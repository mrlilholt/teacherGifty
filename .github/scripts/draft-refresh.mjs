import fs from "fs";
import path from "path";

const BLOG_DIR = "blog";
const MAX_FILES = 2;
const AFF_TAG = "giftsforteacher-20";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Good starter model:
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN.");
  process.exit(1);
}

const basePrompt = fs.readFileSync(".github/prompts/monthly_refresh_prompt.txt", "utf8");

function listHtmlFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
}

function pickFiles(files) {
  return files.sort().slice(0, MAX_FILES);
}

async function runWorkersAI(promptText) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${encodeURIComponent(MODEL)}`;

  // Workers AI text-generation expects "prompt" for many LLMs.
  // We'll ask it to return full HTML only.
  const body = {
    prompt: promptText,
    max_tokens: 3500,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Workers AI request failed (${res.status}): ${t}`);
  }

  const data = await res.json();

  // Cloudflare returns result in different shapes depending on model.
  // For LLMs, commonly: { result: { response: "..." } } or { result: "..." }
  const result = data?.result;
  const text =
    typeof result === "string"
      ? result
      : result?.response || result?.output_text || result?.text;

  if (!text) throw new Error("No text returned from Workers AI.");

  return String(text).trim();
}

const files = pickFiles(listHtmlFiles(BLOG_DIR));
const today = new Date().toISOString().slice(0, 10);

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const html = fs.readFileSync(filePath, "utf8");

  const combinedPrompt = `
${basePrompt}

DATE: ${today}
FILE: ${file}

REQUIREMENTS:
- Output ONLY the FULL updated HTML file. No commentary.
- Maintain existing header/nav/footer and CSS references.
- If any amazon.com links are present, ensure they include ?tag=${AFF_TAG}
- Keep content evergreen (no years in article content).

CURRENT HTML:
${html}
`;

  try {
    const updated = await runWorkersAI(combinedPrompt);

    if (!updated.toLowerCase().includes("<html") && !updated.toLowerCase().includes("<!doctype")) {
      console.error(`No valid HTML returned for ${file}. Skipping write.`);
      continue;
    }

    const hasAmazon = updated.includes("amazon.com");
    if (hasAmazon && !updated.includes(`tag=${AFF_TAG}`)) {
      console.error(`Affiliate tag missing in ${file}. Skipping write.`);
      continue;
    }

    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`Updated: ${file}`);
  } catch (err) {
    console.error(`Failed for ${file}:`, err.message);
    process.exitCode = 1;
  }
}

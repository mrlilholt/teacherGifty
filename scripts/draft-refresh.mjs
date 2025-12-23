import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ CHANGE THIS if your blog folder differs
const BLOG_DIR = "blog";

// Safety: keep small
const MAX_FILES = 2;

// Your affiliate tag
const AFF_TAG = "giftsforteacher-20";

const prompt = fs.readFileSync(".github/prompts/monthly_refresh_prompt.txt", "utf8");

function listHtmlFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith(".html"));
}

function pickFiles(files) {
  // Simple rotation: pick first N alphabetically.
  // (Later we can enhance with a tracker file / season logic.)
  return files.sort().slice(0, MAX_FILES);
}

const files = pickFiles(listHtmlFiles(BLOG_DIR));

const today = new Date().toISOString().slice(0, 10);

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const html = fs.readFileSync(filePath, "utf8");

  const userMsg = `
DATE: ${today}
FILE: ${file}

REQUIREMENTS:
- Output ONLY the FULL updated HTML file.
- Maintain existing header/nav/footer and CSS references.
- If any amazon.com links are present, ensure they include ?tag=${AFF_TAG}
- Keep content evergreen (no years).

CURRENT HTML:
${html}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: userMsg }
    ],
    temperature: 0.4,
  });

  const updated = response.choices?.[0]?.message?.content?.trim();

  // Basic validity checks
  if (!updated || !updated.toLowerCase().includes("<!doctype") && !updated.toLowerCase().includes("<html")) {
    console.error(`No valid HTML returned for ${file}. Skipping.`);
    continue;
  }

  // If amazon links exist, require affiliate tag
  const hasAmazon = updated.includes("amazon.com");
  if (hasAmazon && !updated.includes(`tag=${AFF_TAG}`)) {
    console.error(`Affiliate tag missing in ${file}. Skipping write.`);
    continue;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`Updated: ${file}`);
}

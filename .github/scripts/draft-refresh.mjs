import fs from "fs";
import path from "path";

const BLOG_DIR = "blog";
const MAX_FILES = 2; // refresh this many existing posts
const AFF_TAG = "giftsforteacher-20";

// Cloudflare creds from GitHub secrets
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Workers AI model
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN.");
  process.exit(1);
}

// Prompts
const refreshPrompt = fs.readFileSync(".github/prompts/monthly_refresh_prompt.txt", "utf8");
const newPostPrompt = fs.readFileSync(".github/prompts/monthly_new_post_prompt.txt", "utf8");

function listHtmlFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
}

function pickFiles(files) {
  return files
    .filter((f) => !f.startsWith("monthly-teacher-gift-refresh-")) // don't re-edit our monthly posts
    .sort()
    .slice(0, MAX_FILES);
}

function monthStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function prettyMonthTitle() {
  const d = new Date();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  return `${month} Teacher Gift Ideas & Quick Wins`;
}

async function runWorkersAI(promptText) {
  // Keep slashes in the model path
  const modelPath = MODEL.split("/").map(encodeURIComponent).join("/");
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${modelPath}`;

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
  const result = data?.result;

  const text =
    typeof result === "string"
      ? result
      : result?.response || result?.output_text || result?.text;

  if (!text) throw new Error("No text returned from Workers AI.");

  return String(text).trim();
}

function ensureAffiliateTagOnAmazonLinks(html) {
  // This is a safety net; we still *require* tag if amazon.com is present.
  // We'll only patch simple amazon.com URLs that have no tag parameter.
  return html.replace(/https?:\/\/(www\.)?amazon\.com\/[^\s"']+/g, (url) => {
    if (url.includes("tag=")) return url;
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}tag=${AFF_TAG}`;
  });
}

function updateBlogIndex(newPostRelativePath, title) {
  // Your blog index page is /blog.html at repo root
  const indexPath = "blog.html";
  if (!fs.existsSync(indexPath)) {
    console.warn("blog.html not found; skipping index update.");
    return;
  }

  let indexHtml = fs.readFileSync(indexPath, "utf8");

  // Avoid duplicate insertions
  if (indexHtml.includes(newPostRelativePath)) {
    console.log("blog.html already contains link to monthly post; skipping.");
    return;
  }

  // Insert a new link near the top of the main content.
  // Best-effort insertion: right after the first <main> or <body> tag.
  const linkHtml = `\n<li><a href="${newPostRelativePath}">${title}</a></li>\n`;

  if (indexHtml.includes("<main")) {
    // Insert after first <main...> then try to find first <ul> inside; otherwise add a new UL.
    const mainStart = indexHtml.indexOf("<main");
    const mainTagEnd = indexHtml.indexOf(">", mainStart);
    const afterMain = mainTagEnd + 1;

    const ulStart = indexHtml.indexOf("<ul", afterMain);
    if (ulStart !== -1) {
      const ulTagEnd = indexHtml.indexOf(">", ulStart);
      indexHtml = indexHtml.slice(0, ulTagEnd + 1) + linkHtml + indexHtml.slice(ulTagEnd + 1);
    } else {
      indexHtml =
        indexHtml.slice(0, afterMain) +
        `\n<ul>${linkHtml}</ul>\n` +
        indexHtml.slice(afterMain);
    }
  } else if (indexHtml.includes("<body")) {
    const bodyStart = indexHtml.indexOf("<body");
    const bodyTagEnd = indexHtml.indexOf(">", bodyStart);
    const afterBody = bodyTagEnd + 1;
    indexHtml =
      indexHtml.slice(0, afterBody) +
      `\n<ul>${linkHtml}</ul>\n` +
      indexHtml.slice(afterBody);
  } else {
    // Fallback: append
    indexHtml += `\n<ul>${linkHtml}</ul>\n`;
  }

  fs.writeFileSync(indexPath, indexHtml, "utf8");
  console.log("Updated blog.html with new monthly post link.");
}

async function refreshExistingPosts() {
  const files = pickFiles(listHtmlFiles(BLOG_DIR));
  const today = new Date().toISOString().slice(0, 10);

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const html = fs.readFileSync(filePath, "utf8");

    const combinedPrompt = `
${refreshPrompt}

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

    const updatedRaw = await runWorkersAI(combinedPrompt);
    const updated = ensureAffiliateTagOnAmazonLinks(updatedRaw);

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
    console.log(`Updated existing post: ${file}`);
  }
}

async function createMonthlyPost() {
  const stamp = monthStamp();
  const filename = `monthly-teacher-gift-refresh-${stamp}.html`;
  const filePath = path.join(BLOG_DIR, filename);

  if (fs.existsSync(filePath)) {
    console.log(`Monthly post already exists (${filename}); skipping creation.`);
    return null;
  }

  const title = prettyMonthTitle();

  const promptText = `
${newPostPrompt}

POST TITLE (H1): ${title}

IMPORTANT:
- Use relative internal links to existing posts in /blog (example: blog/teacher-gifts-under-20.html)
- Use ONLY Amazon search links like:
  https://www.amazon.com/s?k=teacher+gift+ideas&tag=${AFF_TAG}
- Output must be a complete HTML document with <!doctype html>, <head>, <body>.
- Include a short affiliate disclosure near the bottom.

Return ONLY the full HTML file.
`;

  const htmlRaw = await runWorkersAI(promptText);
  const html = ensureAffiliateTagOnAmazonLinks(htmlRaw);

  if (!html.toLowerCase().includes("<html") && !html.toLowerCase().includes("<!doctype")) {
    throw new Error("Monthly post generation did not return valid HTML.");
  }

  // Require affiliate tag if amazon links exist
  const hasAmazon = html.includes("amazon.com");
  if (hasAmazon && !html.includes(`tag=${AFF_TAG}`)) {
    throw new Error("Monthly post missing affiliate tag.");
  }

  fs.writeFileSync(filePath, html, "utf8");
  console.log(`Created new monthly post: ${filename}`);

  // Update blog index to include it
  updateBlogIndex(`blog/${filename}`, title);

  return filename;
}

(async () => {
  try {
    await refreshExistingPosts();
    await createMonthlyPost();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();

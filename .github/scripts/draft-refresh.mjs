// .github/scripts/draft-refresh.mjs
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
    .filter((f) => !f.startsWith("monthly-teacher-gift-refresh-")) // don't re-edit our monthly archive posts
    .filter((f) => f !== "monthly-teacher-gift-refresh.html") // don't edit the stable redirect page
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
  // Safety net: append tag to amazon.com URLs that don't have one.
  return html.replace(/https?:\/\/(www\.)?amazon\.com\/[^\s"']+/g, (url) => {
    if (url.includes("tag=")) return url;
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}tag=${AFF_TAG}`;
  });
}

/**
 * Make a stable redirect file that always forwards to the latest dated monthly post.
 * This lets your blog card link stay stable forever.
 */
function wrapMonthlyInSiteTemplate({ title, description, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap">
  <link rel="stylesheet" href="../style.css" />
</head>
<body>
  <header class="site-header">
    <div class="nav-inner">
      <a class="brand" href="../index.html">Gifts for Teachers</a>
      <nav class="nav-links">
        <a href="../index.html">Home</a>
        <a href="../holidays.html">Holidays</a>
        <a href="../types.html">Gift Types</a>
        <a href="../blog.html" aria-current="page">Blog</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="blog-post">
${bodyHtml}
    </section>
  </main>

  <script src="../script.js"></script>
</body>
</html>`;
}

function makeRedirectHtml(targetHref) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Monthly Teacher Gift Refresh</title>
  <meta http-equiv="refresh" content="0; url=${targetHref}">
  <link rel="canonical" href="${targetHref}">
  <meta name="robots" content="noindex, follow">
  <script>location.replace(${JSON.stringify(targetHref)});</script>
</head>
<body>
  <p>Redirecting to the latest monthly refresh… <a href="${targetHref}">Click here</a>.</p>
</body>
</html>`;
}

/**
 * Update ONE stable card in blog.html by swapping its href to the stable monthly URL.
 * You must add data-monthly="true" to that card's <a> tag once.
 *
 * Example in blog.html:
 * <a class="blog-card" data-monthly="true" href="blog/monthly-teacher-gift-refresh.html">...</a>
 */
function updateMonthlyCardToStableUrl() {
  const blogIndexPath = "blog.html";
  if (!fs.existsSync(blogIndexPath)) {
    console.warn("blog.html not found; skipping monthly card update.");
    return;
  }

  let html = fs.readFileSync(blogIndexPath, "utf8");

  // Finds the opening <a ... data-monthly="true" ... href="...">
  const re = /<a([^>]*\sdata-monthly="true"[^>]*)href="[^"]*"([^>]*)>/i;

  if (!re.test(html)) {
    console.warn('Monthly card not found. Add data-monthly="true" to the monthly card <a> in blog.html.');
    return;
  }

  html = html.replace(re, `<a$1href="blog/monthly-teacher-gift-refresh.html"$2>`);
  fs.writeFileSync(blogIndexPath, html, "utf8");
  console.log("Updated blog.html monthly card href to stable URL.");
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
  const stamp = monthStamp(); // e.g., "2025-12"
  const filename = `monthly-teacher-gift-refresh-${stamp}.html`;
  const filePath = path.join(BLOG_DIR, filename);

  const title = prettyMonthTitle();

  // Stable redirect file path (always exists / always points to latest)
  const stableName = "monthly-teacher-gift-refresh.html";
  const stablePath = path.join(BLOG_DIR, stableName);

  // If dated post already exists, still refresh stable redirect + card and exit.
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(stablePath, makeRedirectHtml(filename), "utf8");
    updateMonthlyCardToStableUrl();
    console.log(`Monthly post already exists (${filename}); refreshed stable redirect + blog card.`);
    return filename;
  }

  const promptText = `
${newPostPrompt}

POST TITLE (H1): ${title}

HARD REQUIREMENTS (DO NOT VIOLATE):
- Output MUST be a complete HTML document with <!doctype html>, <html>, <head>, <body>.
- Include this exact stylesheet link in <head>: <link rel="stylesheet" href="../style.css" />
- Wrap the main content in: <section class="blog-post"> ... </section>
- Every gift idea MUST include a clickable <a> tag to an Amazon SEARCH URL that includes ?tag=${AFF_TAG}
- No placeholder links. No plain text "links".
- Include a short affiliate disclosure near the bottom.

IMPORTANT:
- Use relative internal links to existing posts in /blog (example: blog/teacher-gifts-under-20.html)

Return ONLY the full HTML file.
`;

  // Ask AI for ONLY the inner HTML of the blog post
const innerRaw = await runWorkersAI(promptText);
const innerHtml = ensureAffiliateTagOnAmazonLinks(innerRaw);

// Guardrail: reject full HTML documents (prevents broken CSS)
const lower = innerHtml.toLowerCase();
if (
  lower.includes("<html") ||
  lower.includes("<head") ||
  lower.includes("<body") ||
  lower.includes("<!doctype")
) {
  throw new Error(
    "Monthly post generation returned a full HTML document. Expected inner HTML only."
  );
}

// Require affiliate tag if amazon links exist
if (innerHtml.includes("amazon.com") && !innerHtml.includes(`tag=${AFF_TAG}`)) {
  throw new Error("Monthly post missing affiliate tag.");
}

// Wrap the inner content in your REAL site template
const fullHtml = wrapMonthlyInSiteTemplate({
  filename,
  title,
  description: "Fresh teacher gift ideas and quick wins—updated monthly.",
  innerHtml: innerHtml.trim(),
});

// Write dated monthly post (archive)
fs.writeFileSync(filePath, fullHtml, "utf8");
console.log(`Created new monthly post: ${filename}`);

  // Write/overwrite stable redirect to latest
  fs.writeFileSync(stablePath, makeRedirectHtml(filename), "utf8");
  console.log(`Updated stable monthly redirect: ${stableName} -> ${filename}`);

  // Ensure blog.html card href points to stable file (not dated file)
  updateMonthlyCardToStableUrl();

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
function writeStableMonthlyRedirect(targetFilename) {
  const stablePath = path.join(BLOG_DIR, "monthly-teacher-gift-refresh.html");
  const targetHref = `/blog/${targetFilename}`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Monthly Teacher Gift Ideas & Quick Wins</title>
  <meta http-equiv="refresh" content="0; url=${targetHref}">
  <link rel="canonical" href="${targetHref}">
  <meta name="robots" content="noindex, follow">
  <script>window.location.replace(${JSON.stringify(targetHref)});</script>
</head>
<body>
  <p>Redirecting to the latest monthly teacher gift ideas…
    <a href="${targetHref}">Click here</a>.
  </p>
</body>
</html>`;

  fs.writeFileSync(stablePath, html, "utf8");
  console.log("Updated stable monthly refresh redirect.");
}

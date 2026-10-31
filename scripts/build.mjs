// Production build: renders src/ pages into dist/, copies assets,
// writes robots.txt (and sitemap.xml when SITE_URL is set), then verifies the output.
//
//   SITE_URL=https://your-site.example  -> absolute canonical URLs + sitemap.xml
//   BASE_PATH=/repo-name/               -> base for 404.html links when hosted in a subfolder
import { mkdir, readFile, writeFile, readdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { SRC, DIST, PRIVATE_DIRS, loadContext, renderPage } from "./lib/render.mjs";
import { verifySite } from "./lib/verify.mjs";

const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
const basePath = process.env.BASE_PATH || "/";

// Collapse whitespace between tags and drop HTML comments (keeps <pre>/<textarea>-free markup safe).
const minifyHtml = (html) => html.replace(/<!--(?!\[)[\s\S]*?-->/g, "").replace(/\n\s*\n+/g, "\n").replace(/^[ \t]+/gm, "");
const minifyCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, "\n").trim();

async function walk(dir, rel = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!rel && PRIVATE_DIRS.includes(entry.name)) continue;
      out.push(...(await walk(path.join(dir, entry.name), relPath)));
    } else out.push(relPath);
  }
  return out;
}

const started = Date.now();
await rm(DIST, { recursive: true, force: true });
const ctx = await loadContext();
const files = await walk(SRC);
const pages = [];

for (const rel of files) {
  const from = path.join(SRC, rel);
  const to = path.join(DIST, rel);
  await mkdir(path.dirname(to), { recursive: true });
  if (rel.endsWith(".html")) {
    try {
      const { html } = renderPage(rel, await readFile(from, "utf8"), ctx, { siteUrl, basePath });
      await writeFile(to, minifyHtml(html));
      pages.push(rel);
    } catch (err) {
      console.error(`✖ ${rel}: ${err.message}`);
      process.exit(1);
    }
  } else if (rel.endsWith(".css")) {
    await writeFile(to, minifyCss(await readFile(from, "utf8")));
  } else {
    await copyFile(from, to);
  }
}

let robots = "User-agent: *\nAllow: /\n";
if (siteUrl) {
  const urls = pages
    .filter((p) => p !== "404.html")
    .map((p) => `  <url><loc>${siteUrl}/${p === "index.html" ? "" : p}</loc></url>`)
    .join("\n");
  await writeFile(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  robots += `Sitemap: ${siteUrl}/sitemap.xml\n`;
}
await writeFile(path.join(DIST, "robots.txt"), robots);

const { errors, pageCount, fileCount } = await verifySite(DIST);
if (errors.length) {
  console.error(`\n✖ Verification failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ Built ${pageCount} pages (${fileCount} files) into dist/ in ${Date.now() - started} ms. All checks passed.`);
if (siteUrl) console.log(`  Sitemap and canonical URLs generated for ${siteUrl}`);

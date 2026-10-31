// Post-build checks on the generated site: metadata, headings, alt text,
// leftover template tokens, duplicate ids, and every internal link/asset.
import { readFile, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function exists(file) {
  try { return (await stat(file)).isFile(); } catch { return false; }
}

const idsOf = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

export async function verifySite(dist) {
  const errors = [];
  const files = await walk(dist);
  const htmlFiles = files.filter((f) => f.endsWith(".html"));
  const pages = new Map();
  for (const f of htmlFiles) pages.set(f, await readFile(f, "utf8"));

  for (const [file, html] of pages) {
    const rel = path.relative(dist, file).replace(/\\/g, "/");
    const fail = (msg) => errors.push(`${rel}: ${msg}`);

    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    if (!title) fail("missing <title>");
    else if (title.length > 65) fail(`title is ${title.length} chars (max 65)`);
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    if (!desc) fail("missing meta description");
    else if (desc.length > 160) fail(`meta description is ${desc.length} chars (max 160)`);
    if (!/<html lang="/.test(html)) fail("missing <html lang>");

    const h1s = (html.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) fail(`expected exactly one <h1>, found ${h1s}`);

    for (const img of html.match(/<img\b[^>]*>/g) || []) {
      if (!/\salt="/.test(img)) fail(`<img> without alt: ${img.slice(0, 80)}`);
    }
    if (/{{|<!--\s*@/.test(html)) fail("unexpanded template token");

    const ids = idsOf(html);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) fail(`duplicate ids: ${[...new Set(dupes)].join(", ")}`);

    for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
      if (!url) { fail("empty href/src"); continue; }
      if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(url)) continue;
      const [pathPart, hash] = url.split("#");
      const cleanPath = pathPart.split("?")[0];
      if (!cleanPath) {
        if (hash && !ids.includes(hash)) fail(`in-page anchor #${hash} not found`);
        continue;
      }
      let target = cleanPath.startsWith("/")
        ? path.join(dist, cleanPath)
        : path.resolve(path.dirname(file), cleanPath);
      if (cleanPath.endsWith("/")) target = path.join(target, "index.html");
      if (!(await exists(target))) { fail(`broken link: ${url}`); continue; }
      if (hash && target.endsWith(".html")) {
        const targetHtml = pages.get(target) ?? "";
        if (!idsOf(targetHtml).includes(hash)) fail(`anchor #${hash} not found in ${cleanPath}`);
      }
    }
  }

  for (const js of files.filter((f) => f.endsWith(".js"))) {
    const r = spawnSync(process.execPath, ["--check", js], { encoding: "utf8" });
    if (r.status !== 0) errors.push(`${path.relative(dist, js)}: syntax error\n${r.stderr}`);
  }

  return { errors, pageCount: htmlFiles.length, fileCount: files.length };
}

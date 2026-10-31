// Zero-dependency static server.
//   node scripts/serve.mjs src [port]   -> development: renders pages on each request
//   node scripts/serve.mjs dist [port]  -> preview of the production build
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, PRIVATE_DIRS, loadContext, renderPage } from "./lib/render.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

async function isFile(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}

export function startServer(dirName = "dist", port = 4173) {
  const root = path.join(ROOT, dirName);
  const dev = dirName === "src";

  async function load(rel) {
    const file = path.join(root, rel);
    if (dev && rel.endsWith(".html")) {
      const ctx = await loadContext(); // reload each request so edits show immediately
      return renderPage(rel, await readFile(file, "utf8"), ctx).html;
    }
    return readFile(file);
  }

  const server = createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/+/, "");
      if (rel === "" || rel.endsWith("/")) rel += "index.html";
      const resolved = path.resolve(root, rel);
      const blocked = !resolved.startsWith(root) || (dev && PRIVATE_DIRS.includes(rel.split("/")[0]));
      let status = 200;
      if (blocked || !(await isFile(resolved))) {
        status = 404;
        rel = "404.html";
      }
      const body = await load(rel);
      res.writeHead(status, { "Content-Type": TYPES[path.extname(rel)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Server error: ${err.message}`);
      console.error(err);
    }
  });

  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] || "dist";
  const port = Number(process.argv[3]) || (dir === "src" ? 5173 : 4173);
  await startServer(dir, port);
  console.log(`Serving ${dir}/ at http://localhost:${port}`);
}

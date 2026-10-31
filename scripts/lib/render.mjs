// Tiny static-site renderer: wraps page bodies in the shared layout and expands
// <!-- @directive arg --> comments (partials, product cards, icons, counts).
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SRC = path.join(ROOT, "src");
export const DIST = path.join(ROOT, "dist");

// Directories under src/ that are build inputs only, never published.
export const PRIVATE_DIRS = ["partials", "data"];

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export async function loadContext() {
  const data = JSON.parse(await readFile(path.join(SRC, "data/products.json"), "utf8"));
  const partials = {};
  const partialDir = path.join(SRC, "partials");
  for (const f of await readdir(partialDir)) {
    if (f.endsWith(".html")) partials[f.slice(0, -5)] = await readFile(path.join(partialDir, f), "utf8");
  }
  const icons = {};
  const iconDir = path.join(partialDir, "icons");
  for (const f of await readdir(iconDir)) {
    if (f.endsWith(".svg")) icons[f.slice(0, -4)] = (await readFile(path.join(iconDir, f), "utf8")).trim();
  }
  const categories = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  return { ...data, categoryById: categories, partials, icons };
}

// Page files start with a front-matter comment:
// <!--@page
// key: about
// title: ...
// description: ...
// scripts: catalogue form
// -->
export function parsePage(source) {
  const m = source.match(/^\s*<!--@page([\s\S]*?)-->/);
  if (!m) throw new Error("Missing <!--@page ... --> front matter");
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of ["key", "title", "description"]) {
    if (!meta[k]) throw new Error(`Front matter is missing "${k}"`);
  }
  return { meta, body: source.slice(m[0].length) };
}

function productsFor(ctx, arg) {
  return arg === "all" ? ctx.products : ctx.products.filter((p) => p.category === arg);
}

function specRows(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");
}

function renderCard(p, ctx) {
  const cat = ctx.categoryById[p.category];
  const search = [p.name, cat.label, p.hs, ...Object.values(p.specs)].join(" ").toLowerCase();
  const more = [];
  if (p.packagingType) more.push(`<div><dt>Packaging type</dt><dd>${esc(p.packagingType)}</dd></div>`);
  const details = more.length || p.note
    ? `<details class="card__more"><summary>More details</summary>${more.length ? `<dl class="specs">${more.join("")}</dl>` : ""}${p.note ? `<p class="card__note">${esc(p.note)}</p>` : ""}</details>`
    : "";
  return `<article class="card" id="${esc(p.slug)}" data-category="${esc(p.category)}" data-search="${esc(search)}">
  <div class="card__head"><span class="chip chip--${esc(p.category)}">${esc(cat.label)}</span><span class="card__hs">HS ${esc(p.hs)}</span></div>
  <h3 class="card__title">${esc(p.name)}</h3>
  <dl class="specs">${specRows(p.specs)}<div><dt>Packaging</dt><dd>${esc(p.packaging)}</dd></div></dl>
  ${details}
  <div class="card__actions">
    <button type="button" class="btn btn--ghost btn--sm" data-add="${esc(p.slug)}" data-name="${esc(p.name)}" aria-pressed="false">Add to enquiry</button>
    <a class="btn btn--primary btn--sm" href="{{base}}contact.html?product=${esc(p.slug)}">Request quote</a>
  </div>
</article>`;
}

function renderCategoryCard(c, ctx) {
  const count = productsFor(ctx, c.id).length;
  return `<a class="cat-card" href="{{base}}${esc(c.page)}">
  <span class="cat-card__icon">${ctx.icons[c.id] || ""}</span>
  <span class="cat-card__body"><span class="cat-card__title">${esc(c.label)}</span><span class="cat-card__text">${esc(c.summary)}</span></span>
  <span class="cat-card__meta">${count} product${count === 1 ? "" : "s"} <span aria-hidden="true">→</span></span>
</a>`;
}

function renderFilters(ctx) {
  const all = `<button type="button" class="chip-btn" data-cat="all" aria-pressed="true">All (${ctx.products.length})</button>`;
  return all + ctx.categories
    .map((c) => `<button type="button" class="chip-btn" data-cat="${esc(c.id)}" aria-pressed="false">${esc(c.label)} (${productsFor(ctx, c.id).length})</button>`)
    .join("");
}

function renderItemList(ctx, arg) {
  const items = productsFor(ctx, arg).map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: { "@type": "Product", name: p.name, category: ctx.categoryById[p.category].label, brand: { "@type": "Brand", name: "Geo Excel" } }
  }));
  const json = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: items };
  return `<script type="application/ld+json">${JSON.stringify(json).replace(/</g, "\\u003c")}</script>`;
}

function expand(html, ctx, depth = 0) {
  if (depth > 5) throw new Error("Partial include nesting too deep");
  return html.replace(/<!--\s*@(\w+)\s*([\w-]*)\s*-->/g, (match, name, arg) => {
    switch (name) {
      case "include":
        if (!(arg in ctx.partials)) throw new Error(`Unknown partial "${arg}"`);
        return expand(ctx.partials[arg], ctx, depth + 1);
      case "products":
        return productsFor(ctx, arg).map((p) => renderCard(p, ctx)).join("\n");
      case "categories":
        return ctx.categories.map((c) => renderCategoryCard(c, ctx)).join("\n");
      case "filters":
        return renderFilters(ctx);
      case "count":
        return String(productsFor(ctx, arg).length);
      case "icon":
        if (!(arg in ctx.icons)) throw new Error(`Unknown icon "${arg}"`);
        return ctx.icons[arg];
      case "itemlist":
        return renderItemList(ctx, arg);
      case "productmap": {
        const map = Object.fromEntries(ctx.products.map((p) => [p.slug, p.name]));
        return `<script type="application/json" id="gx-products">${JSON.stringify(map).replace(/</g, "\\u003c")}</script>`;
      }
      default:
        throw new Error(`Unknown directive "${match}"`);
    }
  });
}

/**
 * @param {string} relPath  page path relative to src, using forward slashes (e.g. "products/rice.html")
 * @param {string} source   raw page source
 * @param {object} ctx      from loadContext()
 * @param {{siteUrl?: string, basePath?: string}} opts
 */
export function renderPage(relPath, source, ctx, opts = {}) {
  const { meta, body } = parsePage(source);
  const siteUrl = (opts.siteUrl || "").replace(/\/$/, "");
  const depth = relPath.split("/").length - 1;
  // 404.html is served from arbitrary URLs, so it needs absolute links.
  const base = relPath === "404.html" ? (opts.basePath || "/") : "../".repeat(depth);

  const scripts = (meta.scripts || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => `<script src="{{base}}assets/js/${esc(s)}.js" defer></script>`)
    .join("\n  ");

  const pageUrl = siteUrl ? `${siteUrl}/${relPath === "index.html" ? "" : relPath}` : "";
  const seo = pageUrl && relPath !== "404.html"
    ? `<link rel="canonical" href="${esc(pageUrl)}">\n  <meta property="og:url" content="${esc(pageUrl)}">`
    : "";

  let html = expand(ctx.partials.layout, ctx)
    .replace("{{content}}", () => expand(body, ctx))
    .replace("{{scripts}}", () => scripts)
    .replace("{{seo}}", () => seo)
    .replace(/{{robots}}/g, relPath === "404.html" ? "noindex" : "index, follow")
    .replace(/{{title}}/g, esc(meta.title))
    .replace(/{{description}}/g, esc(meta.description))
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{nav:([\w-]+)}}/g, (_, key) => (key === meta.key ? ' aria-current="page"' : ""));
  html = html.replace(/{{base}}/g, base);
  return { html, meta };
}

// End-to-end checks against the production build (dist/) in a real headless browser,
// driven over the Chrome DevTools Protocol. No npm dependencies: needs Node 22+
// (global WebSocket) and a local Chrome or Edge (or set CHROME_PATH).
//
//   npm run build && npm test
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ROOT } from "./lib/render.mjs";
import { startServer } from "./serve.mjs";

const PORT = 4321;
const DEBUG_PORT = 9333;
// Set E2E_BASE_URL to test a deployed site instead of the local dist/ build.
const REMOTE = (process.env.E2E_BASE_URL || "").replace(/\/$/, "");
const BASE = REMOTE || `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, "test-results");

const PAGES = [
  "index.html", "products.html", "products/rice.html", "products/spices.html", "products/iqf.html",
  "products/oils-ghee.html", "products/lifestyle.html", "about.html", "certificates.html",
  "sustainability.html", "contact.html", "404.html"
];
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: true },
  { name: "desktop", width: 1280, height: 800, mobile: false }
];

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"
  ];
  return candidates.find((p) => p && existsSync(p));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Set();
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else {
        this.handlers.forEach((h) => h(msg));
      }
    };
  }
  open() { return new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; }); }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.handlers.delete(h); reject(new Error(`Timeout waiting for ${method}`)); }, timeout);
      const h = (m) => { if (m.method === method) { clearTimeout(t); this.handlers.delete(h); resolve(m.params); } };
      this.handlers.add(h);
    });
  }
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✔" : "✖"} ${name}${detail ? ` (${detail})` : ""}`);
}

async function main() {
  const browserPath = findBrowser();
  if (!browserPath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
  if (!REMOTE && !existsSync(path.join(ROOT, "dist/index.html"))) throw new Error("dist/ not found. Run npm run build first.");

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const server = REMOTE ? null : await startServer("dist", PORT);
  console.log(`Testing ${BASE}\n`);
  const profile = path.join(os.tmpdir(), `gx-e2e-${Date.now()}`);
  const browser = spawn(browserPath, [
    "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions", "about:blank"
  ], { stdio: "ignore" });

  try {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        target = list.find((t) => t.type === "page");
      } catch { /* browser still starting */ }
      if (!target) await sleep(200);
    }
    if (!target) throw new Error("Could not connect to the headless browser");

    const cdp = new CDP(target.webSocketDebuggerUrl);
    await cdp.open();
    await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Log.enable")]);

    const consoleErrors = [];
    let currentPage = "";
    cdp.handlers.add((m) => {
      if (m.method === "Runtime.exceptionThrown") consoleErrors.push(`${currentPage}: ${m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text}`);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleErrors.push(`${currentPage}: ${m.params.args.map((a) => a.value ?? a.description).join(" ")}`);
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
        const { text, url = "" } = m.params.entry;
        // External font CDN failures (e.g. offline test machine) are not site errors.
        if (!/fonts\.(googleapis|gstatic)\.com/.test(url)) consoleErrors.push(`${currentPage}: ${text} ${url}`);
      }
    });

    const evaluate = async (expression) => {
      const r = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    const go = async (page) => {
      currentPage = page;
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `${BASE}/${page}` });
      await loaded;
      await sleep(150);
    };
    const viewport = (v) => cdp.send("Emulation.setDeviceMetricsOverride", { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile });
    const shot = async (file, fullPage = false) => {
      // Park the pointer so hover styles don't leak into screenshots.
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 300 });
      let clip;
      if (fullPage) {
        // Full-page captures don't scroll, so show scroll-revealed sections explicitly.
        await evaluate(`document.querySelectorAll(".reveal").forEach(e => e.classList.add("is-visible"))`);
        await sleep(600);
        const { cssContentSize } = await cdp.send("Page.getLayoutMetrics");
        clip = { x: 0, y: 0, width: cssContentSize.width, height: Math.min(cssContentSize.height, 12000), scale: 1 };
      }
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: fullPage, ...(clip ? { clip } : {}) });
      await writeFile(path.join(OUT, file), Buffer.from(data, "base64"));
    };

    /* ---- Layout checks on every page at every viewport ---- */
    for (const v of VIEWPORTS) {
      await viewport(v);
      for (const page of PAGES) {
        await go(page);
        const info = await evaluate(`({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          h1: document.querySelectorAll("h1").length,
          brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
          smallText: [...document.querySelectorAll("p, li, a, label, dd, dt")].filter(e => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 11).length
        })`);
        const ok = info.overflow <= 0 && info.h1 === 1 && info.brokenImages.length === 0 && info.smallText === 0;
        check(`${v.name} ${page}: layout`, ok, ok ? "" : JSON.stringify(info));
        if (page === "index.html" || page === "products/rice.html" || page === "contact.html") {
          await shot(`${v.name}-${page.replace(/\//g, "_").replace(".html", "")}.png`, true);
        }
      }
    }

    /* ---- Scroll reveal makes content visible once scrolled into view ---- */
    await viewport(VIEWPORTS[2]);
    await go("index.html");
    const reveal = await evaluate(`(async () => {
      const els = [...document.querySelectorAll(".reveal")];
      for (const el of els) { el.scrollIntoView(); await new Promise(r => setTimeout(r, 120)); }
      await new Promise(r => setTimeout(r, 700));
      return els.filter(el => getComputedStyle(el).opacity !== "1").length;
    })()`);
    check("scroll-revealed sections all become visible", reveal === 0, `${reveal} still hidden`);

    /* ---- Mobile navigation ---- */
    await viewport(VIEWPORTS[0]);
    await go("index.html");
    const nav = await evaluate(`(async () => {
      const t = document.querySelector(".nav-toggle"), n = document.getElementById("site-nav");
      const before = getComputedStyle(n).visibility;
      t.click(); await new Promise(r => setTimeout(r, 300));
      const open = t.getAttribute("aria-expanded") === "true" && n.classList.contains("is-open") && getComputedStyle(n).visibility === "visible";
      const focusInside = n.contains(document.activeElement);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      const closed = t.getAttribute("aria-expanded") === "false" && !n.classList.contains("is-open");
      return { before, open, focusInside, closed, focusBack: document.activeElement === t };
    })()`);
    check("mobile menu opens, focuses first link, closes on Esc", nav.before === "hidden" && nav.open && nav.focusInside && nav.closed && nav.focusBack, JSON.stringify(nav));
    await go("index.html");
    await evaluate(`document.querySelector(".nav-toggle").click()`);
    await sleep(300);
    await shot("mobile-menu-open.png");

    /* ---- Desktop dropdown ---- */
    await viewport(VIEWPORTS[2]);
    await go("index.html");
    const dropdown = await evaluate(`(async () => {
      const link = document.querySelector(".site-nav__item--has-menu > a");
      link.focus(); await new Promise(r => setTimeout(r, 250));
      return getComputedStyle(document.querySelector(".submenu")).visibility;
    })()`);
    check("desktop products dropdown opens on keyboard focus", dropdown === "visible", dropdown);

    /* ---- Catalogue filter and search ---- */
    await go("products.html");
    const cat = await evaluate(`(async () => {
      const visible = () => [...document.querySelectorAll(".grid .card")].filter(c => !c.hidden);
      const total = visible().length;
      document.querySelector('[data-cat="spices"]').click();
      const spices = visible(), allSpices = spices.every(c => c.dataset.category === "spices");
      document.querySelector('[data-cat="all"]').click();
      const s = document.querySelector("[data-search]");
      s.value = "basmati"; s.dispatchEvent(new Event("input"));
      const basmati = visible(), allBasmati = basmati.every(c => c.dataset.search.includes("basmati"));
      s.value = "zzzz"; s.dispatchEvent(new Event("input"));
      const emptyShown = !document.querySelector("[data-empty]").hidden && visible().length === 0;
      const countText = document.querySelector("[data-result-count]").textContent;
      return { total, spices: spices.length, allSpices, basmati: basmati.length, allBasmati, emptyShown, countText };
    })()`);
    check("catalogue shows all products", cat.total === 45, `${cat.total}`);
    check("category filter shows only that category", cat.spices === 14 && cat.allSpices, `${cat.spices} spices`);
    check("search filters by text", cat.basmati >= 6 && cat.allBasmati, `${cat.basmati} matches`);
    check("empty state + result count update", cat.emptyShown && cat.countText === "0 products", cat.countText);

    /* ---- Enquiry list across pages ---- */
    await evaluate(`localStorage.clear()`);
    await go("products/spices.html");
    const add = await evaluate(`(async () => {
      const b = document.querySelector('[data-add="black-peppercorn"]');
      b.click();
      return { pressed: b.getAttribute("aria-pressed"), label: b.textContent, pill: !document.querySelector("[data-enquiry-pill]").hidden,
               count: document.querySelector("[data-enquiry-pill] [data-enquiry-count]").textContent };
    })()`);
    check("Add to enquiry toggles state and shows enquiry pill", add.pressed === "true" && add.pill && add.count === "(1)", JSON.stringify(add));

    await go("contact.html?product=1121-basmati-sella-rice");
    const tray = await evaluate(`({
      items: [...document.querySelectorAll("[data-tray] li span")].map(s => s.textContent),
      field: document.getElementById("products").value
    })`);
    check("contact page lists saved product + ?product= prefill", tray.items.includes("Black Peppercorn") && tray.items.includes("1121 Basmati Sella Rice") && tray.field.includes("1121 Basmati Sella Rice"), JSON.stringify(tray));

    const removed = await evaluate(`(async () => {
      document.querySelector('[data-remove="black-peppercorn"]').click();
      return [...document.querySelectorAll("[data-tray] li span")].map(s => s.textContent);
    })()`);
    check("products can be removed from the enquiry", removed.length === 1 && !removed.includes("Black Peppercorn"), JSON.stringify(removed));

    /* ---- Form validation and submission feedback ---- */
    const empty = await evaluate(`(async () => {
      const f = document.getElementById("quote-form");
      f.reset(); document.getElementById("products").value = "";
      f.querySelector('button[type="submit"]').click();
      return {
        errors: [...f.querySelectorAll(".field__error")].filter(e => e.textContent).length,
        invalid: f.querySelectorAll('[aria-invalid="true"]').length,
        focused: document.activeElement.id,
        statusHidden: f.querySelector("[data-form-status]").hidden
      };
    })()`);
    check("empty submit shows inline errors and focuses first invalid field", empty.errors === 7 && empty.invalid === 7 && empty.focused === "products" && empty.statusHidden, JSON.stringify(empty));

    const badEmail = await evaluate(`(async () => {
      const e = document.getElementById("email"); e.value = "not-an-email"; e.dispatchEvent(new Event("blur"));
      return document.getElementById("email-error").textContent;
    })()`);
    check("invalid email shows a specific message", /valid email/i.test(badEmail), badEmail);

    const sent = await evaluate(`(async () => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input")); };
      set("products", "1121 Basmati Sella Rice"); set("quantity", "50"); set("country", "United Arab Emirates");
      set("company", "Test Foods LLC"); set("name", "Test Buyer"); set("email", "buyer@example.com");
      document.getElementById("incoterm").value = "CIF";
      document.getElementById("consent").checked = true;
      const f = document.getElementById("quote-form");
      f.querySelector('button[type="submit"]').click();
      const s = f.querySelector("[data-form-status]");
      const mail = s.querySelector('a[href^="mailto:"]');
      return {
        visible: !s.hidden, title: s.querySelector("h3")?.textContent, focused: document.activeElement === s,
        errors: [...f.querySelectorAll(".field__error")].filter(e => e.textContent).length,
        mailto: mail ? decodeURIComponent(mail.getAttribute("href")) : ""
      };
    })()`);
    check("valid submit shows honest 'not sent yet' feedback (no endpoint configured)",
      sent.visible && /not been sent/i.test(sent.title) && sent.focused && sent.errors === 0, sent.title);
    check("email draft link is pre-filled with the enquiry",
      sent.mailto.startsWith("mailto:Info@geoexcel.group") && sent.mailto.includes("Test Foods LLC") && sent.mailto.includes("50 MT") && sent.mailto.includes("CIF"));
    await shot("desktop-contact-submitted.png");

    /* ---- 404 handling ---- */
    const res404 = await fetch(`${BASE}/does-not-exist`);
    check("unknown URL returns 404 page", res404.status === 404 && (await res404.text()).includes("We couldn"), `${res404.status}`);

    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | "));

    await cdp.send("Browser.close").catch(() => {});
  } finally {
    browser.kill();
    server?.close();
  }

  const failed = results.filter((r) => !r.ok);
  await writeFile(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: test-results/`);
  if (failed.length) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });

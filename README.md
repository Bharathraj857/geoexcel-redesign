# Geo Excel: Website Redesign

A concept redesign of [geoexcel.group](https://www.geoexcel.group/) built around one business problem: **turning export-buyer visits into qualified quote requests.**

- Source code: https://github.com/Bharathraj857/geoexcel-redesign
- Live site: https://geoexcel-redesign.netlify.app
- Problem statement and rationale: [PROBLEM_SOLUTION.md](PROBLEM_SOLUTION.md)
- Research, audit and full plan: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

> This is not the official Geo Excel website. It was prepared for a website redesign assignment. All company information comes from Geo Excel's public website; nothing has been invented.

## Project overview

| Page | Purpose |
|---|---|
| `index.html` | Value proposition, registrations strip, 5 product categories, how we work, heritage, sustainability, call to action |
| `products.html` | All 45 products with category filter, search and "Add to enquiry" |
| `products/rice.html`, `spices.html`, `iqf.html`, `oils-ghee.html`, `lifestyle.html` | Category pages with specification cards, search, breadcrumbs, structured data |
| `about.html` | Company story, 1980s–2023 timeline, group verticals |
| `certificates.html` | APEDA, FSSAI, IEC, Udyam, Council for Leather Exports |
| `sustainability.html` | Approach and sourcing principles |
| `contact.html` | Request-for-quote form, enquiry list, contact details, map link |
| `404.html` | Not-found page with routes back into the site |

**Key features:**
- Specification cards generated at build time from one data file. They work without JavaScript and are indexable.
- An enquiry list kept in `localStorage` across pages: a desktop "Enquiry (n)" button and the mobile "Get Quote (n)" bar.
- A "Request quote" button on every product, which opens the form pre-filled with that product.
- A quote form with inline, accessible validation and honest submission feedback (see [Known limitations](#known-limitations)).
- A responsive layout (mobile, tablet, desktop), a mobile drawer menu (focus trap, Esc to close), a keyboard-accessible dropdown, a skip link, visible focus styles, and support for reduced motion.
- SEO: a unique title and description per page, Open Graph tags, Organization and ItemList JSON-LD, `robots.txt`, plus `sitemap.xml` and canonical URLs when `SITE_URL` is set.

## Technology stack

- **HTML5, CSS3 (custom properties, Grid, Flexbox) and vanilla JavaScript.** No framework, no runtime dependencies.
- **Build tooling: plain Node.js scripts with zero npm dependencies.**
  - `scripts/build.mjs` renders pages from shared partials (header, footer, CTA) and the product data file, minifies HTML and CSS, writes `robots.txt` and `sitemap.xml`, then **verifies** the output: titles and meta descriptions, exactly one `<h1>` per page, alt text, duplicate ids, every internal link and anchor, and JS syntax.
  - `scripts/serve.mjs` is a local dev and preview server.
  - `scripts/test-e2e.mjs` runs end-to-end tests in headless Chrome or Edge over the DevTools Protocol.
- **Fonts:** Inter and Manrope from Google Fonts, with a system-font fallback.
- **Icons:** hand-drawn inline SVG.

## Installation

Requirements: **Node.js 20+** (Node 22+ for `npm test`). There's nothing to install, because the project has no dependencies.

```bash
git clone https://github.com/Bharathraj857/geoexcel-redesign.git
cd geoexcel-redesign
```

## Local development

```bash
npm run dev
```
This opens a server at http://localhost:5173 that renders pages from `src/` on every request, so edits show on refresh.

Where to edit:
- Pages: `src/*.html`, `src/products/*.html` (each starts with an `<!--@page ... -->` block for its title, description and page scripts)
- Shared header, footer and CTA: `src/partials/`
- Products: `src/data/products.json`
- Styles: `src/assets/css/styles.css` (design tokens at the top)
- Scripts: `src/assets/js/main.js` (all pages), `catalogue.js` (filter and search), `form.js` (quote form)

## Build

```bash
npm run build
```
This outputs the production site to `dist/`. The build fails with a list of problems if any verification check fails.

Optional environment variables:

| Variable | Example | Effect |
|---|---|---|
| `SITE_URL` | `https://geoexcel-redesign.netlify.app` | Adds canonical URLs and `og:url`, generates `sitemap.xml`, and references it in `robots.txt` |
| `BASE_PATH` | `/geoexcel-redesign/` | Base path for links on `404.html` when the site is hosted in a subfolder (for example GitHub Pages project sites). Default `/` |

```bash
# PowerShell
$env:SITE_URL="https://your-site.netlify.app"; npm run build
# macOS / Linux
SITE_URL=https://your-site.netlify.app npm run build
```

Preview and test the build:
```bash
npm run preview   # http://localhost:4173
npm test          # 52 end-to-end checks; screenshots saved to test-results/
```

Run the same checks against the deployed site:
```bash
# PowerShell
$env:E2E_BASE_URL="https://geoexcel-redesign.netlify.app"; npm test
```

## Deployment

The site is static. Publish the contents of `dist/` on any static host.

**Netlify (recommended):**
1. Push the repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**, then pick the repository.
3. The build settings come from `netlify.toml` (build command `npm run build`, publish directory `dist`, Node 22), which also adds basic security headers.
4. Under environment variables, set `SITE_URL` to the Netlify URL, then redeploy.
5. Netlify serves `404.html` automatically for unknown URLs.

Without git, run `npm run build` locally and drag the `dist/` folder onto https://app.netlify.com/drop.

**GitHub Pages:**
1. Build with `SITE_URL=https://<user>.github.io/<repo>` and `BASE_PATH=/<repo>/`.
2. Publish the `dist/` folder, either with a GitHub Actions Pages workflow or by pushing `dist/` to a `gh-pages` branch.
3. In the repository, go to **Settings → Pages** and select that source.

After deploying, open the public URL on desktop and on a phone, then run through the [checklist](IMPLEMENTATION_PLAN.md#14-testing-strategy-and-acceptance-criteria).

### Connecting the quote form

The form in `src/contact.html` has `data-endpoint=""`. To receive enquiries online, set it to a JSON-accepting form service endpoint (for example Formspree `https://formspree.io/f/<id>`, or a Web3Forms endpoint with its access key added as a field), then rebuild. The form then POSTs JSON and shows real success or error messages.

## Known limitations

- **The form doesn't send enquiries yet.** No backend or form service is configured, so submitting a valid form shows *"Your enquiry is ready, but it has not been sent yet"*, with a pre-filled email draft (to Info@geoexcel.group) and a "Copy enquiry text" button. It never reports a fake success.
- **There is no product photography.** Geo Excel's images weren't reused, to avoid rights issues, and no stock photos were added that could misrepresent their products. Cards are data-led and categories use neutral SVG icons.
- **Some specifications are marked "To be confirmed".** Several values on the source site contradict each other (for example Nutmeg's HS code and Star Anise's origin). These are flagged rather than guessed, and need confirming with Geo Excel.
- **Certificate images and numbers aren't shown.** Registrations are listed by name, with a link to the images on the current Geo Excel site.
- **No social preview image is included** (`og:image`), because no approved brand image is available.
- **External links (Google Maps, geoexcel.group) aren't checked by the build.** Only internal links and assets are verified automatically.
- **The site is English only.**

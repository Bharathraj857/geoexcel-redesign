# Geo Excel Website Redesign — Implementation Plan (Phase 1)

> Status: research and planning only. No website code has been written.
> Prepared: 31 Oct 2026, ~11:00 IST. Reference site inspected live on that date: https://www.geoexcel.group/

---

## ⚠️ Deadline alert (read first)

The assignment PDF sets the window as **28 Oct 2026 17:00 IST to 30 Oct 2026 17:00 IST**, with **grace time until Saturday 31 Oct 2026, 12:00 IST**. When this plan was written it was **31 Oct, 11:03 IST, so less than one hour remained**.
Also, **`git` is not installed** on this machine (Node v26.13.0 and npm 11.20.0 are available), and `D:\geoExcel-redesign` is empty (no `package.json`).

Consequences for this plan:
- The roadmap (§13) has two tracks. **Track A** is a 45-minute emergency build that fits the grace window. **Track B** is the full plan, if the evaluators accept a late submission or this is done as portfolio work.
- The stack is chosen so it needs **no install and no build step**: plain HTML, CSS, and a small JS file. Deployment works without git (Netlify Drop drag-and-drop, or uploading files through GitHub's web UI).

---

## 1. Executive summary

Geo Excel ("GeoExcel", short for *Geographic Excellence*) is a Bangalore-based trading company of the GeoExcel Group. Formally named in 2023, it exports Indian agricultural and food products (rice, whole spices, IQF frozen foods, edible oils and ghee) and lists a fashion and lifestyle (leather footwear) collection. The current Wix site works as a **static brochure**:

- It is **hidden from search engines**: `<meta name="robots" content="noindex">` is set, and the sitemap that robots.txt points to returns 404.
- It **has no product-level enquiry path**. Product pages are long spec dumps (the Rice page is about 9,800px tall) with no "Request a quote" button, no contact block, and no footer.
- Its **credibility is undermined by content errors**: "HNS Code" instead of HS Code, copy-pasted specs on the wrong products, duplicate products, typos, and a "Certificates" heading over client text.
- The only lead form (home page) asks for name, email, and message. It captures **none of the data an export buyer's enquiry needs** (product, quantity, packaging, destination country, Incoterm).

**Selected opportunity:** turn the site from a brochure into a **B2B export buyer enquiry engine**. Make the catalogue easy to scan and compare, attach a prefilled, qualified "Request a Quote" (RFQ) to every product, surface the real compliance documents (APEDA, FSSAI, IEC, Udyam, CLE) as trust signals, and make the site indexable.

**Recommended stack:** a static multi-page site (semantic HTML, CSS custom properties, vanilla JS), with product data in one JS/JSON file that renders the catalogue. Forms are posted through Netlify Forms (free) or FormSubmit/Web3Forms, falling back to `mailto:`. Hosting is Netlify or GitHub Pages.

---

## 2. Business research

All facts below come from the Geo Excel website unless marked otherwise. Facts that could not be verified are labelled.

| Fact | Detail | Source |
|---|---|---|
| Name | "GeoExcel" / "GEO EXCEL", short for "Geographic Excellence" | https://www.geoexcel.group/about |
| Founding | Heritage "since the 1980s"; the GeoExcel name was "officially brought to life in 2023" | /about |
| Group history | 1980s: farming (rice, sugarcane, sesame). 1990s: cement and steel dealership. 1993–2014: residential, then commercial, industrial, and infrastructure civil construction in Bangalore, partly under "Anuadi Constructions". 2019: CSR focus on the UN's 17 Sustainable Development Goals. 2023: Geo Excel formed for export trade | /about |
| Group verticals | "agriculture, automotive, construction and trading" | / and /about |
| Business model | Trading, export and import facilitation. "Our team of experts facilitates the movement of goods between different countries and markets through import and export… solutions for effective supply chain management." | https://www.geoexcel.group/projects |
| Stated project scope | Production, procuring, packing, and distribution of agri products: IQF and canned fruits and vegetables, flavours and aromas, pulses and lentils, cereals and grains, whole and powdered spices, edible oils and ghee | /projects |
| Stated clients | "food grain traders, food processing companies, and government agencies" (no names given) | /projects |
| Products (listed) | **Rice** (14 entries, incl. 1121/1401/1509 Basmati steam/sella/golden sella, PR-11, IR-64, Sona Masuri, Ponni, Jeerakasala, Palakkadan Matta). **Whole spices** (15: cardamom, black pepper, clove, cinnamon, mace, nutmeg, coriander, cumin, ajwain, fenugreek, mustard, star anise, white/black sesame). **IQF** (9: peas, sweet corn, carrot, cauliflower, broccoli, mixed veg, fries, hash browns, speciality potato). **Edible oil and ghee** (9: coconut, EV coconut, groundnut, mustard, sesame, olive, EV olive, pure ghee, A2 ghee). **Fashion and lifestyle**: leather footwear image gallery with no text | /general-9, /copy-of-rice, /copy-of-whole-spices, /copy-of-whole-spices-1, /fashion-lifestyle |
| Product data style | Packaging sizes and types, origin region, grain length, broken %, moisture, HS code (labelled "HNS Code") | product pages above |
| Registrations shown | APEDA certificate, FSSAI certificate, Council for Leather Exports membership, Udyam (MSME) certificate, IEC certificate (shown as images; numbers not transcribed here) | https://www.geoexcel.group/certificates |
| Sustainability | Living wages, climate change, sustainable and organic farming practices, avoiding endangered plant species and pesticides | https://www.geoexcel.group/about-1 |
| Contact | 3C918, 3rd Cross, 1st Block, HRBR Layout, Bangalore 560043 · +91 8035110602 · Info@geoexcel.group | / (home page contact section) |
| Third-party profile | Tracxn describes geoexcel (geoexcel.group) as a "Provider of agricultural products, edible oils, and lifestyle goods", unfunded | https://tracxn.com/d/companies/geoexcel/__8vQqkAACY0ko647NIHZ0kTHV33mALUi9nKpDfG3T8os |

**Disambiguation (important):** **GeoExcel (geoexcel.com)** is an *unrelated* US geothermal heat-pump manufacturer in Appleton, MN. Its ZoomInfo, BBB, and Blue Book listings are about that company and are **not** used here. Searches for "Anuadi Constructions" returned no matching public record, so the name is taken only from Geo Excel's own About page.

**Target customers (inferred from the site, labelled as inference):** international importers, distributors, and wholesalers of rice, spices, and frozen foods; food processors; HoReCa and retail private-label buyers; domestic B2B traders; government procurement (stated). The leather footwear line suggests fashion importers as a secondary audience.

**Business goals (inferred):** generate qualified export enquiries, build trust with first-time overseas buyers, and present the group's 40-year heritage as reliability.

**Brand identity (observed):** a logo with diagonal stripes in orange, red, teal, and green, and a "GEO EXCEL" wordmark. The site uses navy (#0F1F33-ish) and white with photo-led food imagery and thin uppercase headings.

**Not found publicly:** export volumes, destination markets, team, client names, testimonials, and LinkedIn or social profiles. None of these will be invented. The redesign uses neutral placeholders or leaves them out.

---

## 3. Existing website audit

Inspected live on 31 Oct 2026 using the in-app browser (desktop and 375px mobile emulation). Pages inspected: Home, About, Products (/projects), Rice, Whole Spices, IQF, Edible Oil & Ghee, Fashion & Lifestyle, Certificates, Sustainability, plus robots.txt and sitemap.xml. Every page in the navigation was reachable. The contact form was **not** submitted, so as not to send spam to a live business.

### 3.1 Verified problems

| # | Problem | Evidence | Business impact | Recommendation | Priority |
|---|---|---|---|---|---|
| V1 | Site is excluded from search | Home `<meta name="robots" content="noindex">`; `/sitemap.xml` returns 404 even though robots.txt references it | Buyers searching "1121 basmati exporter Bangalore" can't find Geo Excel; zero organic leads | Remove noindex, publish sitemap.xml, add per-page titles and descriptions | **High** |
| V2 | No enquiry action on product pages | Rice page ~9,770px tall; interactive elements are only nav links plus a "Log In" widget; no contact block or footer | A buyer who has found the product has no next step and leaves | "Request a quote" on every product, prefilled with the product; sticky enquiry bar | **High** |
| V3 | Lead form isn't qualified for export | Fields: First name, Last name, Email (only required field), Message | Sales must go back and forth to learn product, quantity, destination, and terms; low-intent spam is mixed in | RFQ form: company, country, product(s), quantity plus unit, packaging, Incoterm, timeline, phone/WhatsApp | **High** |
| V4 | Content errors damage credibility | "HNS Code" (should be HS Code) everywhere; Nutmeg uses Mace's description; Jeerakasala and Matta specs copied from 1121 Basmati; PR-11 "Speciality: Pure 1509 Basmati"; PR-11 and 1509 Sella listed twice; "Low Crabs", "Armoas", "Kennels", "Florest", "Shelve Life 14Yr"; star anise "Origin: Vietnam" then "Country of Origin: India"; Mixed Veg HS code blank | Food buyers check specs; errors signal poor quality control | Clean, structured product data; flag uncertain values "to confirm with Geo Excel" rather than guessing | **High** |
| V5 | Mislabelled sections on Products page | Headings "SERVICES / PROJECTS / CERTIFICATES"; the "CERTIFICATES" block contains client text; "Get Started" CTA goes to Products, not a contact path | Confusing information architecture | Rewrite as "What we do / How we work / Compliance" | Medium |
| V6 | Product URLs are Wix defaults | /general-9 (Rice), /copy-of-rice (Spices), /copy-of-whole-spices (IQF), /copy-of-whole-spices-1 (Oils), /about-1 (Sustainability), /projects (Products) | Poor SEO and shareability; looks unfinished | Semantic slugs: /products/rice, /products/spices… | Medium |
| V7 | "Contact" nav item points to Home | Nav "Contact → https://www.geoexcel.group/" | Users land at the top of Home, not the contact section | Dedicated /contact page with RFQ form | Medium |
| V8 | Fashion & Lifestyle page has no content | Only "OUR COLLECTIONS" plus an image carousel with empty alt; console error `Cannot read properties of null (reading 'setAttribute')` on this page | Category looks abandoned; inaccessible images | Short category description plus enquiry CTA; label images; or present it as "on request" | Medium |
| V9 | Accessibility gaps | Logo alt "MagicEraser_240225_235337.PNG"; product image alts are file names (".png"); gallery images have empty alt; heading order has two H1s on Home ("GEO EXCEL", "FOR YOUR BUSINESS") | Fails WCAG 1.1.1 / 1.3.1 | Meaningful alt text, a single H1 per page, a labelled form | Medium |
| V10 | Phone not tappable on mobile | `format-detection telephone=no`; phone is plain text, not a `tel:` link; no WhatsApp | Mobile buyers can't call in one tap | `tel:` and `mailto:` links, WhatsApp click-to-chat (only if Geo Excel confirms a number) | Medium |
| V11 | No meta description or OG image | Metas include og:title/url only; favicon is the default Wix favicon | Weak search snippets and link previews | Unique description and OG image per page, brand favicon | Medium |
| V12 | Heavy page for its content | Home: 164 requests, ~558 KB transferred, load ~1.6s on a fast connection; many Wix runtime bundles | Slower on mobile networks in buyer markets | Static site, optimised images (WebP/AVIF, `srcset`, lazy loading) | Low |
| V13 | Floating chat widget overlaps content on mobile | Chat bubble covers the bottom-left of the product carousel and the contact block at 375px | Minor obstruction | Replace with a clear sticky "Get a quote" bar | Low |

### 3.2 Assumptions (not verified)
- A1. The home hero looked blurred in the mobile screenshot. This may just be a progressive-loading placeholder caught mid-load, so it is **not** counted as a defect.
- A2. The Products page shows large blank space below the category tiles (desktop). This may be lazy-loaded gallery height. Treated as likely but not certain.
- A3. Whether the contact form actually delivers email was not tested, on purpose.
- A4. Audience and goals in §2 are inferred from content, not confirmed by Geo Excel.

### 3.3 Opportunities (not defects)
- O1. Present the 1980s → 2023 heritage timeline as a trust story.
- O2. Show compliance documents (APEDA, FSSAI, IEC, Udyam, CLE) as a trust strip on Home and beside the RFQ.
- O3. Add a downloadable spec sheet per category later, once Geo Excel supplies validated data.
- O4. Use schema.org `Organization` and `Product` structured data.

---

## 4. Verified problems and opportunities — summary
High: V1 (invisible to search), V2 (no product enquiry path), V3 (unqualified form), V4 (spec errors). Medium: V5 to V11. Low: V12, V13. The selected problem below combines V2, V3, and V4, which form one buyer journey. V1 is a cheap fix included in the build.

---

## 5. Selected problem statement

> **International B2B buyers who reach Geo Excel's website cannot quickly evaluate a product and send a qualified enquiry. Product pages are long, error-prone spec dumps with no call to action, and the only form doesn't capture what an export quote needs. The result: lost and low-quality leads.**

**Supporting observations:** V2, V3, V4, V5, V7 (and V1, which cuts traffic to begin with).

**Why prioritise this over others:** for an export trader, the website's main commercial job is to produce **quotable enquiries**. Visual polish alone doesn't change revenue. SEO (V1) brings people in, but without a conversion path the extra traffic is wasted. Fixing the product-to-RFQ journey gives the highest impact per hour and also delivers the visual redesign along the way.

**Target audience:** procurement managers at importers and distributors (MENA, SE Asia, EU/UK, Africa are typical destinations for Indian rice and spice exports. This is industry context, not a Geo Excel claim), food processors, HoReCa/private-label buyers, and domestic traders.

**User pain points:** they can't scan or compare grades; they don't know MOQs, packaging, or terms; they can't tell whether the exporter is registered and legitimate; they have to write a free-text email from scratch; and on mobile there's no tap-to-call.

## 6. Proposed solution
1. **Structured, scannable catalogue:** a category overview, then product cards with key specs (origin, grain length, broken %, moisture, packaging, HS code), filters by category, and a search box.
2. **Request a Quote everywhere:** each product card has an "Add to enquiry" / "Request quote" button that prefills the RFQ form. A sticky mobile bar has Call / Email / Get Quote.
3. **Qualified RFQ form:** company, name, email, phone, country, products (multi-select, prefilled), quantity plus unit (MT/kg/containers), packaging preference, Incoterm (FOB/CIF/CFR/EXW), target date, message, and consent. Validation is client-side. The success state lists next steps.
4. **Trust layer:** compliance strip (APEDA, FSSAI, IEC, Udyam, CLE), heritage timeline, sustainability principles, and the real address and phone. No invented testimonials or statistics.
5. **Discoverability:** indexable pages, sitemap.xml, robots.txt, meta and OG tags, structured data, semantic URLs.

**Expected benefit (qualitative; no numbers invented):** more enquiries per visitor, enquiries that contain the data sales needs for a first quote, more credibility with first-time buyers, and organic discoverability.

---

## 7. Target audience and user journeys

| Persona | Goal | Journey |
|---|---|---|
| Importer, procurement manager (desktop) | Source 1121 Basmati Sella, 2×20ft containers, CIF Jebel Ali | Google / direct → Home → Products → Rice → filter "Basmati" → compare cards → "Request quote" on 1121 Sella → RFQ (prefilled) → submit → confirmation with response expectations |
| Distributor, multi-product (desktop or tablet) | Spices and IQF mix | Home category tiles → Spices → "Add to enquiry" ×3 → IQF → add ×2 → enquiry tray shows 5 items → RFQ → submit |
| Trader on mobile (WhatsApp-first) | Quick price check | Lands on product link → sticky bar → tap Call / Email / Get Quote → short form |
| Due-diligence reviewer | Verify legitimacy | Home trust strip → Certificates → About timeline → Contact (map/address) |

**CTAs.** Primary: **"Request a Quote"**. Secondary: "View Products", "Add to enquiry", "Call +91 80351 10602", "Email us", "View certificates".

**Contact/enquiry flow:** product CTA → `/contact.html?product=<slug>` (or the enquiry tray, kept in `localStorage`) → RFQ form prefilled → inline validation → submit (Netlify Forms / Web3Forms) → thank-you state that restates what was sent. If the service fails, a `mailto:` link is built with the form contents.

---

## 8. Sitemap

```
/                       Home
/about.html             About (heritage timeline, group, values)
/products.html          Products overview (+ all-product filter/search)
/products/rice.html
/products/spices.html
/products/iqf.html
/products/oils-ghee.html
/products/lifestyle.html
/certificates.html      Compliance & certificates
/sustainability.html
/contact.html           RFQ form + contact details
/404.html
/sitemap.xml  /robots.txt
```
*Track A (emergency) collapses this to a single page with anchors (#products, #certificates, #about, #contact) plus product category sections.*

**Navigation:** Logo · Products (dropdown: Rice, Spices, IQF, Oils & Ghee, Lifestyle) · About · Certificates · Sustainability · **[Request a Quote]** button. Footer: contact details, quick links, categories, certificates, © year.

## 9. Page-by-page specifications

**Home** (section order):
1. Header (sticky).
2. Hero: an H1 such as "Indian rice, spices & food products, sourced and exported from Bangalore" (to be worded from verified facts), a subline on facilitating international and domestic trade, CTAs "Request a Quote" and "Explore Products", and one optimised image.
3. Trust strip: APEDA · FSSAI · IEC · Udyam · CLE.
4. Product categories: 5 cards with image, short line, product count, link.
5. How we work: Enquire → Specify (grade, packaging, Incoterm) → Quote → Ship. This describes the process generically and makes no promise of timelines.
6. Heritage: 1980s → 2023 mini timeline, linking to About.
7. Sustainability teaser.
8. RFQ CTA band.
9. Footer.

**Products overview:** intro; category filter chips; search; product card grid (name, category, 3–4 key specs, "Request quote" and "Add to enquiry" buttons); enquiry tray.

**Category pages (×5):** H1 plus 2-line category intro, product cards with an expandable full spec table (`<details>`), HS code, packaging, origin, and a per-card CTA. A "can't find a grade? Ask us" CTA. Lifestyle: short description plus gallery with real alt text, and "Collections available on request".

**About:** company overview, meaning of the name, timeline (from /about verbatim facts), group verticals, CTA.

**Certificates:** cards for each registration, with an image thumbnail opening a larger view (accessible lightbox or plain link). If the original certificate images can't be legally or cleanly reused, show the registration *names* only, with "available on request".

**Sustainability:** "Our approach" and "Principles we follow" taken from the site content, rewritten for clarity without new claims.

**Contact / RFQ:** form (see §6), address, `tel:`, `mailto:`, embedded map link (an OpenStreetMap or Google Maps link, not an iframe, for performance), business-hours line only if Geo Excel confirms one.

**404:** links back to Products and Contact.

---

## 10. UI/UX design system

**Concept: "Trade-grade clarity".** A calm, spec-sheet-inspired B2B interface: generous whitespace, data shown in tidy tables and chips, warm photography of the commodities, and brand colour used as accents rather than fills.

**Colour (from the logo plus the current navy):**
| Token | Hex | Use |
|---|---|---|
| `--ink` | #0F1F33 | headings, header text, dark band |
| `--text` | #2B3645 | body |
| `--muted` | #5F6B7A | secondary text |
| `--surface` | #FFFFFF / `--surface-alt` #F6F4EF (warm grain tone) | backgrounds |
| `--line` | #E3E0D8 | borders |
| `--brand-teal` | #0E8C7F | primary buttons, links (AA on white) |
| `--brand-orange` | #E8742A | small accents, highlights (not body text) |
| `--brand-green` | #3FA34D | success states |
| `--brand-red` | #D93A3A | errors |
Exact logo hex values will be sampled from the logo file in Phase 2, and all text/background pairs checked at ≥4.5:1.

**Typography:** headings in "Manrope" (600/700), body in "Inter" (400/500), both Google Fonts with `display=swap`, falling back to the system UI stack. Fluid scale: H1 `clamp(2rem, 4vw + 1rem, 3.5rem)`, H2 `clamp(1.5rem, 2vw + 1rem, 2.25rem)`, body 1rem/1.6, small 0.875rem. Spec tables use tabular numerals.

**Spacing:** 4px base, tokens 4/8/12/16/24/32/48/64/96. Section padding is 64px on mobile and 96px on desktop.

**Layout:** container max 1200px, gutter 16px (mobile) / 24px (tablet+). CSS Grid with `repeat(auto-fill, minmax(260px, 1fr))` for cards. Breakpoints: 600, 900, 1200px.

**Buttons:** Primary (teal fill, white text, 8px radius, 44px min height), Secondary (ink outline), Tertiary (text link with arrow). States: hover darkens 8%, `:focus-visible` 3px teal outline with offset, disabled at 50% opacity.

**Navigation:** sticky header with a 1px bottom border and a subtle shadow after scroll. The desktop dropdown opens on hover and focus. Below 900px a hamburger opens a full-height drawer (`aria-expanded`, focus trap, Esc closes, body scroll locked). A sticky bottom action bar on mobile: Call · Email · Get Quote.

**Components:** Header, Footer, Button, CategoryCard, ProductCard (spec chips plus `<details>` table), FilterChips, SearchInput, EnquiryTray (count badge), TrustStrip, Timeline, CTA band, FormField (label, hint, error), Toast/inline alert, Certificate card.

**Imagery and icons:** reuse Geo Excel's own product photography only where permitted for the assignment; otherwise use royalty-free (Unsplash/Pexels) commodity photos, credited in the README. Convert to WebP, keep each under 150 KB, and set width/height to avoid layout shift. Icons are inline SVG (Lucide, MIT), with no icon font.

**Interactions:** 150–200ms colour/transform transitions; cards lift 2px on hover; sections fade in once with IntersectionObserver. All motion is disabled under `prefers-reduced-motion`. No parallax, no autoplay carousels.

---

## 11. Technical architecture

**Existing project:** `D:\geoExcel-redesign` is empty (no package.json, no git). Nothing to preserve or replace.

**Recommended stack:** **static HTML5 + modern CSS + vanilla ES modules**, with no framework and no build step.
*Why:* it fits the deadline, needs no install (git isn't even present), loads quickly, deploys anywhere free, and is easy to explain. A framework (React/Next/Astro) adds tooling time without solving the problem better.
*Optional upgrade (Track B only):* Vite for dev server and minification (`npm create vite@latest` with the vanilla template), still outputting static files.

**Architecture:**
- Shared header/footer: duplicated HTML in Track A. In Track B, inject them with a tiny `partials.js` (or Vite HTML partials) to avoid inconsistency.
- Product data: `assets/js/products.js` exports an array `{ slug, category, name, origin, specs:{}, packaging:[], hsCode, image, notes }`. Category pages and the products overview render from it, so data errors are fixed in one place.
- Enquiry tray: `localStorage` key `gx-enquiry` (wrapped in try/catch) keeps the selected product slugs. The contact page reads it, plus the `?product=` query.
- Forms: HTML form with `data-netlify="true"` and a honeypot field when hosted on Netlify. If deployed on GitHub Pages, post to Web3Forms or FormSubmit (free, no backend; the access key is public by design). Progressive enhancement means it works without JS.
- Routing: real files (multi-page). No client-side router.
- CSS: one `styles.css` with tokens on `:root`, layered with `@layer reset, base, components, utilities`, mobile-first.
- Assets: `assets/img/` with WebP images, `<img loading="lazy" decoding="async" width height>`. The hero gets `fetchpriority="high"`.
- Performance: no third-party JS except the form endpoint; fonts preconnected with `display=swap`; target Lighthouse ≥90 on all four categories.
- Deployment: Netlify Drop (drag the folder; no git needed) or a GitHub repo uploaded through the web UI with GitHub Pages enabled.

## 12. Project folder structure

```
geoExcel-redesign/
├─ index.html
├─ about.html
├─ products.html
├─ products/
│  ├─ rice.html  spices.html  iqf.html  oils-ghee.html  lifestyle.html
├─ certificates.html
├─ sustainability.html
├─ contact.html
├─ 404.html
├─ assets/
│  ├─ css/styles.css
│  ├─ js/main.js          (nav, sticky bar, reveal, tray)
│  ├─ js/products.js      (data)
│  ├─ js/catalogue.js     (render, filter, search)
│  ├─ js/form.js          (validation, prefill, submit)
│  ├─ img/                (webp, logo.svg, og-image.jpg, favicon)
├─ robots.txt
├─ sitemap.xml
├─ README.md
├─ PROBLEM_SOLUTION.md
└─ IMPLEMENTATION_PLAN.md
```

---

## 13. Implementation roadmap

### Track A: emergency submission (fits the 12:00 IST grace deadline; about 45 min)
| Stage | Tasks | Output | Done when |
|---|---|---|---|
| A1 Prep (3 min) | Create the folder structure | Skeleton | Files exist |
| A2 Single-page build (25 min) | `index.html` with header, hero, trust strip, category sections with product cards (key items per category from verified data), about/timeline, certificates list, RFQ form (Web3Forms or mailto fallback), footer; `styles.css` tokens plus responsive grid; `main.js` mobile nav, "Request quote" prefill | Working responsive one-pager | Renders at 375 / 768 / 1280px with no console errors |
| A3 Docs (5 min) | README (stack, setup, deploy, limitations) and PROBLEM_SOLUTION.md (from §5–6) | Two docs | Both present |
| A4 Deploy (5 min) | Drag the folder into https://app.netlify.com/drop; upload files to a new GitHub repo through the web UI (no git needed) | Live URL plus repo URL | Both URLs open publicly |
| A5 Verify and submit (5 min) | Check on desktop and mobile; submit the 4 deliverables | Submission | Sent before 12:00 IST |

### Track B: full build (if time allows or a late submission is accepted)
| # | Stage | Tasks | Expected output | Depends on | Completion criteria |
|---|---|---|---|---|---|
| 1 | Project preparation | Folder structure; optional `npm create vite@latest` (vanilla); install git or use GitHub Desktop | Skeleton repo | — | Opens locally |
| 2 | Design foundation | Tokens, reset, typography, grid, buttons, focus styles; sample logo colours | `styles.css` base | 1 | Style tile page passes contrast |
| 3 | Shared components | Header (dropdown, drawer), footer, sticky mobile bar, cards, form fields, trust strip | Reusable markup and CSS | 2 | Keyboard-operable nav |
| 4 | Homepage | 9 sections per §9 | `index.html` | 3 | Matches spec; responsive |
| 5 | Remaining pages | Products data file plus renderers; 5 category pages; About, Certificates, Sustainability, Contact, 404 | All pages | 3, 4 | Every nav link resolves |
| 6 | Responsive implementation | Test at 360/414/768/1024/1280/1440 | No overflow | 4, 5 | No horizontal scroll; tap targets ≥44px |
| 7 | Functional interactions | Filter/search, enquiry tray, RFQ prefill, validation, submit, success/error states | Working flows | 5 | Journeys in §7 pass |
| 8 | SEO and accessibility | Titles, descriptions, OG, JSON-LD Organization/Product, sitemap, robots, alt text, landmarks, skip link | Metadata complete | 5 | Lighthouse SEO/A11y ≥90; axe has no serious issues |
| 9 | Testing and bug fixing | §14 checklist | Bug list closed | 6–8 | All checks pass |
| 10 | Production build | Minify (Vite build) or ship as is; compress images | `dist/` or root | 9 | Build has no errors |
| 11 | GitHub repository | Public repo, README, docs, .gitignore | Repo URL | 10 | Repo public, files present |
| 12 | Deployment | Netlify (connect the repo or Drop) / GitHub Pages; form notifications set up | Live URL | 11 | HTTPS URL loads |
| 13 | Final verification | Re-run §14 on the live URL, real phone check, test form submission to own email | Verified site | 12 | Checklist green |
| 14 | Documentation and submission | README, PROBLEM_SOLUTION.md, screenshots; submit links | Submission | 13 | All 4 deliverables sent |

---

## 14. Testing strategy and acceptance criteria

| Area | Check | Pass criteria |
|---|---|---|
| Desktop responsiveness | 1280, 1440, 1920px | Layout intact, max-width respected |
| Mobile responsiveness | 360, 375, 414px; tablet 768/1024 | No horizontal scroll; readable at 16px; drawer works; sticky bar doesn't cover content |
| Navigation | All header, footer, dropdown, and drawer links; keyboard Tab/Shift-Tab/Esc | Every link resolves (no 404); focus visible; drawer closes on Esc and on link click |
| Links and buttons | Every CTA, `tel:`, `mailto:`, external links | Correct targets; external links `rel="noopener"` |
| Forms and validation | Empty submit, invalid email, missing required fields, valid submit, prefill from product, honeypot | Inline errors linked with `aria-describedby`; success message; email received in a test inbox |
| Console errors | DevTools on each page | 0 errors, 0 404 requests |
| Broken images | Network tab / scripted check that `naturalWidth > 0` | All images load; all have width/height and alt |
| Accessibility | axe / Lighthouse; contrast; headings; landmarks; reduced motion; 200% zoom | Lighthouse A11y ≥90; WCAG 2.1 AA contrast; one H1 per page |
| SEO metadata | Title (≤60 chars), description (≤155), canonical, OG/Twitter, JSON-LD validated, sitemap, robots | Present and unique on every page; **no noindex** |
| Loading performance | Lighthouse mobile | Performance ≥90, LCP <2.5s, CLS <0.1 |
| Production build | Clean build / static files | No errors; relative paths work under the host's base path |
| Deployment URL | Open from another network / phone | HTTPS loads; all pages reachable; form works live |

---

## 15. Deployment strategy
- **Primary: Netlify** (free). Use Netlify Drop for speed, or connect the GitHub repo for continuous deploys. Netlify Forms handles the RFQ with spam honeypot and email notification. Custom 404 via `404.html`.
- **Alternative: GitHub Pages** (free) from the `main` branch root; the form posts to Web3Forms.
- **Without git:** create the repo on github.com, then "Add file → Upload files" (drag the whole folder). Or install Git for Windows or GitHub Desktop if time allows.
- Record the live URL, repo URL, and host in the README.
- **Account:** the repository and deployment go under a **separate GitHub account that the project owner will provide later**. No other GitHub account is used.

## 16. Risks and limitations
| Risk | Mitigation |
|---|---|
| **Deadline: less than 1 hour of grace left at time of writing** | Track A; skip Track B items |
| git not installed | Netlify Drop and GitHub web upload |
| Product data on the live site contains errors | Use only values present on the site; fix obvious typos (HNS→HS); mark contradictory values "to be confirmed" rather than inventing; note this in the README |
| Image rights | Prefer royalty-free imagery with credits; use Geo Excel images only as reference |
| Form delivery depends on a third-party free tier | `mailto:` fallback; document it in the README |
| No public data on markets, volumes, or clients | Leave out stats and testimonials entirely |
| Certificate numbers not transcribed or verified | Show registration names; link to images only if reused |
| WhatsApp number unknown | Leave out WhatsApp unless confirmed |
| Contact form on the live site not tested | Declared in the audit (A3) |

## 17. Source references
- Assignment brief: `Geo_Excel_Website_Redesign_Assignment_Professional.pdf` (local)
- Home: https://www.geoexcel.group/
- About: https://www.geoexcel.group/about
- Products: https://www.geoexcel.group/projects
- Rice: https://www.geoexcel.group/general-9
- Whole Spices: https://www.geoexcel.group/copy-of-rice
- IQF Products: https://www.geoexcel.group/copy-of-whole-spices
- Edible Oil & Ghee: https://www.geoexcel.group/copy-of-whole-spices-1
- Fashion & Lifestyle: https://www.geoexcel.group/fashion-lifestyle
- Certificates: https://www.geoexcel.group/certificates
- Sustainability: https://www.geoexcel.group/about-1
- robots.txt: https://www.geoexcel.group/robots.txt · sitemap (404): https://www.geoexcel.group/sitemap.xml
- Tracxn profile: https://tracxn.com/d/companies/geoexcel/__8vQqkAACY0ko647NIHZ0kTHV33mALUi9nKpDfG3T8os
- *Excluded (different company):* https://geoexcel.com/ (US geothermal manufacturer)

## 18. Final assignment acceptance checklist
- [ ] Live website at a public HTTPS URL
- [ ] Public source code repository link
- [ ] PROBLEM_SOLUTION.md (problem, observations, how the redesign addresses it)
- [ ] README (stack, setup, deployment, known limitations, image credits)
- [ ] Responsive on desktop and mobile (verified on the live URL)
- [ ] All navigation, links, and CTAs work; RFQ form validates and submits
- [ ] No invented company facts, testimonials, figures, or capabilities
- [ ] Separate repo and deployment; Geo Excel's live site untouched
- [ ] No console errors or broken images; metadata present; no noindex
- [ ] Submitted before 31 Oct 2026, 12:00 IST (grace deadline)

---

### Review notes: missing information
- Not available publicly: export markets, volumes, MOQs, lead times, payment terms, client names, team, social profiles, WhatsApp number, and certificate numbers. All of these are left out of the build.
- Product data needs validation by Geo Excel (see V4).
- The live contact form's delivery was not tested (deliberately).

---

## Implementation notes (Phase 2)

Technical changes made during implementation. Scope, pages and design direction are unchanged.

- **Source/build split:** pages live in `src/` and are built into `dist/` by a Node script with no dependencies, instead of being written by hand as root HTML files. This gives one shared header, footer and CTA (no duplicated markup). It also renders product cards as static, indexable HTML from `src/data/products.json`, instead of injecting them at runtime with `partials.js`/`products.js` as described in §11.
- **Build verification and tests:** `npm run build` checks metadata, headings, alt text, ids and every internal link. `npm test` runs 52 checks in a headless browser: layout at 375/768/1280px, navigation, catalogue, enquiry list, form, 404 page and console errors.
- **Form:** no form service is configured, so the form doesn't claim to send. Until `data-endpoint` is set (see README), it prepares an email draft and a summary the user can copy.
- **Imagery:** there are no photographs. Neutral SVG category icons are used instead of unlicensed or stock product photos.
- **Problem note:** named `PROBLEM_SOLUTION.md`, as the Phase 2 brief requested.

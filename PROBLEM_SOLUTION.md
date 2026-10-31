# Problem & Solution: Geo Excel Website Redesign

## 1. Selected business problem

**International B2B buyers who reach geoexcel.group cannot quickly evaluate a product and send a qualified enquiry.** Product pages are long, error-prone specification lists with no call to action, and the only form doesn't capture what an export quotation needs. The website works as a brochure when the business needs it to generate leads.

## 2. Supporting observations

All observations come from the live site, inspected on 31 Oct 2026.

| # | Observation | Evidence |
|---|---|---|
| 1 | **No enquiry path on product pages** | The Rice page is about 9,800px of specifications. Its only interactive elements are navigation links and a "Log In" widget, with no quote button, contact block or footer. |
| 2 | **The lead form isn't built for export enquiries** | The single form (home page) asks for first name, last name, email (the only required field) and message. It never asks for product, quantity, destination, packaging or Incoterm. |
| 3 | **Specification errors reduce credibility** | "HNS Code" is used instead of HS code throughout. Nutmeg uses Mace's description; Jeerakasala and Matta reuse 1121 Basmati's specification; PR 11 and 1509 Sella are listed twice; star anise states two origins; there are typos such as "Low Crabs", "Armoas" and "Kennels". |
| 4 | **Confusing structure** | The "Contact" menu item links to the home page. The Products page shows a "CERTIFICATES" heading over client text. URLs are Wix defaults (`/copy-of-rice` is the Spices page, `/about-1` is Sustainability). |
| 5 | **Invisible to search engines** | `<meta name="robots" content="noindex">` is set on the home page, and the sitemap referenced in robots.txt returns 404. |
| 6 | **Mobile friction** | The phone number is plain text rather than a tap-to-call link, and a floating chat bubble covers content at 375px. |

## 3. Target audience

- **Primary:** procurement managers at importers, distributors and wholesalers sourcing Indian rice, spices, frozen foods, oils and ghee.
- **Secondary:** food processors, HoReCa and private-label buyers, domestic B2B traders, and government procurement (which Geo Excel lists among its clients).
- **Tertiary:** fashion importers interested in the leather footwear collection.

**Their pain points:** they can't scan or compare grades quickly, can't easily confirm the exporter is registered, have to write a free-text email from scratch, and can't call with one tap on mobile.

## 4. Proposed solution

Turn the website into a **B2B enquiry engine**:

1. **A structured, scannable catalogue.** All 45 published products appear as specification cards showing key specs, packaging and HS code, grouped into five category pages, with filtering and search.
2. **"Request a Quote" everywhere.** Every product card has "Add to enquiry" (building a multi-product list) and "Request quote" (opening a pre-filled form).
3. **A qualified quote form.** It asks for products, quantity and unit, destination country, Incoterm, packaging, required-by date, company and contact details, with accessible inline validation.
4. **A trust layer.** The site shows the registrations (APEDA, FSSAI, IEC, Udyam, Council for Leather Exports), the 1980s–2023 heritage timeline and sustainability principles, all taken from Geo Excel's own site. There are no invented testimonials or statistics.
5. **Discoverability.** Every page is indexable, with its own title and meta description, plus Open Graph tags, schema.org data, an auto-generated sitemap and readable URLs.

## 5. How the redesign addresses the opportunity

| Problem | What the redesign does |
|---|---|
| No enquiry path | Each of the 45 product cards has "Request quote" (links to the form pre-filled with that product) and "Add to enquiry". A floating "Enquiry (n)" button on desktop and a sticky "Call · Email · Get Quote" bar on mobile keep the next step visible on every page. |
| Unqualified form | The form collects the details needed for a first quotation. Required fields are validated inline, with specific error messages and focus moved to the first problem. |
| Spec errors | Product data lives in one structured file (`src/data/products.json`). HS codes are corrected and duplicates removed. Contradictory source values are marked "To be confirmed" with a visible note, rather than guessed. |
| Confusing structure | The site has a clear sitemap: Products (5 category pages), About, Certificates, Sustainability and Request a Quote. It uses readable URLs such as `/products/rice.html` and breadcrumbs on category pages. |
| Invisible to search | Pages are `index, follow`, with unique titles and descriptions. Organization and ItemList structured data are included, and `sitemap.xml` and canonical URLs are generated at build time. |
| Mobile friction | Phone and email are tap-to-call and tap-to-email links. The layout is responsive from 375px upwards with no horizontal scrolling, and tap targets are at least 40px. |

**Honest submission handling:** this concept site has no backend. Until a form service URL is configured, the form never claims to have sent anything. It tells the user the enquiry hasn't been sent yet and offers a pre-filled email draft and a "copy enquiry" button. Setting one attribute (`data-endpoint`) turns on real online submission.

**Expected benefit:** a higher share of visitors become enquiries, each enquiry arrives with the details needed for a first quotation, first-time overseas buyers get more confidence from visible registrations, and the site can be found in organic search. No numeric targets are claimed, because no baseline data is public.

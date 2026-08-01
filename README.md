# Snowy Nail Studio — Website
**Live site:** Deploy the `docs/` folder via GitHub Pages  
**Language:** English + Simplified Chinese (切换语言: top-right button)  
**Stack:** Fully static HTML · CSS · Vanilla JS · Local JSON files
---
## Project structure
```
snowy-nail-studio/
│
├── docs/                        ← GitHub Pages root (deploy this folder)
│   ├── index.html               ← Home
│   ├── gallery.html             ← Nail Art Gallery
│   ├── services.html            ← Services, Pricing & Promotions
│   ├── studio.html              ← Safety & Studio
│   ├── about.html               ← About & Client Feedback
│   ├── contact.html             ← Contact, FAQ & Policies
│   ├── aftercare.html           ← Nail Care & Aftercare
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css         ← All styles (mobile-first, design tokens)
│   │   ├── js/
│   │   │   ├── i18n.js          ← Language switching (EN ↔ 中文)
│   │   │   ├── main.js          ← Nav injection, scroll reveal, FAQ accordion
│   │   │   ├── gallery.js       ← Gallery grid, filters, lightbox, swipe
│   │   │   └── reviews.js       ← Reviews, services, promotions, FAQ, aftercare loaders
│   │   └── images/
│   │       ├── gallery/         ← Nail art photos (g001.webp … )
│   │       ├── reviews/         ← Review screenshots (review-0004.webp … )
│   │       └── posters/
│   │           ├── en/          ← English pricing/promo poster images
│   │           └── zh/          ← Chinese pricing/promo poster images
│   │
│   └── data/                    ← All site content — edit these JSON files
│       ├── translations.json    ← All bilingual UI strings
│       ├── gallery.json         ← Gallery items metadata
│       ├── reviews.json         ← Client reviews (text + image types)
│       ├── faq.json             ← FAQ questions and answers
│       ├── aftercare.json       ← Aftercare guide content
│       └── promotions.json      ← Services list and active promotions
│
├── content/                     ← Source / upload staging area
│   ├── gallery/                 ← Original nail art photos before optimization
│   ├── reviews/                 ← Original review screenshots
│   └── posters/
│       ├── en/                  ← Original EN poster files
│       ├── zh/                  ← Original ZH poster files
│       └── archive/             ← Past promotions
│
├── metadata/
│   ├── gallery.csv              ← Optional: spreadsheet for bulk gallery updates
│   └── promotions.json          ← Mirror of docs/data/promotions.json
│
└── README.md
```
---
## GitHub Pages setup
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to `Deploy from a branch`, branch `main`, folder `/docs`.
4. Your site will be live at `https://YOUR-USERNAME.github.io/snowy-nail-studio/`.
---
## Adding real content
### Gallery photos

**Recommended:** Use the Cursor `@gallery-upload` skill for bilingual auto-tagging, image optimization, and JSON updates. Say "upload gallery" in Agent chat.

**Manual workflow:**
1. Archive the original upload under `content/gallery/original-uploads/`, then create a full-size `.webp` and a matching thumbnail:
   ```bash
   npm install
   node tools/optimize-gallery-image.js content/gallery/photo.jpg docs/assets/images/gallery/g015-slug.webp
   node tools/gallery-next-id.js "descriptive slug words"
   ```
2. Place the full image in `docs/assets/images/gallery/` and the thumbnail with the same filename in `docs/assets/images/gallery/thumbs/`.
3. Open `docs/data/gallery.json` and add or update entries:
   ```json
   {
     "id": "g015-cherry-blossom",
     "src": "assets/images/gallery/g015-cherry-blossom.webp",
     "thumb": "assets/images/gallery/thumbs/g015-cherry-blossom.webp",
     "altEn": "Description in English",
     "altZh": "中文描述",
     "style": ["floral"],
     "colour": ["pink"],
     "shape": "almond",
     "length": "medium",
     "finish": "gel",
     "service": "manicure",
     "featured": false,
     "featured-order": null,
     "date": "2025-08",
     "mockColor": ""
   }
   ```
4. Set `"mockColor": ""` (empty) to use the real image; set a color name to keep using the CSS placeholder.

Use only these approved gallery style tags: `french`, `cat-eye`, `chrome`, `ombre`, `floral`, `rhinestone`, `marble`, `hand-painted`, and `glitter`. Use an empty `style` array when none applies. Do not invent additional style values and do not classify an item as Shellac.

For homepage placement, set `featured` to `true` and assign a unique positive integer in `featured-order`. The homepage displays up to four featured records in ascending `featured-order`; non-featured records may omit the field or set it to `null`.

For bulk updates, reconcile the original upload, gallery record ID, website image filename, and thumbnail filename against the gallery mapping workbook before editing `gallery.json`.
### Reviews
#### Text review
```json
{
  "id": "review-0007",
  "type": "text",
  "quoteZh": "中文评价内容",
  "quoteEn": "English translation",
  "displayName": "Client",
  "source": "小红书",
  "rating": 5,
  "featured": true
}
```
#### Screenshot review
1. Sanitize the screenshot: remove usernames, profile photos, and phone numbers.
2. Save as `.webp` in `docs/assets/images/reviews/`.
3. Add to `docs/data/reviews.json`:
```json
{
  "id": "review-0008",
  "type": "image",
  "image": "assets/images/reviews/review-0008.webp",
  "quoteZh": "原文中文",
  "quoteEn": "English translation",
  "displayName": "Client",
  "source": "小红书",
  "rating": 5,
  "featured": false
}
```
4. Leave `"image": ""` to display the built-in mock XHS conversation layout.
### Pricing posters
1. Upload EN poster to `docs/assets/images/posters/en/`.
2. Upload ZH poster to `docs/assets/images/posters/zh/`.
3. In `services.html`, replace the `<div class="poster-mock">` block with:
   ```html
   <img src="assets/images/posters/en/pricing-en.webp" alt="Price list">
   ```
   Or keep using the `poster-wrap` toggle — update `promotions.json` with `imageEn`/`imageZh` paths.
### FAQ
Edit `docs/data/faq.json` — no HTML changes needed. The site reads this file on every page load.
### Aftercare
Edit `docs/data/aftercare.json` — no HTML changes needed.
### Promotions
Edit `docs/data/promotions.json`. Set `"active": false` to hide a promotion.
---
## Language switching
- The site auto-detects the visitor's browser language.
- Visitors can switch with the **EN / 中文** button in the top-right nav.
- All UI strings live in `docs/data/translations.json`.
- Gallery alt text, review quotes, FAQ, and aftercare are bilingual in their own JSON files.
---
## Mock content
All gallery items with `"mockColor"` set use CSS gradient placeholders.  
All reviews with `"image": ""` show a mock 小红书 conversation.  
Replace these incrementally as real content becomes available.
---
## Analytics (recommended)
Add a script tag for your analytics provider before `</body>` in each HTML file.  
Filter usage, page views, and contact link clicks are the primary metrics per the project plan.
---
## Maintenance workflow
| Task | Action |
|---|---|
| Upload gallery photo | In Cursor, say **upload gallery** or invoke `@gallery-upload` skill |
| Add nail art photo (manual) | Add to `docs/assets/images/gallery/`, update `docs/data/gallery.json` |
| Add review | Update `docs/data/reviews.json` |
| Update FAQ | Edit `docs/data/faq.json` |
| Update aftercare | Edit `docs/data/aftercare.json` |
| Add promotion | Update `docs/data/promotions.json` + upload poster images |
| Update pricing | Upload new poster to `docs/assets/images/posters/`, update poster source in `services.html` |
 | Change UI text / translation | Edit `docs/data/translations.json` |
---
## Availability / Business hours
The site supports an availability view powered by a cached FreeBusy JSON (Apps Script). To update hours or the endpoint:

- Edit weekly hours in `docs/data/site.json` under `business.hours.days` (keys: `mon`,`tue`,`wed`,`thu`,`fri`,`sat`,`sun`). Each day uses `"open": "HH:MM"` and `"close": "HH:MM"` (24-hour format).
- The site fetches `docs/data/availability.json` by default (sample cached FreeBusy output). To point to a remote Apps Script endpoint, change `business.availabilityEndpoint` in `docs/data/site.json` to the full URL returning the JSON shape `{ "timezone":"...", "busy": [{"start":"...","end":"..."}] }`.

Notes:
- Hourly blocks are marked Booked if any portion of the hour overlaps a `busy` interval.
- The availability page (`docs/availability.html`) renders a 60-day view and auto-scrolls to today.

---
name: gallery-upload
description: >-
  Guides bilingual tagging and publishing of new Snowy Nail Studio gallery
  photos. Use when uploading nail art images, updating gallery.json, adding
  gallery tags with English and Chinese translations, or when the user says
  upload gallery, add gallery photo, new nail art, or @gallery-upload.
---

# Gallery Upload

Interactive workflow for adding nail art photos to the Snowy Nail Studio site with bilingual auto-tagging, user validation, and full publish pipeline.

## Before you start

Read these files in order:

1. [tag-vocabulary.md](tag-vocabulary.md) — allowed slugs and EN/ZH labels
2. [schema.md](schema.md) — gallery.json field requirements
3. [examples.md](examples.md) — sample validation output

## Hard rules

- Never commit unless the user explicitly asks
- Never write files until the user validates the tag proposal
- Never invent translation keys without user approval
- Prefer existing slugs from tag-vocabulary.md over new ones
- Always run `node tools/validate-content.js` before declaring done
- Check images for PII (faces, usernames, phone numbers, watermarks) and flag before publish
- Use ID format `g{NNN}-{kebab-slug}` (e.g. `g015-cherry-blossom`)
- Set `"mockColor": ""` when publishing a real image

## Workflow

Copy this checklist and track progress:

```
Gallery upload progress:
- [ ] Phase 1: Intake
- [ ] Phase 2: Stage
- [ ] Phase 3: Analyze & research
- [ ] Phase 4: Validation (user approval)
- [ ] Phase 5: New-tag handling
- [ ] Phase 6: Publish
- [ ] Phase 7: Verify & summarize
```

### Phase 1 — Intake

Ask the user to attach one or more nail art images, or provide a file path.

- Support **batch mode**: process images sequentially, one validation round per image
- If replacing a mock entry (g007–g014 in gallery.json), note the target ID instead of creating a new one
- Ask whether the design should be **featured** (default: ask each time)
- Default **date** to current `YYYY-MM` unless the user specifies otherwise

### Phase 2 — Stage

Copy each original to `content/gallery/` with a timestamped filename. Never overwrite existing files.

Example: `content/gallery/20250725-143022-original.jpg`

### Phase 3 — Analyze & research

Inspect each image visually. Propose tags for every dimension:

| Group | Cardinality | Field in gallery.json |
|-------|-------------|----------------------|
| style | multi | `style[]` |
| colour | multi | `colour[]` |
| shape | single | `shape` |
| length | single | `length` |
| finish | single | `finish` |
| service | single | `service` |
| season | multi (optional) | `season[]` |

Also draft **altEn** and **altZh** — client-facing descriptions, not tag lists.

For **each proposed tag**, include a bilingual research note explaining the nail-art term:

> **cat-eye / 猫眼** — Magnetic gel polish with a light band that shifts as the nail moves. Differs from plain shimmer or glitter.

Use web search only when a term is ambiguous (e.g. glass foil vs chrome).

### Phase 4 — Validation table

Present this table and **wait for user approval** before writing anything:

```markdown
## Tag proposal — [filename or description]

| Group   | Slug      | EN        | 中文     | Conf  | Notes              |
|---------|-----------|-----------|----------|-------|--------------------|
| style   | cat-eye   | Cat Eye   | 猫眼     | high  | magnetic band      |
| colour  | blue      | Blue      | 蓝色     | high  | on 3 nails         |
| shape   | oval      | Oval      | 椭圆形   | high  |                    |
| length  | short     | Short     | 短       | high  |                    |
| finish  | gel       | Gel       | 光疗胶   | high  |                    |
| service | manicure  | Manicure  | 手部美甲 | high  |                    |

**Alt EN:** Blue cat-eye gel manicure with glitter accent nails and rhinestone charm
**Alt ZH:** 蓝色猫眼光疗甲，银闪渐变配水钻饰品
**Featured:** yes | **Date:** 2025-07 | **Season:** winter (optional)
```

Accept edits, removals, and custom tags from the user.

### Phase 5 — New-tag handling

For any slug **not** in [tag-vocabulary.md](tag-vocabulary.md):

1. Propose kebab-case slug and EN + ZH labels (research-backed)
2. **Ask the user:** "Expose `{slug}` as a filter button on gallery.html?"
3. If approved for translation (always): add `filter_{slug}` to both `en.gallery` and `zh.gallery` in `docs/data/translations.json`
4. If approved for filter button: append a button to the correct group in `docs/gallery.html`:

```html
<button class="filter-btn" data-group="style" data-value="cat-eye" data-i18n="gallery.filter_cat-eye">Cat Eye</button>
```

Replace `style` / `cat-eye` / i18n key with the actual group and slug.

5. Append the new entry to [tag-vocabulary.md](tag-vocabulary.md)

**Filter button groups in gallery.html:**

| JSON field | `data-group` value |
|------------|-------------------|
| `service` | `service` |
| `style[]` | `style` |
| `colour[]` | `colour` |
| `shape` | `shape` |
| `length` | `length` |
| `finish` | `finish` |

### Phase 6 — Publish

1. Get next ID:
   ```bash
   node tools/gallery-next-id.js "descriptive slug words"
   ```
2. Optimize image:
   ```bash
   node tools/optimize-gallery-image.js content/gallery/RAW.ext docs/assets/images/gallery/g015-slug.webp
   ```
   If sharp is unavailable (`npm install` first), ask the user to convert manually to webp (~800×1067, < 200 KB).
3. Append or update entry in `docs/data/gallery.json`:

```json
{
  "id": "g015-cherry-blossom",
  "src": "assets/images/gallery/g015-cherry-blossom.webp",
  "thumb": "assets/images/gallery/g015-cherry-blossom.webp",
  "altEn": "...",
  "altZh": "...",
  "style": ["floral", "romantic"],
  "colour": ["pink", "white"],
  "shape": "almond",
  "length": "medium",
  "finish": "gel",
  "service": "manicure",
  "featured": false,
  "date": "2025-07",
  "mockColor": ""
}
```

- `thumb` equals `src` (site convention)
- When replacing a mock entry: update the existing row, remove `mockColor` or set to `""`

### Phase 7 — Verify & summarize

```bash
node tools/validate-content.js
```

Fix any failures before declaring done. Show a bilingual summary:

```markdown
## Published — g015-cherry-blossom

| | |
|---|---|
| Image | docs/assets/images/gallery/g015-cherry-blossom.webp |
| Staged original | content/gallery/20250725-143022-original.jpg |
| Tags | style: floral, romantic · colour: pink, white · almond · medium · gel · manicure |
| Alt EN | Soft pink almond gel nails with cherry blossom art |
| Alt ZH | 粉色杏形光疗甲，樱花图案 |
| Files changed | gallery.json, translations.json (if new tags) |
| Validator | ✓ passed |
```

## Pre-publish checklist

- [ ] PII check passed (no unintended faces, usernames, watermarks)
- [ ] No duplicate ID (run `gallery-next-id.js`)
- [ ] All style/colour slugs have `filter_{slug}` in translations.json (validator enforces this)
- [ ] EN and ZH translation keys added in pairs
- [ ] New filter buttons use matching `data-i18n="gallery.filter_{slug}"`
- [ ] `mockColor` is `""` for real images
- [ ] `node tools/validate-content.js` passes

## Batch uploads

Process one image at a time through Phases 3–6. Shared vocabulary grows as new tags are approved across the batch. Summarize all published items at the end.

## Mock replacement

Items g007–g014 use CSS placeholders (`mockColor` set). When the user provides a real photo for one:

1. Keep the same numeric ID if replacing that slot, or use next available ID
2. Update the existing gallery.json row
3. Save optimized webp using the item's ID slug

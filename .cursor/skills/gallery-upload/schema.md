# Gallery Item Schema

Reference for `docs/data/gallery.json` entries. Validated by `tools/validate-content.js`.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID, format `g{NNN}-{kebab-slug}` |
| `src` | string | Path relative to `docs/`, e.g. `assets/images/gallery/g015-slug.webp` |
| `thumb` | string | Same as `src` (site convention) |
| `altEn` | string | English alt text for lightbox and accessibility |
| `altZh` | string | Chinese alt text |
| `style` | string[] | One or more style slugs |
| `colour` | string[] | One or more colour slugs |
| `shape` | string | Single shape slug |
| `length` | string | `short` \| `medium` \| `long` |
| `finish` | string | e.g. `gel`, `acrylic` |
| `service` | string | `manicure` \| `pedicure` \| `extensions` |
| `featured` | boolean | Show in featured strip on home page |
| `date` | string | `YYYY-MM` for newest sort |

## Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `season` | string[] | Occasion/season metadata (no UI filter yet) |
| `mockColor` | string | CSS placeholder class when no real image; set `""` for real photos |

## Translation contract

Every slug in `style[]` and `colour[]` **must** have a matching key in `docs/data/translations.json`:

```
en.gallery.filter_{slug}
zh.gallery.filter_{slug}
```

The validator fails if any style or colour slug lacks translations.

## Filter groups (gallery.js)

| JSON field | Filter group | Match type |
|------------|--------------|------------|
| `service` | `service` | exact |
| `style[]` | `style` | includes |
| `colour[]` | `colour` | includes |
| `shape` | `shape` | exact |
| `length` | `length` | exact |
| `finish` | `finish` | exact |

## Canonical new-entry template

```json
{
  "id": "g015-cherry-blossom",
  "src": "assets/images/gallery/g015-cherry-blossom.webp",
  "thumb": "assets/images/gallery/g015-cherry-blossom.webp",
  "altEn": "Soft pink almond gel nails with cherry blossom art",
  "altZh": "粉色杏形光疗甲，樱花图案",
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

## Image specs

- Format: `.webp`
- Max dimensions: 800×1067 px (maintain aspect ratio, no upscaling)
- Target size: < 200 KB
- Output path: `docs/assets/images/gallery/`
- Staging path: `content/gallery/` (originals)

## ID naming

- Prefer descriptive slugs: `g001-blue-cat-eye-rhinestone`
- Get next ID: `node tools/gallery-next-id.js "blue cat eye rhinestone"`

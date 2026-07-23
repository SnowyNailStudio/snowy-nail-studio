# ChatGPT Project Instructions

Place this file in the project root of `snowy-nail-studio`. Use it as a reference when asking ChatGPT to help with:

- converting photos to `.webp`
- updating `docs/data/gallery.json`
- updating `docs/data/reviews.json`
- updating `docs/data/promotions.json`

---

## Project structure

The website files are served from `docs/`.

Important asset folders:

- `docs/assets/images/gallery/`
- `docs/assets/images/reviews/`
- `docs/assets/images/posters/en/`
- `docs/assets/images/posters/zh/`

Important data files:

- `docs/data/gallery.json`
- `docs/data/reviews.json`
- `docs/data/promotions.json`
- `docs/data/translations.json`
- `docs/data/faq.json`
- `docs/data/aftercare.json`

---

## How to ask ChatGPT

### 1. Convert photos to `.webp`

When you have a source photo, ask:

> Convert these images to `.webp` and save them to the correct asset folder for the Snowy Nail Studio project.

List the original image names and the intended gallery or reviews destination, for example:

- `sunset-nails.jpg` → `docs/assets/images/gallery/sunset-nails.webp`
- `review-screenshot.png` → `docs/assets/images/reviews/review-0007.webp`

If you want a specific quality setting, add it, e.g. `quality 80`.

### 2. Update `gallery.json`

Tell ChatGPT the new gallery items and include all required fields.

Example prompt:

> Add these new gallery items to `docs/data/gallery.json`:
> - `id`: `g015`
> - `src`: `assets/images/gallery/g015.webp`
> - `thumb`: `assets/images/gallery/g015.webp`
> - `altEn`: `Soft pink almond gel nails with cherry blossom art`
> - `altZh`: `粉色杏形光疗甲，樱花图案`
> - `style`: `["floral", "romantic"]`
> - `colour`: `["pink", "white"]`
> - `shape`: `almond`
> - `length`: `medium`
> - `finish`: `gel`
> - `service`: `manicure`
> - `featured`: `true`
> - `date`: `2025-08`
> - `mockColor`: `""`

If the photo is ready, set `mockColor` to `""`. If you want a placeholder until the photo is added, use a color string such as `"pink"`.

### 3. Update `reviews.json`

For text reviews:

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

For screenshot reviews:

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

If you do not want to include a real screenshot, leave `"image": ""` and the site will use the mock conversation layout.

### 4. Update `promotions.json`

Promotions require:

- `id`
- `titleEn`
- `titleZh`
- `descriptionEn`
- `descriptionZh`
- `imageEn`
- `imageZh`
- `validUntil`
- `active`

Example:

```json
{
  "id": "promo-003",
  "titleEn": "Holiday Nail Set",
  "titleZh": "节日美甲套餐",
  "descriptionEn": "Book a festive set and get a free nail art upgrade.",
  "descriptionZh": "预订节日套餐，即享免费美甲彩绘升级。",
  "imageEn": "assets/images/posters/en/holiday-set-en.webp",
  "imageZh": "assets/images/posters/zh/holiday-set-zh.webp",
  "validUntil": "2025-12-31",
  "active": true
}
```

If a promotion should not appear yet, set `"active": false`.

---

## File path rules

All image paths inside JSON should be relative to `docs/`.

- `assets/images/gallery/...`
- `assets/images/reviews/...`
- `assets/images/posters/en/...`
- `assets/images/posters/zh/...`

Do not include `docs/` in the JSON image path.

---

## Example workflow

1. Add source photos to the local project or provide them.
2. Ask ChatGPT to convert the source images to `.webp`.
3. Receive the converted filenames and save them into the correct folders.
4. Ask ChatGPT to update `docs/data/gallery.json`, `docs/data/reviews.json`, or `docs/data/promotions.json` with the new entries.
5. Preview the site locally by serving `docs/`.

---

## Conversion command examples

If you have a local image conversion tool, you can also use these commands:

### Using `cwebp`

```powershell
cwebp -q 80 "source.jpg" -o "docs/assets/images/gallery/source.webp"
```

### Using ImageMagick

```powershell
magick "source.jpg" -quality 80 "docs/assets/images/gallery/source.webp"
```

---

## Notes

- Use `.webp` when possible for best performance.
- The gallery currently renders only images, not video.
- Keep JSON entries well-formed and use consistent IDs.
- If ChatGPT modifies JSON, verify the structure and commas carefully.

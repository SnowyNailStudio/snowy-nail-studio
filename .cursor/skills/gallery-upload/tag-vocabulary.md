# Gallery Tag Vocabulary

EN/ZH mapping for Snowy Nail Studio gallery tags. Primary source of truth for labels: `docs/data/translations.json` keys `gallery.filter_{slug}`.

**Legend:** `[filter]` = has a button in `docs/gallery.html` · `[meta]` = translation exists, no filter button · `[gap]` = used in data or needed, no translation yet

---

## Service (single value)

| Slug | EN | 中文 | UI |
|------|----|------|-----|
| manicure | Manicure | 手部美甲 | [filter] |
| pedicure | Pedicure | 足部美甲 | [filter] |
| extensions | Extensions | — | [gap] |

---

## Style (multi-value)

| Slug | EN | 中文 | UI |
|------|----|------|-----|
| floral | Floral | 花卉 | [filter] |
| minimalist | Minimalist | 简约 | [filter] |
| glam | Glam | 华丽 | [filter] |
| geometric | Geometric | 几何 | [filter] |
| kawaii | Kawaii | 可爱 | [filter] |
| ombre | Ombre | 渐变 | [filter] |
| romantic | Romantic | 浪漫 | [filter] |
| cat-eye | Cat Eye | 猫眼 | [meta] |
| glitter | Glitter | 闪粉 | [meta] |
| rhinestone | Rhinestone | 水钻 | [meta] |
| accent | Accent | 点缀 | [meta] |
| pearl | Pearl | 珠光 | [meta] |
| glazed | Glazed | 釉面 | [meta] |
| french | French | 法式 | [meta] |
| 3d-floral | 3D Floral | 3D 花朵 | [meta] |
| butterfly | Butterfly | 蝴蝶 | [meta] |
| matte | Matte | 磨砂 | [meta] |
| glass | Glass | 玻璃感 | [meta] |
| chrome | Chrome | 镜面 | [meta] |
| foil | Foil | 亮片 | [meta] |
| gradient | Gradient | 渐变 | [meta] |

---

## Colour (multi-value)

| Slug | EN | 中文 | UI |
|------|----|------|-----|
| pink | Pink | 粉色 | [filter] |
| red | Red | 红色 | [filter] |
| nude | Nude | 裸色 | [filter] |
| white | White | 白色 | [filter] |
| black | Black | 黑色 | [filter] |
| purple | Purple | 紫色 | [filter] |
| blue | Blue | 蓝色 | [filter] |
| green | Green | 绿色 | [filter] |
| gold | Gold | 金色 | [filter] |
| silver | Silver | 银色 | [meta] |
| champagne | Champagne | 香槟色 | [meta] |
| yellow | Yellow | 黄色 | [meta] |
| navy | Navy | 藏青色 | [meta] |

---

## Shape (single value)

| Slug | EN | 中文 | UI |
|------|----|------|-----|
| almond | Almond | 杏形 | [filter] |
| oval | Oval | 椭圆形 | [filter] |
| square | Square | 方形 | [filter] |
| coffin | Coffin | 棺材形 | [filter] |
| round | Round | 圆形 | [filter] |
| stiletto | Stiletto | — | [gap] |

---

## Length (single value)

| Slug | EN | 中文 | UI |
|------|----|------|-----|
| short | Short | 短 | [filter] |
| medium | Medium | 中 | [filter] |
| long | Long | 长 | [filter] |

---

## Finish (single value)

| Slug | EN | 中文 | UI |
|------|----|------|-----|
| gel | Gel | 光疗胶 | [meta] |
| acrylic | Acrylic | 水晶甲 | [meta] |
| dip | Dip Powder | 浸粉 | [meta] |
| natural | Natural | 天然甲 | [meta] |

Note: finish has translations but no filter buttons in gallery.html yet.

---

## Season / occasion (multi-value, optional, no UI filters)

| Slug | EN | 中文 | UI |
|------|----|------|-----|
| spring | Spring | — | [gap] |
| summer | Summer | — | [gap] |
| autumn | Autumn | — | [gap] |
| winter | Winter | — | [gap] |
| all-season | All Season | — | [gap] |
| bridal | Bridal | — | [gap] |

Season tags are stored in gallery.json for metadata only. Add translations when first used if exposing in UI later.

---

## Adding new tags

When the user approves a new slug during upload:

1. Add `filter_{slug}` to `docs/data/translations.json` (both `en.gallery` and `zh.gallery`)
2. Ask whether to add a filter button to `docs/gallery.html`
3. Append a row to the appropriate table in this file

Slug rules: lowercase kebab-case, match existing convention (e.g. `3d-floral`, `cat-eye`).

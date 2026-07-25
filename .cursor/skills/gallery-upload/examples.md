# Gallery Upload Examples

## Example 1 — Single upload (g001-style)

**User:** `@gallery-upload` then attaches `blue-nails.jpg`

**Agent (Phase 3–4):**

```markdown
## Tag proposal — blue-nails.jpg

| Group   | Slug       | EN         | 中文       | Conf  | Notes                    |
|---------|------------|------------|------------|-------|--------------------------|
| style   | cat-eye    | Cat Eye    | 猫眼       | high  | magnetic shimmer band    |
| style   | glitter    | Glitter    | 闪粉       | high  | pink/silver accent nails |
| style   | rhinestone | Rhinestone | 水钻       | high  | square gem on accent     |
| style   | accent     | Accent     | 点缀       | high  | 2 accent nails           |
| colour  | blue       | Blue       | 蓝色       | high  | cat-eye base             |
| colour  | silver     | Silver     | 银色       | med   | glitter mix              |
| colour  | white      | White      | 白色       | med   | polka-dot nails          |
| shape   | oval       | Oval       | 椭圆形     | high  |                          |
| length  | short      | Short      | 短         | high  |                          |
| finish  | gel        | Gel        | 光疗胶     | high  |                          |
| service | manicure   | Manicure   | 手部美甲   | high  |                          |

**Research notes:**
- **cat-eye / 猫眼** — Magnetic gel with a moving light band; popular for depth without heavy art.
- **rhinestone / 水钻** — Flat-back crystal applied on gel; differs from 3D charms.

**Alt EN:** Blue cat-eye gel manicure with glitter accent nails and rhinestone charm
**Alt ZH:** 蓝色猫眼光疗甲，银闪渐变配水钻饰品
**Featured:** yes | **Date:** 2025-07

Please confirm, edit, or add custom tags.
```

**User:** "Looks good. Don't add filter buttons for cat-eye."

**Agent (Phase 6–7):** Optimizes, writes `g015-blue-cat-eye-rhinestone.webp`, appends gallery.json, runs validator, summarizes.

---

## Example 2 — New custom tag

**User approves tag `polka-dot` (style) with EN "Polka Dot" / 中文 "波点"**

**Agent asks:** "Expose `polka-dot` as a filter button on gallery.html?"

- **User says yes** → add to translations.json + gallery.html style row + tag-vocabulary.md
- **User says no** → add to translations.json + tag-vocabulary.md only (metadata-only)

---

## Example 3 — Batch upload

**User:** attaches 3 photos

**Agent:** "I'll process these one at a time. Starting with image 1 of 3…"

After all three validated and published:

```markdown
## Batch complete — 3 items published

| ID | Alt EN | Featured |
|----|--------|----------|
| g015-cherry-blossom | Soft pink almond gel nails… | yes |
| g016-matte-black | Matte black square nails… | no |
| g017-sage-pedicure | Sage green short oval pedicure… | yes |

Validator: ✓ passed
```

---

## Example 4 — Replace mock entry

**User:** "Replace g007 mock with this lavender photo"

**Agent:** Updates existing `g007` row in gallery.json, saves `g007-lavender-dried-flower.webp`, sets `mockColor: ""`, keeps or updates descriptive slug in `id` if user prefers.

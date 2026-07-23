#!/usr/bin/env node
/**
 * fix-encoding.js
 * Repairs HTML files whose UTF-8 emoji/special-chars were corrupted when
 * PowerShell 5.1's Get-Content (Windows-1252 default) read them and
 * re-wrote them as UTF-8 of the wrongly-decoded characters.
 *
 * Each entry: [garbled-unicode-string, correct-replacement]
 * The garbled strings are composed of the Unicode code-points that
 * result from interpreting each original UTF-8 byte through CP-1252.
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const DOCS = path.join(__dirname, '..', 'docs');
// ── Garbled → Correct mapping ────────────────────────────────────────────────
// Source emoji / char → UTF-8 bytes → CP1252 misread → re-encoded as UTF-8
// The left side uses JS Unicode escapes so control chars are safe.
const FIXES = [
  // 4-byte emoji (F0 9F xx yy)
  // 0x9F in CP-1252 = U+0178 (Ÿ, capital Y-diaeresis)
  ['\u00F0\u0178\u00A7\u00B4', '🧴'],  // U+1F9F4  F0 9F A7 B4
  ['\u00F0\u0178\u00AA\u00B4', '🪴'],  // U+1FAB4  F0 9F AA B4
  ['\u00F0\u0178\u2019\u00A1', '💡'],  // U+1F4A1  F0 9F 92 A1  (0x92=U+2019 in CP1252)
  ['\u00F0\u0178\u2019\u2026', '💅'],  // U+1F485  F0 9F 92 85  (0x85=U+2026)
  ['\u00F0\u0178\u201C\u00A6', '📦'],  // U+1F4E6  F0 9F 93 A6  (0x93=U+201C)
  ['\u00F0\u0178\u008F\u00A0', '🏠'],  // U+1F3E0  F0 9F 8F A0  (0x8F=ctrl U+008F, A0=NBSP)
  ['\u00F0\u0178\u008F\u2026', '🏅'],  // U+1F3C5  F0 9F 8F 85
  ['\u00F0\u0178\u0152\u0090', '🌐'],  // U+1F310  F0 9F 8C 90  (0x8C=U+0152 Œ, 0x90=ctrl)
  // 3-byte special characters (E2 xx yy)
  // 0x9C in CP-1252 = U+0153 (œ)
  ['\u00E2\u0153\u00A6', '✦'],   // U+2726  E2 9C A6
  ['\u00E2\u0153\u00A8', '✨'],   // U+2728  E2 9C A8
  ['\u00E2\u0153\u2022', '✕'],   // U+2715  E2 9C 95  (0x95=U+2022 bullet in CP1252)
  ['\u00E2\u0153\u201A', '✂'],   // U+2702  E2 9C 82  (0x82=U+201A in CP1252)
  // 0x80 in CP-1252 = U+20AC (€)
  ['\u00E2\u20AC\u00B9', '‹'],  // U+2039  E2 80 B9
  ['\u00E2\u20AC\u00BA', '›'],  // U+203A  E2 80 BA
  ['\u00E2\u20AC\u201D', '—'],  // U+2014  E2 80 94  (0x94=U+201D in CP1252)
  ['\u00E2\u20AC\u2122', '™'],  // U+2122  E2 80 99  (0x99=U+2122)
  ['\u00E2\u20AC\u2026', '\u2026'],  // U+2026 (ellipsis itself, appearing doubled)
  ['\u00E2\u20AC\u2018', '\u2018'],  // U+2018 left single quote
  // 2-byte chars (C2 xx or C3 xx)
  ['\u00C2\u00B7',  '·'],    // U+00B7  C2 B7  (middle dot)
  ['\u00C2\u00A9',  '©'],    // U+00A9  C2 A9  (copyright)
  ['\u00C2\u00AB',  '«'],    // U+00AB
  ['\u00C2\u00BB',  '»'],    // U+00BB
  ['\u00C2\u00A0',  '\u00A0'],  // NBSP re-encoded (idempotent but safe)
  // Common Chinese characters that appear in services.html mock & meta descriptions
  // 中 U+4E2D: E4 B8 AD → ä+¸+\x8AD? Let me fix the visible ones:
  // 中文 (zhōngwén) = U+4E2D U+6587
  // 4E2D: E4 B8 AD → ä (U+00E4) + ¸ (U+00B8) + \xAD (soft hyphen U+00AD)
  ['\u00E4\u00B8\u00AD', '中'],
  // 6587: E6 96 87 → æ (U+00E6) + – (U+2013, 0x96 in CP1252) + ‡ (U+2021, 0x87)
  ['\u00E6\u2013\u2021', '文'],
  // 小 U+5C0F: E5 B0 8F → å+°+U+008F(ctrl)
  ['\u00E5\u00B0\u008F', '小'],
  // 红 U+7EA2: E7 BA A2 → ç+º+¢
  ['\u00E7\u00BA\u00A2', '红'],
  // 书 U+4E66: E4 B9 A6 → ä+¹+¦
  ['\u00E4\u00B9\u00A6', '书'],
  // 美 U+7F8E: E7 BE 8E → ç+¾+U+008E(ctrl)
  ['\u00E7\u00BE\u008E', '美'],
  // 甲 U+7532: E7 94 B2 → ç+\x94(U+201D)+²
  ['\u00E7\u201D\u00B2', '甲'],
  // 工 U+5DE5: E5 B7 A5 → å+·+¥
  ['\u00E5\u00B7\u00A5', '工'],
  // 作 U+4F5C: E4 BD 9C → ä+½+\x9C(U+0153 in CP1252)
  ['\u00E4\u00BD\u0153', '作'],
  // 室 U+5BA4: E5 AE A4 → å+®+¤
  ['\u00E5\u00AE\u00A4', '室'],
  // 列 U+5217: E5 88 97 → å+\x88(ctrl U+0088)+\x97(U+2014 —)
  ['\u00E5\u0088\u2014', '列'],
  // 治 U+6CBB: E6 B2 BB → æ+²+»
  ['\u00E6\u00B2\u00BB', '治'],
  // 文 U+6587 already above
  // 山 U+5C71: E5 B1 B1 → å+±+±
  ['\u00E5\u00B1\u00B1', '山'],
  // 价 U+4EF7: E4 BB B7 → ä+»+·  (wait, B7=· but also the garbled ·)
  // skip price-list chars since it's mock content
  // Specific em-dash / quote fixes in body text
  ['\u00E2\u20AC\u201C', '\u2013'],  // en-dash U+2013 E2 80 93 → â+€+\x93(U+201C)
  // actually 0x93 in CP1252 = U+201C (left double quote), so:
  // U+2013 en-dash E28093 → â + € + U+201C (")
  // Let me correct that:
];
// Extra fix: the variation selector for ✂️
// U+FE0F = EF B8 8F → ï(U+00EF) + ¸(U+00B8) + U+008F(ctrl)
// We'll just strip it from the ✂ we already fixed above (it's optional)
const STRIP = [
  '\u00EF\u00B8\u008F',  // variation selector-16 (garbled)
];
// ── Apply fixes ──────────────────────────────────────────────────────────────
const htmlFiles = fs.readdirSync(DOCS)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(DOCS, f));
let totalFixed = 0;
for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  for (const [garbled, correct] of FIXES) {
    while (content.includes(garbled)) {
      content = content.split(garbled).join(correct);
    }
  }
  for (const strip of STRIP) {
    while (content.includes(strip)) {
      content = content.split(strip).join('');
    }
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    const name = path.basename(file);
    console.log(`Fixed: ${name}`);
    totalFixed++;
  }
}
console.log(`\nDone. ${totalFixed} file(s) repaired.`);
console.log('\nNOTE: To enable Chinese language switching, serve over HTTP:');
console.log('  npx serve "docs"   then open http://localhost:3000');

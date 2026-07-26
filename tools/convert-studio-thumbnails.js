const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '..', 'docs', 'assets', 'images', 'studio');
const sizes = [600];

(async function main() {
  const files = fs.readdirSync(srcDir).filter(f => /\.(jpe?g|png)$/i.test(f) && !f.endsWith('-thumb.jpg'));
  for (const file of files) {
    const base = path.parse(file).name;
    const inPath = path.join(srcDir, file);
    for (const width of sizes) {
      const outJpg = path.join(srcDir, `${base}-thumb.jpg`);
      const outWebP = path.join(srcDir, `${base}-thumb.webp`);
      try {
        await sharp(inPath).resize({ width }).jpeg({ quality: 80 }).toFile(outJpg);
        await sharp(inPath).resize({ width }).webp({ quality: 80 }).toFile(outWebP);
        console.log('Created', outJpg, outWebP);
      } catch (err) {
        console.error('Failed to convert', inPath, err.message);
      }
    }
  }
})();

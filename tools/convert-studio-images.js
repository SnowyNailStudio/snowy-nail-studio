const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '..', 'docs', 'assets', 'images', 'studio');
(async function main(){
  if (!fs.existsSync(srcDir)) {
    console.error('Source directory not found:', srcDir);
    process.exit(1);
  }
  const files = fs.readdirSync(srcDir).filter(f => /\.(jpe?g|png)$/i.test(f));
  for (const file of files) {
    const inPath = path.join(srcDir, file);
    const base = path.parse(file).name;
    const outWebP = path.join(srcDir, base + '.webp');
    try {
      const img = sharp(inPath).resize({ width: 1200 }).webp({ quality: 80 });
      await img.toFile(outWebP);
      console.log('Created', outWebP);
    } catch (err) {
      console.error('Failed to convert', inPath, err.message);
    }
  }
})();

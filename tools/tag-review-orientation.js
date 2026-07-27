const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const reviewsPath = path.join(__dirname, '..', 'docs', 'data', 'reviews.json');
const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));

(async () => {
  for (const item of reviews.items || []) {
    if (!item.image) continue;
    const imagePath = path.join(__dirname, '..', 'docs', item.image);
    const meta = await sharp(imagePath).metadata();
    item.orientation = meta.height && meta.width && meta.height > meta.width ? 'portrait' : 'landscape';
    console.log(`${item.id}: ${meta.width}x${meta.height} -> ${item.orientation}`);
  }

  fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2) + '\n', 'utf8');
  console.log('Updated', reviewsPath);
})();

const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../public/uploads/hero-brain.png');
const outputDir = path.join(__dirname, '../public/uploads');

async function splitImage() {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const width = metadata.width;
  const height = metadata.height;
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);

  console.log(`Image size: ${width}x${height}`);
  console.log(`Splitting into ${halfW}x${halfH} quadrants`);

  // Top-left
  await sharp(inputPath)
    .extract({ left: 0, top: 0, width: halfW, height: halfH })
    .toFile(path.join(outputDir, 'hero-tl.png'));
  console.log('Created hero-tl.png');

  // Top-right
  await sharp(inputPath)
    .extract({ left: halfW, top: 0, width: halfW, height: halfH })
    .toFile(path.join(outputDir, 'hero-tr.png'));
  console.log('Created hero-tr.png');

  // Bottom-left
  await sharp(inputPath)
    .extract({ left: 0, top: halfH, width: halfW, height: halfH })
    .toFile(path.join(outputDir, 'hero-bl.png'));
  console.log('Created hero-bl.png');

  // Bottom-right
  await sharp(inputPath)
    .extract({ left: halfW, top: halfH, width: halfW, height: halfH })
    .toFile(path.join(outputDir, 'hero-br.png'));
  console.log('Created hero-br.png');

  console.log('Done!');
}

splitImage().catch(console.error);

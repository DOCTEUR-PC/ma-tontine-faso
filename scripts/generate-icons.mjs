import sharp from 'sharp'
import { readFileSync } from 'fs'

const svgPath = 'public/icons/icon.svg'
const svg = readFileSync(svgPath)

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`Generated icon-${size}.png`)
}

// Favicon 32x32
await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile('public/favicon.png')
console.log('Generated favicon.png')

// Apple touch icon 180x180
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile('public/icons/apple-touch-icon.png')
console.log('Generated apple-touch-icon.png')

console.log('Done!')

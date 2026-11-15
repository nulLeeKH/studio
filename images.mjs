// Pictures the builder derives from one source image per product, so a product folder only needs the original.
import sharp from 'sharp'

export const THUMBNAIL_SOURCES = ['thumbnail.png', 'thumbnail.jpg', 'thumbnail.jpeg', 'thumbnail.webp']
export const THUMBNAIL = 'thumbnail.webp' // shown in a 16:10 frame, never cropped (style.css)
export const OG = { file: 'og.jpg', width: 1200, height: 630 }

const INK = '#171717', LINE = '#ecebe6'
const PAD = 56, GAP = 10 // picture inset from the edge; dashed line offset around the picture

// Always 1600×1000: the whole picture scaled to fit, centered, other ratios padded with transparency.
export async function thumbnail(source, target) {
  await sharp(source).rotate()
    .resize(1600, 1000, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, alphaQuality: 100 })
    .toFile(target)
}

// Share card: the whole picture on ink, a white dashed line hugging it, like the frames on the site.
export async function ogImage(source, target) {
  const { width, height } = OG
  const picture = await sharp(source).rotate()
    .resize(width - PAD * 2, height - PAD * 2, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true })
  const w = picture.info.width, h = picture.info.height
  const left = Math.round((width - w) / 2), top = Math.round((height - h) / 2)
  const frame = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<rect x="${left - GAP + .5}" y="${top - GAP + .5}" width="${w + GAP * 2 - 1}" height="${h + GAP * 2 - 1}" fill="none" stroke="${LINE}" stroke-width="2" stroke-dasharray="7 5"/></svg>`
  await sharp({ create: { width, height, channels: 3, background: INK } })
    .composite([{ input: picture.data, left, top }, { input: Buffer.from(frame), left: 0, top: 0 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(target)
}

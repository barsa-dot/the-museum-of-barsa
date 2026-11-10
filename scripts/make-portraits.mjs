// Builds the two published portrait images from the owner's source photo.
//
//   npm run portraits                    (uses docs/barsaprofile.png.png)
//   npm run portraits -- path/to/photo   (another source photo)
//
// The source photo stays private (docs/ images are git-ignored). Only these
// outputs are published, in app/public/images/:
//
//   portrait.webp        Business identity card: head-and-shoulders, 4:5.
//   portrait-pixel.png   Developer hero: 64×64 pixel art (24 colours) with the
//                        wall replaced by the Developer surface colour,
//                        enlarged ×12 with nearest-neighbour so pixels stay crisp.
//
// sharp strips metadata (EXIF/GPS etc.) from outputs by default.
//
// The crops below are tuned to the current photo (1254×1254, face centred).
// If the photo changes, adjust them and check the results by eye.

import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = process.argv[2] ?? `${root}docs/barsaprofile.png.png`;
const outDir = `${root}app/public/images/`;
mkdirSync(outDir, { recursive: true });

// ---------- Business: editorial photograph ----------

const EDITORIAL_CROP = { left: 227, top: 60, width: 800, height: 1000 }; // 4:5
const EDITORIAL_SIZE = { width: 640, height: 800 };

const editorial = await sharp(source)
  .flatten({ background: "#ffffff" })
  .extract(EDITORIAL_CROP)
  .resize(EDITORIAL_SIZE.width, EDITORIAL_SIZE.height, { kernel: "lanczos3" })
  .webp({ quality: 82, effort: 6 })
  .toFile(`${outDir}portrait.webp`);

// ---------- Developer: pixel art ----------

const PIXEL_CROP = { left: 207, top: 50, width: 840, height: 840 }; // square, head and shoulders
const PIXELS = 64;
const COLOURS = 24;
const SCALE = 12;
const WALL_TOLERANCE = 48;
const SURFACE = [0x0b, 0x12, 0x0e]; // Developer --color-surface

const { data, info } = await sharp(source)
  .flatten({ background: "#ffffff" })
  .extract(PIXEL_CROP)
  .resize(PIXELS, PIXELS, { kernel: "lanczos3" })
  .raw()
  .toBuffer({ resolveWithObject: true });

// Replace the plain wall behind the subject: flood-fill from the top and side
// edges through pixels close to the wall colour (sampled at the top-left).
const at = (x, y) => (y * info.width + x) * info.channels;
const wall = [data[at(1, 1)], data[at(1, 1) + 1], data[at(1, 1) + 2]];
const isWall = (i) => Math.hypot(data[i] - wall[0], data[i + 1] - wall[1], data[i + 2] - wall[2]) < WALL_TOLERANCE;
const visited = new Uint8Array(PIXELS * PIXELS);
const stack = [];
for (let k = 0; k < PIXELS; k++) stack.push([k, 0], [0, k], [PIXELS - 1, k]);
while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= PIXELS || y >= PIXELS || visited[y * PIXELS + x]) continue;
  visited[y * PIXELS + x] = 1;
  const i = at(x, y);
  if (!isWall(i)) continue;
  data.set(SURFACE, i);
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

const pixelArt = await sharp(data, { raw: { width: PIXELS, height: PIXELS, channels: info.channels } })
  .png({ palette: true, colours: COLOURS, dither: 0 })
  .toBuffer();

const pixel = await sharp(pixelArt)
  .resize(PIXELS * SCALE, PIXELS * SCALE, { kernel: "nearest" })
  .png({ palette: true, colours: COLOURS, dither: 0, compressionLevel: 9 })
  .toFile(`${outDir}portrait-pixel.png`);

console.log(`portrait.webp        ${editorial.width}×${editorial.height}  ${(editorial.size / 1024).toFixed(1)} KB`);
console.log(`portrait-pixel.png   ${pixel.width}×${pixel.height}  ${(pixel.size / 1024).toFixed(1)} KB`);

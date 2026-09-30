// Draws the bend of the PCjr's tube (src/scripts/crt-set.ts, CRT.curve) into public/tv/ibm-pcjr-curve.png:
//   npm run crt:curve
// It's a displacement map for the screen's SVG filter (Work.astro): each pixel says where on the flat
// picture to sample, R across and G down, as (value − ½) × SCALE × the screen's width. Made here, not
// on a canvas in the browser, so privacy-hardened browsers never have to ask to read one.
// Re-run it (and update CRT.curve) if the bend, the scale or the tube's opening changes.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// kx: how far the left/right edges bow at the top and bottom (fraction of the half-width), ky the
// same for the top/bottom edges; ZOOM < 1 pulls the picture back so less of it is lost to the bend.
const KX = 0.1;
const KY = 0.14;
const ZOOM = 0.94;
// Must match CRT.curve.scale: the largest shift the map can hold, as a fraction of the screen's width.
const SCALE = 0.065;
// The tube's opening (CRT.screen, CRT.image): height over width.
const ASPECT = (0.523 * 1282) / (0.758 * 1200);

const W = 768;
const H = Math.round(W * ASPECT);

// One row per scanline, each led by PNG filter type 1 (Sub: bytes stored as the step from the pixel
// to their left), which keeps a smooth gradient like this one small.
const raw = Buffer.alloc(H * (1 + W * 3));
let worst = 0;
for (let j = 0; j < H; j++) {
  const row = j * (1 + W * 3);
  raw[row] = 1;
  let prev = [0, 0, 0];
  for (let i = 0; i < W; i++) {
    const ux = ((i + 0.5) / W) * 2 - 1;
    const uy = ((j + 0.5) / H) * 2 - 1;
    const sx = ux * (1 + uy * uy * KX) * ZOOM;
    const sy = uy * (1 + ux * ux * KY) * ZOOM;
    const dx = (sx - ux) / 2; // in screen widths
    const dy = ((sy - uy) / 2) * ASPECT;
    worst = Math.max(worst, Math.abs(dx), Math.abs(dy));
    const px = [Math.round((0.5 + dx / SCALE) * 255), Math.round((0.5 + dy / SCALE) * 255), 128];
    for (let c = 0; c < 3; c++) raw[row + 1 + i * 3 + c] = (px[c] - prev[c]) & 0xff;
    prev = px;
  }
}
if (worst * 2 > SCALE) throw new Error(`SCALE must be at least ${(worst * 2).toFixed(4)}`);

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), data])));
  return Buffer.concat([head, data, tail]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bits per channel
ihdr[9] = 2; // RGB

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync('public/tv/ibm-pcjr-curve.png', png);
console.log(`public/tv/ibm-pcjr-curve.png: ${W}×${H}, ${(png.length / 1024).toFixed(1)} KB, largest shift ${worst.toFixed(4)} of SCALE ${SCALE}`);

// Draws the bend of the PCjr's tube (src/scripts/crt-set.ts, CRT.curve) into public/tv/ibm-pcjr-curve.png:
//   npm run crt:curve
// It's a displacement map for the screen's SVG filter (Work.astro): each pixel says where on the flat
// picture to sample, R across and G down, as (value − ½) × SCALE × the screen's width. Made here, not
// on a canvas in the browser, so privacy-hardened browsers never have to ask to read one.
// Re-run it (and update CRT.curve) if the bend, the scale or the tube's opening changes.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// The bend grows with |ux|ᴾ + |uy|ᴾ (u from −1 to 1 across each axis): nearly flat across the middle
// of the tube, then piling up at the rim, hardest in the corners, along contours shaped like the tube's
// rounded opening. The higher POWER, the wider the flat middle and the nearer the rim the bend starts.
// BEND is how far the rim pulls in.
const POWER = Number(process.env.POWER ?? 6);
const BEND = Number(process.env.BEND ?? 0.08);
// Must match CRT.curve.scale: the largest shift the map can hold, as a fraction of the screen's width.
const SCALE = Number(process.env.SCALE ?? 0.1);
// Must match the largest of CRT.curve.guns: the gun that lands furthest out.
const GUN = 1.012;
// The tube's opening (CRT.screen, CRT.image): height over width, and its corner radii (6% / 8% of
// the width / height), in u.
const ASPECT = (0.523 * 1282) / (0.758 * 1200);
const RX = 0.12;
const RY = 0.16;

const rim = (ux, uy) => 1 + BEND * (Math.abs(ux) ** POWER + Math.abs(uy) ** POWER);
const visible = (ux, uy) => {
  const cx = Math.abs(ux) - (1 - RX);
  const cy = Math.abs(uy) - (1 - RY);
  return cx <= 0 || cy <= 0 || (cx / RX) ** 2 + (cy / RY) ** 2 <= 1;
};

const W = 768;
const H = Math.round(W * ASPECT);

// ZOOM pulls the whole picture back just enough that no visible pixel of the tube, for any gun,
// samples off the picture's edge (which would leave it black). A hair less, for the map's rounding.
let ZOOM = Infinity;
for (let j = 0; j <= H; j++) {
  for (let i = 0; i <= W; i++) {
    const ux = (i / W) * 2 - 1;
    const uy = (j / H) * 2 - 1;
    if (!visible(ux, uy)) continue;
    // |u · (1 + GUN · (rim · ZOOM − 1))| ≤ 1 on each axis
    for (const u of [ux, uy]) if (u) ZOOM = Math.min(ZOOM, (1 + (1 / Math.abs(u) - 1) / GUN) / rim(ux, uy));
  }
}
ZOOM *= 0.997;

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
    const k = rim(ux, uy) * ZOOM;
    const sx = ux * k;
    const sy = uy * k;
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
console.log(
  `public/tv/ibm-pcjr-curve.png: ${W}×${H}, ${(png.length / 1024).toFixed(1)} KB, largest shift ${worst.toFixed(4)} of SCALE ${SCALE}, ` +
    `zoom ${ZOOM.toFixed(4)} (edges lose ${((1 - rim(1, 0) * ZOOM) * 50).toFixed(1)}% across, ${((1 - rim(0, 1) * ZOOM) * 50).toFixed(1)}% down)`,
);

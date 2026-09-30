// Draws the bend of the PCjr's tube (src/scripts/crt-set.ts, CRT.curve) into public/tv/ibm-pcjr-curve.png:
//   npm run crt:curve
// It's a displacement map for the screen's SVG filter (Work.astro): each pixel says where on the flat
// picture to sample, R across and G down, as (value − ½) × SCALE × the screen's width. Made here, not
// on a canvas in the browser, so privacy-hardened browsers never have to ask to read one.
// Re-run it (and update CRT.curve) if the bend, the scale or the tube's opening changes.
//
// The bend fits the picture to the render's actual glass opening, measured off its alpha into
// scripts/crt-opening.json. If the render changes, measure it again first:
//   CHROME=/path/to/chrome npm run crt:curve -- --measure
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// CRT.screen and CRT.image: the screen box, in % of the render.
const SCREEN = { left: 12.9, top: 5.9, width: 75.8, height: 52.3 };
const IMAGE = [1200, 1282];
const OPENING = 'scripts/crt-opening.json';
const ROWS = 200; // the opening is measured every 1/ROWS of the screen's height

if (process.argv.includes('--measure')) {
  await measure();
  process.exit();
}

// The picture is mapped onto the tube's opening, not cropped by it: the rim of the glass shows the
// picture's very edge, its sharp corners folded into the opening's rounded ones, so all of it stays on
// screen and none of the tube is left black. Toward the middle it's nearly flat (magnified by 1 + BEND);
// the squeeze that makes room for that piles up at the rim, as rᴾ, where r runs from 0 at the opening's
// centre to 1 at its rim, along contours shaped like it. The higher POWER, the nearer the rim the bend.
const POWER = Number(process.env.POWER ?? 8);
const BEND = Number(process.env.BEND ?? 0.05);
// Must match CRT.curve.scale: the largest shift the map can hold, as a fraction of the screen's width.
const SCALE = Number(process.env.SCALE ?? 0.1);
// Must match the largest of CRT.curve.guns: the gun that lands furthest out.
const GUN = 1.012;
const ASPECT = (SCREEN.height * IMAGE[1]) / (SCREEN.width * IMAGE[0]);

// The opening, one span per row, in u (−1 to 1 across each axis of the screen box).
const spans = JSON.parse(readFileSync(OPENING, 'utf8')).map((s) => s && [s[0] * 2 - 1, s[1] * 2 - 1]);
const span = (uy) => {
  const f = ((uy + 1) / 2) * ROWS;
  const j = Math.floor(f);
  const a = spans[j];
  const b = spans[Math.min(j + 1, ROWS)];
  if (!a || !b) return null;
  const t = f - j;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
};
const visible = (ux, uy) => {
  if (uy < -1 || uy > 1) return false;
  const s = span(uy);
  return !!s && ux >= s[0] && ux <= s[1];
};
const rowsOpen = spans.map((s, j) => s && (j / ROWS) * 2 - 1).filter((y) => y != null);
const O = [
  (Math.min(...spans.filter(Boolean).map((s) => s[0])) + Math.max(...spans.filter(Boolean).map((s) => s[1]))) / 2,
  (rowsOpen[0] + rowsOpen[rowsOpen.length - 1]) / 2,
];
// How far out u is from the opening's centre, 1 on its rim.
const reach = (vx, vy) => {
  let lo = 0;
  let hi = 4;
  for (let n = 0; n < 40; n++) {
    const t = (lo + hi) / 2;
    if (visible(O[0] + vx / t, O[1] + vy / t)) hi = t;
    else lo = t;
  }
  return hi;
};
// Where on the flat picture (−1 to 1) the tube shows at u.
const MARGIN = 0.997; // a hair in, for the map's rounding and the outermost gun
const sample = (ux, uy) => {
  const vx = ux - O[0];
  const vy = uy - O[1];
  if (!vx && !vy) return [0, 0];
  const r = Math.min(reach(vx, vy), 1);
  // Out to the rim along the same line, then on to the picture's edge: the fold into the corners.
  const fold = 1 / (r * Math.max(Math.abs(vx / r), Math.abs(vy / r))) - 1 / r;
  const k = ((1 + BEND * r ** POWER) / (1 + BEND)) * (1 + fold * r * r ** POWER) * MARGIN;
  return [vx * k, vy * k];
};

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
    const [sx, sy] = sample(ux, uy);
    let dx = (sx - ux) / 2; // in screen widths
    let dy = ((sy - uy) / 2) * ASPECT;
    // Under the bezel nobody sees the picture: just keep the shift in range.
    if (visible(ux, uy)) worst = Math.max(worst, Math.abs(dx), Math.abs(dy));
    else [dx, dy] = [dx, dy].map((d) => Math.max(-SCALE / 2, Math.min(SCALE / 2, d)));
    const px = [Math.round((0.5 + dx / SCALE) * 255), Math.round((0.5 + dy / SCALE) * 255), 128];
    for (let c = 0; c < 3; c++) raw[row + 1 + i * 3 + c] = (px[c] - prev[c]) & 0xff;
    prev = px;
  }
}
if (worst * 2 > SCALE) throw new Error(`SCALE must be at least ${(worst * 2).toFixed(4)}`);

// Check the promise: every visible pixel, for every gun, lands on the picture, and the rim reaches
// the picture's edges and corners.
let over = 0;
for (let j = 0; j <= H; j++) {
  for (let i = 0; i <= W; i++) {
    const ux = (i / W) * 2 - 1;
    const uy = (j / H) * 2 - 1;
    if (!visible(ux, uy)) continue;
    const [sx, sy] = sample(ux, uy);
    over = Math.max(over, Math.abs(ux + GUN * (sx - ux)), Math.abs(uy + GUN * (sy - uy)));
  }
}
if (over > 1) throw new Error(`the ${GUN} gun samples off the picture (${over.toFixed(4)}); lower MARGIN`);

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
    `opening centred at (${O[0].toFixed(3)}, ${O[1].toFixed(3)}), furthest gun ${over.toFixed(4)}`,
);

// Where the render is see-through inside the screen box, row by row: [left, right] as fractions of the
// box's width, or null where the row is all bezel.
async function measure() {
  const { chromium } = await import('playwright-core');
  const executablePath = process.env.CHROME;
  if (!executablePath) throw new Error('Set CHROME to a Chrome or Chromium executable.');
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();
  const src = `data:image/webp;base64,${readFileSync('public/tv/ibm-pcjr.webp').toString('base64')}`;
  const rows = await page.evaluate(
    async ({ src, S, ROWS }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const L = (S.left / 100) * c.width;
      const T = (S.top / 100) * c.height;
      const W = (S.width / 100) * c.width;
      const H = (S.height / 100) * c.height;
      const rows = [];
      for (let j = 0; j <= ROWS; j++) {
        const y = Math.min(c.height - 1, Math.max(0, Math.round(T + (j / ROWS) * H)));
        let l = -1;
        let r = -1;
        // Anything not quite opaque shows the screen through it, so it counts as open.
        for (let x = Math.max(0, Math.floor(L)); x < Math.min(c.width, Math.ceil(L + W)); x++) {
          if (d[(y * c.width + x) * 4 + 3] < 250) {
            if (l < 0) l = x;
            r = x + 1;
          }
        }
        rows.push(l < 0 ? null : [+((l - L) / W).toFixed(4), +((r - L) / W).toFixed(4)]);
      }
      return rows;
    },
    { src, S: SCREEN, ROWS },
  );
  await browser.close();
  writeFileSync(OPENING, `[\n${rows.map((r) => `  ${JSON.stringify(r)}`).join(',\n')}\n]\n`);
  console.log(`${OPENING}: ${rows.filter(Boolean).length} of ${rows.length} rows open`);
}

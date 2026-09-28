// Generates the invented data behind the Casa Zenzontle demo dashboard.
// Seeded, so re-running gives the same file. Output is committed; the page never runs this.
//   node scripts/gen-retail-data.mjs
import { writeFileSync } from 'node:fs';

let seed = 20260928;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = (amp) => 1 + (rand() * 2 - 1) * amp;

// Sep 2024 .. Aug 2026: 24 closed months.
const months = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(Date.UTC(2024, 8 + i, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
});

const regions = [
  { id: 'mty', en: 'Monterrey', es: 'Monterrey' },
  { id: 'cdmx', en: 'Mexico City', es: 'Ciudad de México' },
  { id: 'gdl', en: 'Guadalajara', es: 'Guadalajara' },
];

// size: relative store traffic; trend: yearly in-store growth; plan: yearly growth the target assumed.
const stores = [
  { id: 'san-pedro', name: 'San Pedro', region: 'mty', size: 1.35, trend: 0.06, plan: 0.06, web: 1.2 },
  { id: 'cumbres', name: 'Cumbres', region: 'mty', size: 0.95, trend: 0.05, plan: 0.05, web: 1.0 },
  { id: 'centro-mty', name: 'Centro', region: 'mty', size: 0.8, trend: -0.07, plan: 0.03, web: 0.6 },
  { id: 'coyoacan', name: 'Coyoacán', region: 'cdmx', size: 1.1, trend: 0.04, plan: 0.05, web: 1.1 },
  { id: 'roma', name: 'Roma', region: 'cdmx', size: 1.0, trend: 0.11, plan: 0.06, web: 1.5 },
  { id: 'polanco', name: 'Polanco', region: 'cdmx', size: 1.4, trend: 0.03, plan: 0.06, web: 1.3 },
  { id: 'chapultepec', name: 'Chapultepec', region: 'gdl', size: 0.9, trend: 0.05, plan: 0.05, web: 0.9 },
  { id: 'zapopan', name: 'Zapopan', region: 'gdl', size: 1.05, trend: 0.08, plan: 0.06, web: 1.0 },
];

const channels = ['store', 'online'];

// margin: gross margin at full price; upo: units per order; season: month (1-12) multipliers.
const categories = [
  { id: 'kitchen', en: 'Kitchen & dining', es: 'Cocina y mesa', margin: 0.5, upo: 2.4, season: {} },
  { id: 'textiles', en: 'Textiles', es: 'Textiles', margin: 0.57, upo: 2.0, season: { 11: 1.2, 12: 1.3, 1: 1.25, 2: 1.1, 6: 0.8, 7: 0.8 } },
  { id: 'lighting', en: 'Lighting', es: 'Iluminación', margin: 0.52, upo: 1.5, season: { 12: 1.3, 11: 1.1 } },
  { id: 'decor', en: 'Décor', es: 'Decoración', margin: 0.61, upo: 1.8, season: { 5: 1.25, 12: 1.2 } },
  { id: 'furniture', en: 'Furniture', es: 'Muebles', margin: 0.38, upo: 1.1, season: { 1: 1.15, 12: 0.85 } },
  { id: 'outdoor', en: 'Outdoor', es: 'Exterior', margin: 0.44, upo: 1.6, season: { 3: 1.35, 4: 1.5, 5: 1.45, 6: 1.2, 11: 0.7, 12: 0.65, 1: 0.6 } },
];

// price in USD; base: monthly units in an average store; cover: months of stock the buyers aim to hold;
// over: from which month index buyers over-ordered, and by how much.
const products = [
  ['talavera-plate', 'kitchen', 'Talavera dinner plate', 'Plato de talavera', 18, 95, 1.4],
  ['glass-tumblers', 'kitchen', 'Hand-blown tumbler set', 'Juego de vasos de vidrio soplado', 34, 38, 1.6],
  ['molcajete', 'kitchen', 'Volcanic stone molcajete', 'Molcajete de piedra volcánica', 45, 22, 1.8],
  ['copper-cookware', 'kitchen', 'Copper-finish cookware set', 'Batería de cocina acabado cobre', 160, 9, 1.8, { from: 12, by: 3 }],
  ['barro-bowl', 'kitchen', 'Clay serving bowl', 'Tazón de barro para servir', 26, 44, 1.5],
  ['wool-throw', 'textiles', 'Wool throw', 'Cobija de lana', 72, 26, 1.7],
  ['bed-linen', 'textiles', 'Cotton bed linen set', 'Juego de sábanas de algodón', 95, 20, 1.6],
  ['cushion-cover', 'textiles', 'Embroidered cushion cover', 'Funda de cojín bordada', 22, 70, 1.4],
  ['table-runner', 'textiles', 'Linen table runner', 'Camino de mesa de lino', 28, 30, 1.9],
  ['towel-set', 'textiles', 'Bath towel set', 'Juego de toallas', 48, 34, 1.5],
  ['palm-pendant', 'lighting', 'Palm-fiber pendant lamp', 'Lámpara colgante de palma', 120, 11, 1.8],
  ['ceramic-lamp', 'lighting', 'Ceramic table lamp', 'Lámpara de mesa de cerámica', 85, 14, 1.7],
  ['brass-sconce', 'lighting', 'Brass wall sconce', 'Arbotante de latón', 110, 7, 2.2],
  ['string-lights', 'lighting', 'String lights, 10 m', 'Serie de luces, 10 m', 24, 60, 1.2],
  ['pewter-holder', 'lighting', 'Pewter candle holder', 'Portavelas de peltre', 30, 28, 1.8],
  ['painted-vase', 'decor', 'Hand-painted vase', 'Jarrón pintado a mano', 58, 24, 1.7],
  ['botanical-print', 'decor', 'Framed botanical print', 'Lámina botánica enmarcada', 65, 18, 1.8],
  ['alebrije', 'decor', 'Alebrije figure', 'Figura de alebrije', 40, 32, 1.5],
  ['wall-hanging', 'decor', 'Woven wall hanging', 'Tapiz tejido', 75, 10, 2.0, { from: 15, by: 3 }],
  ['scented-candle', 'decor', 'Scented candle', 'Vela aromática', 16, 130, 1.1],
  ['oak-side-table', 'furniture', 'Oak side table', 'Mesa auxiliar de roble', 240, 6, 1.9],
  ['rattan-chair', 'furniture', 'Rattan lounge chair', 'Sillón de ratán', 420, 3.2, 2.0, { from: 13, by: 3.5 }],
  ['pine-bookshelf', 'furniture', 'Pine bookshelf', 'Librero de pino', 310, 4, 2.0],
  ['upholstered-bench', 'furniture', 'Upholstered bench', 'Banca tapizada', 280, 4.2, 2.1],
  ['walnut-chair', 'furniture', 'Walnut dining chair', 'Silla de comedor de nogal', 190, 9, 1.8],
  ['clay-planter', 'outdoor', 'Clay planter', 'Maceta de barro', 28, 48, 1.4],
  ['hammock', 'outdoor', 'Hammock', 'Hamaca', 65, 16, 1.6],
  ['garden-chair', 'outdoor', 'Folding garden chair', 'Silla plegable de jardín', 55, 18, 1.7],
  ['outdoor-lantern', 'outdoor', 'Outdoor lantern', 'Farol de exterior', 42, 20, 1.6],
  ['patio-umbrella', 'outdoor', 'Patio umbrella', 'Sombrilla de terraza', 150, 6, 1.8, { from: 17, by: 2.5 }],
].map(([id, cat, en, es, price, base, cover, over]) => ({ id, cat, en, es, price, base, cover, over }));

// Mexican home-goods calendar: Mother's Day (May), Buen Fin (Nov), December.
const monthSeason = [0.84, 0.8, 0.92, 0.96, 1.14, 0.9, 0.88, 0.93, 0.95, 1.0, 1.28, 1.46];
const onlineShare0 = 0.13;
const onlineGrowth = 0.3; // yearly
const planOnline = 0.2; // yearly growth the online target assumed

const catOf = (p) => categories.find((c) => c.id === p.cat);
const monthNum = (i) => Number(months[i].slice(5));
const years = (i) => i / 12;

// Expected (noise-free) monthly units for a store/channel/product.
function expected(mi, s, ch, p, growthOverride) {
  const mn = monthNum(mi);
  const cat = catOf(p);
  const seasonal = monthSeason[mn - 1] * (cat.season[mn] ?? 1);
  const inStore = p.base * s.size * seasonal * Math.pow(1 + (growthOverride?.store ?? s.trend), years(mi));
  if (ch === 'store') return inStore * slow(p, mi);
  const share = onlineShare0 * s.web * Math.pow(1 + (growthOverride?.online ?? onlineGrowth), years(mi));
  return ((p.base * s.size * seasonal * share) / (1 - onlineShare0)) * slow(p, mi);
}

// Over-bought lines are the ones demand cooled on: they sell at about half pace from then on.
function slow(p, mi) {
  return p.over && mi >= p.over.from ? 0.5 : 1;
}

// The plan is set a year ahead, so some months it is generous and some it is not.
const planNoise = Array.from({ length: 24 }, () => 1.0 + (rand() * 2 - 1) * 0.05);

const S = stores.length, C = channels.length, P = products.length, K = categories.length, M = months.length;
const units = [], net = [], cost = [], orders = [];
const target = new Array(M * S * C * K).fill(0);

for (let mi = 0; mi < M; mi++) {
  const mn = monthNum(mi);
  const buenFin = mn === 11;
  for (let si = 0; si < S; si++) {
    const s = stores[si];
    for (let ci = 0; ci < C; ci++) {
      const ch = channels[ci];
      for (let pi = 0; pi < P; pi++) {
        const p = products[pi];
        const cat = catOf(p);
        const lift = buenFin ? 1.12 : 1;
        const u = Math.max(0, Math.round(expected(mi, s, ch, p) * lift * noise(0.14)));
        const discount = buenFin ? 0.86 : mn === 1 ? 0.92 : 1;
        // Overstocked lines get marked down once they pile up.
        const markdown = p.over && mi >= p.over.from + 4 ? 0.8 : 1;
        const price = p.price * discount * markdown * noise(0.02);
        const n = Math.round(u * price);
        const unitCost = p.price * (1 - cat.margin) * noise(0.02);
        units.push(u);
        net.push(n);
        cost.push(Math.round(u * unitCost));
        orders.push(Math.round(u / (cat.upo * noise(0.08))));
        const ki = categories.indexOf(cat);
        const plan = expected(mi, s, ch, p, { store: s.plan, online: planOnline }) * (buenFin ? 1.15 : 1) * p.price * (buenFin ? 0.86 : mn === 1 ? 0.92 : 1);
        target[((mi * S + si) * C + ci) * K + ki] += plan * (p.over && mi >= p.over.from ? 2 : 1) * planNoise[mi];
      }
    }
  }
}

// Stock is held per store (online orders ship from the nearest store).
// Buyers order to hold `cover` months of expected sales; over-bought lines receive `by` times that.
const open = [], onHand = [], received = [];
for (let si = 0; si < S; si++) {
  for (let pi = 0; pi < P; pi++) {
    const p = products[pi];
    const exp0 = expected(0, stores[si], 'store', p) + expected(0, stores[si], 'online', p);
    open.push(Math.round(exp0 * p.cover));
  }
}
const idx = (mi, si, ci, pi) => ((mi * S + si) * C + ci) * P + pi;
for (let mi = 0; mi < M; mi++) {
  for (let si = 0; si < S; si++) {
    for (let pi = 0; pi < P; pi++) {
      const p = products[pi];
      const prev = mi === 0 ? open[si * P + pi] : onHand[((mi - 1) * S + si) * P + pi];
      const sold = units[idx(mi, si, 0, pi)] + units[idx(mi, si, 1, pi)];
      const nextExp = expected(Math.min(mi + 1, M - 1), stores[si], 'store', p) + expected(Math.min(mi + 1, M - 1), stores[si], 'online', p);
      let cover = p.cover;
      // Buyers sized the big order on the demand they expected, not the demand that came.
      if (p.over && mi >= p.over.from && mi < p.over.from + 3) cover *= p.over.by / slow(p, mi);
      const want = Math.max(0, Math.round((nextExp * cover + sold - prev) * noise(0.1)));
      const r = want;
      received.push(r);
      onHand.push(Math.max(0, prev + r - sold));
    }
  }
}

const data = {
  note: 'Invented data for the Casa Zenzontle demo dashboard. Generated by scripts/gen-retail-data.mjs; do not edit by hand.',
  currency: 'USD',
  months,
  regions,
  stores: stores.map(({ id, name, region }) => ({ id, name, region })),
  channels,
  categories: categories.map(({ id, en, es }) => ({ id, en, es })),
  products: products.map(({ id, cat, en, es }) => ({ id, cat, en, es })),
  // index = ((month * stores + store) * channels + channel) * products + product
  sales: { units, net, cost, orders },
  // index = ((month * stores + store) * channels + channel) * categories + category
  target: target.map(Math.round),
  // open: index = store * products + product (stock before the first month)
  // onHand, received: index = (month * stores + store) * products + product
  stock: { open, onHand, received },
};

writeFileSync(new URL('../src/demos/retail/data.json', import.meta.url), JSON.stringify(data));
const total = net.reduce((a, b) => a + b, 0);
console.log(`rows ${units.length}, net sales $${(total / 1e6).toFixed(1)}M over 24 months`);

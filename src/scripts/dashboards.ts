// What each TV shows: a stylized render of the real thing behind it, drawn as
// HTML+SVG at a fixed 640×480 (4:3, the field monitor's tube) and scaled to
// fit. Figures are copied from each demo's own screen; nothing here is live.
// Rendered at build time only; the wall reuses the markup when it zooms in.
// Styles live in src/styles/screens.css.

import type { Preview } from '../data/site';

export const DASH_W = 640;
export const DASH_H = 480;

type Locale = 'en' | 'es';

const n = (v: number, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const mix = (a: number[], b: number[], k: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(Math.max(k, 0), 1))).join(' ')})`;
const svg = (w: number, h: number, body: string, cls = '') =>
  `<svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${body}</svg>`;

// ------------------------------------------------------------------ Money on Rails
// The demo's Overview in its dark theme: rail, score rings, money in and out,
// and the Sankey of where August's money went.

const MOR = {
  en: {
    tagline: 'Analytics for YNAB',
    nav: ['Overview', 'Money flow', 'Plan', 'Plan Quality'],
    plan: 'Rivera household',
    range: 'Apr 2025 to Sep 2026, USD',
    user: 'Sample household',
    banner: 'Sample data: an invented household, not connected to any YNAB account.',
    about: 'About Money on Rails',
    title: 'Your month at a glance',
    month: 'August 2026',
    adherence: ['Adherence Rating', 'How closely you followed your plan'],
    vsAvg: '+1 vs average of Aug 2025 to Jul 2026',
    axis: ['Apr 2025', 'floor 85', 'Aug 2026'],
    quality: ['Plan Quality', 'How well it is built, last 3 months'],
    qRows: [['Needs, Wants, Savings split', '61% / 16% / 23%'], ['Emergency fund', '4.0 of 6 months'], ['True expenses', '8 of 8 funded']],
    inout: ['Money in and out', 'Ticks: 12-month average'],
    saved: 'Saved',
    flows: ['Income', 'Spending', 'Paying down card debt'],
    topGroups: 'Top groups',
    groups: ['Home', 'Savings and investing', 'Kids'],
    where: ['Where the money went in Aug', 'Top sources and groups'],
    chart: 'Chart',
    table: 'Table',
    income: 'Income',
    smaller: '2 smaller sources',
    right: ['Home', 'Savings and investing', 'Kids', 'Everyday', 'True expenses', 'Freelance studio', 'Fun money', 'Other groups', 'Paying down card debt', 'Unspent'],
    attention: ['Needs your attention', '3 things to look at'],
    attRows: ['6 categories waiting for a bucket', 'Emergency fund covers 4.0 of 6 months', '10 categories overspent in Aug'],
    nws: ['Needs, Wants, Savings', 'Assigned in Aug'],
    buckets: [['N', 'Needs'], ['W', 'Wants'], ['S', 'Savings']],
    target: 'target',
  },
  es: {
    tagline: 'Análisis para YNAB',
    nav: ['Resumen', 'Flujo de dinero', 'Plan', 'Calidad del plan'],
    plan: 'Hogar Rivera',
    range: 'abr 2025 a sep 2026, USD',
    user: 'Hogar de ejemplo',
    banner: 'Datos de ejemplo: un hogar inventado, sin conexión a ninguna cuenta de YNAB.',
    about: 'Sobre Money on Rails',
    title: 'Tu mes de un vistazo',
    month: 'agosto de 2026',
    adherence: ['Calificación de apego', 'Qué tanto seguiste tu plan'],
    vsAvg: '+1 vs. promedio de ago 2025 a jul 2026',
    axis: ['abr 2025', 'base 85', 'ago 2026'],
    quality: ['Calidad del plan', 'Qué tan bien está armado, últimos 3 meses'],
    qRows: [['Necesidades, Gustos y Ahorro', '61% / 16% / 23%'], ['Fondo de emergencia', '4.0 de 6 meses'], ['Gastos reales', '8 de 8 cubiertos']],
    inout: ['Entradas y salidas', 'Marcas: promedio de 12 meses'],
    saved: 'Ahorrado',
    flows: ['Ingreso', 'Gasto', 'Pago de tarjetas'],
    topGroups: 'Grupos principales',
    groups: ['Casa', 'Ahorro e inversión', 'Niños'],
    where: ['A dónde se fue tu dinero en ago', 'Principales fuentes y grupos'],
    chart: 'Gráfica',
    table: 'Tabla',
    income: 'Ingreso',
    smaller: '2 fuentes menores',
    right: ['Casa', 'Ahorro e inversión', 'Niños', 'Día a día', 'Gastos reales', 'Estudio freelance', 'Gustos', 'Otros grupos', 'Pago de tarjetas', 'Sin gastar'],
    attention: ['Requiere tu atención', '3 cosas por revisar'],
    attRows: ['6 categorías sin clasificar', 'El fondo de emergencia cubre 4.0 de 6 meses', '10 categorías excedidas en ago'],
    nws: ['Necesidades, Gustos, Ahorro', 'Asignado en ago'],
    buckets: [['N', 'Necesidades'], ['G', 'Gustos'], ['A', 'Ahorro']],
    target: 'meta',
  },
};

const MOR_C = {
  accent: '#9085e9',
  good: '#4cc27a',
  attention: '#e08a45',
  cats: ['#4f8fe0', '#e0703d', '#d9a21b', '#3fae82', '#8a74dd', '#d65a8e', '#35a7c0', '#6d6a64', '#6d6a64', '#6d6a64'],
  buckets: ['#7f9bd4', '#d8875a', '#6cbf8f'],
};

const ring = (size: number, v: number, color: string) => {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return svg(
    size,
    size,
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgb(255 255 255 / .09)" stroke-width="4"/>
     <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"
       stroke-dasharray="${(c * v) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
     <text x="${size / 2}" y="${size / 2 + 4}" text-anchor="middle" class="mor-ringnum">${v}</text>`,
  );
};

function sankey(t: (typeof MOR)['en']) {
  const W = 318, H = 176, top = 16;
  const sources: [string, number][] = [
    ['Contoso Health', 5955], ['Northwind Ltd', 5480], ['Harbor & Pine', 889], ['Birchwood Studio', 862],
    ['Pallet Workshop', 485], ['Tutoring', 411], [t.smaller, 358],
  ];
  const outs = [2786, 1900, 1543, 1395, 1029, 964, 529, 1939, 150, 2206];
  const total = 14440;
  const k = 118 / total; // px per dollar at the Income node
  const gapL = 5, gapR = 4.2;
  const xL = 92, xM = 150, xR = 214, nw = 4;
  let body = `<text x="${xM + 2}" y="9" text-anchor="middle" class="mor-sk-l">${t.income}</text>`;
  // Left: sources into Income.
  let yl = top, ym = top;
  sources.forEach(([name, v], i) => {
    const h = Math.max(v * k, 1);
    const hm = v * k;
    body += `<path d="M${xL + nw},${yl}C${xL + 40},${yl} ${xM - 30},${ym} ${xM},${ym}V${ym + hm}C${xM - 30},${ym + hm} ${xL + 40},${yl + h} ${xL + nw},${yl + h}Z" fill="${MOR_C.accent}" opacity=".22"/>`;
    body += `<rect x="${xL}" y="${yl}" width="${nw}" height="${h}" rx="1" fill="${MOR_C.accent}"/>`;
    body += `<text x="${xL - 4}" y="${yl + Math.max(h, 6) / 2 + 2.5}" text-anchor="end" class="mor-sk-l">${name} <tspan class="mor-sk-v">$${n(v)}</tspan></text>`;
    yl += h + gapL + (i < 2 ? 4 : 0);
    ym += hm;
  });
  body += `<rect x="${xM}" y="${top}" width="${nw}" height="${total * k}" rx="1" fill="${MOR_C.accent}"/>`;
  // Right: Income out to groups.
  let yr = top, yo = top;
  outs.forEach((v, i) => {
    const h = Math.max(v * k, 1);
    const color = MOR_C.cats[i];
    body += `<path d="M${xM + nw},${yo}C${xM + 34},${yo} ${xR - 30},${yr} ${xR},${yr}V${yr + h}C${xR - 30},${yr + h} ${xM + 34},${yo + h} ${xM + nw},${yo + h}Z" fill="${color}" opacity=".24"/>`;
    body += `<rect x="${xR}" y="${yr}" width="${nw}" height="${h}" rx="1" fill="${color}"/>`;
    body += `<text x="${xR + 8}" y="${yr + Math.max(h, 6) / 2 + 2.5}" class="mor-sk-l">${t.right[i]} <tspan class="mor-sk-v">$${n(v)}</tspan></text>`;
    yr += h + gapR;
    yo += h;
  });
  return svg(W, H, body, 'mor-sankey');
}

function money(locale: Locale) {
  const t = MOR[locale];
  const spark = [93, 95, 94, 94, 96, 95, 93, 97, 94, 95, 96, 95, 93, 98, 94, 93, 96];
  const sx = (i: number) => 2 + (i / (spark.length - 1)) * 136;
  const sy = (v: number) => 30 - ((v - 88) / 12) * 28;
  const sparkPath = spark.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join('');
  const bar = (label: string, v: number, max: number, tick: number, color: string, amount: string, change: string) =>
    `<div class="mor-io"><span>${label}</span><span class="mor-io__track"><i style="width:${(v / max) * 100}%;background:${color}"></i><b style="left:${(tick / max) * 100}%"></b></span><span class="mor-io__v">${amount}<small>${change}</small></span></div>`;
  const q = (i: number, score: number, color: string) =>
    `<div class="mor-q"><div><span>${t.qRows[i][0]}</span><small>${t.qRows[i][1]}</small></div><span class="mor-q__bar"><i style="width:${score}%;background:${color}"></i></span><b>${score}</b></div>`;
  const icons = [
    '<path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z"/>',
    '<path d="M1 3h4l3 4-3 4H1M8 7h5"/>',
    '<path d="M1 11l4-5 3 3 5-6"/>',
    '<path d="M7 1l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6V3z"/>',
  ];
  return `<div class="dash mor">
    <aside class="mor-rail">
      <div class="mor-brand">
        <span class="mor-logo">${svg(12, 12, '<path d="M3.3 11.6L6.1 1.4M10.9 11.6L8.1 1.4M4.6 8.6h4.8M5.4 5.6h3.2" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" transform="translate(-1 0)"/>')}</span>
        <div><b>Money on Rails</b><small>${t.tagline}</small></div>
      </div>
      <nav>${t.nav
        .map((label, i) => `<span class="${i === 0 ? 'is-on' : ''}">${svg(9, 9, `<g fill="none" stroke="currentColor" stroke-width="1.3" transform="scale(.64)">${icons[i]}</g>`)}${label}</span>`)
        .join('')}</nav>
    </aside>
    <header class="mor-top">
      <span class="mor-chip"><b>${t.plan}</b><small>${t.range}</small></span>
      <span class="mor-user"><span><b>Alex Rivera</b><small>${t.user}</small></span><i>AR</i></span>
    </header>
    <main class="mor-main">
      <p class="mor-banner"><b>${t.banner}</b><span>${t.about}</span></p>
      <div class="mor-head"><h3>${t.title}</h3><span class="mor-step"><i>‹</i>${t.month}<i>›</i></span></div>
      <div class="mor-row">
        <section class="mor-card">
          <div class="mor-card__head"><div><h4>${t.adherence[0]}</h4><p>${t.adherence[1]}</p></div>${ring(34, 96, MOR_C.good)}</div>
          <span class="mor-pill">${t.vsAvg}</span>
          ${svg(140, 34, `<path d="${sparkPath}" fill="none" stroke="${MOR_C.accent}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${sx(spark.length - 1)}" cy="${sy(spark.at(-1)!)}" r="1.8" fill="${MOR_C.accent}"/>`, 'mor-spark')}
          <p class="mor-axis">${t.axis.map((a) => `<span>${a}</span>`).join('')}</p>
        </section>
        <section class="mor-card">
          <div class="mor-card__head"><div><h4>${t.quality[0]}</h4><p>${t.quality[1]}</p></div>${ring(34, 84, MOR_C.good)}</div>
          ${q(0, 86, MOR_C.good)}${q(1, 66, MOR_C.attention)}${q(2, 100, MOR_C.good)}
        </section>
        <section class="mor-card">
          <div class="mor-card__head"><div><h4>${t.inout[0]}</h4><p>${t.inout[1]}</p></div><span class="mor-saved">✓ ${t.saved} $2,206</span></div>
          ${bar(t.flows[0], 14440, 15500, 15127, MOR_C.accent, '$14,440', '−$687')}
          ${bar(t.flows[1], 12084, 15500, 13282, '#8f887c', '$12,084', '−$1,198')}
          ${bar(t.flows[2], 150, 15500, 133, '#8f887c', '$150', '+$17')}
          <p class="mor-eyebrow">${t.topGroups}</p>
          ${bar(t.groups[0], 2786, 3100, 2815, MOR_C.cats[0], '$2,786', '−$29')}
          ${bar(t.groups[1], 1900, 3100, 2017, MOR_C.cats[1], '$1,900', '−$117')}
          ${bar(t.groups[2], 1543, 3100, 1507, MOR_C.cats[2], '$1,543', '+$36')}
        </section>
      </div>
      <div class="mor-row mor-row--b">
        <section class="mor-card mor-card--flow">
          <div class="mor-card__head"><div><h4>${t.where[0]}</h4><p>${t.where[1]}</p></div><span class="mor-seg"><b>${t.chart}</b><span>${t.table}</span></span></div>
          ${sankey(t)}
        </section>
        <div class="mor-stack">
          <section class="mor-card">
            <h4>${t.attention[0]}</h4><p>${t.attention[1]}</p>
            <ul class="mor-att">${t.attRows.map((r, i) => `<li><i style="color:${i === 1 ? MOR_C.attention : '#e0703d'}">${i === 1 ? '◔' : '✦'}</i>${r}</li>`).join('')}</ul>
          </section>
          <section class="mor-card">
            <h4>${t.nws[0]}</h4><p>${t.nws[1]}</p>
            <span class="mor-nws"><i style="width:55%;background:${MOR_C.buckets[0]}"></i><i style="width:14%;background:${MOR_C.buckets[1]}"></i><i style="width:21%;background:${MOR_C.buckets[2]}"></i><i class="is-left"></i></span>
            <div class="mor-buckets">${t.buckets
              .map(([l, name], i) => `<div><span><i style="background:${MOR_C.buckets[i]}">${l}</i>${name}</span><b>${['61%', '16%', '23%'][i]}</b><small>${t.target} ${['50%', '30%', '20%'][i]}</small></div>`)
              .join('')}</div>
          </section>
        </div>
      </div>
    </main>
  </div>`;
}

// ------------------------------------------------------------------ App Tarimas
// The Spanish-only app mid-job: an order captured, boxes being spread across
// pallets, and the pallet label ready to print. Ant Design's default look.

// A stand-in barcode: bar widths come from the digits, so each value gets its own pattern.
function barcode(value: string, w: number, h: number) {
  const mods: number[] = [2, 1, 1, 2, 3, 2];
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    mods.push(1 + (c % 3), 1 + ((c >> 1) % 2), 1 + ((c * 7) % 3), 1 + ((c >> 2) % 2), 1 + ((c * 3) % 2), 1 + ((c + 1) % 3));
  }
  mods.push(2, 3, 3, 1, 1, 1, 2);
  const total = mods.reduce((s, m) => s + m, 0);
  const unit = w / total;
  let x = 0, bars = '';
  mods.forEach((m, i) => {
    if (i % 2 === 0) bars += `<rect x="${(x * unit).toFixed(2)}" y="0" width="${(m * unit).toFixed(2)}" height="${h}"/>`;
    x += m;
  });
  return `<span class="tar-code">${svg(w, h, bars)}<small>${value}</small></span>`;
}

const TAR_PRODUCTS: [string, string, string][] = [
  ['Tortilla Blanca', '02000001000014', '#eadfc2'],
  ['Tortilla Amarilla', '02000001000021', '#f0c75a'],
  ['Tortilla Azul', '02000001000045', '#6b77ad'],
  ['Tostada Blanca', '02000001000052', '#e9d9b0'],
  ['Totopos', '02000001000076', '#e5a64a'],
];

const tortilla = (color: string, chip = false) =>
  svg(
    22,
    16,
    chip
      ? `<path d="M3 13L11 2l8 11z" fill="${color}" stroke="rgb(0 0 0 / .18)" stroke-width=".8"/><path d="M6 13l5-7 5 7" fill="none" stroke="rgb(0 0 0 / .08)"/>`
      : `<ellipse cx="11" cy="11" rx="9" ry="3.6" fill="${color}" stroke="rgb(0 0 0 / .15)" stroke-width=".8"/><ellipse cx="11" cy="8.6" rx="9" ry="3.6" fill="${color}" stroke="rgb(0 0 0 / .15)" stroke-width=".8"/><ellipse cx="11" cy="6.2" rx="9" ry="3.6" fill="${color}" stroke="rgb(0 0 0 / .18)" stroke-width=".8"/><circle cx="8" cy="6" r=".7" fill="rgb(0 0 0 / .12)"/><circle cx="13.5" cy="6.8" r=".6" fill="rgb(0 0 0 / .12)"/>`,
  );

function tarimas() {
  const icon = (d: string) => svg(10, 10, `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>`);
  const order: [number, number][] = [[0, 40], [1, 24], [2, 10], [4, 12]];
  // 86 boxes ordered: Tarima 1 is full, Tarima 2 is taking three Tortilla Azul boxes off a stack of ten.
  const inventory: [number, string, boolean][] = [[0, '16', false], [2, '3/10', true]];
  const pallet = (no: number, rows: [number, number][], over = false) => `
    <div class="tar-pallet${no === 1 ? ' is-picked' : ''}">
      <header>${icon('M1 7h8M2 7V3h6v4M1 9h8')}<b>Tarima ${no}</b><span class="tar-tag tar-tag--geek">${rows.length} ${rows.length === 1 ? 'item' : 'items'}</span></header>
      ${rows.map(([p, q]) => `<div class="tar-row">${tortilla(TAR_PRODUCTS[p][2], p === 4)}<span>${TAR_PRODUCTS[p][0]}</span><span class="tar-tag tar-tag--grey">${q}</span></div>`).join('')}
      ${over ? '<div class="tar-drop">Suelta aquí</div>' : ''}
    </div>`;
  return `<div class="dash tar">
    <div class="tar-tile is-drag">${tortilla(TAR_PRODUCTS[2][2])}<span>${TAR_PRODUCTS[2][0]}</span><span class="tar-tag tar-tag--orange">3</span></div>
    <p class="tar-banner"><b>Demo con datos de ejemplo</b> · <u>← gsanchez.me</u><small>Captura un pedido, reparte sus cajas en tarimas y genera la etiqueta logística de cada una.</small></p>
    <div class="tar-cols">
      <section class="tar-card">
        <h4>${icon('M1 1h1.5l1.2 5.5h4.8L9.5 3H3')}Pedido</h4>
        <div class="tar-body">
          <label>Orden de Compra</label><span class="tar-input">4501</span>
          <label>CEDIS</label><span class="tar-input">7482</span>
          <label><i>*</i> Producto</label><span class="tar-input tar-input--sel">Totopos<i>⌄</i></span>
          <label><i>*</i> Cantidad</label><span class="tar-input">12</span>
          <span class="tar-btn">+ Agregar item</span>
          <h5>Orden de Compra</h5>
          ${order.map(([p, q]) => `<div class="tar-line"><span>${TAR_PRODUCTS[p][0]}<small>${TAR_PRODUCTS[p][1]}</small></span><span class="tar-tag">${q}</span></div>`).join('')}
        </div>
      </section>
      <section class="tar-card">
        <h4>${icon('M1 1h3.5v3.5H1zM5.5 1H9v3.5H5.5zM1 5.5h3.5V9H1zM5.5 5.5H9V9H5.5z')}Inventario<small>26 cajas</small></h4>
        <div class="tar-body tar-grid">
          ${inventory
            .map(
              ([p, q, partial]) =>
                `<div class="tar-tile${partial ? ' is-partial' : ''}">${tortilla(TAR_PRODUCTS[p][2], p === 4)}<span>${TAR_PRODUCTS[p][0]}</span><span class="tar-tag${partial ? ' tar-tag--orange' : ''}">${q}</span></div>`,
            )
            .join('')}
        </div>
      </section>
      <section class="tar-card">
        <h4>${icon('M1 3l4-2 4 2v4L5 9 1 7zM1 3l4 2 4-2M5 5v4')}Tarimas</h4>
        <div class="tar-body">
          ${pallet(1, [[0, 24], [1, 24]])}
          ${pallet(2, [[4, 12]], true)}
          <span class="tar-btn tar-btn--dashed">+ Agregar tarima</span>
        </div>
      </section>
      <section class="tar-card tar-card--label">
        <h4>${icon('M1 1h4l4 4-4 4-4-4zM3 3h.1')}Etiqueta</h4>
        <div class="tar-body">
          <div class="tar-sheet">
            <b>CEDIS</b>${barcode('7482', 92, 18)}
            <b>OC</b>${barcode('4501', 92, 18)}
            <b>UPC</b>
            <div class="tar-upc">${barcode('02000001000014', 104, 18)}${barcode('24', 34, 18)}</div>
            <div class="tar-upc">${barcode('02000001000021', 104, 18)}${barcode('24', 34, 18)}</div>
            <div class="tar-foot"><span>${barcode('48', 40, 16)}<b>NUMERO TOTAL DE CAJAS</b></span><span>${barcode('1', 34, 16)}<b>CONSECUTIVO TARIMA</b></span></div>
          </div>
          <span class="tar-btn tar-btn--lg">${icon('M2.5 3.5V1h5v2.5M2.5 7H1V3.5h8V7H7.5M2.5 5.5h5V9h-5z')} Imprimir Etiqueta</span>
        </div>
      </section>
    </div>
  </div>`;
}

// ------------------------------------------------------------------ demo dashboards
// Casa Zenzontle and Molara Dental share one look (src/styles/demo.css); each
// brand swaps its tokens. Their headers, filter sentence and KPI strip match.

const dzHead = (logo: string, name: string, tagline: string) =>
  `<header class="dzs-head">${logo}<div><h3>${name}</h3><p>${tagline}</p></div></header>`;

const dzSentence = (parts: (string | [string])[]) =>
  `<p class="dzs-sentence">${parts
    .map((p) => (Array.isArray(p) ? `<span class="dzs-sel">${p[0]}<i>▾</i></span>` : `<span class="${/^[,.]/.test(p) ? 'is-punct' : ''}">${p}</span>`))
    .join('')}</p>`;

const dzPresets = (labels: string[], on: number, reset: string) =>
  `<div class="dzs-presets">${labels.map((l, i) => `<span class="${i === on ? 'is-on' : ''}">${l}</span>`).join('')}<span class="dzs-reset">${reset}</span></div>`;

const dzKpis = (items: [string, string, string, boolean][], note = '') =>
  `<dl class="dzs-kpis">${items
    .map(([label, value, delta, good], i) => `<div><dt>${label}</dt><dd><b>${value}</b><span class="${good ? 'is-up' : 'is-down'}">${delta}</span></dd>${i === 0 && note ? `<small>${note}</small>` : ''}</div>`)
    .join('')}</dl>`;

const ZEN = {
  en: {
    tagline: 'Home goods from eight stores in Monterrey, Mexico City and Guadalajara, and online.',
    sentence: ['Showing', ['all stores'], 'on', ['both channels'], ',', ['all categories'], ', from', ['Sep 2025'], 'to', ['Aug 2026'], '.'],
    presets: ['Last 3 months', 'Last 6 months', 'Last 12 months', 'All 24 months'],
    reset: 'Reset filters',
    kpis: [['Net sales', '$5M', '+2.4%', true], ['Gross margin', '49.7%', '−0.1 pp', false], ['Orders', '65,085', '+6.3%', true], ['Average order', '$76.94', '−3.7%', false], ['Units sold', '118,814', '+6.6%', true]],
    ofTarget: '94% of target',
    trend: 'Net sales by month',
    legend: ['In store', 'Online', 'Target'],
    yAxis: ['$0', '$200K', '$400K', '$600K', '$800K'],
    months: ['Oct', '2025', 'Apr', 'Jul', 'Oct', '2026', 'Apr', 'Jul'],
    stores: 'Stores',
    regions: ['Monterrey', 'Mexico City', 'Guadalajara'],
  },
  es: {
    tagline: 'Artículos para el hogar en ocho tiendas de Monterrey, Ciudad de México y Guadalajara, y en línea.',
    sentence: ['Mostrando', ['todas las tiendas'], 'en', ['ambos canales'], ',', ['todas las categorías'], ', de', ['sep 2025'], 'a', ['ago 2026'], '.'],
    presets: ['Últimos 3 meses', 'Últimos 6 meses', 'Últimos 12 meses', 'Los 24 meses'],
    reset: 'Quitar filtros',
    kpis: [['Ventas netas', '$91.1 M', '+2.4%', true], ['Margen bruto', '49.7%', '−0.1 pp', false], ['Pedidos', '65,085', '+6.3%', true], ['Ticket promedio', '$1,400.28', '−3.7%', false], ['Unidades vendidas', '118,814', '+6.6%', true]],
    ofTarget: '94% de la meta',
    trend: 'Ventas netas por mes',
    legend: ['En tienda', 'En línea', 'Meta'],
    yAxis: ['$0', '$3.6 M', '$7.3 M', '$10.9 M', '$14.6 M'],
    months: ['oct', '2025', 'abr', 'jul', 'oct', '2026', 'abr', 'jul'],
    stores: 'Tiendas',
    regions: ['Monterrey', 'Ciudad de México', 'Guadalajara'],
  },
} as const;

const ZEN_C = { a: '#2346a8', aSoft: '#c9d3ee', b: '#2c8a66', bSoft: '#c5e2d5', target: '#d9960f' };

function retail(locale: Locale) {
  const t = ZEN[locale];
  // Monthly net sales ($K), Sep 2024 – Aug 2026, read off the demo's own chart.
  const totals = [367, 387, 489, 616, 308, 321, 390, 508, 364, 344, 387, 393, 393, 407, 508, 639, 325, 331, 393, 420, 511, 367, 348, 393];
  const targets = [380, 380, 510, 600, 310, 330, 410, 520, 380, 360, 400, 400, 400, 435, 520, 690, 340, 340, 410, 440, 560, 380, 370, 410];
  const W = 372, H = 236, L = 30, B = 14, T = 4, max = 800;
  const slot = (W - L) / totals.length;
  const bw = slot * 0.66;
  const Y = (v: number) => T + (1 - v / max) * (H - T - B);
  let body = '';
  t.yAxis.forEach((lab, i) => {
    const y = Y((max * i) / 4);
    body += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" class="dzs-grid"/><text x="${L - 4}" y="${y + 2.5}" text-anchor="end">${lab}</text>`;
  });
  let step = '';
  totals.forEach((v, i) => {
    const x = L + i * slot + (slot - bw) / 2;
    const online = v * 0.18;
    const faded = i < 12;
    body += `<rect x="${x.toFixed(1)}" y="${Y(v - online).toFixed(1)}" width="${bw.toFixed(1)}" height="${(Y(0) - Y(v - online)).toFixed(1)}" fill="${faded ? ZEN_C.aSoft : ZEN_C.a}"/>`;
    body += `<rect x="${x.toFixed(1)}" y="${Y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(Y(v - online) - Y(v)).toFixed(1)}" fill="${faded ? ZEN_C.bSoft : ZEN_C.b}"/>`;
    const x0 = L + i * slot, x1 = x0 + slot, ty = Y(targets[i]).toFixed(1);
    step += `${i ? 'L' : 'M'}${x0.toFixed(1)},${ty}H${x1.toFixed(1)}`;
  });
  body += `<path d="${step}" fill="none" stroke="${ZEN_C.target}" stroke-width="1.6" stroke-dasharray="3 2"/>`;
  [1, 4, 7, 10, 13, 16, 19, 22].forEach((m, i) => (body += `<text x="${(L + m * slot + slot / 2).toFixed(1)}" y="${H - 2}" text-anchor="middle">${t.months[i]}</text>`));

  // Stores: in-store, online (share of the widest bar), target tick, % of target.
  const stores: [number, string, number, number, number, string][] = [
    [0, 'San Pedro', 144, 35, 188, '95%'], [0, 'Cumbres', 100, 20, 126, '95%'], [0, 'Centro', 71, 10, 97, '82%'],
    [1, 'Coyoacán', 115, 25, 149, '94%'], [1, 'Roma', 114, 30, 145, '101%'], [1, 'Polanco', 143, 39, 198, '92%'],
    [2, 'Chapultepec', 95, 18, 119, '95%'], [2, 'Zapopan', 115, 22, 142, '97%'],
  ];
  let storeRows = '';
  stores.forEach(([r, name, a, b, tick, pct], i) => {
    if (i === 0 || stores[i - 1][0] !== r) storeRows += `<p class="dzs-group">${t.regions[r]}</p>`;
    storeRows += `<div class="zen-store"><span>${name}</span><span class="zen-store__bar"><i style="width:${(a / 210) * 100}%;background:${ZEN_C.a}"></i><i style="width:${(b / 210) * 100}%;background:${ZEN_C.b}"></i><b style="left:${(tick / 210) * 100}%"></b></span><span>${pct}</span></div>`;
  });

  return `<div class="dash dzs zen">
    ${dzHead(
      `<svg class="dzs-logo" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 27c6 0 9-3 12-8 2-4 5-8 10-8 3 0 5 2 6 4l-4 1c1 3 0 7-3 10-3 3-8 4-13 4l-6 4 2-5-4-2z"/><circle cx="29" cy="14.5" r="1.3" fill="var(--z-ground)"/><path d="M4 34h32" stroke="currentColor" stroke-width="2"/></svg>`,
      'Casa Zenzontle',
      t.tagline,
    )}
    ${dzSentence(t.sentence as unknown as (string | [string])[])}
    ${dzPresets([...t.presets], 2, t.reset)}
    ${dzKpis(t.kpis as unknown as [string, string, string, boolean][], t.ofTarget)}
    <div class="dzs-grid">
      <section class="dzs-panel">
        <header><h4>${t.trend}</h4><ul class="dzs-legend"><li><i style="background:${ZEN_C.a}"></i>${t.legend[0]}</li><li><i style="background:${ZEN_C.b}"></i>${t.legend[1]}</li><li><i class="is-target"></i>${t.legend[2]}</li></ul></header>
        ${svg(W, H, body, 'dzs-svg')}
      </section>
      <section class="dzs-panel">
        <header><h4>${t.stores}</h4></header>
        ${storeRows}
      </section>
    </div>
  </div>`;
}

const MOL = {
  en: {
    tagline: 'Five dental clinics across Querétaro.',
    sentence: ['Showing', ['all clinics'], ',', ['all treatments'], ', from', ['Sep 2025'], 'to', ['Aug 2026'], '.'],
    presets: ['Last 3 months', 'Last 6 months', 'Last 12 months', 'All 24 months'],
    reset: 'Reset filters',
    kpis: [['Revenue', '$4.8M', '+5.2%', true], ['Appointments', '30,887', '+6.0%', true], ['Chair utilisation', '64%', '+4.1 pp', true], ['No-show rate', '11.5%', '−1.2 pp', true], ['Cost of no-shows', '$430.1K', '−5.7%', true], ['New patients', '3,884', '+3.9%', true]],
    heat: 'When the chairs are full',
    show: ['Utilisation', 'No-shows'],
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    noshow: 'Where no-shows happen',
    byClinic: 'By clinic',
    byLead: 'By how far ahead it was booked',
    leads: ['Same day', '1–3 days', '4–7 days', '8–14 days', '15–30 days', '31+ days'],
  },
  es: {
    tagline: 'Cinco clínicas dentales en Querétaro.',
    sentence: ['Mostrando', ['todas las clínicas'], ',', ['todos los tratamientos'], ', de', ['sep 2025'], 'a', ['ago 2026'], '.'],
    presets: ['Últimos 3 meses', 'Últimos 6 meses', 'Últimos 12 meses', 'Los 24 meses'],
    reset: 'Quitar filtros',
    kpis: [['Ingresos', '$87.7 M', '+5.2%', true], ['Citas', '30,887', '+6.0%', true], ['Ocupación de sillones', '64%', '+4.1 pp', true], ['Tasa de inasistencia', '11.5%', '−1.2 pp', true], ['Costo de inasistencias', '$7.8 M', '−5.7%', true], ['Pacientes nuevos', '3,884', '+3.9%', true]],
    heat: 'Cuándo se llenan los sillones',
    show: ['Ocupación', 'Inasistencias'],
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    noshow: 'Dónde faltan los pacientes',
    byClinic: 'Por clínica',
    byLead: 'Por anticipación de la cita',
    leads: ['El mismo día', '1–3 días', '4–7 días', '8–14 días', '15–30 días', '31+ días'],
  },
} as const;

function clinic(locale: Locale) {
  const t = MOL[locale];
  // Chair utilisation (%) by weekday and hour, 9:00–18:00, from the demo. Saturdays close at 14:00.
  const util = [
    [46, 52, 58, 60, 58, 39, 53, 55, 60, 57],
    [65, 72, 74, 74, 72, 51, 68, 74, 73, 70],
    [63, 70, 70, 71, 69, 50, 63, 71, 73, 70],
    [61, 71, 73, 74, 72, 53, 68, 73, 78, 75],
    [68, 73, 77, 77, 72, 51, 70, 74, 76, 70],
    [44, 49, 49, 51, 50, 0, 0, 0, 0, 0],
  ];
  const W = 330, H = 206, L = 22, top = 12;
  const cw = (W - L) / 10, rh = (H - top) / 6;
  let body = '';
  for (let c = 0; c < 10; c++) body += `<text x="${L + c * cw + cw / 2}" y="8" text-anchor="middle">${9 + c}</text>`;
  util.forEach((row, r) => {
    body += `<text x="0" y="${top + r * rh + rh / 2 + 3}">${t.days[r]}</text>`;
    row.forEach((v, c) => {
      const x = L + c * cw + 1.2, y = top + r * rh + 1.2, w = cw - 2.4, h = rh - 2.4;
      if (!v) {
        body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="none" stroke="#d8d2dc" stroke-dasharray="2 2"/>`;
        return;
      }
      const k = (v - 36) / 42;
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${mix([236, 214, 226], [126, 50, 96], k)}"/>`;
      body += `<text x="${x + w / 2}" y="${y + h / 2 + 2}" text-anchor="middle" class="${k > 0.5 ? 'is-light' : ''}">${v}%</text>`;
    });
  });

  const nsRow = (label: string, v: number, max: number, chain?: number) =>
    `<div class="mol-ns"><span>${label}</span><span class="mol-ns__bar"><i style="width:${(v / max) * 100}%"></i>${chain ? `<b style="left:${(chain / max) * 100}%"></b>` : ''}</span><span>${v.toFixed(1)}%</span></div>`;
  const clinics: [string, number][] = [['Centro Histórico', 10.5], ['Juriquilla', 7.1], ['El Refugio', 12.5], ['Milenio III', 12.7], ['Corregidora', 16.1]];
  const leads = [1.8, 4.4, 8.3, 10.7, 13.7, 22.5];

  return `<div class="dash dzs mol">
    ${dzHead(
      `<svg class="dzs-logo" viewBox="0 0 40 40" aria-hidden="true"><path d="M9 11c0-4 4-6 7-5 2 1 3 1 4 1s2 0 4-1c3-1 7 1 7 5 0 5-2 7-2 11 0 4-1 11-4 11-2 0-2-4-3-7-1-2-1-3-2-3s-1 1-2 3c-1 3-1 7-3 7-3 0-4-7-4-11 0-4-2-6-2-11z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>`,
      'Molara Dental',
      t.tagline,
    )}
    ${dzSentence(t.sentence as unknown as (string | [string])[])}
    ${dzPresets([...t.presets], 2, t.reset)}
    ${dzKpis(t.kpis as unknown as [string, string, string, boolean][])}
    <div class="dzs-grid">
      <section class="dzs-panel">
        <header><h4>${t.heat}</h4><span class="dzs-toggle"><b>${t.show[0]}</b><span>${t.show[1]}</span></span></header>
        ${svg(W, H, body, 'dzs-svg mol-heat')}
      </section>
      <section class="dzs-panel">
        <header><h4>${t.noshow}</h4></header>
        <p class="dzs-group">${t.byClinic}</p>
        ${clinics.map(([c, v]) => nsRow(c, v, 40, 11.5)).join('')}
        <p class="dzs-group">${t.byLead}</p>
        ${leads.map((v, i) => nsRow(t.leads[i], v, 40)).join('')}
      </section>
    </div>
  </div>`;
}

const RENDER: Record<Preview, (locale: Locale) => string> = {
  money,
  tarimas,
  retail,
  clinic,
};

export const renderDash = (kind: Preview, locale: Locale = 'en') => RENDER[kind](locale);

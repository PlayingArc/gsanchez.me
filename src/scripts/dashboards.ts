// Modern dashboard mockups that play on the TV screens, rendered as HTML+SVG
// at a fixed 640×480 and scaled to fit. Placeholder data, generated from `t`
// so the screens can tick along as if live. Swap for real captures later.

import type { Preview } from '../data/site';

export const DASH_W = 640;
export const DASH_H = 480;

type Series = { vals: number[]; color: string; area?: boolean; dash?: boolean; name?: string };

// ------------------------------------------------------------------ data
const wave = (i: number, seed: number, t: number) =>
  0.5 +
  0.22 * Math.sin(i * 0.45 + seed + t * 0.25) +
  0.14 * Math.sin(i * 1.3 + seed * 2.1 - t * 0.4) +
  0.06 * Math.sin(i * 3.7 + seed * 0.7 + t * 0.9);

const series = (n: number, seed: number, t: number, lo: number, hi: number) =>
  Array.from({ length: n }, (_, i) => lo + (hi - lo) * wave(i, seed, t));

const num = (v: number, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ------------------------------------------------------------------ pieces
const delta = (v: number, unit = '%', invert = false) => {
  const up = v >= 0;
  const good = invert ? !up : up;
  return `<span class="dash__delta ${good ? 'is-good' : 'is-bad'}">${up ? '▲' : '▼'} ${Math.abs(v).toFixed(1)}${unit}</span>`;
};

const kpi = (label: string, value: string, change = '') =>
  `<div class="dash__kpi"><span class="dash__label">${label}</span><strong>${value}</strong>${change}</div>`;

const card = (title: string, body: string, cls = '') =>
  `<section class="dash__card ${cls}"><h4>${title}</h4>${body}</section>`;

const legend = (items: { name: string; color: string; dash?: boolean }[]) =>
  `<div class="dash__legend">${items
    .map((s) => `<span><i style="background:${s.dash ? 'transparent' : s.color};border-color:${s.color}" class="${s.dash ? 'is-dash' : ''}"></i>${s.name}</span>`)
    .join('')}</div>`;

const top = (logo: string, title: string, sub: string, range: string) => `
  <header class="dash__top">
    <span class="dash__logo">${logo}</span>
    <div><b>${title}</b><small>${sub}</small></div>
    <span class="dash__pill">${range} ▾</span>
    <span class="dash__live"><i></i>Live</span>
  </header>`;

// ------------------------------------------------------------------ charts
function lineChart(w: number, h: number, list: Series[], opts: { min?: number; max?: number; fmt?: (v: number) => string; x?: string[] } = {}) {
  const L = 34, R = 10, T = 8, B = 18;
  const all = list.flatMap((s) => s.vals);
  const min = opts.min ?? Math.min(...all) * 0.9;
  const max = opts.max ?? Math.max(...all) * 1.05;
  const fmt = opts.fmt ?? ((v: number) => num(v));
  const X = (i: number, n: number) => L + (i / (n - 1)) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - min) / (max - min)) * (h - T - B);

  let svg = '';
  for (let k = 0; k <= 3; k++) {
    const v = min + ((max - min) * k) / 3;
    svg += `<line x1="${L}" x2="${w - R}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${L - 6}" y="${Y(v) + 3}" text-anchor="end">${fmt(v)}</text>`;
  }
  (opts.x ?? []).forEach((lab, i, arr) => {
    const x = L + (i / (arr.length - 1)) * (w - L - R);
    svg += `<text x="${x}" y="${h - 4}" text-anchor="${i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}">${lab}</text>`;
  });
  list.forEach((s, si) => {
    const pts = s.vals.map((v, i) => [X(i, s.vals.length), Y(v)] as const);
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
    if (s.area) {
      svg += `<defs><linearGradient id="a${si}${s.color.slice(1)}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".28"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>`;
      svg += `<path d="${d}L${pts.at(-1)![0]},${h - B}L${pts[0][0]},${h - B}Z" fill="url(#a${si}${s.color.slice(1)})"/>`;
    }
    svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" ${s.dash ? 'stroke-dasharray="4 4"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
    if (!s.dash) {
      const [lx, ly] = pts.at(-1)!;
      svg += `<circle cx="${lx}" cy="${ly}" r="4" fill="${s.color}" stroke="var(--d-card)" stroke-width="2"/>`;
    }
  });
  return `<svg class="dash__svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`;
}

// Rounded 4px on the data end only; square on the baseline.
const colPath = (x: number, y: number, bw: number, bh: number) => {
  const r = Math.min(4, bw / 2, bh);
  return `M${x},${y + bh}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y + bh}Z`;
};

function columns(w: number, h: number, vals: number[], color: string, x: string[], max = Math.max(...vals) * 1.1) {
  const L = 30, B = 18, T = 8;
  const n = vals.length;
  const slot = (w - L) / n;
  const bw = slot - 2 - slot * 0.25;
  let svg = '';
  for (let k = 0; k <= 3; k++) {
    const y = T + ((h - T - B) * k) / 3;
    svg += `<line x1="${L}" x2="${w}" y1="${y}" y2="${y}" class="g"/><text x="${L - 6}" y="${y + 3}" text-anchor="end">${num((max * (3 - k)) / 3)}</text>`;
  }
  vals.forEach((v, i) => {
    const bh = (v / max) * (h - T - B);
    const bx = L + i * slot + slot * 0.125;
    svg += `<path d="${colPath(bx, h - B - bh, bw, bh)}" fill="${color}"/>`;
    if (x[i]) svg += `<text x="${bx + bw / 2}" y="${h - 4}" text-anchor="middle">${x[i]}</text>`;
  });
  return `<svg class="dash__svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`;
}

function hbars(rows: [string, number, string][], color: string | string[], max = Math.max(...rows.map((r) => r[1]))) {
  return `<div class="dash__hbars">${rows
    .map(
      ([label, v, text], i) =>
        `<div><span>${label}</span><span class="dash__track"><i style="width:${(v / max) * 100}%;background:${Array.isArray(color) ? color[i] : color}"></i></span><b>${text}</b></div>`,
    )
    .join('')}</div>`;
}

const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(a0)}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
};

function gauge(size: number, v: number, target: number, color: string) {
  const cx = size / 2, cy = size * 0.55, r = size * 0.4;
  const a = (x: number) => Math.PI + x * Math.PI;
  const ta = a(target);
  return `<svg class="dash__svg" width="${size}" height="${size * 0.62}" viewBox="0 0 ${size} ${size * 0.62}">
    <path d="${arc(cx, cy, r, Math.PI, 2 * Math.PI)}" stroke="var(--d-line)" stroke-width="14" fill="none"/>
    <path d="${arc(cx, cy, r, Math.PI, a(v))}" stroke="${color}" stroke-width="14" fill="none"/>
    <line x1="${cx + (r - 11) * Math.cos(ta)}" y1="${cy + (r - 11) * Math.sin(ta)}" x2="${cx + (r + 11) * Math.cos(ta)}" y2="${cy + (r + 11) * Math.sin(ta)}" stroke="var(--d-text)" stroke-width="2"/>
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="big">${(v * 100).toFixed(1)}%</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle">target ${(target * 100).toFixed(0)}%</text>
  </svg>`;
}

function donut(size: number, parts: { v: number; color: string }[], center: string, sub: string) {
  const total = parts.reduce((s, p) => s + p.v, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const gap = 0.035;
  let a = -Math.PI / 2;
  let svg = '';
  for (const p of parts) {
    const span = (p.v / total) * Math.PI * 2;
    svg += `<path d="${arc(cx, cy, r, a + gap / 2, a + span - gap / 2)}" stroke="${p.color}" stroke-width="16" fill="none"/>`;
    a += span;
  }
  return `<svg class="dash__svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svg}
    <text x="${cx}" y="${cy + 2}" text-anchor="middle" class="big">${center}</text>
    <text x="${cx}" y="${cy + 18}" text-anchor="middle">${sub}</text></svg>`;
}

function stackedArea(w: number, h: number, layers: Series[], x: string[]) {
  const L = 30, R = 8, T = 8, B = 18;
  const n = layers[0].vals.length;
  const sums = Array.from({ length: n }, (_, i) => layers.reduce((s, l) => s + l.vals[i], 0));
  const max = Math.max(...sums) * 1.08;
  const X = (i: number) => L + (i / (n - 1)) * (w - L - R);
  const Y = (v: number) => T + (1 - v / max) * (h - T - B);
  let svg = '';
  for (let k = 0; k <= 3; k++) {
    const v = (max * k) / 3;
    svg += `<line x1="${L}" x2="${w - R}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${L - 6}" y="${Y(v) + 3}" text-anchor="end">${num(v)}</text>`;
  }
  const base = new Array(n).fill(0);
  for (const l of layers) {
    const topPts = l.vals.map((v, i) => [X(i), Y(base[i] + v)]);
    const botPts = base.map((b, i) => [X(i), Y(b)]).reverse();
    const d = [...topPts, ...botPts].map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('') + 'Z';
    svg += `<path d="${d}" fill="${l.color}" stroke="var(--d-card)" stroke-width="2" stroke-linejoin="round"/>`;
    l.vals.forEach((v, i) => (base[i] += v));
  }
  x.forEach((lab, i, arr) => {
    svg += `<text x="${L + (i / (arr.length - 1)) * (w - L - R)}" y="${h - 4}" text-anchor="${i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}">${lab}</text>`;
  });
  return `<svg class="dash__svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`;
}

function heatmap(w: number, h: number, rows: string[], cols: number, value: (r: number, c: number) => number, ramp: (v: number) => string, xLabels: string[]) {
  const L = 22, B = 16;
  const cw = (w - L) / cols;
  const rh = (h - B) / rows.length;
  let svg = '';
  rows.forEach((name, r) => {
    svg += `<text x="0" y="${r * rh + rh / 2 + 3}">${name}</text>`;
    for (let c = 0; c < cols; c++) {
      svg += `<rect x="${L + c * cw + 1}" y="${r * rh + 1}" width="${cw - 2}" height="${rh - 2}" rx="2" fill="${ramp(value(r, c))}"/>`;
    }
  });
  xLabels.forEach((lab, i, arr) => {
    svg += `<text x="${L + (i / (arr.length - 1)) * (w - L - cw) + cw / 2}" y="${h - 3}" text-anchor="middle">${lab}</text>`;
  });
  return `<svg class="dash__svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`;
}

// Sequential blue on the dark surface: low recedes toward the card colour.
const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(' ')})`;
const blueOnDark = (v: number) => mix([30, 42, 60], [134, 182, 239], Math.min(Math.max(v, 0), 1));

// ------------------------------------------------------------------ dashboards
// Categorical slots, fixed order: blue, orange, aqua (light / dark steps).
const DARK = { s1: '#3987e5', s2: '#d95926', s3: '#199e70', muted: '#6f6e69' };
const LIGHT = { s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', muted: '#a3a29c', ordinal: ['#184f95', '#256abf', '#3987e5', '#5598e7', '#86b6ef'] };

const DAYS = ['Sep 1', 'Sep 8', 'Sep 15', 'Sep 22', 'Sep 28'];

const RENDER: Record<Preview, (t: number) => string> = {
  sales: (t) => {
    const rev = series(30, 1, t, 2.2, 3.6);
    const regions: [string, number, string][] = ['North', 'South', 'East', 'West', 'Online'].map((r, i) => {
      const v = 8 + 14 * wave(i * 2, 4, t * 0.5);
      return [r, v, `$${v.toFixed(1)}K`];
    });
    return `<div class="dash dash--dark">
      ${top('RP', 'Retail Pulse', 'Sales overview · All stores', 'Last 30 days')}
      <div class="dash__kpis">
        ${kpi('Revenue', `$${(84.2 + Math.sin(t * 0.3)).toFixed(1)}K`, delta(4.1))}
        ${kpi('Orders', num(1204 + Math.round(Math.sin(t * 0.4) * 12)), delta(2.3))}
        ${kpi('Avg. order', '$69.93', delta(-0.8))}
        ${kpi('Margin', '31.4%', delta(0.6, 'pt'))}
      </div>
      <div class="dash__main">
        ${card('Daily revenue ($K)', legend([{ name: 'Revenue', color: DARK.s1 }, { name: 'Target', color: DARK.muted, dash: true }]) + lineChart(346, 238, [{ vals: new Array(30).fill(3), color: DARK.muted, dash: true }, { vals: rev, color: DARK.s1, area: true }], { min: 1.5, max: 4.2, fmt: (v) => v.toFixed(1), x: DAYS }))}
        ${card('Revenue by region', hbars(regions, DARK.s1, 24) + `<p class="dash__note">Online up 12% week over week</p>`)}
      </div>
    </div>`;
  },

  ops: (t) => {
    const weeks = series(12, 3, t * 0.6, 14, 26);
    const sla = 0.93 + Math.sin(t * 0.3) * 0.012;
    return `<div class="dash dash--light dash--pbi">
      <nav class="dash__rail"><i></i><i class="on"></i><i></i><i></i></nav>
      ${top('<span class="pbi"></span>', 'Ops Overview', 'Warehouse network · Power BI', 'This quarter')}
      <div class="dash__kpis">
        ${kpi('Throughput / h', num(3120 + Math.round(Math.sin(t) * 30)), delta(3.2))}
        ${kpi('Backlog', num(212 + Math.round(Math.sin(t * 0.7) * 6)), delta(-5.4, '%', true))}
        ${kpi('On-time', '94.1%', delta(0.9, 'pt'))}
        ${kpi('Open breaches', '3', '<span class="dash__status is-warn">▲ Needs review</span>')}
      </div>
      <div class="dash__main">
        ${card('Orders shipped per week (K)', columns(314, 262, weeks, LIGHT.s1, weeks.map((_, i) => (i % 2 ? '' : `W${i + 1}`)), 30))}
        ${card('SLA attainment', gauge(186, sla, 0.95, LIGHT.s1) + `<ul class="dash__list">
            <li><span class="dot is-good"></span>North DC<b>97.2%</b></li>
            <li><span class="dot is-warn"></span>Central DC<b>93.8%</b></li>
            <li><span class="dot is-bad"></span>South DC<b>89.5%</b></li></ul>`)}
      </div>
    </div>`;
  },

  funnel: (t) => {
    const organic = series(28, 5, t * 0.5, 1.1, 2.1);
    const paid = series(28, 8, t * 0.5, 0.5, 1.3);
    const steps: [string, number][] = [['Visit', 48120], ['Product view', 29830], ['Add to cart', 9120], ['Checkout', 3410], ['Purchase', 1155]];
    return `<div class="dash dash--light dash--looker">
      ${top('<span class="lk"></span>', 'Funnel Lens', 'Marketing funnel · Looker Studio', 'Sep 1 – Sep 28')}
      <div class="dash__kpis">
        ${kpi('Sessions', num(48120 + Math.round(Math.sin(t * 0.5) * 90)), delta(6.2))}
        ${kpi('Conversions', num(1155), delta(3.4))}
        ${kpi('Conv. rate', `${(2.4 + Math.sin(t * 0.4) * 0.05).toFixed(2)}%`, delta(-0.1, 'pt'))}
        ${kpi('Revenue', '$61.3K', delta(5.8))}
      </div>
      <div class="dash__main">
        ${card('Sessions by channel (K)', legend([{ name: 'Organic', color: LIGHT.s1 }, { name: 'Paid', color: LIGHT.s2 }]) + lineChart(346, 238, [{ vals: organic, color: LIGHT.s1 }, { vals: paid, color: LIGHT.s2 }], { min: 0, max: 2.4, fmt: (v) => v.toFixed(1), x: DAYS }))}
        ${card('Checkout funnel', hbars(steps.map(([n, v], i) => [n, v, i ? `${((v / steps[i - 1][1]) * 100).toFixed(0)}%` : num(v)]), LIGHT.ordinal, steps[0][1]))}
      </div>
    </div>`;
  },

  transit: (t) => {
    const lines = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
    const hours = 19;
    const load = (r: number, c: number) => {
      const hr = c / (hours - 1);
      const peak = Math.exp(-(((hr - 0.17) / 0.09) ** 2)) + 0.9 * Math.exp(-(((hr - 0.68) / 0.1) ** 2));
      return Math.min(1, peak * (0.55 + 0.45 * wave(r * 3 + c, 2, t * 0.4)) + 0.08);
    };
    const today = series(19, 6, t * 0.4, 8, 30).map((v, i) => v * (0.6 + load(2, i)));
    const typical = series(19, 6, 0, 8, 28).map((v, i) => v * (0.6 + load(2, i) * 0.9));
    return `<div class="dash dash--dark">
      ${top('TF', 'Transit Flow', 'Ridership · Open data demo', 'Today')}
      <div class="dash__kpis">
        ${kpi('Riders today', num(412380 + Math.round(t * 37) % 900), delta(2.7))}
        ${kpi('Peak hour', '08:00', '<span class="dash__delta">31.2K riders</span>')}
        ${kpi('On-time', '87%', delta(-1.4, 'pt'))}
        ${kpi('Busiest line', 'L3', '<span class="dash__delta">18% of trips</span>')}
      </div>
      <div class="dash__main">
        ${card('Load by line and hour', heatmap(346, 268, lines, hours, load, blueOnDark, ['05', '09', '13', '17', '21', '23']))}
        ${card('Line L3 riders (K)', legend([{ name: 'Today', color: DARK.s1 }, { name: 'Typical', color: DARK.muted, dash: true }]) + lineChart(204, 238, [{ vals: typical, color: DARK.muted, dash: true }, { vals: today, color: DARK.s1 }], { min: 0, fmt: (v) => v.toFixed(0), x: ['05', '14', '23'] }))}
      </div>
    </div>`;
  },

  energy: (t) => {
    const hours = 25;
    const base = Array.from({ length: hours }, (_, i) => 12 + Math.sin(i / 4 + t * 0.1) * 0.8);
    const solar = Array.from({ length: hours }, (_, i) => Math.max(0, Math.sin(((i - 6) / 13) * Math.PI)) * 11 * (0.9 + 0.1 * wave(i, 3, t)));
    const wind = series(hours, 9, t * 0.3, 3, 9);
    const nowI = 14;
    const parts = [
      { v: base[nowI], color: DARK.s1, name: 'Base' },
      { v: solar[nowI], color: DARK.s2, name: 'Solar' },
      { v: wind[nowI], color: DARK.s3, name: 'Wind' },
    ];
    const total = parts.reduce((s, p) => s + p.v, 0);
    return `<div class="dash dash--dark">
      ${top('GL', 'Grid Load', 'Demand vs. generation mix', 'Last 24 h')}
      <div class="dash__kpis">
        ${kpi('Demand', `${(31.4 + Math.sin(t * 0.5) * 0.4).toFixed(1)} GW`, delta(1.8))}
        ${kpi('Renewables', `${Math.round(((parts[1].v + parts[2].v) / total) * 100)}%`, delta(4.0, 'pt'))}
        ${kpi('Price', `€${(88 + Math.sin(t) * 2).toFixed(0)}/MWh`, delta(-3.1, '%', true))}
        ${kpi('Carbon', '212 g/kWh', delta(-6.5, '%', true))}
      </div>
      <div class="dash__main">
        ${card('Generation by source (GW)', legend(parts) + stackedArea(346, 238, parts.map((p, i) => ({ vals: [base, solar, wind][i], color: p.color })), ['00:00', '06:00', '12:00', '18:00', '24:00']))}
        ${card('Mix right now', `<div class="dash__center">${donut(150, parts, `${total.toFixed(1)}`, 'GW')}</div>` + hbars(parts.map((p) => [p.name, p.v, `${Math.round((p.v / total) * 100)}%`]), parts.map((p) => p.color), total))}
      </div>
    </div>`;
  },
};

export const renderDash = (kind: Preview, t = 0) => RENDER[kind](t);

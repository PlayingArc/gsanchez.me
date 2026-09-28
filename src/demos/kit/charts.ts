// Hand-drawn SVG charts for the demo dashboards. Each returns an SVG string sized to the
// container width it is given. Clickable marks carry `data-act` (read by the dashboard) and
// `data-tip` (read by the tooltip), and are focusable so the keyboard can do what the mouse does.

import { esc } from './format';

export type Mark = {
  /** What clicking the mark does, e.g. `store:roma`. Omit for inert marks. */
  act?: string;
  /** Tooltip HTML (already escaped). */
  tip?: string;
  /** Accessible name. */
  label?: string;
};

const markAttrs = (m: Mark) =>
  (m.act ? ` data-act="${esc(m.act)}" tabindex="0" role="button"` : '') +
  (m.tip ? ` data-tip="${esc(m.tip)}"` : '') +
  (m.label ? ` aria-label="${esc(m.label)}"` : '');

/** Round axis maximum and evenly spaced ticks. */
export function niceScale(max: number, count = 4) {
  if (max <= 0) return { max: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { max: top, ticks };
}

// ------------------------------------------------------------------ columns
export type ColumnDatum = Mark & {
  label: string;
  /** Short axis label; empty to skip. */
  axis: string;
  stack: { value: number; cls: string }[];
  target?: number;
  inRange: boolean;
};

/** Stacked columns with an optional target step line. */
export function columns(width: number, height: number, data: ColumnDatum[], fmtAxis: (v: number) => string) {
  const L = 52, R = 8, T = 10, B = 26;
  const w = width - L - R;
  const h = height - T - B;
  const max = Math.max(...data.map((d) => Math.max(d.stack.reduce((a, s) => a + s.value, 0), d.target ?? 0)));
  const { max: top, ticks } = niceScale(max);
  const Y = (v: number) => T + h - (v / top) * h;
  const slot = w / data.length;
  const bw = Math.max(3, Math.min(28, slot * 0.64));

  let g = '';
  for (const t of ticks) g += `<line class="dz-gridline" x1="${L}" x2="${width - R}" y1="${Y(t)}" y2="${Y(t)}"/><text class="dz-axis" x="${L - 8}" y="${Y(t) + 4}" text-anchor="end">${esc(fmtAxis(t))}</text>`;

  let bars = '';
  let target = '';
  data.forEach((d, i) => {
    const cx = L + slot * i + slot / 2;
    let y = T + h;
    let seg = '';
    for (const s of d.stack) {
      const sh = (s.value / top) * h;
      y -= sh;
      seg += `<rect class="${s.cls}" x="${cx - bw / 2}" y="${y}" width="${bw}" height="${Math.max(0, sh)}"/>`;
    }
    // Full-height hit area so thin months are still easy to point at.
    bars += `<g class="dz-col${d.inRange ? '' : ' is-out'}"${markAttrs(d)}><rect class="dz-hit" x="${L + slot * i}" y="${T}" width="${slot}" height="${h}"/>${seg}</g>`;
    if (d.target != null) {
      const ty = Y(d.target);
      target += `${i ? 'L' : 'M'}${(cx - slot / 2).toFixed(1)},${ty.toFixed(1)}H${(cx + slot / 2).toFixed(1)}`;
    }
    if (d.axis) bars += `<text class="dz-axis" x="${cx}" y="${height - 8}" text-anchor="middle">${esc(d.axis)}</text>`;
  });

  return `<svg class="dz-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${g}${bars}${target ? `<path class="dz-target" d="${target}"/>` : ''}</svg>`;
}

// ------------------------------------------------------------------ horizontal bars
export type BarRow = Mark & {
  label: string;
  /** Rows sharing a group are drawn under one heading. */
  group?: { id: string; label: string } & Mark;
  segs: ({ value: number; cls: string } & Mark)[];
  /** Tick drawn across the bar, e.g. the target. */
  marker?: number;
  note?: string;
  selected?: boolean;
  dimmed?: boolean;
};

/** Horizontal (optionally stacked) bars with labels on the left and a note on the right. */
export function hbars(width: number, rows: BarRow[], opts: { labelW?: number; noteW?: number; rowH?: number } = {}) {
  const labelW = opts.labelW ?? Math.min(150, width * 0.32);
  const noteW = opts.noteW ?? 56;
  const rowH = opts.rowH ?? 26;
  const groupH = 26;
  const x0 = labelW + 8;
  const w = Math.max(40, width - x0 - noteW - 8);
  const max = Math.max(...rows.map((r) => Math.max(r.segs.reduce((a, s) => a + s.value, 0), r.marker ?? 0)), 1);

  let y = 4;
  let out = '';
  let lastGroup = '';
  for (const r of rows) {
    if (r.group && r.group.id !== lastGroup) {
      lastGroup = r.group.id;
      y += lastGroup && y > 4 ? 6 : 0;
      out += `<text class="dz-group${r.group.act ? ' is-act' : ''}" x="0" y="${y + 16}"${markAttrs(r.group)}>${esc(r.group.label)}</text>`;
      y += groupH;
    }
    const cls = `dz-row${r.selected ? ' is-selected' : ''}${r.dimmed ? ' is-dimmed' : ''}`;
    const by = y + 5;
    const bh = rowH - 10;
    let segs = '';
    let x = x0;
    for (const s of r.segs) {
      const sw = (s.value / max) * w;
      segs += `<rect class="${s.cls}" x="${x}" y="${by}" width="${Math.max(0, sw)}" height="${bh}"${markAttrs(s)}/>`;
      x += sw;
    }
    const marker = r.marker != null ? `<line class="dz-marker" x1="${x0 + (r.marker / max) * w}" x2="${x0 + (r.marker / max) * w}" y1="${by - 3}" y2="${by + bh + 3}"/>` : '';
    out += `<g class="${cls}">`
      + `<rect class="dz-hit" x="0" y="${y}" width="${x0 - 4}" height="${rowH}"${markAttrs(r)}/>`
      + `<text class="dz-label" x="${r.group ? 12 : 0}" y="${y + rowH / 2 + 5}">${esc(r.label)}</text>`
      + segs + marker
      + (r.note ? `<text class="dz-note" x="${width}" y="${y + rowH / 2 + 5}" text-anchor="end">${esc(r.note)}</text>` : '')
      + `</g>`;
    y += rowH;
  }
  return `<svg class="dz-svg" viewBox="0 0 ${width} ${y + 4}" width="${width}" height="${y + 4}">${out}</svg>`;
}

// ------------------------------------------------------------------ scatter
export type Point = Mark & {
  x: number;
  y: number;
  r: number;
  cls?: string;
  /** Printed next to the dot. */
  name?: string;
  selected?: boolean;
  dimmed?: boolean;
};

export function scatter(
  width: number,
  height: number,
  points: Point[],
  opts: {
    x: { max: number; ticks: number[]; fmt: (v: number) => string; title: string };
    y: { max: number; ticks: number[]; fmt: (v: number) => string; title: string };
    /** Shaded zone from (x0, y0) to the top-left corner. */
    zone?: { x: number; y: number; label: string };
  },
) {
  const L = 44, R = 12, T = 26, B = 40;
  const w = width - L - R;
  const h = height - T - B;
  const X = (v: number) => L + (Math.min(v, opts.x.max) / opts.x.max) * w;
  const Y = (v: number) => T + h - (Math.min(v, opts.y.max) / opts.y.max) * h;

  let g = '';
  if (opts.zone) {
    g += `<rect class="dz-zone" x="${L}" y="${T}" width="${X(opts.zone.x) - L}" height="${Y(opts.zone.y) - T}"/>`;
    g += `<text class="dz-zone-label" x="${L + 8}" y="${T + 18}">${esc(opts.zone.label)}</text>`;
  }
  for (const t of opts.y.ticks) g += `<line class="dz-gridline" x1="${L}" x2="${width - R}" y1="${Y(t)}" y2="${Y(t)}"/><text class="dz-axis" x="${L - 8}" y="${Y(t) + 4}" text-anchor="end">${esc(opts.y.fmt(t))}</text>`;
  for (const t of opts.x.ticks) g += `<text class="dz-axis" x="${X(t)}" y="${T + h + 18}" text-anchor="middle">${esc(opts.x.fmt(t))}</text>`;
  g += `<line class="dz-baseline" x1="${L}" x2="${width - R}" y1="${T + h}" y2="${T + h}"/>`;
  g += `<text class="dz-axis-title" x="${L + w}" y="${height - 4}" text-anchor="end">${esc(opts.x.title)}</text>`;
  g += `<text class="dz-axis-title" x="${L - 8}" y="${T - 12}" text-anchor="start">${esc(opts.y.title)}</text>`;

  // Biggest first so small dots stay on top and clickable.
  const sorted = [...points].sort((a, b) => b.r - a.r);
  let dots = '';
  let names = '';
  for (const p of sorted) {
    const cx = X(p.x), cy = Y(p.y);
    dots += `<circle class="dz-dot ${p.cls ?? ''}${p.selected ? ' is-selected' : ''}${p.dimmed ? ' is-dimmed' : ''}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${p.r.toFixed(1)}"${markAttrs(p)}/>`;
    if (p.name) {
      const right = cx < L + w * 0.6;
      names += `<text class="dz-dot-name" x="${cx + (right ? p.r + 5 : -p.r - 5)}" y="${cy + 4}" text-anchor="${right ? 'start' : 'end'}">${esc(p.name)}</text>`;
    }
  }
  return `<svg class="dz-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${g}${dots}${names}</svg>`;
}

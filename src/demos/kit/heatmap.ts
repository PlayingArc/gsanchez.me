// Weekday x hour heatmap for the demo dashboards. Cells carry `data-act` / `data-tip` like every
// other mark (see charts.ts); closed cells are drawn hatched and are inert.

import { esc } from './format';
import type { Mark } from './charts';

export type HeatCell = Mark & {
  /** 0..1, already scaled to the colour ramp. */
  level: number;
  /** Printed in the cell when there is room. */
  text?: string;
  open: boolean;
  selected?: boolean;
  dimmed?: boolean;
};

/**
 * `cells` run row by row: rows.length x cols.length. The ramp has five steps (`dz-h0`..`dz-h4`)
 * so it stays legible in both themes and in print.
 */
export function heatmap(width: number, rows: string[], cols: string[], cells: HeatCell[], opts: { rowH?: number } = {}) {
  const L = 44, T = 22, gap = 3;
  const cw = Math.max(18, (width - L) / cols.length - gap);
  const ch = opts.rowH ?? Math.max(24, Math.min(40, cw * 0.72));
  const showText = cw >= 38;
  let out = '';
  cols.forEach((c, x) => {
    // Label every column when there is room, else every other one.
    if (cw >= 30 || x % 2 === 0) out += `<text class="dz-axis" x="${L + x * (cw + gap) + cw / 2}" y="${T - 8}" text-anchor="middle">${esc(c)}</text>`;
  });
  rows.forEach((r, y) => {
    const cy = T + y * (ch + gap);
    out += `<text class="dz-axis" x="${L - 8}" y="${cy + ch / 2 + 4}" text-anchor="end">${esc(r)}</text>`;
    cols.forEach((_c, x) => {
      const cell = cells[y * cols.length + x];
      const cx = L + x * (cw + gap);
      if (!cell.open) {
        out += `<rect class="dz-heat-closed" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="2"/>`;
        return;
      }
      const step = Math.max(0, Math.min(4, Math.floor(cell.level * 5 - 1e-9)));
      const attrs =
        (cell.act ? ` data-act="${esc(cell.act)}" tabindex="0" role="button"` : '') +
        (cell.tip ? ` data-tip="${esc(cell.tip)}"` : '') +
        (cell.label ? ` aria-label="${esc(cell.label)}"` : '');
      out += `<g class="dz-heat${cell.selected ? ' is-selected' : ''}${cell.dimmed ? ' is-dimmed' : ''}"${attrs}>`
        + `<rect class="dz-h${step}" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="2"/>`
        + (showText && cell.text ? `<text class="dz-heat-text${step >= 3 ? ' is-dark' : ''}" x="${cx + cw / 2}" y="${cy + ch / 2 + 4}" text-anchor="middle">${esc(cell.text)}</text>` : '')
        + `</g>`;
    });
  });
  const height = T + rows.length * (ch + gap);
  return `<svg class="dz-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${out}</svg>`;
}

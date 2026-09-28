// Sortable detail table. Header buttons carry `data-sort`; rows carry `data-act` so a row click
// cross-filters like any other mark.

import { esc } from './format';

export type Column<Row> = {
  key: string;
  label: string;
  /** Sort value; null sorts last. */
  value: (r: Row) => number | string | null;
  /** Cell HTML (already escaped). */
  cell: (r: Row) => string;
  numeric?: boolean;
};

export type Sort = { key: string; dir: 'asc' | 'desc' };

export function sortRows<Row>(rows: Row[], cols: Column<Row>[], sort: Sort, locale: string) {
  const col = cols.find((c) => c.key === sort.key) ?? cols[0];
  const sign = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = col.value(a), vb = col.value(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'string' || typeof vb === 'string') return sign * String(va).localeCompare(String(vb), locale);
    return sign * (va - vb);
  });
}

export function table<Row>(
  rows: Row[],
  cols: Column<Row>[],
  sort: Sort,
  opts: { act: (r: Row) => string | undefined; selected: (r: Row) => boolean; label: (r: Row) => string; caption: string; locale: string; empty: string },
) {
  const sorted = sortRows(rows, cols, sort, opts.locale);
  const head = cols
    .map((c) => {
      const on = c.key === sort.key;
      const aria = on ? ` aria-sort="${sort.dir === 'asc' ? 'ascending' : 'descending'}"` : '';
      const arrow = on ? (sort.dir === 'asc' ? '↑' : '↓') : '';
      return `<th scope="col"${aria} class="${c.numeric ? 'is-num' : ''}"><button type="button" data-sort="${c.key}">${esc(c.label)}<span class="dz-sort" aria-hidden="true">${arrow}</span></button></th>`;
    })
    .join('');
  const body = sorted.length
    ? sorted
        .map((r) => {
          const act = opts.act(r);
          const attrs = act ? ` data-act="${esc(act)}" tabindex="0" aria-label="${esc(opts.label(r))}"` : '';
          return `<tr class="${opts.selected(r) ? 'is-selected' : ''}"${attrs}>${cols.map((c, i) => (i === 0 ? `<th scope="row">${c.cell(r)}</th>` : `<td class="${c.numeric ? 'is-num' : ''}">${c.cell(r)}</td>`)).join('')}</tr>`;
        })
        .join('')
    : `<tr><td colspan="${cols.length}" class="dz-empty">${esc(opts.empty)}</td></tr>`;
  return `<table class="dz-table"><caption class="sr-only">${esc(opts.caption)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

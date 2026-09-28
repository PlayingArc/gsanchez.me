// Casa Zenzontle: filter state and every aggregate the dashboard draws.
// Data is dense arrays (see scripts/gen-retail-data.mjs); indices are computed, never searched.

import raw from './data.json';

type Named = { id: string; en: string; es: string };
export type Store = { id: string; name: string; region: string };
export type Product = Named & { cat: string };
export type Channel = 'store' | 'online';

export const data = raw as unknown as {
  months: string[];
  regions: Named[];
  stores: Store[];
  channels: Channel[];
  categories: Named[];
  products: Product[];
  sales: { units: number[]; net: number[]; cost: number[]; orders: number[] };
  target: number[];
  stock: { open: number[]; onHand: number[]; received: number[] };
};

const M = data.months.length;
const S = data.stores.length;
const C = data.channels.length;
const P = data.products.length;
const K = data.categories.length;
const catIndex = data.products.map((p) => data.categories.findIndex((c) => c.id === p.cat));
const WEEKS_PER_MONTH = 30.44 / 7;

// ------------------------------------------------------------------ state
export type State = {
  from: number;
  to: number;
  region: string | null;
  store: string | null;
  channel: Channel | null;
  category: string | null;
  product: string | null;
  rows: 'product' | 'store';
  sort: { key: string; dir: 'asc' | 'desc' };
};

export const DEFAULT_SORT = { key: 'net', dir: 'desc' } as const;

export function defaultState(): State {
  return { from: M - 12, to: M - 1, region: null, store: null, channel: null, category: null, product: null, rows: 'product', sort: { ...DEFAULT_SORT } };
}

/** Reads state from the query string, ignoring anything that does not match the data. */
export function stateFromParams(q: URLSearchParams): State {
  const s = defaultState();
  const mi = (v: string | null) => (v ? data.months.indexOf(v) : -1);
  const from = mi(q.get('from'));
  const to = mi(q.get('to'));
  if (from >= 0) s.from = from;
  if (to >= 0) s.to = to;
  if (s.from > s.to) [s.from, s.to] = [s.to, s.from];
  const store = data.stores.find((x) => x.id === q.get('store'));
  if (store) s.store = store.id;
  else if (data.regions.some((r) => r.id === q.get('region'))) s.region = q.get('region');
  const ch = q.get('channel');
  if (ch === 'store' || ch === 'online') s.channel = ch;
  const product = data.products.find((p) => p.id === q.get('product'));
  if (product) {
    s.product = product.id;
    s.category = product.cat;
  } else if (data.categories.some((c) => c.id === q.get('category'))) s.category = q.get('category');
  if (q.get('rows') === 'store') s.rows = 'store';
  const [key, dir] = (q.get('sort') ?? '').split('-');
  if (key && (dir === 'asc' || dir === 'desc')) s.sort = { key, dir };
  return s;
}

export function stateToParams(s: State) {
  const d = defaultState();
  const sort = s.sort.key === DEFAULT_SORT.key && s.sort.dir === DEFAULT_SORT.dir ? null : `${s.sort.key}-${s.sort.dir}`;
  return {
    from: s.from === d.from && s.to === d.to ? null : data.months[s.from],
    to: s.from === d.from && s.to === d.to ? null : data.months[s.to],
    region: s.store ? null : s.region,
    store: s.store,
    channel: s.channel,
    category: s.product ? null : s.category,
    product: s.product,
    rows: s.rows === 'store' ? 'store' : null,
    sort,
  };
}

// ------------------------------------------------------------------ filters
type Filter = { stores: boolean[]; channels: boolean[]; products: boolean[] };

/** Which stores / channels / products pass. `ignore` drops one dimension, for charts that show all of it. */
function filterOf(s: State, ignore?: 'store' | 'channel' | 'category'): Filter {
  const stores = data.stores.map((x) => ignore === 'store' || (!s.store && !s.region) || (s.store ? x.id === s.store : x.region === s.region));
  const channels = data.channels.map((c) => ignore === 'channel' || !s.channel || c === s.channel);
  const products = data.products.map((p) => ignore === 'category' || (s.product ? p.id === s.product : !s.category || p.cat === s.category));
  return { stores, channels, products };
}

export type Totals = { net: number; cost: number; units: number; orders: number; target: number };
const zero = (): Totals => ({ net: 0, cost: 0, units: 0, orders: 0, target: 0 });

/**
 * Walks the sales cube once for months [from, to] and hands each passing cell to `visit`.
 * Target is recorded per category, so it is added once per (month, store, channel, category) that passes.
 */
function walk(f: Filter, from: number, to: number, visit: (m: number, si: number, ci: number, pi: number, i: number) => void) {
  for (let m = from; m <= to; m++)
    for (let si = 0; si < S; si++) {
      if (!f.stores[si]) continue;
      for (let ci = 0; ci < C; ci++) {
        if (!f.channels[ci]) continue;
        const base = ((m * S + si) * C + ci) * P;
        for (let pi = 0; pi < P; pi++) if (f.products[pi]) visit(m, si, ci, pi, base + pi);
      }
    }
}

function add(t: Totals, i: number) {
  t.net += data.sales.net[i];
  t.cost += data.sales.cost[i];
  t.units += data.sales.units[i];
  t.orders += data.sales.orders[i];
}

/** Target for the filter. A product filter takes the product's share of its category's target. */
function targetFor(f: Filter, s: State, from: number, to: number) {
  let t = 0;
  const cats = data.categories.map((_c, ki) => data.products.some((_p, pi) => f.products[pi] && catIndex[pi] === ki));
  for (let m = from; m <= to; m++)
    for (let si = 0; si < S; si++) {
      if (!f.stores[si]) continue;
      for (let ci = 0; ci < C; ci++) {
        if (!f.channels[ci]) continue;
        for (let ki = 0; ki < K; ki++) if (cats[ki]) t += data.target[((m * S + si) * C + ci) * K + ki];
      }
    }
  if (s.product) {
    // Scale by the product's share of its category's sales over the same cells.
    const all = { ...f, products: data.products.map((p) => p.cat === s.category) };
    let part = 0, whole = 0;
    walk(f, from, to, (_m, _s, _c, _p, i) => (part += data.sales.net[i]));
    walk(all, from, to, (_m, _s, _c, _p, i) => (whole += data.sales.net[i]));
    t *= whole ? part / whole : 0;
  }
  return t;
}

export const derived = (t: Totals) => ({
  margin: t.net ? (t.net - t.cost) / t.net : 0,
  aov: t.orders ? t.net / t.orders : 0,
  vsTarget: t.target ? t.net / t.target : 0,
});

// ------------------------------------------------------------------ views
export function kpis(s: State) {
  const f = filterOf(s);
  const n = s.to - s.from + 1;
  const cur = zero();
  walk(f, s.from, s.to, (_m, _s, _c, _p, i) => add(cur, i));
  cur.target = targetFor(f, s, s.from, s.to);
  const pf = s.from - n;
  let prev: Totals | null = null;
  if (pf >= 0) {
    prev = zero();
    const p = prev;
    walk(f, pf, s.from - 1, (_m, _s, _c, _p, i) => add(p, i));
  }
  return { cur, prev, prevRange: pf >= 0 ? ([pf, s.from - 1] as const) : null };
}

/** All 24 months (the date filter only highlights), split by channel, with target. */
export function trend(s: State) {
  const f = filterOf(s);
  const rows = data.months.map(() => ({ store: 0, online: 0, target: 0 }));
  walk(f, 0, M - 1, (m, _s, ci, _p, i) => (rows[m][data.channels[ci]] += data.sales.net[i]));
  rows.forEach((r, m) => (r.target = targetFor(f, s, m, m)));
  return rows;
}

/** Every store (the store filter only highlights), split by channel, with target and margin. */
export function byStore(s: State) {
  const f = filterOf(s, 'store');
  const rows = data.stores.map((st) => ({ store: st, byChannel: { store: 0, online: 0 } as Record<Channel, number>, t: zero() }));
  walk(f, s.from, s.to, (_m, si, ci, _p, i) => {
    rows[si].byChannel[data.channels[ci]] += data.sales.net[i];
    add(rows[si].t, i);
  });
  rows.forEach((r) => (r.t.target = targetFor({ ...f, stores: data.stores.map((x) => x.id === r.store.id) }, s, s.from, s.to)));
  return rows;
}

/** Category totals, or the products of the selected category. */
export function drill(s: State) {
  if (!s.category) {
    const f = filterOf(s, 'category');
    const rows = data.categories.map((c) => ({ id: c.id, cat: c, t: zero() }));
    walk(f, s.from, s.to, (_m, _s, _c, pi, i) => add(rows[catIndex[pi]].t, i));
    return { level: 'category' as const, rows };
  }
  const f = filterOf({ ...s, product: null });
  const rows = data.products.filter((p) => p.cat === s.category).map((p) => ({ id: p.id, product: p, t: zero() }));
  const at = new Map(rows.map((r, k) => [r.id, k]));
  walk(f, s.from, s.to, (_m, _s, _c, pi, i) => add(rows[at.get(data.products[pi].id)!].t, i));
  return { level: 'product' as const, rows };
}

export type StockRow = { product: Product; sold: number; net: number; available: number; end: number; sellThrough: number; weeksCover: number };

/**
 * Sell-through and weeks of cover per product for the stores in the filter.
 * Stock is shared by both channels, so the channel filter does not apply here.
 * Sell-through = units sold / (opening stock + received). Weeks of cover = closing stock / average weekly units sold.
 */
export function stock(s: State, opts: { ignoreProduct?: boolean; perStore?: boolean } = {}) {
  const f = filterOf({ ...s, channel: null, product: opts.ignoreProduct ? null : s.product });
  const weeks = (s.to - s.from + 1) * WEEKS_PER_MONTH;
  const make = () => ({ sold: 0, net: 0, open: 0, received: 0, end: 0 });
  const keyCount = opts.perStore ? S : P;
  const acc = Array.from({ length: keyCount }, make);
  for (let si = 0; si < S; si++) {
    if (!f.stores[si]) continue;
    for (let pi = 0; pi < P; pi++) {
      if (!f.products[pi]) continue;
      const a = acc[opts.perStore ? si : pi];
      a.open += s.from === 0 ? data.stock.open[si * P + pi] : data.stock.onHand[((s.from - 1) * S + si) * P + pi];
      a.end += data.stock.onHand[(s.to * S + si) * P + pi];
      for (let m = s.from; m <= s.to; m++) {
        a.received += data.stock.received[(m * S + si) * P + pi];
        for (let ci = 0; ci < C; ci++) {
          const i = ((m * S + si) * C + ci) * P + pi;
          a.sold += data.sales.units[i];
          a.net += data.sales.net[i];
        }
      }
    }
  }
  const metric = (a: ReturnType<typeof make>) => ({
    sold: a.sold,
    net: a.net,
    available: a.open + a.received,
    end: a.end,
    sellThrough: a.open + a.received ? a.sold / (a.open + a.received) : 0,
    weeksCover: a.sold ? a.end / (a.sold / weeks) : Infinity,
  });
  return acc.map(metric);
}

export function productRows(s: State) {
  const products = stock(s, { ignoreProduct: true });
  const f = filterOf({ ...s, product: null });
  const n = s.to - s.from + 1;
  const cur = data.products.map(zero);
  const prev = data.products.map(zero);
  const pf = s.from - n;
  walk(f, s.from, s.to, (_m, _s, _c, pi, i) => add(cur[pi], i));
  if (pf >= 0) walk(f, pf, s.from - 1, (_m, _s, _c, pi, i) => add(prev[pi], i));
  return data.products
    .map((p, pi) => ({ product: p, t: cur[pi], prevNet: pf >= 0 ? prev[pi].net : null, stock: products[pi] }))
    .filter((r, pi) => f.products[pi] && (r.t.units > 0 || r.stock.end > 0));
}

export function storeRows(s: State) {
  const stocks = stock(s, { perStore: true });
  const f = filterOf(s);
  const n = s.to - s.from + 1;
  const cur = data.stores.map(zero);
  const prev = data.stores.map(zero);
  const pf = s.from - n;
  walk(f, s.from, s.to, (_m, si, _c, _p, i) => add(cur[si], i));
  if (pf >= 0) walk(f, pf, s.from - 1, (_m, si, _c, _p, i) => add(prev[si], i));
  return data.stores
    .map((st, si) => ({ store: st, t: cur[si], prevNet: pf >= 0 ? prev[si].net : null, stock: stocks[si] }))
    .filter((_r, si) => f.stores[si]);
}

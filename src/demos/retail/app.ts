// Casa Zenzontle demo dashboard: renders every view from one state object and keeps that state
// in the URL. Clicking a mark (bar, dot, row) cross-filters every view.

import { esc, makeFormat, type Locale } from '../kit/format';
import { columns, hbars, niceScale, scatter, type BarRow, type ColumnDatum, type Point } from '../kit/charts';
import { table, type Column } from '../kit/table';
import { mountTooltip } from '../kit/tooltip';
import { readParams, syncLangLinks, writeParams } from '../kit/url';
import { strings } from './i18n';
import {
  byStore, data, defaultState, derived, drill, kpis, productRows, stateFromParams, stateToParams, stock, storeRows, trend,
  type Channel, type State,
} from './model';

const SLOW_COVER = 12; // weeks
const SLOW_SELL_THROUGH = 0.65;

export function mountRetail(root: HTMLElement) {
  const locale = (root.dataset.locale as Locale) ?? 'en';
  const t = strings[locale];
  const fmt = makeFormat(locale);
  const name = (x: { en: string; es: string }) => x[locale];
  const region = (id: string) => name(data.regions.find((r) => r.id === id)!);
  const catName = (id: string) => name(data.categories.find((c) => c.id === id)!);
  const tip = (title: string, rows: [string, string][]) =>
    `<b>${esc(title)}</b>${rows.map(([k, v]) => `<span><i>${esc(k)}</i>${esc(v)}</span>`).join('')}`;

  let state: State = stateFromParams(readParams());
  const tooltip = mountTooltip(root);

  const $ = <E extends Element = HTMLElement>(sel: string) => root.querySelector<E & Element>(sel)!;
  const view = (name: string) => $(`[data-view="${name}"]`);
  const widthOf = (el: HTMLElement) => Math.max(260, Math.floor(el.clientWidth));

  // ------------------------------------------------------------------ filters
  const fStore = $<HTMLSelectElement>('[data-filter="store"]');
  const fChannel = $<HTMLSelectElement>('[data-filter="channel"]');
  const fCategory = $<HTMLSelectElement>('[data-filter="category"]');
  const fFrom = $<HTMLSelectElement>('[data-filter="from"]');
  const fTo = $<HTMLSelectElement>('[data-filter="to"]');
  const selects = [fStore, fChannel, fCategory, fFrom, fTo];

  // Size each select to its current text so the filter reads as a sentence.
  const measure = document.createElement('span');
  measure.className = 'dz-measure';
  measure.setAttribute('aria-hidden', 'true');
  root.append(measure);
  const fit = (sel: HTMLSelectElement) => {
    measure.textContent = sel.selectedOptions[0]?.textContent ?? '';
    sel.style.width = `${measure.getBoundingClientRect().width + 26}px`;
  };

  function syncFilters() {
    fStore.value = state.store ? `store:${state.store}` : state.region ? `region:${state.region}` : '';
    fChannel.value = state.channel ?? '';
    fCategory.value = state.category ?? '';
    fFrom.value = String(state.from);
    fTo.value = String(state.to);
    selects.forEach((s) => s.classList.toggle('is-set', s.value !== '' && s !== fFrom && s !== fTo));
    const d = defaultState();
    fFrom.classList.toggle('is-set', state.from !== d.from || state.to !== d.to);
    fTo.classList.toggle('is-set', state.from !== d.from || state.to !== d.to);
    selects.forEach(fit);

    const chip = view('product-chip');
    if (state.product) {
      const p = data.products.find((x) => x.id === state.product)!;
      chip.innerHTML = `${esc(t.onlyProduct)} <button type="button" class="dz-chip" data-act="clear-product" aria-label="${esc(t.clearProduct(name(p)))}">${esc(name(p))}<span aria-hidden="true">×</span></button>`;
      chip.hidden = false;
    } else {
      chip.hidden = true;
      chip.innerHTML = '';
    }
    root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => {
      const [a, z] = presetRange(b.dataset.preset!);
      b.setAttribute('aria-pressed', String(state.from === a && state.to === z));
    });
    root.querySelectorAll<HTMLButtonElement>('[data-rows]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rows === state.rows)));
    const isDefault = JSON.stringify({ ...stateToParams(state), rows: null, sort: null }) === JSON.stringify({ ...stateToParams(defaultState()), rows: null, sort: null });
    $<HTMLButtonElement>('[data-reset]').disabled = isDefault;
  }

  const last = data.months.length - 1;
  const presetRange = (p: string): [number, number] =>
    p === 'last3' ? [last - 2, last] : p === 'last6' ? [last - 5, last] : p === 'last12' ? [last - 11, last] : [0, last];

  fStore.addEventListener('change', () => {
    const [kind, id] = fStore.value.split(':');
    update({ store: kind === 'store' ? id : null, region: kind === 'region' ? id : null });
  });
  fChannel.addEventListener('change', () => update({ channel: (fChannel.value || null) as Channel | null }));
  fCategory.addEventListener('change', () => update({ category: fCategory.value || null, product: null }));
  fFrom.addEventListener('change', () => {
    const from = Number(fFrom.value);
    update({ from, to: Math.max(from, state.to) });
  });
  fTo.addEventListener('change', () => {
    const to = Number(fTo.value);
    update({ to, from: Math.min(to, state.from) });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) =>
    b.addEventListener('click', () => {
      const [from, to] = presetRange(b.dataset.preset!);
      update({ from, to });
    }),
  );
  $('[data-reset]').addEventListener('click', () => update({ ...defaultState(), rows: state.rows, sort: state.sort }));
  root.querySelectorAll<HTMLButtonElement>('[data-rows]').forEach((b) =>
    b.addEventListener('click', () => update({ rows: b.dataset.rows as State['rows'], sort: { key: 'net', dir: 'desc' } })),
  );

  // ------------------------------------------------------------------ cross-filtering
  let anchor = state.from;
  function act(action: string, e: Event) {
    const [kind, a, b] = action.split(':');
    const toggle = <T>(cur: T | null, next: T) => (cur === next ? null : next);
    switch (kind) {
      case 'month': {
        const m = Number(a);
        if ((e as MouseEvent).shiftKey) update({ from: Math.min(anchor, m), to: Math.max(anchor, m) });
        else if (state.from === m && state.to === m) update({ from: last - 11, to: last });
        else {
          anchor = m;
          update({ from: m, to: m });
        }
        return;
      }
      case 'region':
        return update({ region: toggle(state.region, a), store: null });
      case 'store':
        return update({ store: toggle(state.store, a), region: null });
      case 'storech': {
        const same = state.store === a && state.channel === b;
        return update({ store: same ? null : a, region: null, channel: same ? null : (b as Channel) });
      }
      case 'channel':
        return update({ channel: toggle(state.channel, a as Channel) });
      case 'category':
        return update({ category: a, product: null });
      case 'crumb':
        return update({ category: null, product: null });
      case 'product': {
        const p = data.products.find((x) => x.id === a)!;
        return update({ product: toggle(state.product, a), category: p.cat });
      }
      case 'clear-product':
        return update({ product: null });
    }
  }

  root.addEventListener('click', (e) => {
    const el = (e.target as Element).closest<HTMLElement | SVGElement>('[data-act]');
    if (el && root.contains(el)) {
      e.preventDefault();
      act(el.getAttribute('data-act')!, e);
      return;
    }
    const sort = (e.target as Element).closest<HTMLButtonElement>('[data-sort]');
    if (sort) {
      const key = sort.dataset.sort!;
      const dir = state.sort.key === key ? (state.sort.dir === 'desc' ? 'asc' : 'desc') : key === 'name' || key === 'group' ? 'asc' : 'desc';
      update({ sort: { key, dir } });
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = (e.target as Element).closest('[data-act]');
    if (!el || el.tagName === 'BUTTON') return;
    e.preventDefault();
    act(el.getAttribute('data-act')!, e);
  });

  // ------------------------------------------------------------------ views
  function renderKpis() {
    const { cur, prev, prevRange } = kpis(state);
    const d = derived(cur);
    const p = prev ? derived(prev) : null;
    const pct = (a: number, b: number | undefined) => (b ? a / b - 1 : null);
    const delta = (v: number | null, unit: '%' | 'pp' = '%') =>
      v == null ? '' : `<span class="dz-delta ${v >= 0 ? 'is-up' : 'is-down'}">${esc(fmt.change(v, unit))}</span>`;
    const cells: [string, string, string, string?][] = [
      [t.kpiNet, fmt.moneyShort(cur.net), delta(pct(cur.net, prev?.net)), cur.target ? t.ofTarget(fmt.pct(d.vsTarget)) : ''],
      [t.kpiMargin, fmt.pct1(d.margin), delta(p ? d.margin - p.margin : null, 'pp')],
      [t.kpiOrders, fmt.int(cur.orders), delta(pct(cur.orders, prev?.orders))],
      [t.kpiAov, fmt.moneyCents(d.aov), delta(p ? pct(d.aov, p.aov) : null)],
      [t.kpiUnits, fmt.int(cur.units), delta(pct(cur.units, prev?.units))],
    ];
    view('kpis').innerHTML = cells
      .map(([label, value, change, extra]) => `<div class="dz-kpi"><dt>${esc(label)}</dt><dd><strong>${esc(value)}</strong>${change}${extra ? `<small>${esc(extra)}</small>` : ''}</dd></div>`)
      .join('');
    view('kpi-period').textContent = prevRange ? t.vsPrior(fmt.range(data.months[prevRange[0]], data.months[prevRange[1]])) : t.noPrior;
  }

  function renderTrend() {
    const el = view('trend');
    const width = widthOf(el);
    const rows = trend(state);
    const dense = width / rows.length < 34;
    const cols: ColumnDatum[] = rows.map((r, m) => {
      const ym = data.months[m];
      const net = r.store + r.online;
      const mn = Number(ym.slice(5));
      const axis = mn === 1 ? ym.slice(0, 4) : dense && mn % 3 !== 1 ? '' : fmt.monthOnly(ym);
      return {
        label: fmt.monthLong(ym),
        axis,
        stack: [
          { value: state.channel === 'online' ? 0 : r.store, cls: 'is-store' },
          { value: state.channel === 'store' ? 0 : r.online, cls: 'is-online' },
        ],
        target: r.target,
        inRange: m >= state.from && m <= state.to,
        act: `month:${m}`,
        tip: tip(fmt.monthLong(ym), [
          [t.inStore, fmt.money(r.store)],
          [t.online, fmt.money(r.online)],
          [t.tipTarget, fmt.money(r.target)],
          [t.tipVsTarget, r.target ? fmt.pct(net / r.target) : '—'],
        ]),
      };
    });
    el.innerHTML = columns(width, width < 520 ? 220 : 280, cols, fmt.moneyShort);
  }

  function renderStores() {
    const el = view('stores');
    const width = widthOf(el);
    const rows = byStore(state);
    const any = !!(state.store || state.region);
    const bars: BarRow[] = rows.map(({ store: st, byChannel, t: tot }) => {
      const d = derived(tot);
      const selected = state.store ? st.id === state.store : state.region === st.region;
      const segTip = (ch: Channel) =>
        tip(`${st.name}, ${(ch === 'store' ? t.inStore : t.online).toLowerCase()}`, [
          [t.kpiNet, fmt.money(byChannel[ch])],
          [t.tipShare, fmt.pct(tot.net ? byChannel[ch] / tot.net : 0)],
        ]);
      return {
        label: st.name,
        group: { id: st.region, label: region(st.region), act: `region:${st.region}` },
        act: `store:${st.id}`,
        tip: tip(st.name, [
          [t.kpiNet, fmt.money(tot.net)],
          [t.tipTarget, fmt.money(tot.target)],
          [t.tipVsTarget, fmt.pct(d.vsTarget)],
          [t.tipOnlineShare, fmt.pct(tot.net ? byChannel.online / tot.net : 0)],
          [t.tipMargin, fmt.pct1(d.margin)],
        ]),
        segs: [
          { value: byChannel.store, cls: 'is-store', act: `storech:${st.id}:store`, tip: segTip('store'), label: `${st.name}, ${t.inStore}` },
          { value: byChannel.online, cls: 'is-online', act: `storech:${st.id}:online`, tip: segTip('online'), label: `${st.name}, ${t.online}` },
        ],
        marker: tot.target,
        note: fmt.pct(d.vsTarget),
        selected: any && selected,
        dimmed: any && !selected,
      };
    });
    el.innerHTML = hbars(width, bars, { labelW: Math.min(128, width * 0.3), noteW: 44 });
  }

  function renderDrill() {
    const el = view('drill');
    const width = widthOf(el);
    const res = drill(state);
    const crumb = view('crumb');
    if (res.level === 'category') {
      crumb.innerHTML = `<span aria-current="page">${esc(t.allCategoriesCrumb)}</span>`;
      view('drill-hint').textContent = t.catHint;
      const bars: BarRow[] = res.rows.map((r) => {
        const d = derived(r.t);
        return {
          label: name(r.cat),
          act: `category:${r.id}`,
          tip: tip(name(r.cat), [[t.kpiNet, fmt.money(r.t.net)], [t.tipMargin, fmt.pct1(d.margin)], [t.tipUnits, fmt.int(r.t.units)]]),
          segs: [{ value: r.t.net, cls: 'is-cat', act: `category:${r.id}`, label: t.filterBy(name(r.cat)) }],
          note: fmt.moneyShort(r.t.net),
        };
      });
      bars.sort((a, b) => b.segs[0].value - a.segs[0].value);
      el.innerHTML = hbars(width, bars, { labelW: Math.min(150, width * 0.36), noteW: 64, rowH: 34 });
    } else {
      crumb.innerHTML = `<button type="button" data-act="crumb:all">${esc(t.allCategoriesCrumb)}</button><span aria-hidden="true">›</span><span aria-current="page">${esc(catName(state.category!))}</span>`;
      view('drill-hint').textContent = t.prodHint;
      const bars: BarRow[] = res.rows.map((r) => {
        const d = derived(r.t);
        const selected = state.product === r.id;
        return {
          label: name(r.product),
          act: `product:${r.id}`,
          tip: tip(name(r.product), [[t.kpiNet, fmt.money(r.t.net)], [t.tipMargin, fmt.pct1(d.margin)], [t.tipUnits, fmt.int(r.t.units)]]),
          segs: [{ value: r.t.net, cls: 'is-cat', act: `product:${r.id}`, label: t.filterBy(name(r.product)) }],
          note: fmt.moneyShort(r.t.net),
          selected: !!state.product && selected,
          dimmed: !!state.product && !selected,
        };
      });
      bars.sort((a, b) => b.segs[0].value - a.segs[0].value);
      el.innerHTML = hbars(width, bars, { labelW: Math.min(190, width * 0.42), noteW: 64, rowH: 34 });
    }
  }

  function renderStock() {
    const el = view('stock');
    const width = widthOf(el);
    const all = stock(state, { ignoreProduct: true });
    const inScope = data.products.map((p) => !state.category || p.cat === state.category);
    const rows = data.products.map((p, i) => ({ p, s: all[i] })).filter((r, i) => inScope[i] && r.s.available > 0);
    const maxNet = Math.max(...rows.map((r) => r.s.net), 1);
    const maxR = width < 520 ? 14 : 18;
    const coverMax = Math.min(60, Math.max(...rows.map((r) => (Number.isFinite(r.s.weeksCover) ? r.s.weeksCover : 0)), SLOW_COVER + 4));
    const y = niceScale(coverMax, 4);
    const points: Point[] = rows.map(({ p, s }) => {
      const slow = s.sellThrough < SLOW_SELL_THROUGH && s.weeksCover > SLOW_COVER;
      const selected = state.product === p.id;
      return {
        x: s.sellThrough,
        y: Number.isFinite(s.weeksCover) ? s.weeksCover : y.max,
        r: 3 + Math.sqrt(s.net / maxNet) * (maxR - 3),
        cls: slow ? 'is-slow' : '',
        name: slow || selected ? name(p) : undefined,
        selected: !!state.product && selected,
        dimmed: !!state.product && !selected,
        act: `product:${p.id}`,
        label: t.filterBy(name(p)),
        tip: tip(name(p), [
          [t.sellThrough, fmt.pct(s.sellThrough)],
          [t.weeksCover, Number.isFinite(s.weeksCover) ? fmt.dec1(s.weeksCover) : '—'],
          [t.tipSold, fmt.int(s.sold)],
          [t.tipOnHand, fmt.int(s.end)],
          [t.kpiNet, fmt.money(s.net)],
        ]),
      };
    });
    el.innerHTML = scatter(width, width < 520 ? 300 : 340, points, {
      x: { max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: fmt.pct, title: t.sellThrough },
      y: { max: y.max, ticks: y.ticks, fmt: (v) => fmt.int(v), title: t.weeksCover },
      zone: { x: SLOW_SELL_THROUGH, y: SLOW_COVER, label: t.stockZone },
    });
  }

  function renderTable() {
    const change = (cur: number, prev: number | null) => {
      if (prev == null || !prev) return '<span class="dz-muted">—</span>';
      const v = cur / prev - 1;
      return `<span class="dz-delta ${v >= 0 ? 'is-up' : 'is-down'}">${esc(fmt.change(v))}</span>`;
    };
    const cover = (w: number) => (Number.isFinite(w) ? `<span class="${w > SLOW_COVER ? 'dz-warn' : ''}">${esc(fmt.dec1(w))}</span>` : '<span class="dz-muted">—</span>');
    const st = (v: number) => `<span class="${v < SLOW_SELL_THROUGH ? 'dz-warn' : ''}">${esc(fmt.pct(v))}</span>`;
    type Common = { t: { net: number; cost: number; units: number }; prevNet: number | null; stock: { sellThrough: number; weeksCover: number } };
    const shared = <R extends Common>(): Column<R>[] => [
      { key: 'net', label: t.colNet, numeric: true, value: (r) => r.t.net, cell: (r) => esc(fmt.money(r.t.net)) },
      { key: 'change', label: t.colChange, numeric: true, value: (r) => (r.prevNet ? r.t.net / r.prevNet - 1 : null), cell: (r) => change(r.t.net, r.prevNet) },
      { key: 'margin', label: t.colMargin, numeric: true, value: (r) => (r.t.net ? (r.t.net - r.t.cost) / r.t.net : null), cell: (r) => esc(r.t.net ? fmt.pct1((r.t.net - r.t.cost) / r.t.net) : '—') },
      { key: 'units', label: t.colUnits, numeric: true, value: (r) => r.t.units, cell: (r) => esc(fmt.int(r.t.units)) },
      { key: 'st', label: t.colSellThrough, numeric: true, value: (r) => r.stock.sellThrough, cell: (r) => st(r.stock.sellThrough) },
      { key: 'cover', label: t.colCover, numeric: true, value: (r) => (Number.isFinite(r.stock.weeksCover) ? r.stock.weeksCover : null), cell: (r) => cover(r.stock.weeksCover) },
    ];
    const el = view('table');
    if (state.rows === 'product') {
      type R = ReturnType<typeof productRows>[number];
      const cols: Column<R>[] = [
        { key: 'name', label: t.colProduct, value: (r) => name(r.product), cell: (r) => esc(name(r.product)) },
        { key: 'group', label: t.colCategory, value: (r) => catName(r.product.cat), cell: (r) => esc(catName(r.product.cat)) },
        ...shared<R>(),
      ];
      el.innerHTML = table(productRows(state), cols, state.sort, {
        act: (r) => `product:${r.product.id}`,
        selected: (r) => r.product.id === state.product,
        label: (r) => t.filterBy(name(r.product)),
        caption: t.tableCaption,
        locale: fmt.locale,
        empty: t.empty,
      });
    } else {
      type R = ReturnType<typeof storeRows>[number];
      const cols: Column<R>[] = [
        { key: 'name', label: t.colStore, value: (r) => r.store.name, cell: (r) => esc(r.store.name) },
        { key: 'group', label: t.colRegion, value: (r) => region(r.store.region), cell: (r) => esc(region(r.store.region)) },
        ...shared<R>(),
      ];
      el.innerHTML = table(storeRows(state), cols, state.sort, {
        act: (r) => `store:${r.store.id}`,
        selected: (r) => r.store.id === state.store,
        label: (r) => t.filterBy(r.store.name),
        caption: t.tableCaption,
        locale: fmt.locale,
        empty: t.empty,
      });
    }
  }

  function renderCharts() {
    renderTrend();
    renderStores();
    renderDrill();
    renderStock();
  }

  function render() {
    syncFilters();
    renderKpis();
    renderCharts();
    renderTable();
  }

  function update(patch: Partial<State>) {
    // Keep focus on the mark that was used, if it still exists after re-render.
    const focused = document.activeElement?.getAttribute('data-act');
    state = { ...state, ...patch };
    tooltip.hide();
    writeParams(stateToParams(state));
    syncLangLinks();
    render();
    if (focused) root.querySelector<HTMLElement>(`[data-act="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
  }

  let lastWidth = root.clientWidth;
  let frame = 0;
  new ResizeObserver(() => {
    if (root.clientWidth === lastWidth) return;
    lastWidth = root.clientWidth;
    selects.forEach(fit); // their text scales with the window
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(renderCharts);
  }).observe(root);

  root.classList.add('is-ready');
  syncLangLinks();
  render();
  if (document.fonts) document.fonts.ready.then(() => selects.forEach(fit));
}

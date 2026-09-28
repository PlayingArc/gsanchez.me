// Molara Dental demo dashboard: renders every view from one state object and keeps that state in
// the URL. Clicking a mark (cell, bar, column, row) cross-filters every view.

import { esc, makeFormat, type Locale } from '../kit/format';
import { columns, hbars, type BarRow, type ColumnDatum } from '../kit/charts';
import { heatmap, type HeatCell } from '../kit/heatmap';
import { table, type Column } from '../kit/table';
import { mountTooltip } from '../kit/tooltip';
import { readParams, syncLangLinks, writeParams } from '../kit/url';
import { strings } from './i18n';
import {
  HOURS, data, defaultState, detailRows, drill, heat, kpis, noShowRate, noShowsByClinic, noShowsByLead, patients, recall,
  stateFromParams, stateToParams, type DetailRow, type Heat, type Rows, type State, type Totals,
} from './model';

export function mountClinic(root: HTMLElement) {
  const locale = (root.dataset.locale as Locale) ?? 'en';
  const t = strings[locale];
  const fmt = makeFormat(locale);
  const name = (x: { en: string; es: string }) => x[locale];
  const clinic = (id: string) => data.clinics.find((c) => c.id === id)!;
  const dentist = (id: string) => data.dentists.find((d) => d.id === id)!;
  const treatment = (id: string) => data.treatments.find((x) => x.id === id)!;
  const dentistName = (id: string) => {
    const d = dentist(id);
    return `${d.title} ${d.name}`;
  };
  const hourLabel = (h: number) => `${data.firstHour + h}:00`;
  const slotName = (slot: number) => t.slotName(t.daysLong[Math.floor(slot / 10)], hourLabel(slot % 10));
  const tip = (title: string, rows: [string, string][]) =>
    `<b>${esc(title)}</b>${rows.map(([k, v]) => `<span><i>${esc(k)}</i>${esc(v)}</span>`).join('')}`;

  let state: State = stateFromParams(readParams());
  const tooltip = mountTooltip(root);

  const $ = <E extends Element = HTMLElement>(sel: string) => root.querySelector<E & Element>(sel)!;
  const view = (id: string) => $(`[data-view="${id}"]`);
  const widthOf = (el: HTMLElement) => Math.max(260, Math.floor(el.clientWidth));

  // ------------------------------------------------------------------ filters
  const fClinic = $<HTMLSelectElement>('[data-filter="clinic"]');
  const fTreatment = $<HTMLSelectElement>('[data-filter="treatment"]');
  const fFrom = $<HTMLSelectElement>('[data-filter="from"]');
  const fTo = $<HTMLSelectElement>('[data-filter="to"]');
  const selects = [fClinic, fTreatment, fFrom, fTo];

  // Size each select to its current text so the filter reads as a sentence.
  const measure = document.createElement('span');
  measure.className = 'dz-measure';
  measure.setAttribute('aria-hidden', 'true');
  root.append(measure);
  const fit = (sel: HTMLSelectElement) => {
    measure.textContent = sel.selectedOptions[0]?.textContent ?? '';
    sel.style.width = `${measure.getBoundingClientRect().width + 26}px`;
  };

  const last = data.months.length - 1;
  const presetRange = (p: string): [number, number] =>
    p === 'last3' ? [last - 2, last] : p === 'last6' ? [last - 5, last] : p === 'last12' ? [last - 11, last] : [0, last];

  const chip = (label: string, act: string, aria: string) =>
    `<button type="button" class="dz-chip" data-act="${esc(act)}" aria-label="${esc(aria)}">${esc(label)}<span aria-hidden="true">×</span></button>`;

  function syncFilters() {
    fClinic.value = state.dentist ? `dentist:${state.dentist}` : state.clinic ? `clinic:${state.clinic}` : '';
    fTreatment.value = state.treatment ?? '';
    fFrom.value = String(state.from);
    fTo.value = String(state.to);
    const d = defaultState();
    const rangeSet = state.from !== d.from || state.to !== d.to;
    fClinic.classList.toggle('is-set', fClinic.value !== '');
    fTreatment.classList.toggle('is-set', fTreatment.value !== '');
    fFrom.classList.toggle('is-set', rangeSet);
    fTo.classList.toggle('is-set', rangeSet);
    selects.forEach(fit);

    const slotChip = view('slot-chip');
    slotChip.hidden = state.slot == null;
    slotChip.innerHTML = state.slot == null ? '' : `${esc(t.at)} ${chip(slotName(state.slot), 'clear-slot', t.clearSlot(slotName(state.slot)))}`;
    const leadChip = view('lead-chip');
    leadChip.hidden = state.lead == null;
    leadChip.innerHTML = state.lead == null ? '' : `${esc(t.onlyLead)} ${chip(t.leadsInline[state.lead], 'clear-lead', t.clearLead(t.leadsInline[state.lead]))}`;

    root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => {
      const [a, z] = presetRange(b.dataset.preset!);
      b.setAttribute('aria-pressed', String(state.from === a && state.to === z));
    });
    root.querySelectorAll<HTMLButtonElement>('[data-rows]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rows === state.rows)));
    root.querySelectorAll<HTMLButtonElement>('[data-heat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.heat === state.heat)));
    const strip = (s: State) => JSON.stringify({ ...stateToParams(s), rows: null, sort: null, heat: null });
    $<HTMLButtonElement>('[data-reset]').disabled = strip(state) === strip(defaultState());
  }

  fClinic.addEventListener('change', () => {
    const [kind, id] = fClinic.value.split(':');
    if (kind === 'dentist') update({ dentist: id, clinic: dentist(id).clinic });
    else update({ clinic: kind === 'clinic' ? id : null, dentist: null });
  });
  fTreatment.addEventListener('change', () => update({ treatment: fTreatment.value || null }));
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
  $<HTMLButtonElement>('[data-reset]').addEventListener('click', () => {
    const d = defaultState();
    update({ ...d, heat: state.heat, rows: state.rows, sort: state.sort });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-rows]').forEach((b) =>
    b.addEventListener('click', () => update({ rows: b.dataset.rows as Rows, sort: { key: 'revenue', dir: 'desc' } })),
  );
  root.querySelectorAll<HTMLButtonElement>('[data-heat]').forEach((b) => b.addEventListener('click', () => update({ heat: b.dataset.heat as Heat })));

  // ------------------------------------------------------------------ marks
  function act(a: string, extend: boolean) {
    const [kind, id] = a.split(':');
    switch (kind) {
      case 'clinic':
        return update(state.clinic === id && !state.dentist ? { clinic: null } : { clinic: id, dentist: null });
      case 'dentist':
        return update(state.dentist === id ? { dentist: null } : { dentist: id, clinic: dentist(id).clinic });
      case 'treatment':
        return update({ treatment: state.treatment === id ? null : id });
      case 'slot':
        return update({ slot: state.slot === Number(id) ? null : Number(id) });
      case 'lead':
        return update({ lead: state.lead === Number(id) ? null : Number(id) });
      case 'month': {
        const m = Number(id);
        if (extend) return update({ from: Math.min(state.from, m), to: Math.max(state.to, m) });
        if (state.from === m && state.to === m) {
          const d = defaultState();
          return update({ from: d.from, to: d.to });
        }
        return update({ from: m, to: m });
      }
      case 'clear-slot':
        return update({ slot: null });
      case 'clear-lead':
        return update({ lead: null });
      case 'crumb':
        return update(id === 'all' ? { clinic: null, dentist: null } : { dentist: null });
    }
  }

  root.addEventListener('click', (e) => {
    const target = e.target as Element;
    const sortBtn = target.closest<HTMLButtonElement>('[data-sort]');
    if (sortBtn) {
      const key = sortBtn.dataset.sort!;
      const text = key === 'name' || key === 'group';
      const dir = state.sort.key === key ? (state.sort.dir === 'asc' ? 'desc' : 'asc') : text ? 'asc' : 'desc';
      return update({ sort: { key, dir } });
    }
    const mark = target.closest<Element>('[data-act]');
    if (mark && root.contains(mark)) act(mark.getAttribute('data-act')!, (e as MouseEvent).shiftKey);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const mark = (e.target as Element).closest<Element>('[data-act]');
    // Buttons already turn Enter/Space into clicks.
    if (!mark || mark.tagName === 'BUTTON') return;
    e.preventDefault();
    act(mark.getAttribute('data-act')!, e.shiftKey);
  });

  // ------------------------------------------------------------------ views
  const delta = (v: number | null, unit: '%' | 'pp', goodUp: boolean) => {
    if (v == null || !Number.isFinite(v)) return '';
    const good = v === 0 ? '' : v > 0 === goodUp ? 'is-up' : 'is-down';
    return `<span class="dz-delta ${good}">${esc(fmt.change(v, unit))}</span>`;
  };
  const ratio = (cur: number, prev: number | undefined | null) => (prev ? cur / prev - 1 : null);

  function renderKpis() {
    const k = kpis(state);
    const { cur, prev } = k;
    const rows: { label: string; value: string; change: string }[] = [
      { label: t.kpiRevenue, value: fmt.moneyShort(cur.revenue), change: delta(ratio(cur.revenue, prev?.revenue), '%', true) },
      { label: t.kpiAppointments, value: fmt.int(cur.booked), change: delta(ratio(cur.booked, prev?.booked), '%', true) },
      { label: state.dentist ? t.kpiUtilDentist : t.kpiUtil, value: fmt.pct(k.util), change: delta(k.prevUtil == null ? null : k.util - k.prevUtil, 'pp', true) },
      { label: t.kpiNoShow, value: fmt.pct1(noShowRate(cur)), change: delta(prev ? noShowRate(cur) - noShowRate(prev) : null, 'pp', false) },
      { label: t.kpiLost, value: fmt.moneyShort(cur.lost), change: delta(ratio(cur.lost, prev?.lost), '%', false) },
      { label: t.kpiNew, value: fmt.int(cur.newPatients), change: delta(ratio(cur.newPatients, prev?.newPatients), '%', true) },
    ];
    view('kpis').innerHTML = rows
      .map((r) => `<div class="dz-kpi"><dt>${esc(r.label)}</dt><dd class="dz-kpi__value">${esc(r.value)}</dd><dd class="dz-kpi__change">${r.change}</dd></div>`)
      .join('');
    const range = fmt.range(data.months[state.from], data.months[state.to]);
    view('kpi-period').textContent = k.prevRange
      ? `${range} · ${t.vsPrior(fmt.range(data.months[k.prevRange[0]], data.months[k.prevRange[1]]))}`
      : `${range} · ${t.noPrior}`;
  }

  function renderHeat() {
    const cells = heat(state);
    const maxRate = Math.max(0.2, ...cells.filter((c) => c.open && c.booked >= 20).map((c) => c.booked ? c.noShows / c.booked : 0));
    const marks: HeatCell[] = cells.map((c) => {
      const rate = c.booked ? c.noShows / c.booked : 0;
      const value = state.heat === 'util' ? c.util : rate;
      const nm = slotName(c.slot);
      return {
        open: c.open,
        level: state.heat === 'util' ? c.util : rate / maxRate,
        text: fmt.pct(value),
        act: `slot:${c.slot}`,
        label: `${t.filterBy(nm)}: ${fmt.pct(value)}`,
        selected: state.slot === c.slot,
        dimmed: state.slot != null && state.slot !== c.slot,
        tip: tip(nm, [
          [t.tipUtil, fmt.pct(c.util)],
          [t.tipBooked, fmt.int(c.booked)],
          [t.tipNoShowRate, c.booked ? fmt.pct1(rate) : '—'],
        ]),
      };
    });
    const el = view('heat');
    el.innerHTML = heatmap(widthOf(el), t.days, Array.from({ length: HOURS }, (_, h) => String(data.firstHour + h)), marks);
    view('heat-hint').textContent = state.heat === 'util' ? t.heatHintUtil : t.heatHintNoShow;
    el.dataset.metric = state.heat;
  }

  function renderNoShows() {
    const { rows, chain } = noShowsByClinic(state);
    const clinicRows: BarRow[] = rows.map(({ clinic: c, t: x }) => {
      const rate = noShowRate(x);
      return {
        label: c.name,
        act: `clinic:${c.id}`,
        segs: [{ value: rate, cls: 'dz-bar is-noshow' }],
        marker: chain,
        note: fmt.pct1(rate),
        selected: state.clinic === c.id,
        dimmed: state.clinic != null && state.clinic !== c.id,
        tip: tip(c.name, [
          [t.tipNoShowRate, fmt.pct1(rate)],
          [t.tipNoShows, fmt.int(x.noShows)],
          [t.tipBooked, fmt.int(x.booked)],
          [t.tipLost, fmt.money(x.lost)],
          [t.chain, fmt.pct1(chain)],
        ]),
      };
    });
    const leadRows: BarRow[] = noShowsByLead(state).map(({ lead, t: x }) => {
      const rate = noShowRate(x);
      return {
        label: t.leads[lead],
        act: `lead:${lead}`,
        segs: [{ value: rate, cls: 'dz-bar is-noshow' }],
        note: fmt.pct1(rate),
        selected: state.lead === lead,
        dimmed: state.lead != null && state.lead !== lead,
        tip: tip(t.leads[lead], [
          [t.tipNoShowRate, fmt.pct1(rate)],
          [t.tipNoShows, fmt.int(x.noShows)],
          [t.tipBooked, fmt.int(x.booked)],
          [t.tipLost, fmt.money(x.lost)],
        ]),
      };
    });
    const a = view('noshow-clinic');
    a.innerHTML = hbars(widthOf(a), clinicRows, { noteW: 52 });
    const b = view('noshow-lead');
    b.innerHTML = hbars(widthOf(b), leadRows, { noteW: 52 });
  }

  function renderDrill() {
    const d = drill(state);
    const total = d.rows.reduce((a, r) => a + r.t.revenue, 0) || 1;
    const labelOf = (id: string) => (d.level === 'clinic' ? clinic(id).name : d.level === 'dentist' ? dentistName(id) : name(treatment(id)));
    const actOf = (id: string) => `${d.level}:${id}`;
    const isSel = (id: string) => (d.level === 'clinic' ? state.clinic === id : d.level === 'dentist' ? state.dentist === id : state.treatment === id);
    const anySel = d.level === 'treatment' && state.treatment != null;
    const rows: BarRow[] = [...d.rows]
      .sort((a, b) => b.t.revenue - a.t.revenue)
      .map((r) => {
        const label = labelOf(r.id);
        return {
          label,
          act: actOf(r.id),
          segs: [{ value: r.t.revenue, cls: 'dz-bar' }],
          note: fmt.moneyShort(r.t.revenue),
          selected: isSel(r.id),
          dimmed: anySel && !isSel(r.id),
          tip: tip(label, [
            [t.tipRevenue, fmt.money(r.t.revenue)],
            [t.tipShare, fmt.pct1(r.t.revenue / total)],
            [t.tipAttended, fmt.int(r.t.attended)],
            [t.tipNoShowRate, fmt.pct1(noShowRate(r.t))],
          ]),
        };
      });
    const el = view('drill');
    el.innerHTML = hbars(widthOf(el), rows, { noteW: 64 });

    const crumbs: string[] = [];
    const crumb = (label: string, a: string | null) =>
      a ? `<button type="button" data-act="${esc(a)}">${esc(label)}</button>` : `<span aria-current="page">${esc(label)}</span>`;
    crumbs.push(crumb(t.allClinicsCrumb, state.clinic ? 'crumb:all' : null));
    if (state.clinic) crumbs.push(crumb(clinic(state.clinic).name, state.dentist ? 'crumb:clinic' : null));
    if (state.dentist) crumbs.push(crumb(dentistName(state.dentist), null));
    view('crumb').innerHTML = crumbs.join('<span class="dz-crumb__sep" aria-hidden="true">›</span>');
    view('drill-hint').textContent = d.level === 'clinic' ? t.hintClinic : d.level === 'dentist' ? t.hintDentist : t.hintTreatment;
  }

  function renderPatients() {
    const rows = patients(state);
    const el = view('patients');
    const width = widthOf(el);
    const cols: ColumnDatum[] = rows.map((r, m) => {
      const ym = data.months[m];
      const month = fmt.monthLong(ym);
      const all = r.fresh + r.returning;
      return {
        label: month,
        axis: m % 3 === 0 || width >= 640 ? fmt.monthOnly(ym) : '',
        stack: [
          { value: r.returning, cls: 'is-returning' },
          { value: r.fresh, cls: 'is-new' },
        ],
        inRange: m >= state.from && m <= state.to,
        act: `month:${m}`,
        tip: tip(month, [
          [t.tipNew, fmt.int(r.fresh)],
          [t.tipReturning, fmt.int(r.returning)],
          [t.tipNewShare, all ? fmt.pct1(r.fresh / all) : '—'],
        ]),
      };
    });
    el.innerHTML = columns(width, width < 520 ? 190 : 220, cols, (v) => fmt.int(v));

    const rc = recall(state);
    const rrows: BarRow[] = rc.rows.map((r) => {
      const label = rc.level === 'clinic' ? clinic(r.id).name : dentistName(r.id);
      const sel = rc.level === 'clinic' ? state.clinic === r.id : state.dentist === r.id;
      return {
        label,
        act: `${rc.level}:${r.id}`,
        segs: [{ value: r.rate, cls: 'dz-bar is-recall' }],
        marker: rc.chain.rate,
        note: fmt.pct(r.rate),
        selected: sel,
        dimmed: rc.level === 'dentist' && state.dentist != null && !sel,
        tip: tip(label, [
          [t.recallTitle, fmt.pct1(r.rate)],
          [t.tipDue, fmt.int(r.due)],
          [t.tipKept, fmt.int(r.kept)],
          [t.chain, fmt.pct1(rc.chain.rate)],
        ]),
      };
    });
    const rel = view('recall');
    rel.innerHTML = hbars(widthOf(rel), rrows, { noteW: 44 });
  }

  function renderTable() {
    const change = (r: DetailRow) => {
      const v = ratio(r.t.revenue, r.prevRevenue);
      return v == null ? '<span class="dz-muted">—</span>' : `<span class="dz-delta ${v >= 0 ? 'is-up' : 'is-down'}">${esc(fmt.change(v))}</span>`;
    };
    const rate = (x: Totals) => {
      const v = noShowRate(x);
      return `<span class="${v >= 0.15 ? 'dz-warn' : ''}">${esc(fmt.pct1(v))}</span>`;
    };
    const byDentist = state.rows === 'dentist';
    const label = (r: DetailRow) => (byDentist ? dentistName(r.id) : name(treatment(r.id)));
    const cols: Column<DetailRow>[] = [
      { key: 'name', label: byDentist ? t.colDentist : t.colTreatment, value: label, cell: (r) => esc(label(r)) },
      byDentist
        ? { key: 'group', label: t.colClinic, value: (r) => clinic(dentist(r.id).clinic).name, cell: (r) => esc(clinic(dentist(r.id).clinic).name) }
        : { key: 'group', label: t.colPrice, numeric: true, value: (r) => treatment(r.id).price, cell: (r) => esc(fmt.money(treatment(r.id).price)) },
      { key: 'booked', label: t.colBooked, numeric: true, value: (r) => r.t.booked, cell: (r) => esc(fmt.int(r.t.booked)) },
      { key: 'noshow', label: t.colNoShow, numeric: true, value: (r) => noShowRate(r.t), cell: (r) => rate(r.t) },
      { key: 'lost', label: t.colLost, numeric: true, value: (r) => r.t.lost, cell: (r) => esc(fmt.money(r.t.lost)) },
      { key: 'revenue', label: t.colRevenue, numeric: true, value: (r) => r.t.revenue, cell: (r) => esc(fmt.money(r.t.revenue)) },
      { key: 'change', label: t.colChange, numeric: true, value: (r) => ratio(r.t.revenue, r.prevRevenue), cell: change },
      ...(byDentist ? [{ key: 'util', label: t.colUtil, numeric: true, value: (r: DetailRow) => r.util, cell: (r: DetailRow) => esc(r.util == null ? '—' : fmt.pct(r.util)) }] : []),
      { key: 'new', label: t.colNew, numeric: true, value: (r) => r.t.newPatients, cell: (r) => esc(fmt.int(r.t.newPatients)) },
    ];
    view('table').innerHTML = table(detailRows(state), cols, state.sort, {
      act: (r) => `${byDentist ? 'dentist' : 'treatment'}:${r.id}`,
      selected: (r) => (byDentist ? state.dentist === r.id : state.treatment === r.id),
      label: (r) => t.filterBy(label(r)),
      caption: t.tableCaption,
      locale: fmt.locale,
      empty: t.empty,
    });
  }

  function renderCharts() {
    renderHeat();
    renderNoShows();
    renderDrill();
    renderPatients();
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
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(renderCharts);
  }).observe(root);

  root.classList.add('is-ready');
  syncLangLinks();
  render();
  if (document.fonts) document.fonts.ready.then(() => selects.forEach(fit));
}


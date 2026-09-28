// Molara Dental: filter state and every aggregate the dashboard draws.
// Appointments arrive packed (see scripts/gen-clinic-data.mjs) and are unpacked once into columns;
// every view is one pass over them.

import raw from './data.json';

type Named = { id: string; en: string; es: string };
export type Clinic = { id: string; name: string; chairs: number; price: number };
export type Dentist = { id: string; title: string; name: string; clinic: string; role: string; days: number[] };
export type Treatment = Named & { minutes: number; price: number };

export const data = raw as unknown as {
  months: string[];
  firstHour: number;
  closeHour: number[];
  openDays: number[];
  clinics: Clinic[];
  dentists: Dentist[];
  treatments: Treatment[];
  appointments: string;
  recall: { due: number[]; kept: number[] };
};

const M = data.months.length;
const D = data.dentists.length;
export const DAYS = 6; // Mon..Sat
export const HOURS = data.closeHour.reduce((a, b) => Math.max(a, b), 0) - data.firstHour;
export const LEADS = 6;
const clinicOf = data.dentists.map((d) => data.clinics.findIndex((c) => c.id === d.clinic));
/** Is the chain open in this weekday/hour cell? */
export const isOpen = (wd: number, h: number) => data.firstHour + h < data.closeHour[wd];

// ------------------------------------------------------------------ unpack
const bin = atob(data.appointments);
const N = bin.length / 3;
const A = {
  month: new Uint8Array(N),
  slot: new Uint8Array(N),
  half: new Uint8Array(N),
  dentist: new Uint8Array(N),
  clinic: new Uint8Array(N),
  treatment: new Uint8Array(N),
  lead: new Uint8Array(N),
  noShow: new Uint8Array(N),
  isNew: new Uint8Array(N),
  price: new Float32Array(N),
  minutes: new Uint16Array(N),
};
for (let i = 0; i < N; i++) {
  const v = bin.charCodeAt(i * 3) | (bin.charCodeAt(i * 3 + 1) << 8) | (bin.charCodeAt(i * 3 + 2) << 16);
  A.month[i] = v & 31;
  A.slot[i] = (v >> 5) & 63;
  A.half[i] = (v >> 11) & 1;
  A.dentist[i] = (v >> 12) & 15;
  A.clinic[i] = clinicOf[A.dentist[i]];
  A.treatment[i] = (v >> 16) & 7;
  A.lead[i] = (v >> 19) & 7;
  A.noShow[i] = (v >> 22) & 1;
  A.isNew[i] = (v >> 23) & 1;
  const t = data.treatments[A.treatment[i]];
  A.price[i] = t.price * data.clinics[A.clinic[i]].price;
  A.minutes[i] = t.minutes;
}

// ------------------------------------------------------------------ state
export type Heat = 'util' | 'noshow';
export type Rows = 'dentist' | 'treatment';

export type State = {
  from: number;
  to: number;
  clinic: string | null;
  dentist: string | null;
  treatment: string | null;
  /** Weekday * 10 + hour index, picked on the heatmap. */
  slot: number | null;
  /** Lead-time bucket, picked on the lead-time chart. */
  lead: number | null;
  heat: Heat;
  rows: Rows;
  sort: { key: string; dir: 'asc' | 'desc' };
};

export const DEFAULT_SORT = { key: 'revenue', dir: 'desc' } as const;

export function defaultState(): State {
  return { from: M - 12, to: M - 1, clinic: null, dentist: null, treatment: null, slot: null, lead: null, heat: 'util', rows: 'dentist', sort: { ...DEFAULT_SORT } };
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
  const dentist = data.dentists.find((x) => x.id === q.get('dentist'));
  if (dentist) {
    s.dentist = dentist.id;
    s.clinic = dentist.clinic;
  } else if (data.clinics.some((c) => c.id === q.get('clinic'))) s.clinic = q.get('clinic');
  if (data.treatments.some((x) => x.id === q.get('treatment'))) s.treatment = q.get('treatment');
  const slot = q.get('slot')?.match(/^(\d)-(\d{1,2})$/);
  if (slot) {
    const wd = Number(slot[1]) - 1, hour = Number(slot[2]) - data.firstHour;
    if (wd >= 0 && wd < DAYS && hour >= 0 && isOpen(wd, hour)) s.slot = wd * 10 + hour;
  }
  const lead = Number(q.get('lead'));
  if (q.get('lead') && Number.isInteger(lead) && lead >= 1 && lead <= LEADS) s.lead = lead - 1;
  if (q.get('heat') === 'noshow') s.heat = 'noshow';
  if (q.get('rows') === 'treatment') s.rows = 'treatment';
  const [key, dir] = (q.get('sort') ?? '').split('-');
  if (key && (dir === 'asc' || dir === 'desc')) s.sort = { key, dir };
  return s;
}

export function stateToParams(s: State) {
  const d = defaultState();
  const range = s.from === d.from && s.to === d.to;
  const sort = s.sort.key === DEFAULT_SORT.key && s.sort.dir === DEFAULT_SORT.dir ? null : `${s.sort.key}-${s.sort.dir}`;
  return {
    from: range ? null : data.months[s.from],
    to: range ? null : data.months[s.to],
    clinic: s.dentist ? null : s.clinic,
    dentist: s.dentist,
    treatment: s.treatment,
    // Weekday 1-6 and the clock hour, so the URL reads "slot=1-9" for Monday 9:00.
    slot: s.slot == null ? null : `${Math.floor(s.slot / 10) + 1}-${(s.slot % 10) + data.firstHour}`,
    lead: s.lead == null ? null : String(s.lead + 1),
    heat: s.heat === 'noshow' ? 'noshow' : null,
    rows: s.rows === 'treatment' ? 'treatment' : null,
    sort,
  };
}

// ------------------------------------------------------------------ filters
type Dim = 'clinic' | 'dentist' | 'treatment' | 'slot' | 'lead';

/** A predicate over appointment indices. `ignore` drops dimensions, for charts that show all of one. */
function filterOf(s: State, ignore: Dim[] = []) {
  const skip = new Set(ignore);
  const ci = !skip.has('clinic') && s.clinic ? data.clinics.findIndex((c) => c.id === s.clinic) : -1;
  const di = !skip.has('dentist') && s.dentist ? data.dentists.findIndex((d) => d.id === s.dentist) : -1;
  const ti = !skip.has('treatment') && s.treatment ? data.treatments.findIndex((t) => t.id === s.treatment) : -1;
  const slot = !skip.has('slot') ? s.slot : null;
  const lead = !skip.has('lead') ? s.lead : null;
  return (i: number) =>
    (ci < 0 || A.clinic[i] === ci) &&
    (di < 0 || A.dentist[i] === di) &&
    (ti < 0 || A.treatment[i] === ti) &&
    (slot == null || A.slot[i] === slot) &&
    (lead == null || A.lead[i] === lead);
}

function each(pass: (i: number) => boolean, from: number, to: number, visit: (i: number) => void) {
  for (let i = 0; i < N; i++) {
    const m = A.month[i];
    if (m >= from && m <= to && pass(i)) visit(i);
  }
}

export type Totals = { booked: number; noShows: number; attended: number; revenue: number; lost: number; minutes: number; newPatients: number };
const zero = (): Totals => ({ booked: 0, noShows: 0, attended: 0, revenue: 0, lost: 0, minutes: 0, newPatients: 0 });

function add(t: Totals, i: number) {
  t.booked++;
  if (A.noShow[i]) {
    t.noShows++;
    t.lost += A.price[i];
  } else {
    t.attended++;
    t.revenue += A.price[i];
    t.minutes += A.minutes[i];
    t.newPatients += A.isNew[i];
  }
}

export const noShowRate = (t: Totals) => (t.booked ? t.noShows / t.booked : 0);

/**
 * Chair minutes on offer: every chair of the clinics in scope through their open hours or, with a
 * dentist picked, that dentist's own weekdays. A heatmap slot narrows it to that weekday and hour.
 */
function capacity(s: State, from: number, to: number, opts: { dentist?: number; clinic?: number; slot?: number | null } = {}) {
  const di = opts.dentist ?? (s.dentist ? data.dentists.findIndex((d) => d.id === s.dentist) : -1);
  const ci = opts.clinic ?? (s.clinic ? data.clinics.findIndex((c) => c.id === s.clinic) : -1);
  const slot = opts.slot === undefined ? s.slot : opts.slot;
  const minutesOn = (wd: number) => (slot == null ? (data.closeHour[wd] - data.firstHour) * 60 : Math.floor(slot / 10) === wd ? 60 : 0);
  const seats = (wd: number) =>
    di >= 0 ? (data.dentists[di].days.includes(wd) ? 1 : 0) : data.clinics.reduce((a, c, k) => a + (ci < 0 || k === ci ? c.chairs : 0), 0);
  let total = 0;
  for (let m = from; m <= to; m++) for (let wd = 0; wd < DAYS; wd++) total += data.openDays[m * DAYS + wd] * minutesOn(wd) * seats(wd);
  return total;
}

/** Attended chair minutes of the filter falling into each weekday/hour cell (long visits spill over). */
function cellMinutes(pass: (i: number) => boolean, from: number, to: number) {
  const used = new Float64Array(DAYS * 10);
  each(pass, from, to, (i) => {
    if (A.noShow[i]) return;
    const wd = Math.floor(A.slot[i] / 10);
    let at = (A.slot[i] % 10) * 60 + A.half[i] * 30;
    let left = A.minutes[i];
    while (left > 0) {
      const h = Math.floor(at / 60);
      const take = Math.min(left, 60 - (at % 60));
      if (h < 10) used[wd * 10 + h] += take;
      at += take;
      left -= take;
    }
  });
  return used;
}

/** Chair utilisation: attended chair minutes over chair minutes on offer. */
function utilisation(s: State, from: number, to: number) {
  if (s.slot == null) {
    const t = zero();
    each(filterOf(s), from, to, (i) => add(t, i));
    const cap = capacity(s, from, to);
    return cap ? t.minutes / cap : 0;
  }
  // In one hour of the week, count the minutes of every visit that runs through it.
  const used = cellMinutes(filterOf(s, ['slot']), from, to)[s.slot];
  const cap = capacity(s, from, to);
  return cap ? used / cap : 0;
}

// ------------------------------------------------------------------ views
export function kpis(s: State) {
  const n = s.to - s.from + 1;
  const pass = filterOf(s);
  const cur = zero();
  each(pass, s.from, s.to, (i) => add(cur, i));
  const pf = s.from - n;
  let prev: Totals | null = null;
  if (pf >= 0) {
    const p = zero();
    each(pass, pf, s.from - 1, (i) => add(p, i));
    prev = p;
  }
  return {
    cur,
    prev,
    util: utilisation(s, s.from, s.to),
    prevUtil: pf >= 0 ? utilisation(s, pf, s.from - 1) : null,
    prevRange: pf >= 0 ? ([pf, s.from - 1] as const) : null,
  };
}

export type Cell = { slot: number; open: boolean; booked: number; noShows: number; util: number };

/** Weekday x hour: utilisation and no-show rate for everything but the slot filter. */
export function heat(s: State): Cell[] {
  const pass = filterOf(s, ['slot']);
  const used = cellMinutes(pass, s.from, s.to);
  const booked = new Uint32Array(DAYS * 10);
  const noShows = new Uint32Array(DAYS * 10);
  each(pass, s.from, s.to, (i) => {
    booked[A.slot[i]]++;
    noShows[A.slot[i]] += A.noShow[i];
  });
  const cells: Cell[] = [];
  for (let wd = 0; wd < DAYS; wd++)
    for (let h = 0; h < HOURS; h++) {
      const slot = wd * 10 + h;
      const cap = capacity(s, s.from, s.to, { slot });
      cells.push({ slot, open: isOpen(wd, h), booked: booked[slot], noShows: noShows[slot], util: cap ? used[slot] / cap : 0 });
    }
  return cells;
}

/** Every clinic (the clinic and dentist filters only highlight). */
export function noShowsByClinic(s: State) {
  const pass = filterOf(s, ['clinic', 'dentist']);
  const rows = data.clinics.map((c) => ({ clinic: c, t: zero() }));
  each(pass, s.from, s.to, (i) => add(rows[A.clinic[i]].t, i));
  const all = zero();
  each(pass, s.from, s.to, (i) => add(all, i));
  return { rows, chain: noShowRate(all) };
}

/** Every lead-time bucket (the lead filter only highlights). */
export function noShowsByLead(s: State) {
  const pass = filterOf(s, ['lead']);
  const rows = Array.from({ length: LEADS }, (_, lead) => ({ lead, t: zero() }));
  each(pass, s.from, s.to, (i) => add(rows[A.lead[i]].t, i));
  return rows;
}

/** Revenue by clinic, then the picked clinic's dentists, then the picked dentist's treatments. */
export function drill(s: State) {
  if (!s.clinic) {
    const rows = data.clinics.map((c) => ({ id: c.id, t: zero() }));
    each(filterOf(s, ['clinic', 'dentist']), s.from, s.to, (i) => add(rows[A.clinic[i]].t, i));
    return { level: 'clinic' as const, rows };
  }
  if (!s.dentist) {
    const ci = data.clinics.findIndex((c) => c.id === s.clinic);
    const ids = data.dentists.map((_d, k) => (clinicOf[k] === ci ? k : -1)).filter((k) => k >= 0);
    const rows = ids.map((k) => ({ id: data.dentists[k].id, t: zero() }));
    each(filterOf(s, ['dentist']), s.from, s.to, (i) => add(rows[ids.indexOf(A.dentist[i])].t, i));
    return { level: 'dentist' as const, rows };
  }
  const rows = data.treatments.map((t) => ({ id: t.id, t: zero() }));
  each(filterOf(s, ['treatment']), s.from, s.to, (i) => add(rows[A.treatment[i]].t, i));
  return { level: 'treatment' as const, rows: rows.filter((r) => r.t.booked > 0) };
}

/** Revenue by treatment for everything but the treatment filter (which only highlights). */
export function byTreatment(s: State) {
  const rows = data.treatments.map((t) => ({ id: t.id, t: zero() }));
  each(filterOf(s, ['treatment']), s.from, s.to, (i) => add(rows[A.treatment[i]].t, i));
  return rows.filter((r) => r.t.booked > 0);
}

/** All 24 months (the date filter only highlights): visits by new and by returning patients. */
export function patients(s: State) {
  const rows = data.months.map(() => ({ fresh: 0, returning: 0 }));
  each(filterOf(s), 0, M - 1, (i) => {
    if (A.noShow[i]) return;
    if (A.isNew[i]) rows[A.month[i]].fresh++;
    else rows[A.month[i]].returning++;
  });
  return rows;
}

/**
 * Six-month recall kept, by clinic (or by the picked clinic's dentists). A recall belongs to the
 * dentist who did the check-up, so the treatment, slot and lead filters do not apply here.
 */
export function recall(s: State) {
  const ci = s.clinic ? data.clinics.findIndex((c) => c.id === s.clinic) : -1;
  const sum = (dentist: (k: number) => boolean) => {
    let due = 0, kept = 0;
    for (let m = s.from; m <= s.to; m++)
      for (let k = 0; k < D; k++) {
        if (!dentist(k)) continue;
        due += data.recall.due[m * D + k];
        kept += data.recall.kept[m * D + k];
      }
    return { due, kept, rate: due ? kept / due : 0 };
  };
  const chain = sum(() => true);
  if (ci < 0) return { level: 'clinic' as const, chain, rows: data.clinics.map((c, k) => ({ id: c.id, ...sum((d) => clinicOf[d] === k) })) };
  const ids = data.dentists.map((_d, k) => (clinicOf[k] === ci ? k : -1)).filter((k) => k >= 0);
  return { level: 'dentist' as const, chain, rows: ids.map((k) => ({ id: data.dentists[k].id, ...sum((d) => d === k) })) };
}

export type DetailRow = { id: string; t: Totals; prevRevenue: number | null; util: number | null };

/** Detail table: one row per dentist (with their own utilisation) or per treatment. */
export function detailRows(s: State): DetailRow[] {
  const n = s.to - s.from + 1;
  const pf = s.from - n;
  const byDentist = s.rows === 'dentist';
  const keyOf = (i: number) => (byDentist ? A.dentist[i] : A.treatment[i]);
  const ignore: Dim[] = byDentist ? ['dentist'] : ['treatment'];
  const pass = filterOf(s, ignore);
  const count = byDentist ? D : data.treatments.length;
  const cur = Array.from({ length: count }, zero);
  const prev = Array.from({ length: count }, zero);
  each(pass, s.from, s.to, (i) => add(cur[keyOf(i)], i));
  if (pf >= 0) each(pass, pf, s.from - 1, (i) => add(prev[keyOf(i)], i));
  const ci = s.clinic ? data.clinics.findIndex((c) => c.id === s.clinic) : -1;
  return cur
    .map((t, k) => ({
      id: byDentist ? data.dentists[k].id : data.treatments[k].id,
      t,
      prevRevenue: pf >= 0 ? prev[k].revenue : null,
      util: byDentist ? (() => {
        const cap = capacity(s, s.from, s.to, { dentist: k });
        return cap ? t.minutes / cap : 0;
      })() : null,
      inScope: !byDentist || ci < 0 || clinicOf[k] === ci,
    }))
    .filter((r) => r.inScope && r.t.booked > 0)
    .map(({ inScope: _, ...r }) => r);
}

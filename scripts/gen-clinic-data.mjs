// Generates the invented data behind the Molara Dental demo dashboard.
// Seeded, so re-running gives the same file. Output is committed; the page never runs this.
//   node scripts/gen-clinic-data.mjs
//
// Every dentist's calendar is walked day by day: open days only (Mexican statutory holidays and
// Semana Santa closed), their own weekdays, their clinic's hours. Each appointment is packed into
// 3 bytes (see `pack`) and the whole list is written as one base64 string.
import { writeFileSync } from 'node:fs';

let seed = 20260929;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = (amp) => 1 + (rand() * 2 - 1) * amp;
const pick = (weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) < 0) return i;
  return weights.length - 1;
};

// Sep 2024 .. Aug 2026: 24 closed months.
const months = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(Date.UTC(2024, 8 + i, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
});

// Weekdays Mon..Sat (index 0..5); Sunday closed. Hour slots start at 9:00 (index 0..9).
const FIRST_HOUR = 9;
const closeHour = [19, 19, 19, 19, 19, 14];

// Closed: statutory holidays (incl. the Monday-shifted ones) and Maundy Thursday / Good Friday.
const holidays = new Set([
  '2024-09-16', '2024-11-18', '2024-12-25',
  '2025-01-01', '2025-02-03', '2025-03-17', '2025-04-17', '2025-04-18', '2025-05-01', '2025-09-16', '2025-11-17', '2025-12-25',
  '2026-01-01', '2026-02-02', '2026-03-16', '2026-04-02', '2026-04-03', '2026-05-01',
]);

// price: the clinic's price list against the chain's; fill: share of free half-hours that get booked;
// noShow: the clinic's no-show multiplier. Juriquilla starts WhatsApp reminders in month 14 (Nov 2025).
// Milenio III opened in the summer of 2024 and is still filling its book.
const clinics = [
  { id: 'centro', name: 'Centro Histórico', chairs: 3, price: 1.0, fill: 0.8, noShow: 1.0 },
  { id: 'juriquilla', name: 'Juriquilla', chairs: 3, price: 1.12, fill: 0.84, noShow: 0.95, reminders: 14 },
  { id: 'refugio', name: 'El Refugio', chairs: 3, price: 1.05, fill: 0.79, noShow: 0.95 },
  { id: 'milenio', name: 'Milenio III', chairs: 2, price: 1.0, fill: 0.8, noShow: 1.1, ramp: { from: 0.5, months: 15 } },
  { id: 'corregidora', name: 'Corregidora', chairs: 3, price: 0.95, fill: 0.78, noShow: 1.5 },
];

const W = { M: 0, T: 1, W: 2, R: 3, F: 4, S: 5 };
const days = (s) => [...s].map((c) => W[c]);

// Dentists are shown by first name and initial only.
const dentists = [
  ['lucia-m', 'Dra.', 'Lucía M.', 'centro', 'general', 'MTWRF'],
  ['andres-v', 'Dr.', 'Andrés V.', 'centro', 'general', 'MTWRFS'],
  ['tomas-r', 'Dr.', 'Tomás R.', 'centro', 'endo', 'MTRF'],
  ['sofia-a', 'Dra.', 'Sofía A.', 'juriquilla', 'general', 'MTWRF'],
  ['pablo-e', 'Dr.', 'Pablo E.', 'juriquilla', 'general', 'TWRFS'],
  ['diego-c', 'Dr.', 'Diego C.', 'juriquilla', 'ortho', 'MWFS'],
  ['valeria-n', 'Dra.', 'Valeria N.', 'juriquilla', 'implant', 'TRS'],
  ['mariana-o', 'Dra.', 'Mariana O.', 'refugio', 'general', 'MTWRFS'],
  ['emilio-s', 'Dr.', 'Emilio S.', 'refugio', 'general', 'MTWRF'],
  ['regina-t', 'Dra.', 'Regina T.', 'refugio', 'ortho', 'MWFS'],
  ['ivan-l', 'Dr.', 'Iván L.', 'milenio', 'general', 'MTWRFS'],
  ['paula-r', 'Dra.', 'Paula R.', 'milenio', 'general', 'TWRFS'],
  ['hector-d', 'Dr.', 'Héctor D.', 'corregidora', 'general', 'MTWRFS'],
  ['carmen-i', 'Dra.', 'Carmen I.', 'corregidora', 'endo', 'TWRF'],
  ['luis-f', 'Dr.', 'Luis F.', 'corregidora', 'general', 'MTWRF'],
].map(([id, title, name, clinic, role, d], i) => ({ id, title, name, clinic, role, days: days(d), skill: [1.02, 0.98, 1, 1.03, 0.97, 1, 1, 1.01, 0.96, 1, 1, 0.95, 1, 1, 0.97][i] }));

// minutes: chair time; price: USD list price; newShare: how often the visit is a new patient's first;
// noShow: treatment multiplier (deposits keep crown and implant patients coming);
// lead: weights over the lead-time buckets (same day, 1-3 d, 4-7 d, 8-14 d, 15-30 d, 31+ d).
const treatments = [
  { id: 'checkup', en: 'Check-up & cleaning', es: 'Revisión y limpieza', minutes: 60, price: 55, newShare: 0.2, noShow: 1.25, lead: [0.02, 0.08, 0.15, 0.2, 0.25, 0.3] },
  { id: 'filling', en: 'Filling', es: 'Resina', minutes: 60, price: 90, newShare: 0.07, noShow: 1.0, lead: [0.05, 0.2, 0.3, 0.25, 0.15, 0.05] },
  { id: 'extraction', en: 'Extraction', es: 'Extracción', minutes: 30, price: 110, newShare: 0.3, noShow: 0.75, lead: [0.32, 0.3, 0.2, 0.1, 0.06, 0.02] },
  { id: 'root-canal', en: 'Root canal', es: 'Endodoncia', minutes: 90, price: 380, newShare: 0.1, noShow: 0.7, lead: [0.12, 0.3, 0.26, 0.17, 0.1, 0.05] },
  { id: 'crown', en: 'Crown', es: 'Corona', minutes: 60, price: 620, newShare: 0.02, noShow: 0.45, lead: [0, 0.04, 0.14, 0.3, 0.37, 0.15] },
  { id: 'whitening', en: 'Whitening', es: 'Blanqueamiento', minutes: 60, price: 240, newShare: 0.35, noShow: 1.2, lead: [0.04, 0.14, 0.24, 0.26, 0.21, 0.11] },
  { id: 'ortho', en: 'Orthodontic adjustment', es: 'Ajuste de ortodoncia', minutes: 30, price: 65, newShare: 0.02, noShow: 1.1, lead: [0, 0.02, 0.08, 0.2, 0.5, 0.2] },
  { id: 'implant', en: 'Implant', es: 'Implante', minutes: 120, price: 1400, newShare: 0.05, noShow: 0.35, lead: [0, 0.02, 0.08, 0.2, 0.35, 0.35] },
];
const T = Object.fromEntries(treatments.map((t, i) => [t.id, i]));

const mix = {
  general: { checkup: 0.43, filling: 0.25, extraction: 0.08, 'root-canal': 0.04, crown: 0.07, whitening: 0.08 },
  endo: { 'root-canal': 0.6, crown: 0.22, filling: 0.1, extraction: 0.08 },
  ortho: { ortho: 0.88, checkup: 0.07, whitening: 0.05 },
  implant: { implant: 0.5, extraction: 0.3, crown: 0.2 },
};
const mixWeights = Object.fromEntries(Object.entries(mix).map(([role, m]) => [role, treatments.map((t) => m[t.id] ?? 0)]));

const leadNoShow = [0.016, 0.04, 0.065, 0.09, 0.12, 0.17];
const monthFill = [1.08, 1.02, 1.0, 0.9, 1.0, 0.98, 0.88, 0.95, 1.0, 1.03, 1.02, 0.8]; // Jan..Dec
const monthNoShow = [1.0, 1.0, 1.0, 1.2, 1.0, 1.0, 1.15, 1.05, 1.0, 1.0, 1.05, 1.35];
const hourFill = [0.86, 1.0, 1.03, 1.03, 0.98, 0.55, 0.9, 1.02, 1.08, 1.0]; // 9:00..18:00
const dayFill = [0.95, 1.0, 1.0, 1.02, 0.96, 1.08];

function noShowOf(c, ci, mi, wd, h, ti, lead, isNew) {
  let p = leadNoShow[lead] * treatments[ti].noShow * c.noShow * monthNoShow[Number(months[mi].slice(5)) - 1];
  if (isNew) p *= 1.35;
  if (wd === 0 && h < 2) p *= 1.35; // Monday first thing
  if (wd === 5) p *= 1.25;
  if (wd === 4 && h >= 7) p *= 1.3; // Friday late afternoon
  if (h === 5) p *= 1.15; // lunch hour
  if (c.reminders != null && mi >= c.reminders) p *= 0.55;
  return Math.min(0.6, p);
}

// ------------------------------------------------------------------ calendar
const openDays = months.map(() => [0, 0, 0, 0, 0, 0]); // [month][weekday]
const calendar = []; // { mi, wd }
for (let mi = 0; mi < months.length; mi++) {
  const [y, m] = months[mi].split('-').map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let d = 1; d <= n; d++) {
    const date = new Date(Date.UTC(y, m - 1, d));
    const js = date.getUTCDay();
    if (js === 0 || holidays.has(date.toISOString().slice(0, 10))) continue;
    const wd = js - 1;
    openDays[mi][wd]++;
    calendar.push({ mi, wd });
  }
}

// ------------------------------------------------------------------ appointments
// Bits (low to high): month 5 | slot 6 (weekday * 10 + hour) | half-hour 1 | dentist 4 | treatment 3 | lead 3 | no-show 1 | new 1
const pack = (mi, slot, half, di, ti, lead, ns, nw) =>
  mi | (slot << 5) | (half << 11) | (di << 12) | (ti << 16) | (lead << 19) | (ns << 22) | (nw << 23);

const appts = [];
const checkupsAttended = dentists.map(() => months.map(() => 0));
for (const { mi, wd } of calendar) {
  const monthNum = Number(months[mi].slice(5));
  const years = mi / 12;
  for (let di = 0; di < dentists.length; di++) {
    const d = dentists[di];
    if (!d.days.includes(wd)) continue;
    const ci = clinics.findIndex((c) => c.id === d.clinic);
    const c = clinics[ci];
    // An occasional day off (courses, sick days, holidays of their own).
    if (rand() < 0.035) continue;
    const ramp = c.ramp ? Math.min(1, c.ramp.from + ((1 - c.ramp.from) * mi) / c.ramp.months) : 1;
    const dayNoise = noise(0.08);
    let t = FIRST_HOUR * 60;
    const close = closeHour[wd] * 60;
    while (t < close) {
      const h = Math.floor(t / 60) - FIRST_HOUR;
      const p = Math.min(0.97, c.fill * ramp * monthFill[monthNum - 1] * hourFill[h] * dayFill[wd] * d.skill * dayNoise * (1 + 0.04 * years));
      if (rand() >= p) {
        t += 30;
        continue;
      }
      let ti = pick(mixWeights[d.role]);
      // Long work does not start late in the day.
      if (t + treatments[ti].minutes > close) {
        const fits = mixWeights[d.role].map((w, k) => (t + treatments[k].minutes <= close ? w : 0));
        if (!fits.some((w) => w > 0)) break;
        ti = pick(fits);
      }
      const tr = treatments[ti];
      const isNew = rand() < tr.newShare * (c.ramp ? 1 + 1.2 * (1 - ramp) : 1) ? 1 : 0;
      const lead = pick(tr.lead);
      const ns = rand() < noShowOf(c, ci, mi, wd, h, ti, lead, isNew) ? 1 : 0;
      appts.push(pack(mi, wd * 10 + h, t % 60 ? 1 : 0, di, ti, lead, ns, isNew));
      if (!ns && ti === T.checkup) checkupsAttended[di][mi]++;
      t += tr.minutes;
    }
  }
}

// ------------------------------------------------------------------ recall
// A patient seen for a check-up is due back six months later. `due` counts recalls falling due in a
// month (the first six months use the book of check-ups from before the data starts, estimated from
// the same months a year on); `kept` counts those who came back within the month they were due.
const keepRate = { centro: 0.54, juriquilla: 0.58, refugio: 0.56, milenio: 0.47, corregidora: 0.41 };
const due = [], kept = [];
for (let mi = 0; mi < months.length; mi++) {
  for (let di = 0; di < dentists.length; di++) {
    const d = dentists[di];
    const c = clinics.find((x) => x.id === d.clinic);
    const src = mi >= 6 ? checkupsAttended[di][mi - 6] : checkupsAttended[di][mi + 6] * 0.9;
    const n = Math.round(src * 0.93 * noise(0.05));
    let rate = keepRate[d.clinic] * d.skill;
    if (c.reminders != null && mi >= c.reminders) rate += 0.14;
    due.push(n);
    kept.push(Math.min(n, Math.round(n * rate * noise(0.06))));
  }
}

// ------------------------------------------------------------------ write
const bytes = Buffer.alloc(appts.length * 3);
appts.forEach((v, i) => {
  bytes[i * 3] = v & 255;
  bytes[i * 3 + 1] = (v >> 8) & 255;
  bytes[i * 3 + 2] = (v >> 16) & 255;
});

const data = {
  note: 'Invented data for the Molara Dental demo dashboard. Generated by scripts/gen-clinic-data.mjs; do not edit by hand.',
  currency: 'USD',
  months,
  firstHour: FIRST_HOUR,
  closeHour,
  // openDays: index = month * 6 + weekday (Mon..Sat); days the chain was open.
  openDays: openDays.flat(),
  clinics: clinics.map(({ id, name, chairs, price }) => ({ id, name, chairs, price })),
  dentists: dentists.map(({ id, title, name, clinic, role, days }) => ({ id, title, name, clinic, role, days })),
  treatments: treatments.map(({ id, en, es, minutes, price }) => ({ id, en, es, minutes, price })),
  // 3 bytes per appointment, little-endian. Bits (low to high): month 5 | slot 6 (weekday * 10 + hour
  // from firstHour) | starts on the half hour 1 | dentist 4 | treatment 3 | lead-time bucket 3 |
  // no-show 1 | new patient 1. Revenue is the treatment's price times the clinic's price factor.
  appointments: bytes.toString('base64'),
  // index = month * dentists + dentist
  recall: { due, kept },
};

writeFileSync(new URL('../src/demos/clinic/data.json', import.meta.url), JSON.stringify(data));

// A quick read of what came out, to keep the story honest.
const dec = (v) => ({ mi: v & 31, slot: (v >> 5) & 63, di: (v >> 12) & 15, ti: (v >> 16) & 7, lead: (v >> 19) & 7, ns: (v >> 22) & 1, nw: (v >> 23) & 1 });
const rows = appts.map(dec);
const rate = (xs) => (xs.filter((r) => r.ns).length / xs.length * 100).toFixed(1) + '%';
const revenue = rows.filter((r) => !r.ns).reduce((a, r) => a + treatments[r.ti].price * clinics.find((c) => c.id === dentists[r.di].clinic).price, 0);
console.log(`appointments ${rows.length}, no-show ${rate(rows)}, revenue $${(revenue / 1e6).toFixed(2)}M, base64 ${(data.appointments.length / 1024).toFixed(0)} KB`);
console.log('no-show by clinic', clinics.map((c) => `${c.id} ${rate(rows.filter((r) => dentists[r.di].clinic === c.id))}`).join(', '));
console.log('no-show by lead', [0, 1, 2, 3, 4, 5].map((l) => rate(rows.filter((r) => r.lead === l))).join(', '));
console.log('juriquilla before/after reminders', rate(rows.filter((r) => dentists[r.di].clinic === 'juriquilla' && r.mi < 14)), rate(rows.filter((r) => dentists[r.di].clinic === 'juriquilla' && r.mi >= 14)));
for (const c of clinics) {
  const ds = dentists.filter((d) => d.clinic === c.id);
  let used = 0, cap = 0;
  for (let mi = 0; mi < months.length; mi++) for (let wd = 0; wd < 6; wd++) cap += openDays[mi][wd] * (closeHour[wd] - FIRST_HOUR) * 60 * c.chairs;
  for (const r of rows) if (!r.ns && dentists[r.di].clinic === c.id) used += treatments[r.ti].minutes;
  console.log(`${c.id}: chair utilisation ${(used / cap * 100).toFixed(1)}%, dentists ${ds.length}`);
}
const dueAll = due.reduce((a, b) => a + b, 0), keptAll = kept.reduce((a, b) => a + b, 0);
console.log(`recall kept ${(keptAll / dueAll * 100).toFixed(1)}% of ${dueAll}; new-patient visits ${rows.filter((r) => r.nw && !r.ns).length}`);

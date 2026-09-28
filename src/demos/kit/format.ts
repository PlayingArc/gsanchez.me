// Locale-aware formatting shared by the demo dashboards.
// `/en` pages show USD, `/es` pages show MXN at a fixed invented rate; the data is stored in USD.

export type Locale = 'en' | 'es';

export const USD_TO_MXN = 18.2;

const intlLocale = (l: Locale) => (l === 'en' ? 'en-US' : 'es-MX');

export function makeFormat(locale: Locale) {
  const tag = intlLocale(locale);
  const currency = locale === 'en' ? 'USD' : 'MXN';
  const rate = locale === 'en' ? 1 : USD_TO_MXN;

  const moneyFull = new Intl.NumberFormat(tag, { style: 'currency', currency, maximumFractionDigits: 0 });
  const moneyCents = new Intl.NumberFormat(tag, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Compact currency as "$91.1M" / "$91.1 M": es-MX's own compact currency style ("91.1 M$") reads oddly in Mexico.
  const compact = new Intl.NumberFormat(tag, { notation: 'compact', maximumFractionDigits: 1, trailingZeroDisplay: 'stripIfInteger' });
  const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
  const dec1 = new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const pct0 = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 });
  const pct1 = new Intl.NumberFormat(tag, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const monthShort = new Intl.DateTimeFormat(tag, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const monthLong = new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const monthOnly = new Intl.DateTimeFormat(tag, { month: 'short', timeZone: 'UTC' });

  const toDate = (ym: string) => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1));
  const tidy = (s: string) => s.replace('.', ''); // es-MX writes "sept." / "ago."

  return {
    locale,
    currency,
    /** Converts a stored USD amount into the page's currency. */
    fx: (usd: number) => usd * rate,
    money: (usd: number) => moneyFull.format(usd * rate),
    moneyCents: (usd: number) => moneyCents.format(usd * rate),
    moneyShort: (usd: number) => `${usd < 0 ? '−' : ''}$${compact.format(Math.abs(usd * rate))}`,
    int: (v: number) => int.format(v),
    dec1: (v: number) => dec1.format(v),
    pct: (v: number) => pct0.format(v),
    pct1: (v: number) => pct1.format(v),
    /** Signed change, e.g. "+4.2%" / "−1.3 pp". */
    change: (v: number, unit: '%' | 'pp' = '%') => {
      const body = unit === '%' ? pct1.format(Math.abs(v)) : `${dec1.format(Math.abs(v * 100))} pp`;
      return `${v > 0 ? '+' : v < 0 ? '−' : '±'}${body}`;
    },
    month: (ym: string) => tidy(monthShort.format(toDate(ym))),
    monthLong: (ym: string) => monthLong.format(toDate(ym)),
    monthOnly: (ym: string) => tidy(monthOnly.format(toDate(ym))),
    range: (a: string, b: string) => (a === b ? tidy(monthShort.format(toDate(a))) : `${tidy(monthShort.format(toDate(a)))} – ${tidy(monthShort.format(toDate(b)))}`),
  };
}

export type Format = ReturnType<typeof makeFormat>;

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

// Every indexable page, each with its other-language twin. Bare / and /demos/* only redirect by language
// (noindex), so x-default is the English page, never the redirect (#57).
import type { APIRoute } from 'astro';
import { locales } from '../data/site';

const moneyOnRails = ['overview', 'money-flow', 'plan', 'plan-quality'].map((s) => `/demos/money-on-rails/${s}`);
const bilingual = ['/', '/demos/retail/', '/demos/clinic/', ...moneyOnRails];
const single = ['/demos/tarimas/']; // App Tarimas is Spanish only

export const GET: APIRoute = ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const alternate = (lang: string, href: string) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>\n`;
  const entry = (loc: string, alternates = '') => `  <url>\n    <loc>${loc}</loc>\n${alternates}  </url>\n`;
  const urls = [
    ...bilingual.flatMap((path) => {
      const alternates =
        locales.map((l) => alternate(l, abs(`/${l}${path}`))).join('') + alternate('x-default', abs(`/en${path}`));
      return locales.map((l) => entry(abs(`/${l}${path}`), alternates));
    }),
    ...single.map((path) => entry(abs(path))),
  ];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('') +
    '</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};

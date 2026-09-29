// Every indexable page, each with its other-language twin. Bare / and /demos/* only redirect by language.
import type { APIRoute } from 'astro';
import { locales } from '../data/site';

const bilingual = ['/', '/demos/retail/', '/demos/clinic/'];
const single = ['/demos/tarimas/']; // App Tarimas is Spanish only

export const GET: APIRoute = ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const entry = (loc: string, alternates = '') => `  <url>\n    <loc>${loc}</loc>\n${alternates}  </url>\n`;
  const urls = [
    ...bilingual.flatMap((path) => {
      const alternates = locales
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(`/${l}${path}`)}"/>\n`)
        .join('');
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

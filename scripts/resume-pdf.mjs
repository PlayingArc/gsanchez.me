// Prints resume/resume.html to public/gerardo-sanchez-resume.pdf, the résumé the site links.
//   npm run resume                        # uses /usr/bin/chromium
//   CHROME=/path/to/chrome npm run resume
// Needs network for the Google Fonts. Re-run it whenever resume/resume.html changes, and keep that
// file in step with src/data/site.ts. Fails if the page overflows Letter, so it stays one page.
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const executablePath = process.env.CHROME ?? '/usr/bin/chromium';
const source = resolve('resume/resume.html');
const out = resolve('public/gerardo-sanchez-resume.pdf');

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();
await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

// How far the lowest section reaches into the page's bottom margin (or past the page).
const overflow = await page.evaluate(() => {
  const el = document.querySelector('.page');
  const limit = el.getBoundingClientRect().bottom - parseFloat(getComputedStyle(el).paddingBottom);
  const lowest = Math.max(...[...el.querySelectorAll('section')].map((s) => s.getBoundingClientRect().bottom));
  return Math.ceil(Math.max(lowest - limit, el.scrollHeight - el.clientHeight));
});
if (overflow > 0) {
  await browser.close();
  throw new Error(`resume/resume.html overflows the page by ${overflow}px; trim it to keep one page.`);
}

await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`${out} ← ${source}`);

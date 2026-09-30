// Screenshots the built site into the 1200×630 share pictures under public/og/ (Open Graph, Twitter).
// Serve a build first (`npm run build && npm run preview`), then:
//   CHROME=/path/to/chrome npm run og:images [-- http://localhost:4321]
// Re-run it when the hero, a dashboard, Money on Rails or App Tarimas changes how it looks.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:4321';
const executablePath = process.env.CHROME;
if (!executablePath) throw new Error('Set CHROME to a Chrome or Chromium executable.');
const out = resolve('public/og');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath });
const context = await browser.newContext({ viewport: { width: 1200, height: 630 } });

async function shoot(name, path, prepare = async () => {}) {
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await prepare(page);
  await page.waitForTimeout(2500); // let the ASCII and chart intros settle
  await page.screenshot({ path: `${out}/${name}.png` });
  await page.close();
  console.log(`${name}.png ← ${path}`);
}

// The hero's live clock would freeze at whatever time the picture was taken.
const hideClock = (page) => page.addStyleTag({ content: '[data-clock] { visibility: hidden; }' });

// An order with two products on the first pallet, so the label shows real barcodes.
async function fillTarimas(page) {
  await page.getByPlaceholder('1001').fill('4500123456');
  await page.getByPlaceholder('1234').fill('7482');
  for (const [i, qty] of [[0, '12'], [1, '8'], [2, '20']]) {
    await page.locator('.ant-select').first().click();
    await page.locator('.ant-select-item-option').nth(i).click();
    await page.locator('.ant-input-number input').first().fill(qty);
    await page.getByRole('button', { name: /Agregar item/ }).click();
  }
  await page.getByRole('button', { name: /Agregar tarima/ }).click();
  await page.getByRole('button', { name: /Agregar tarima/ }).click();
  for (const product of ['Tortilla Blanca', 'Tortilla Amarilla']) {
    const from = await page.getByText(product, { exact: true }).last().boundingBox();
    const to = await page.getByText('Tarima 1').boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 5 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  await page.getByText('Tarima 1').click();
}

for (const l of ['en', 'es']) {
  await shoot(`home-${l}`, `/${l}/`, hideClock);
  await shoot(`retail-${l}`, `/${l}/demos/retail/`);
  await shoot(`clinic-${l}`, `/${l}/demos/clinic/`);
  await shoot(`money-${l}`, `/${l}/demos/money-on-rails/overview`);
}
await shoot('tarimas', '/demos/tarimas/', fillTarimas);

await browser.close();

// Rebuilds the Money on Rails demo (`npm run demo:build`) and copies each language to
// public/{en,es}/demos/money-on-rails/, so the TV can play it live from this site.
// Builds from a fresh clone of the repo's main branch, or from a local checkout set in MONEY_DIR.
// Then gives each screen gsanchez.me's description, canonical and share tags. `--meta-only` does just that.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO = 'https://github.com/PlayingArc/money-on-rails.git';
const locales = ['en', 'es'];
const target = (l) => resolve(`public/${l}/demos/money-on-rails`);
const screens = ['index', 'overview', 'money-flow', 'plan', 'plan-quality', 'settings'];

const run = (cmd, args, cwd, env) => execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

const copy = {
  en: {
    ogLocale: 'en_US',
    description:
      'Demo of Money on Rails, analytics for YNAB: how closely you followed your plan, how well the plan is built, and where the money went. On an invented household, no sign-in. Built by Gerardo Sanchez.',
  },
  es: {
    ogLocale: 'es_MX',
    description:
      'Demo de Money on Rails, analítica para YNAB: qué tan bien seguiste tu plan, qué tan bien está armado y a dónde se fue el dinero. Con un hogar inventado, sin iniciar sesión. Hecho por Gerardo Sanchez.',
  },
};

function addMeta() {
  for (const l of locales) {
    const { ogLocale, description } = copy[l];
    const image = `https://gsanchez.me/og/money-${l}.png`;
    for (const screen of screens) {
      const file = join(target(l), `${screen}.html`);
      if (!existsSync(file)) continue;
      const url = `https://gsanchez.me/${l}/demos/money-on-rails/${screen === 'index' ? '' : screen}`;
      let html = readFileSync(file, 'utf8');
      const title = html.match(/<title>([^<]*)<\/title>/)[1];
      const meta = [
        `<meta name="description" content="${description}"/>`,
        `<link rel="canonical" href="${url}"/>`,
        `<meta property="og:type" content="website"/>`,
        `<meta property="og:site_name" content="gsanchez.me"/>`,
        `<meta property="og:locale" content="${ogLocale}"/>`,
        `<meta property="og:url" content="${url}"/>`,
        `<meta property="og:title" content="${title}"/>`,
        `<meta property="og:description" content="${description}"/>`,
        `<meta property="og:image" content="${image}"/>`,
        `<meta property="og:image:width" content="1200"/>`,
        `<meta property="og:image:height" content="630"/>`,
        `<meta property="og:image:alt" content="${title}"/>`,
        `<meta name="twitter:card" content="summary_large_image"/>`,
        `<meta name="twitter:title" content="${title}"/>`,
        `<meta name="twitter:description" content="${description}"/>`,
        `<meta name="twitter:image" content="${image}"/>`,
        `<meta name="twitter:image:alt" content="${title}"/>`,
      ].join('');
      // Drop the build's own description (or tags from an earlier run), then add ours after the title.
      html = html
        .replace(/<meta name="description"[^>]*>/g, '')
        .replace(/<link rel="canonical"[^>]*>/g, '')
        .replace(/<meta (property="og:|name="twitter:)[^>]*>/g, '')
        .replace(/<\/title>/, `</title>${meta}`);
      writeFileSync(file, html);
    }
    console.log(`Share tags written to ${target(l)}`);
  }
}

if (process.argv.includes('--meta-only')) {
  addMeta();
  process.exit(0);
}

let source = process.env.MONEY_DIR && resolve(process.env.MONEY_DIR);
let scratch;
if (!source) {
  scratch = mkdtempSync(join(tmpdir(), 'money-'));
  source = join(scratch, 'app');
  run('git', ['clone', '--depth', '1', REPO, source]);
}

try {
  run('npm', ['ci', '--no-audit', '--no-fund'], source);
  // The demo builds only static files from invented data: no database, YNAB, OpenAI or secrets.
  run('npm', ['run', 'demo:build'], source, {
    DEMO_BASE_PATH: '/{locale}/demos/money-on-rails',
    DEMO_ORIGIN: 'https://gsanchez.me',
  });
  for (const l of locales) {
    rmSync(target(l), { recursive: true, force: true });
    cpSync(join(source, '.next-demo', l), target(l), { recursive: true });
    rmSync(join(target(l), 'robots.txt'), { force: true }); // gsanchez.me has its own
    console.log(`Money on Rails demo (${l}) copied to ${target(l)}`);
  }
  addMeta();
} finally {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}

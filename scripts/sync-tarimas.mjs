// Rebuilds the App Tarimas demo (`vite build --mode demo`) and copies it to public/demos/tarimas/.
// Builds from a fresh clone of the repo's main branch, or from a local checkout set in TARIMAS_DIR.
// Then gives the page gsanchez.me's description, canonical and share tags. `--meta-only` does just that.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO = 'https://github.com/PlayingArc/GSL.Tortiregias.AppTarimasWalmart.git';
const target = resolve('public/demos/tarimas');

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

const url = 'https://gsanchez.me/demos/tarimas/';
const title = 'App Tarimas: etiquetas de tarimas para Walmart';
const description =
  'Demo de App Tarimas: captura un pedido de Walmart, reparte sus cajas en tarimas e imprime la etiqueta logística de cada una. Con productos de ejemplo. Hecho por Gerardo Sanchez.';
const image = 'https://gsanchez.me/og/tarimas.png';
const meta = `
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="gsanchez.me" />
    <meta property="og:locale" content="es_MX" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${title}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${title}" />`;

function addMeta() {
  const file = join(target, 'index.html');
  const html = readFileSync(file, 'utf8')
    .replace(/\n\s*<meta name="description"[\s\S]*?<meta name="twitter:image:alt"[^>]*>/, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>${meta}`);
  writeFileSync(file, html);
  console.log(`Share tags written to ${file}`);
}

if (process.argv.includes('--meta-only')) {
  addMeta();
  process.exit(0);
}

let source = process.env.TARIMAS_DIR && resolve(process.env.TARIMAS_DIR);
let scratch;
if (!source) {
  scratch = mkdtempSync(join(tmpdir(), 'tarimas-'));
  source = join(scratch, 'app');
  run('git', ['clone', '--depth', '1', REPO, source]);
}

try {
  run('npm', ['ci', '--no-audit', '--no-fund'], source);
  run('npm', ['exec', '--', 'vite', 'build', '--mode', 'demo'], source);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(source, 'dist'), target, { recursive: true });
  console.log(`App Tarimas demo copied to ${target}`);
  addMeta();
} finally {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}

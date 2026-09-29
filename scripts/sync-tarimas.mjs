// Rebuilds the App Tarimas demo (`vite build --mode demo`) and copies it to public/demos/tarimas/.
// Builds from a fresh clone of the repo's main branch, or from a local checkout set in TARIMAS_DIR.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO = 'https://github.com/PlayingArc/GSL.Tortiregias.AppTarimasWalmart.git';
const target = resolve('public/demos/tarimas');

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

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
} finally {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}

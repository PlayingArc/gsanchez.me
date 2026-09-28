// Text that decodes from ASCII glyphs into its real characters.
//   [data-scramble]        decodes once when scrolled into view
//   [data-scramble-hover]  re-decodes on hover/focus (links, labels)
//   [data-reveal]          slides up, then decodes any [data-scramble-child] inside
//
// The real text keeps its place in the layout (just hidden) while an overlay
// plays the effect on top, so nothing around it ever moves.

const GLYPHS = '#%&*+=-:/\\<>[]{}░▒▚▀×÷01';
const STEP_MS = 70; // how often an unsettled glyph changes
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

type Run = { raf: number; done: boolean };
const runs = new WeakMap<HTMLElement, Run>();

const hash = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const esc = (c: string) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);

export function scramble(el: HTMLElement, duration = 900, { restart = true } = {}) {
  if (reduced()) return;
  const prev = runs.get(el);
  if (prev && !prev.done && !restart) return;
  if (prev) cancelAnimationFrame(prev.raf);

  const text = (el.dataset.text ??= el.textContent ?? '');
  const chars = [...text];

  // Settle order: mostly left to right, with some jitter so it feels organic.
  const settle = chars.map((_, i) => Math.min(0.15 + (i / chars.length) * 0.65 + hash(i, text.length) * 0.2, 1));

  el.innerHTML = `<span class="scr__real">${text.split('').map(esc).join('')}</span><span class="scr__fx" aria-hidden="true"></span>`;
  el.classList.add('is-scrambling');
  const fx = el.lastElementChild as HTMLElement;

  const run: Run = { raf: 0, done: false };
  runs.set(el, run);
  const start = performance.now();

  const tick = (now: number) => {
    const elapsed = now - start;
    const p = Math.min(elapsed / duration, 1);
    const step = Math.floor(elapsed / STEP_MS);
    let html = '';
    let glyphs = '';
    chars.forEach((c, i) => {
      if (c === ' ' || p >= settle[i]) {
        if (glyphs) html += `<span class="scr__g">${glyphs}</span>`;
        glyphs = '';
        html += esc(c);
      } else {
        glyphs += esc(GLYPHS[Math.floor(hash(i, step) * GLYPHS.length)]);
      }
    });
    if (glyphs) html += `<span class="scr__g">${glyphs}</span>`;
    fx.innerHTML = html;

    if (p < 1) run.raf = requestAnimationFrame(tick);
    else {
      run.done = true;
      el.textContent = text;
      el.classList.remove('is-scrambling');
    }
  };
  run.raf = requestAnimationFrame(tick);
}

export function mountScramble() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        const delay = Number(el.dataset.delay ?? 0);
        const duration = Number(el.dataset.duration ?? 1600);
        setTimeout(() => {
          el.classList.add('is-in');
          const targets = el.matches('[data-scramble]')
            ? [el]
            : [...el.querySelectorAll<HTMLElement>('[data-scramble-child]')];
          targets.forEach((t) => scramble(t, duration));
        }, delay);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  document.querySelectorAll<HTMLElement>('[data-scramble], [data-reveal]').forEach((el) => io.observe(el));

  document.querySelectorAll<HTMLElement>('[data-scramble-hover]').forEach((el) => {
    const target = el.querySelector<HTMLElement>('[data-scramble-target]') ?? el;
    const play = () => scramble(target, 650, { restart: false });
    el.addEventListener('pointerenter', play);
    el.addEventListener('focus', play);
  });
}

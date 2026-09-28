// The stacked wall of TVs: scales each dashboard to its screen, powers
// the TVs on when the wall scrolls into view, keeps the screens ticking,
// shows the hovered project's details, and zooms into a screen on click.

import type { Preview } from '../data/site';
import { renderDash, DASH_W, DASH_H } from './dashboards';
import { scramble } from './scramble';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountWall() {
  const wall = document.querySelector<HTMLElement>('[data-wall]');
  if (!wall) return;
  const tvs = [...wall.querySelectorAll<HTMLAnchorElement>('[data-tv]')];
  const panels = [...document.querySelectorAll<HTMLElement>('[data-panel]')];
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;

  // Fit the fixed-size dashboards to whatever size each screen is.
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      el.style.setProperty('--k', String(el.clientWidth / DASH_W));
    }
  });
  tvs.forEach((tv) => ro.observe(tv.querySelector('[data-dash]')!));

  // Power on, one TV at a time, the first time the wall is seen.
  let visible = false;
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (!visible || wall.classList.contains('is-powered')) return;
      wall.classList.add('is-powered');
      const order = [2, 0, 3, 1].filter((i) => i < tvs.length);
      tvs.forEach((_, i) => order.includes(i) || order.push(i));
      order.forEach((i, k) => setTimeout(() => tvs[i].classList.add('is-on'), reduced() ? 0 : 250 + k * 220));
    },
    { threshold: 0.25 },
  ).observe(wall);

  // Screens tick along while in view.
  if (!reduced()) {
    setInterval(() => {
      if (!visible || document.hidden) return;
      const t = now();
      tvs.forEach((tv) => {
        tv.querySelector('[data-dash]')!.innerHTML = renderDash(tv.dataset.preview as Preview, t);
      });
    }, 1600);
  }

  // Details for the TV under the pointer (or keyboard focus).
  let active = 0;
  const show = (i: number) => {
    wall.classList.add('is-hovering');
    tvs.forEach((tv) => tv.classList.toggle('is-active', Number(tv.dataset.tv) === i));
    if (i === active) return;
    active = i;
    panels.forEach((p) => {
      const on = Number(p.dataset.panel) === i;
      p.hidden = !on;
      if (on) p.querySelectorAll<HTMLElement>('[data-scramble-child]').forEach((el) => scramble(el, 900));
    });
  };
  const clear = () => {
    wall.classList.remove('is-hovering');
    tvs.forEach((tv) => tv.classList.remove('is-active'));
  };
  tvs.forEach((tv) => {
    const i = Number(tv.dataset.tv);
    tv.addEventListener('pointerenter', () => show(i));
    tv.addEventListener('focus', () => show(i));
    tv.addEventListener('blur', clear);
    tv.addEventListener('click', (e) => {
      e.preventDefault();
      launch(tv, now());
    });
  });
  wall.addEventListener('pointerleave', clear);

  document.querySelectorAll<HTMLAnchorElement>('[data-launch]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const tv = tvs.find((x) => x.dataset.tv === a.dataset.launch);
      if (tv) launch(tv, now());
    }),
  );
}

// Zoom from the TV screen to fill the viewport. The CRT filter fades away on
// the way in, so you arrive at the plain, modern dashboard.
function launch(tv: HTMLAnchorElement, t: number) {
  if (document.querySelector('.launch')) return;
  const href = tv.getAttribute('href') ?? '#';
  const title = tv.getAttribute('aria-label')?.split(' — ')[0] ?? '';
  const from = tv.querySelector('.tv__screen')!.getBoundingClientRect();

  // Fit the dashboard above the notice bar.
  const room = innerHeight - 72;
  const fw = Math.min(innerWidth, (room * DASH_W) / DASH_H);
  const fh = (fw * DASH_H) / DASH_W;
  const fx = (innerWidth - fw) / 2;
  const fy = (room - fh) / 2;
  const startTransform = `translate(${from.left - fx}px, ${from.top - fy}px) scale(${from.width / fw})`;

  const veil = document.createElement('div');
  veil.className = 'launch';
  veil.innerHTML = `
    <div class="launch__screen" style="left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;--k:${fw / DASH_W};transform:${startTransform}">
      <div class="launch__img">${renderDash(tv.dataset.preview as Preview, t)}</div>
      <div class="tv__fx"></div>
    </div>
    <div class="launch__bar mono" role="status">
      <span>${title} — demo coming soon. Set <code>href</code> in src/data/site.ts</span>
      <button type="button">Close · Esc</button>
    </div>`;
  document.body.append(veil);
  document.documentElement.classList.add('is-launching');
  const screen = veil.querySelector<HTMLElement>('.launch__screen')!;

  const close = () => {
    removeEventListener('keydown', onKey);
    veil.classList.remove('is-open');
    screen.style.transform = startTransform;
    setTimeout(() => {
      veil.remove();
      document.documentElement.classList.remove('is-launching');
      tv.focus({ preventScroll: true });
    }, reduced() ? 0 : 650);
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();

  veil.getBoundingClientRect(); // commit the start state so the zoom transitions
  veil.classList.add('is-open');
  screen.style.transform = 'none';

  setTimeout(() => {
    // Real links go straight to the demo; placeholders stay and explain.
    if (!href.startsWith('#')) {
      location.href = href;
      return;
    }
    veil.classList.add('is-arrived');
    addEventListener('keydown', onKey);
    veil.querySelector('button')!.addEventListener('click', close);
    veil.addEventListener('click', (e) => e.target === veil && close());
  }, reduced() ? 0 : 800);
}

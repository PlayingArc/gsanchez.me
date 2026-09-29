// The stacked wall of TVs: scales each screen to its tube, powers the TVs on
// when the wall scrolls into view, shows the hovered project's details, and
// zooms into a screen on click before opening the real thing.

import { DASH_W, DASH_H } from './dashboards';
import { scramble } from './scramble';
import { isTouch } from './touch';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountWall() {
  const wall = document.querySelector<HTMLElement>('[data-wall]');
  if (!wall) return;
  const tvs = [...wall.querySelectorAll<HTMLAnchorElement>('[data-tv]')];
  const panels = [...document.querySelectorAll<HTMLElement>('[data-panel]')];

  // Fit the fixed-size screens to whatever size each tube is.
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      el.style.setProperty('--k', String(el.clientWidth / DASH_W));
    }
  });
  tvs.forEach((tv) => ro.observe(tv.querySelector('[data-dash]')!));

  // Power on, one TV at a time, the first time the wall is seen.
  new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting || wall.classList.contains('is-powered')) return;
      wall.classList.add('is-powered');
      const order = [2, 0, 3, 1].filter((i) => i < tvs.length);
      tvs.forEach((_, i) => order.includes(i) || order.push(i));
      order.forEach((i, k) => setTimeout(() => tvs[i].classList.add('is-on'), reduced() ? 0 : 250 + k * 220));
    },
    { threshold: 0.25 },
  ).observe(wall);

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
    tv.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && show(i));
    tv.addEventListener('focus', () => show(i));
    tv.addEventListener('blur', clear);
    tv.addEventListener('click', (e) => {
      e.preventDefault();
      launch(tv);
    });
  });
  wall.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && clear());

  if (isTouch()) channelSurf(wall, tvs, panels, show);

  document.querySelectorAll<HTMLAnchorElement>('[data-launch]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const tv = tvs.find((x) => x.dataset.tv === a.dataset.launch);
      if (tv) launch(tv);
    }),
  );

  // Coming back with the Back button can restore the page mid-zoom; clear it.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelector('.launch')?.remove();
    document.documentElement.classList.remove('is-launching');
  });
}

// Zoom from the TV screen to fill the viewport, then open the real thing. The
// CRT filter fades away on the way in, so you arrive at the plain screen.
function launch(tv: HTMLAnchorElement) {
  if (document.querySelector('.launch')) return;
  const from = tv.querySelector('.tv__screen')!.getBoundingClientRect();

  const fw = Math.min(innerWidth, (innerHeight * DASH_W) / DASH_H);
  const fh = (fw * DASH_H) / DASH_W;
  const fx = (innerWidth - fw) / 2;
  const fy = (innerHeight - fh) / 2;
  const startTransform = `translate(${from.left - fx}px, ${from.top - fy}px) scale(${from.width / fw})`;

  const veil = document.createElement('div');
  veil.className = 'launch';
  veil.innerHTML = `
    <div class="launch__screen" style="left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;--k:${fw / DASH_W};transform:${startTransform}">
      <div class="launch__img">${tv.querySelector('[data-dash]')!.innerHTML}</div>
      <div class="tv__fx"></div>
    </div>`;
  document.body.append(veil);
  document.documentElement.classList.add('is-launching');
  const screen = veil.querySelector<HTMLElement>('.launch__screen')!;

  veil.getBoundingClientRect(); // commit the start state so the zoom transitions
  veil.classList.add('is-open');
  screen.style.transform = 'none';

  setTimeout(() => (location.href = tv.href), reduced() ? 0 : 800);
}

// Touch devices have no hover to pick a TV, so while the wall is on screen the
// TVs take turns, like flicking through channels, and the caption follows. The
// caption keeps the height of its tallest panel so switching never moves the
// page under the finger.
function channelSurf(wall: HTMLElement, tvs: HTMLElement[], panels: HTMLElement[], show: (i: number) => void) {
  const caption = panels[0]?.parentElement;
  const fit = () => {
    if (!caption) return;
    caption.style.minHeight = '';
    let tallest = 0;
    panels.forEach((p) => {
      const was = p.hidden;
      p.hidden = false;
      tallest = Math.max(tallest, caption.getBoundingClientRect().height);
      p.hidden = was;
    });
    // Measured with one panel shown at a time, so hide all but the active one.
    caption.style.minHeight = `${Math.ceil(tallest)}px`;
  };
  panels.forEach((p) => (p.hidden = true));
  fit();
  panels.forEach((p, k) => (p.hidden = k !== 0));
  addEventListener('resize', fit);

  const order = tvs.map((tv) => Number(tv.dataset.tv));
  let k = 0;
  let timer = 0;
  const step = () => {
    show(order[k % order.length]);
    k++;
  };
  new IntersectionObserver(
    ([e]) => {
      clearInterval(timer);
      if (!e.isIntersecting || reduced()) return;
      step();
      timer = window.setInterval(step, 3200);
    },
    { threshold: 0.5 },
  ).observe(wall);
}

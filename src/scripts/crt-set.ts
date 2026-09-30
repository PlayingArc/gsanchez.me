// The TV: one CRT set you flip through with channel buttons. Powers on to colour
// bars when it scrolls into view, then tunes to CH 01. Tuning plays a burst of
// snow, swaps the screen, flashes the channel number and shows the channel's
// details. Work hosted on this site plays live on the screen (a same-origin
// iframe you can hover and click); stepping inside zooms the screen to fill the
// viewport before opening the real thing.

import { DASH_W, DASH_H } from './dashboards';
import { scramble } from './scramble';

type Rect = { left: number; top: number; width: number; height: number }; // % of the render

/** The render (prototype/single-crt branch, prototype/crt-premade/): the IBM PCjr Color
 *  Display, "IBM PCjr 4863 Computer" by Freepoly.org, CC BY 4.0. Its tube opening was
 *  measured off the render's alpha; the keys are its contrast, tint and brightness
 *  controls and its power button. */
export const CRT = {
  body: '/tv/ibm-pcjr.webp',
  glass: '/tv/ibm-pcjr-glass.webp',
  source: 'https://sketchfab.com/3d-models/ibm-pcjr-4863-computer-freepolyorg-1c3c3cd0643d44d49a1771048da74c62',
  image: [1200, 1282] as const,
  screen: { left: 12.9, top: 5.9, width: 75.8, height: 52.3, radius: '6% / 8%' },
  keys: [
    { left: 56.25, top: 64.7, width: 3.4, height: 3.1 },
    { left: 62.1, top: 64.7, width: 3.4, height: 3.1 },
    { left: 67.1, top: 64.7, width: 3.4, height: 3.1 },
    { left: 77.5, top: 63.8, width: 5, height: 4.4 },
  ] as Rect[],
};

// Live demos lay out at this desktop width, then scale down into the tube.
const LIVE_W = 1024;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (i: number) => String(i + 1).padStart(2, '0');

export function mountCrt() {
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  if (!stage) return;
  const crt = stage.querySelector<HTMLElement>('[data-crt]')!;
  const screen = crt.querySelector<HTMLElement>('.crt__screen')!;
  const chans = [...crt.querySelectorAll<HTMLElement>('[data-crt-ch]')];
  const panels = [...stage.querySelectorAll<HTMLElement>('[data-panel]')];
  const gos = [...stage.querySelectorAll<HTMLElement>('[data-crt-go]')];
  const osd = crt.querySelector<HTMLElement>('[data-crt-osd]')!;
  const tag = crt.querySelector<HTMLElement>('[data-crt-tag]')!;

  // Fit the 640×480 static screens inside the tube, centred, and size the live ones.
  new ResizeObserver(() => {
    const w = screen.clientWidth;
    const h = screen.clientHeight;
    const k = Math.min(w / DASH_W, h / DASH_H);
    screen.style.setProperty('--k', String(k));
    screen.style.setProperty('--ox', `${(w - DASH_W * k) / 2}px`);
    screen.style.setProperty('--oy', `${(h - DASH_H * k) / 2}px`);
    screen.style.setProperty('--lk', String(w / LIVE_W));
    screen.style.setProperty('--lh', `${(h * LIVE_W) / w}px`);
  }).observe(screen);

  let current = -1;
  let osdTimer = 0;
  let tuneTimer = 0;

  // What the corner tag says about the channel on air.
  const say = () => {
    if (current < 0) return;
    const c = chans[current];
    const live = c.classList.contains('is-live');
    tag.textContent = !c.dataset.live
      ? `▶ ${tag.dataset.previewText}`
      : live
        ? `● ${tag.dataset.liveText}`
        : `◌ ${tag.dataset.tuningText}`;
    tag.classList.toggle('is-live', live);
  };

  // Made the first time its channel is tuned and then kept, so a demo's state
  // survives flipping away and back.
  const goLive = (c: HTMLElement) => {
    const href = c.dataset.live;
    if (!href || c.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.className = 'crt__live';
    f.title = panels[Number(c.dataset.crtCh)]?.querySelector('.panel__title')?.textContent?.trim() ?? href;
    // astro dev doesn't serve a public/ folder's index.html (Cloudflare does), e.g. /demos/tarimas/.
    f.src = import.meta.env.DEV && href.startsWith('/demos/') ? `${href}index.html` : href;
    f.addEventListener('load', () => {
      const doc = f.contentDocument;
      if (doc) {
        // On the set, drop the demo's own "back to gsanchez.me" bar and its scrollbars.
        const st = doc.createElement('style');
        st.textContent = '.dz-frame{display:none!important} html{scrollbar-width:none} ::-webkit-scrollbar{display:none}';
        doc.head.append(st);
        // A link out of the demo takes the whole page there, not the little screen.
        doc.addEventListener(
          'click',
          (e) => {
            const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
            if (!a) return;
            const u = new URL(a.href);
            if (u.origin !== location.origin || u.pathname !== f.contentWindow!.location.pathname) {
              e.preventDefault();
              location.href = u.href;
            }
          },
          true,
        );
      }
      c.classList.add('is-live');
      say();
    });
    c.append(f);
  };

  const land = (i: number) => {
    current = i;
    crt.classList.add('has-signal');
    stage.style.setProperty('--ch', String(i));
    chans.forEach((c, k) => (c.hidden = k !== i));
    gos.forEach((g) => g.setAttribute('aria-pressed', String(Number(g.dataset.crtGo) === i)));
    panels.forEach((p) => {
      const on = Number(p.dataset.panel) === i;
      p.hidden = !on;
      if (on) p.querySelectorAll<HTMLElement>('[data-scramble-child]').forEach((el) => scramble(el, 700));
    });
    osd.textContent = `CH ${pad(i)}`;
    crt.classList.add('show-osd');
    clearTimeout(osdTimer);
    osdTimer = window.setTimeout(() => crt.classList.remove('show-osd'), 1800);
    goLive(chans[i]);
    say();
  };

  const tune = (i: number) => {
    i = (i + chans.length) % chans.length;
    if (i === current) return;
    clearTimeout(tuneTimer);
    if (reduced()) return land(i);
    crt.classList.remove('is-tuning');
    void crt.offsetWidth; // restart the snow burst
    crt.classList.add('is-tuning');
    tuneTimer = window.setTimeout(() => {
      land(i);
      tuneTimer = window.setTimeout(() => crt.classList.remove('is-tuning'), 140);
    }, 260);
  };

  // Step into a channel: into a live demo where it is now (its filters, its tab).
  const enter = (i: number) => {
    let href = chans[i].dataset.href!;
    try {
      href = chans[i].querySelector('iframe')?.contentWindow?.location.href ?? href;
    } catch {}
    launch(screen, chans[i].querySelector('[data-dash]')!, href);
  };

  gos.forEach((g) => g.addEventListener('click', () => tune(Number(g.dataset.crtGo))));
  stage.querySelectorAll<HTMLElement>('[data-crt-step]').forEach((b) =>
    b.addEventListener('click', () => tune((current < 0 ? 0 : current) + Number(b.dataset.crtStep))),
  );
  crt.querySelector('[data-crt-enter]')!.addEventListener('click', () => (current < 0 ? tune(0) : enter(current)));
  // The details' "Step inside" and the index below.
  document.querySelectorAll<HTMLAnchorElement>('[data-launch]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      enter(Number(a.dataset.launch));
    }),
  );

  // Number keys pick a channel, +/- step, while the set is on screen.
  let visible = false;
  addEventListener('keydown', (e) => {
    if (!visible || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= chans.length) tune(n - 1);
    else if (e.key === '+' || e.key === '=') tune(current + 1);
    else if (e.key === '-') tune(current - 1);
  });

  // Power on to colour bars the first time the set is seen, then land on CH 01.
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (!e.isIntersecting || crt.classList.contains('is-on')) return;
      crt.classList.add('is-on');
      setTimeout(() => current < 0 && tune(0), reduced() ? 0 : 1300);
    },
    { threshold: 0.35 },
  ).observe(crt);

  // Coming back with the Back button can restore the page mid-zoom; clear it.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelector('.launch')?.remove();
    document.documentElement.classList.remove('is-launching');
  });
}

// Zoom from the screen to fill the viewport, then open the real thing. The CRT
// filter fades away on the way in, so you arrive at the plain screen.
function launch(screenEl: Element, dash: Element, href: string) {
  if (document.querySelector('.launch')) return;
  const from = screenEl.getBoundingClientRect();

  const fw = Math.min(innerWidth, (innerHeight * DASH_W) / DASH_H);
  const fh = (fw * DASH_H) / DASH_W;
  const fx = (innerWidth - fw) / 2;
  const fy = (innerHeight - fh) / 2;
  const startTransform = `translate(${from.left - fx}px, ${from.top - fy}px) scale(${from.width / fw})`;

  const veil = document.createElement('div');
  veil.className = 'launch';
  veil.innerHTML = `
    <div class="launch__screen" style="left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;--k:${fw / DASH_W};transform:${startTransform}">
      <div class="launch__img">${dash.innerHTML}</div>
      <div class="tv__fx"></div>
    </div>`;
  document.body.append(veil);
  document.documentElement.classList.add('is-launching');
  const screen = veil.querySelector<HTMLElement>('.launch__screen')!;

  veil.getBoundingClientRect(); // commit the start state so the zoom transitions
  veil.classList.add('is-open');
  screen.style.transform = 'none';

  setTimeout(() => (location.href = href), reduced() ? 0 : 800);
}

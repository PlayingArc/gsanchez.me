// The TV: one CRT set you flip through with channel buttons. Powers on to colour
// bars when it scrolls into view, then tunes to CH 01. Tuning plays a burst of
// snow, swaps the screen, flashes the channel number and shows the channel's
// details. Work hosted on this site plays live on the screen (a same-origin
// iframe you can hover and click); stepping inside switches the set off and the
// whole viewport on, as a big TV showing the real thing.

import { DASH_W, DASH_H } from './dashboards';
import { scramble } from './scramble';
import { isTouch } from './touch';

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
  /** The tube's bend (scripts/crt-curve-map.mjs): a displacement map, the largest shift it holds as
   *  a fraction of the screen's width, and how far each gun (red, green, blue) lands along it. */
  curve: { map: '/tv/ibm-pcjr-curve.png', scale: 0.1, guns: [1.012, 1, 0.988] as const },
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
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
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
    bend(w, h);
  }).observe(screen);

  // The filter works in the screen's pixels, so it's sized to it. It stays off until its map has
  // loaded: a browser that won't fetch it keeps the flat picture instead of losing it.
  const curve = document.querySelector<SVGFilterElement>('#crt-curve');
  const bend = (w: number, h: number) => {
    if (!curve) return;
    for (const el of [curve, curve.querySelector('feImage')!]) {
      el.setAttribute('width', String(w));
      el.setAttribute('height', String(h));
    }
    curve.querySelectorAll('feDisplacementMap').forEach((d, i) => d.setAttribute('scale', String(w * CRT.curve.scale * CRT.curve.guns[i])));
    curve.querySelector('feGaussianBlur')!.setAttribute('stdDeviation', String(Math.max(2, w / 220)));
  };
  const map = new Image();
  map.src = CRT.curve.map;
  map.decode().then(
    () => crt.classList.add('is-curved'),
    () => {},
  );

  // Hovering the screen with a mouse lets you try the live demo; leaving puts it back.
  let mouseOver = false;
  const tryLive = (e: PointerEvent) => {
    mouseOver = e.type === 'pointerenter' && e.pointerType === 'mouse';
    screen.querySelectorAll('iframe').forEach((f) => (f.inert = !mouseOver));
  };
  screen.addEventListener('pointerenter', tryLive);
  screen.addEventListener('pointerleave', tryLive);

  let current = -1;
  let osdTimer = 0;
  let tuneTimer = 0;

  // What the corner tag says about the channel on air.
  const say = () => {
    if (current < 0) return;
    const c = chans[current];
    const live = c.classList.contains('is-live');
    tag.textContent = !c.querySelector('iframe')
      ? `▶ ${tag.dataset.previewText}`
      : live
        ? `● ${tag.dataset.liveText}`
        : `◌ ${tag.dataset.tuningText}`;
    tag.classList.toggle('is-live', live);
  };

  // Made the first time its channel is tuned and then kept, so a demo's state
  // survives flipping away and back. Not on touch screens, where there's no hover to
  // try it with: those keep the static preview.
  const goLive = (c: HTMLElement) => {
    const href = c.dataset.live;
    if (!href || isTouch() || c.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.className = 'crt__live';
    // Out of the Tab order and the accessibility tree until a mouse is over the screen
    // (above); keyboards and screen readers have "Step inside".
    f.tabIndex = -1;
    f.inert = !mouseOver;
    f.title = panels[Number(c.dataset.crtCh)]?.querySelector('.panel__title')?.textContent?.trim() ?? href;
    // astro dev doesn't serve a public/ folder's index.html or extensionless .html (Cloudflare
    // does), e.g. /demos/tarimas/ or /en/demos/money-on-rails/overview.
    f.src = !import.meta.env.DEV
      ? href
      : href.startsWith('/demos/')
        ? `${href}index.html`
        : href.includes('/demos/money-on-rails/')
          ? `${href}.html`
          : href;
    // The demo's own pages: links under this path (its tabs) stay on the screen.
    const home = new URL(href, location.href).pathname.replace(/[^/]*$/, '');
    f.addEventListener('load', () => {
      const doc = f.contentDocument;
      if (doc) {
        onSet(doc);
        // A link out of the demo takes the whole page there, not the little screen.
        doc.addEventListener(
          'click',
          (e) => {
            const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
            if (!a) return;
            const u = new URL(a.href);
            if (u.origin !== location.origin || !u.pathname.startsWith(home)) {
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
    launch(crt, chans[i], href);
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

  // Number keys pick a channel, +/- step, while focus is in the TV (the stage takes focus).
  stage.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= chans.length) tune(n - 1);
    else if (e.key === '+' || e.key === '=') tune(current + 1);
    else if (e.key === '-') tune(current - 1);
  });

  // Power on to colour bars the first time the set is seen, then land on CH 01.
  new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting || crt.classList.contains('is-on')) return;
      crt.classList.add('is-on');
      setTimeout(() => current < 0 && tune(0), reduced() ? 0 : 1300);
    },
    { threshold: 0.35 },
  ).observe(crt);

  // Coming back with the Back button can restore the page mid-launch; clear it.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelector('.launch')?.remove();
    document.documentElement.classList.remove('is-launching');
    crt.classList.remove('is-leaving');
    chans.forEach((c) => {
      if (!c.classList.contains('is-inside')) return;
      c.hidePopover();
      c.removeAttribute('popover');
      c.classList.remove('is-inside');
      const f = c.querySelector('iframe');
      f?.removeAttribute('style');
      if (f?.contentDocument) onSet(f.contentDocument);
    });
  });
}

// On the set, a demo drops its own "back to gsanchez.me" bar and its scrollbars; stepping
// inside puts them back, as the real page has them.
function onSet(doc: Document, on = true) {
  doc.querySelector('style[data-on-set]')?.remove();
  if (!on) return;
  const st = doc.createElement('style');
  st.dataset.onSet = '';
  st.textContent = '.dz-frame{display:none!important} html{scrollbar-width:none} ::-webkit-scrollbar{display:none}';
  doc.head.append(st);
}

// Step inside. The set switches off to a dot, then the whole viewport switches on as the
// big TV showing the real page: the live demo already playing on the set, lifted into the
// top layer (a popover, so the iframe isn't moved and doesn't reload) at the window's
// size. It's loaded, drawn and in the state you left it, and the power-on ends on it
// unfiltered, so the navigation swaps identical pixels instead of jumping from a picture
// of the page to the page. A channel not on air ends on black instead.
function launch(crt: HTMLElement, chan: HTMLElement, href: string) {
  if (crt.classList.contains('is-leaving')) return;
  if (reduced()) {
    location.href = href;
    return;
  }
  const f = chan.hidden ? null : chan.querySelector<HTMLIFrameElement>('iframe.crt__live');
  // Re-lay the demo out at the window's size (letterboxed in the tube) as the set starts
  // to collapse, so its charts have settled at that size by the time it's full-screen.
  const resize = () => {
    const doc = f?.contentDocument;
    if (!f || !doc) return false;
    const r = chan.getBoundingClientRect();
    const k = Math.min(r.width / innerWidth, r.height / innerHeight);
    f.style.cssText = `width:${innerWidth}px;height:${innerHeight}px;left:${(r.width - innerWidth * k) / 2}px;top:${(r.height - innerHeight * k) / 2}px;transform:scale(${k})`;
    onSet(doc, false);
    f.contentWindow?.scrollTo(0, 0); // the real page opens at the top
    return true;
  };
  const onAir =
    f && chan.classList.contains('is-live') && resize()
      ? Promise.resolve(true)
      : !f
        ? Promise.resolve(false)
        : Promise.race([
            new Promise<boolean>((r) => f.addEventListener('load', () => r(resize()), { once: true })),
            wait(4000).then(() => false),
          ]);
  crt.classList.add('is-leaving');

  Promise.all([wait(420), onAir]).then(([, ok]) => {
    document.documentElement.classList.add('is-launching');
    if (!ok || !f) {
      const black = document.createElement('div');
      black.className = 'launch';
      document.body.append(black);
      black.getBoundingClientRect();
      black.classList.add('is-on');
      setTimeout(() => (location.href = href), 250);
      return;
    }
    f.style.left = f.style.top = f.style.transform = '';
    chan.popover = 'manual';
    chan.classList.add('is-inside');
    chan.showPopover();
    setTimeout(() => (location.href = href), 800);
  });
}

// Page chrome: the fixed header takes on the colours of whichever section is
// under it, the local clock ticks, and the hero name drifts apart on scroll.

import { isTouch } from './touch';

export function mountChrome() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const sections = [...document.querySelectorAll<HTMLElement>('[data-theme]')];

  const syncTheme = () => {
    if (!header) return;
    const y = header.offsetHeight / 2;
    const under = sections.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    if (under) header.dataset.on = under.dataset.theme;
  };

  const name = document.querySelectorAll<HTMLElement>('[data-drift]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const drift = () => {
    if (reduced) return;
    const p = Math.min(scrollY / innerHeight, 1);
    name.forEach((el) => {
      const dir = Number(el.dataset.drift);
      el.style.transform = `translate3d(${dir * p * 12}vw, ${-p * 6}vh, 0)`;
    });
  };

  let queued = false;
  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        syncTheme();
        drift();
      });
    },
    { passive: true },
  );
  syncTheme();

  document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => {
    const tz = el.dataset.clock || undefined;
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz });
    const tick = () => (el.textContent = fmt.format(new Date()));
    tick();
    setInterval(tick, 1000);
  });

  // Experience rows: dim the others while one is hovered or focused. Touch
  // devices get the scroll-driven version in touch.ts instead.
  if (isTouch()) return;
  document.querySelectorAll<HTMLElement>('[data-dim-group]').forEach((group) => {
    const on = () => group.classList.add('is-dimming');
    const off = () => group.classList.remove('is-dimming');
    group.addEventListener('pointerover', (e) => (e.target as HTMLElement).closest('[data-dim-item]') && on());
    group.addEventListener('pointerleave', off);
    group.addEventListener('focusin', on);
    group.addEventListener('focusout', off);
  });
}

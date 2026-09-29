// Touch devices get their own versions of the hover effects (#39). A finger
// "hovers" only while it is down and never leaves, so hover-driven states stick
// and shift the layout under the finger. Here the scroll position drives them.

export const isTouch = () => matchMedia('(hover: none)').matches;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Calls `onChange` with the item whose box crosses the middle band of the
// viewport (or null when none does), once per change, throttled to frames.
export function trackCenter<T extends HTMLElement>(items: T[], onChange: (item: T | null) => void) {
  let current: T | null = null;
  let queued = false;
  const check = () => {
    queued = false;
    const mid = innerHeight * 0.45;
    const hit = items.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= mid && r.bottom > mid;
    }) ?? null;
    if (hit !== current) onChange((current = hit));
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(check);
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  check();
}

export function mountTouch() {
  if (!isTouch()) return;
  document.documentElement.classList.add('is-touch');

  // Experience: the job in the middle of the screen lights up.
  document.querySelectorAll<HTMLElement>('[data-dim-group]').forEach((group) => {
    const items = [...group.querySelectorAll<HTMLElement>('[data-dim-item]')];
    trackCenter(items, (item) => {
      items.forEach((el) => el.classList.toggle('is-current', el === item));
      group.classList.toggle('is-surfing', !!item);
    });
  });

  // Contact links and other rows: brief press feedback instead of sticky hover.
  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('a, button');
      if (!el) return;
      el.classList.add('is-pressed');
      const up = () => setTimeout(() => el.classList.remove('is-pressed'), reduced() ? 0 : 180);
      el.addEventListener('pointerup', up, { once: true });
      el.addEventListener('pointercancel', up, { once: true });
    },
    { passive: true },
  );
}

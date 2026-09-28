// One floating tooltip per dashboard. Any element with `data-tip` (HTML, pre-escaped) gets it
// on hover and on keyboard focus.

export function mountTooltip(root: HTMLElement) {
  const tip = document.createElement('div');
  tip.className = 'dz-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);

  let current: Element | null = null;

  const place = (x: number, y: number) => {
    const pad = 14;
    const { width, height } = tip.getBoundingClientRect();
    let left = x + pad;
    let top = y + pad;
    if (left + width > innerWidth - 8) left = x - width - pad;
    if (top + height > innerHeight - 8) top = y - height - pad;
    tip.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
  };

  const show = (el: Element, x: number, y: number) => {
    const html = el.getAttribute('data-tip');
    if (!html) return;
    if (el !== current) {
      tip.innerHTML = html;
      current = el;
    }
    tip.hidden = false;
    place(x, y);
  };

  const hide = () => {
    tip.hidden = true;
    current = null;
  };

  root.addEventListener('pointermove', (e) => {
    const el = (e.target as Element).closest('[data-tip]');
    if (el && root.contains(el)) show(el, e.clientX, e.clientY);
    else if (current) hide();
  });
  root.addEventListener('pointerleave', hide);
  root.addEventListener('focusin', (e) => {
    const el = (e.target as Element).closest('[data-tip]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    show(el, r.left + r.width / 2, r.top + r.height / 2);
  });
  root.addEventListener('focusout', hide);
  addEventListener('scroll', hide, { passive: true });
  addEventListener('keydown', (e) => e.key === 'Escape' && hide());

  return { hide };
}

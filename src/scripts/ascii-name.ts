// The ASCII name reacts to the pointer: solid blocks near it flicker through
// lighter shades for a moment, then settle back to █.

const SHADES = '▓▒░#▚';

export function mountAsciiName() {
  const root = document.querySelector<HTMLElement>('[data-ascii-name]');
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const blocks = [...root.querySelectorAll<HTMLPreElement>('pre')].map((pre) => {
    const rows = [...pre.querySelectorAll<HTMLElement>('.ascii__row')];
    // Map each row to its cells by column, so the pointer can address them directly.
    const grid = rows.map((row) => {
      const cells: (HTMLElement | null)[] = [];
      row.childNodes.forEach((node) => {
        if (node instanceof HTMLElement && node.tagName === 'I') cells.push(node);
        else for (const _ of node.textContent ?? '') cells.push(null);
      });
      return cells;
    });
    return { pre, grid };
  });

  const busy = new WeakSet<HTMLElement>();
  const flicker = (cell: HTMLElement) => {
    if (busy.has(cell)) return;
    busy.add(cell);
    let steps = 2 + ((Math.random() * 3) | 0);
    const tick = () => {
      if (steps-- > 0) {
        cell.classList.add('is-g');
        cell.textContent = SHADES[(Math.random() * SHADES.length) | 0];
        setTimeout(tick, 70 + Math.random() * 90);
      } else {
        cell.textContent = '█';
        cell.classList.remove('is-g');
        busy.delete(cell);
      }
    };
    tick();
  };

  const disturb = (e: PointerEvent) => {
    for (const { pre, grid } of blocks) {
      const r = pre.getBoundingClientRect();
      if (e.clientY < r.top - 20 || e.clientY > r.bottom + 20) continue;
      const cw = r.width / (grid[0]?.length || 1);
      const ch = r.height / grid.length;
      const col = (e.clientX - r.left) / cw;
      const row = (e.clientY - r.top) / ch;
      const radius = 3.2; // in columns; rows are ~2x taller than columns are wide
      for (let j = Math.floor(row - 2); j <= Math.ceil(row + 2); j++) {
        const line = grid[j];
        if (!line) continue;
        for (let i = Math.floor(col - radius); i <= Math.ceil(col + radius); i++) {
          const cell = line[i];
          if (!cell) continue;
          const d = Math.hypot(i + 0.5 - col, (j + 0.5 - row) * 2);
          if (d < radius && Math.random() < 0.55) flicker(cell);
        }
      }
    }
  };
  root.addEventListener('pointermove', disturb);
  // Touch (#39): a tap flickers the blocks under the finger, and while the name
  // is on screen a few random blocks shimmer on their own now and then.
  root.addEventListener('pointerdown', (e) => e.pointerType !== 'mouse' && disturb(e));
  if (matchMedia('(hover: none)').matches) {
    const cells = blocks.flatMap(({ grid }) => grid.flat().filter((c): c is HTMLElement => !!c));
    let visible = false;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);
    setInterval(() => {
      if (!visible || document.hidden) return;
      for (let n = 0; n < 6; n++) flicker(cells[(Math.random() * cells.length) | 0]);
    }, 1400);
  }
}

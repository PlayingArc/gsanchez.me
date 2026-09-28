// Live ASCII fields drawn to a character grid on a canvas.
//
//   'bars'   – a lattice of thin rotating bars, smooth-unioned, after
//              play.core's "sdf/rectangles". Bars near the pointer turn to
//              face it; scrolling spins them and lets them melt together.
//   'shapes' – a few large rotating boxes that the pointer melts into.

type Shape = {
  x: number; // centre, in units of half the short side of the canvas
  y: number;
  w: number; // half extents
  h: number;
  spin: number; // radians per second
  turn: number; // radians per viewport of scroll
  phase: number;
};

type ShapesScene = { mode: 'shapes'; shapes: Shape[]; lift?: number };

type BarsScene = {
  mode: 'bars';
  spacing: number; // lattice pitch
  length: number; // bar half-length, as a fraction of the pitch
  thickness: number; // bar half-thickness
  spin: number;
  falloff: number; // how quickly density fades away from the bars
};

type Scene = (ShapesScene | BarsScene) & { fontSize?: number };

const SHAPES_RAMP = '@%#*+=-:.';
// Heavy glyphs hug the bars, then thin out into empty space.
const BARS_RAMP = '█▓▒#×+=:·        ';
const BARS_HEAVY = 3;

const sdBox = (px: number, py: number, w: number, h: number) => {
  const qx = Math.abs(px) - w;
  const qy = Math.abs(py) - h;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0);
};

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

const fract = (v: number) => v - Math.floor(v);

const turnToward = (a: number, b: number, w: number) => {
  let d = (b - a) % Math.PI; // bars are symmetric, so half a turn is a full match
  if (d > Math.PI / 2) d -= Math.PI;
  if (d < -Math.PI / 2) d += Math.PI;
  return a + d * w;
};

export class AsciiField {
  private ctx: CanvasRenderingContext2D;
  private cw = 8;
  private ch = 16;
  private cols = 0;
  private rows = 0;
  private w = 0;
  private h = 0;
  private raf = 0;
  private visible = false;
  private t0 = performance.now();
  private pointer = { x: 0, y: 0, tx: 0, ty: 0, on: 0, target: 0 };
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private colors: { ink: string; faint: string; accent: string };

  constructor(private canvas: HTMLCanvasElement, private scene: Scene) {
    this.ctx = canvas.getContext('2d')!;
    const css = getComputedStyle(canvas);
    this.colors = {
      ink: css.getPropertyValue('--ascii-ink').trim() || '#000',
      faint: css.getPropertyValue('--ascii-faint').trim() || 'rgba(0,0,0,.25)',
      accent: css.getPropertyValue('--ascii-accent').trim() || '#fff',
    };
    this.bind();
  }

  private bind() {
    new ResizeObserver(() => this.resize()).observe(this.canvas);

    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.start();
    }).observe(this.canvas);

    // Listen on the section so the pointer still registers over text.
    const host = this.canvas.parentElement ?? this.canvas;
    host.addEventListener('pointermove', (e) => {
      const r = this.canvas.getBoundingClientRect();
      const s = Math.min(r.width, r.height) / 2;
      this.pointer.tx = (e.clientX - r.left - r.width / 2) / s;
      this.pointer.ty = (e.clientY - r.top - r.height / 2) / s;
      if (!this.pointer.target) {
        this.pointer.x = this.pointer.tx;
        this.pointer.y = this.pointer.ty;
      }
      this.pointer.target = 1;
      if (this.reduced) this.draw();
    });
    host.addEventListener('pointerleave', () => (this.pointer.target = 0));
    addEventListener('scroll', () => this.reduced && this.draw(), { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.start();
    });
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = this.canvas.getBoundingClientRect();
    this.w = width;
    this.h = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    const base = this.scene.fontSize ?? 14;
    const fs = width < 640 ? base - 2 : base;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.font = `${fs}px "JetBrains Mono", ui-monospace, monospace`;
    this.ctx.textBaseline = 'top';
    this.cw = this.ctx.measureText('M').width;
    this.ch = Math.round(fs * 1.25);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);
    this.draw();
  }

  private start() {
    if (this.reduced || this.raf) return;
    const loop = () => {
      this.raf = 0;
      if (!this.visible || document.hidden) return;
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  draw() {
    if (!this.cols) return;
    const t = this.reduced ? 12 : (performance.now() - this.t0) / 1000;
    const scroll = -this.canvas.getBoundingClientRect().top / innerHeight;

    const p = this.pointer;
    p.x += (p.tx - p.x) * 0.12;
    p.y += (p.ty - p.y) * 0.12;
    p.on += (p.target - p.on) * 0.06;

    const layers =
      this.scene.mode === 'bars' ? this.bars(this.scene, t, scroll) : this.shapes(this.scene, t, scroll);

    const { ctx, w, h, rows, ch } = this;
    ctx.clearRect(0, 0, w, h);
    const colors = [this.colors.faint, this.colors.ink, this.colors.accent];
    layers.forEach((lines, k) => {
      ctx.fillStyle = colors[k];
      for (let j = 0; j < rows; j++) ctx.fillText(lines[j], 0, j * ch);
    });
  }

  // Returns [faint, ink, accent] rows.
  private bars(sc: BarsScene, t: number, scroll: number) {
    const { cols, rows, cw, ch, w, h } = this;
    const p = this.pointer;
    const s = Math.min(w, h) / 2;
    const g = sc.spacing;
    const L = g * sc.length;
    const T = sc.thickness;

    // Lattice covering the canvas, one ring past the edges.
    const ex = w / 2 / s + g;
    const ey = h / 2 / s + g;
    const nx = Math.ceil(ex / g);
    const ny = Math.ceil(ey / g);
    // Stored by lattice row/column so each cell only visits its neighbours.
    type Bar = { x: number; y: number; c: number; s: number };
    const lattice: Bar[][] = [];
    for (let by = -ny; by <= ny; by++) {
      const row: Bar[] = [];
      for (let bx = -nx; bx <= nx; bx++) {
        const x = bx * g + (by & 1 ? g / 2 : 0);
        const y = by * g;
        let a = t * sc.spin * (1 + 0.4 * Math.sin(x * 1.3 + y * 0.7)) + x * 0.9 + y * 1.7 + scroll * 2.2;
        const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
        const pull = p.on * Math.exp(-((dist / 0.6) ** 2));
        if (pull > 0.01) a = turnToward(a, Math.atan2(p.y - y, p.x - x), pull);
        row.push({ x, y, c: Math.cos(a), s: Math.sin(a) });
      }
      lattice.push(row);
    }

    // Bars breathe between crisp and melted; scrolling melts them further.
    const k = 0.04 + 0.1 * (0.5 + 0.5 * Math.sin(t * 0.35)) + Math.min(Math.max(scroll, 0), 1) * 0.2;
    const ramp = BARS_RAMP;
    const rl = ramp.length;
    const pr = 0.22 * p.on;

    const faint: string[] = [];
    const ink: string[] = [];
    const accent: string[] = [];
    for (let j = 0; j < rows; j++) {
      let fRow = '';
      let iRow = '';
      let aRow = '';
      const v = ((j + 0.5) * ch - h / 2) / s;
      for (let i = 0; i < cols; i++) {
        const u = ((i + 0.5) * cw - w / 2) / s;
        let d = 1e9;
        const rc = Math.round(v / g);
        for (let by = rc - 1; by <= rc + 1; by++) {
          const row = lattice[by + ny];
          if (!row) continue;
          const cc = Math.round((u - (by & 1 ? g / 2 : 0)) / g);
          for (let bx = cc - 1; bx <= cc + 1; bx++) {
            const b = row[bx + nx];
            if (!b) continue;
            const dx = u - b.x;
            const dy = v - b.y;
            d = smin(d, sdBox(dx * b.c + dy * b.s, -dx * b.s + dy * b.c, L, T), k);
          }
        }
        const idx = d < 0 ? 0 : Math.floor((1 - Math.exp(-sc.falloff * d)) * rl);
        const glyph = ramp[Math.min(idx, rl - 1)];
        let f = ' ';
        let n = ' ';
        let a = ' ';
        if (glyph !== ' ') {
          if (pr > 0.01 && (u - p.x) ** 2 + (v - p.y) ** 2 < pr * pr) a = glyph;
          else if (idx < BARS_HEAVY) n = glyph;
          else f = glyph;
        }
        fRow += f;
        iRow += n;
        aRow += a;
      }
      faint.push(fRow);
      ink.push(iRow);
      accent.push(aRow);
    }
    return [faint, ink, accent];
  }

  private shapes(sc: ShapesScene, t: number, scroll: number) {
    const { cols, rows, cw, ch, w, h } = this;
    const p = this.pointer;
    const s = Math.min(w, h) / 2;
    const lift = sc.lift ?? 0.9;
    const shapes = sc.shapes.map((sh) => {
      const a = sh.phase + t * sh.spin + scroll * sh.turn;
      return {
        x: sh.x,
        y: sh.y + Math.sin(t * 0.3 + sh.phase) * 0.04 - scroll * lift,
        w: sh.w,
        h: sh.h,
        c: Math.cos(a),
        s: Math.sin(a),
      };
    });

    const ramp = SHAPES_RAMP;
    const rl = ramp.length;
    const pr = 0.2 * p.on;
    const faint: string[] = [];
    const ink: string[] = [];
    const accent: string[] = [];

    for (let j = 0; j < rows; j++) {
      let fRow = '';
      let iRow = '';
      let aRow = '';
      const v = ((j + 0.5) * ch - h / 2) / s;
      for (let i = 0; i < cols; i++) {
        const u = ((i + 0.5) * cw - w / 2) / s;
        let d = 1e9;
        for (const b of shapes) {
          const dx = u - b.x;
          const dy = v - b.y;
          d = smin(d, sdBox(dx * b.c + dy * b.s, -dx * b.s + dy * b.c, b.w, b.h), 0.08);
        }
        const dm = Math.hypot(u - p.x, v - p.y);
        if (p.on > 0.01) d = smin(d, dm - pr, 0.35 * p.on);

        let f = ' ';
        let k = ' ';
        let a = ' ';
        if (d < 0) {
          const g = ramp[Math.floor(fract(-d * 7 - t * 0.35) * rl)] ?? ' ';
          if (dm < pr + 0.06) a = g;
          else k = g;
        } else if (i % 4 === 0 && j % 2 === 0) {
          f = d < 0.12 ? '+' : '·';
        }
        fRow += f;
        iRow += k;
        aRow += a;
      }
      faint.push(fRow);
      ink.push(iRow);
      accent.push(aRow);
    }
    return [faint, ink, accent];
  }
}

const SCENES: Record<string, Scene> = {
  hero: { mode: 'bars', spacing: 0.55, length: 0.44, thickness: 0.03, spin: 0.22, falloff: 14 },
  contact: {
    mode: 'shapes',
    lift: 0.3,
    shapes: [
      { x: -1.1, y: 0.1, w: 0.5, h: 0.14, spin: 0.07, turn: 0.8, phase: 0.4 },
      { x: 1.2, y: -0.2, w: 0.3, h: 0.3, spin: -0.1, turn: -1.2, phase: 1.7 },
      { x: 0.2, y: -0.75, w: 0.12, h: 0.4, spin: 0.14, turn: 1.0, phase: 2.9 },
    ],
  },
};

export async function mountAsciiFields() {
  await document.fonts.load('14px "JetBrains Mono"').catch(() => {});
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-ascii]').forEach((canvas) => {
    new AsciiField(canvas, SCENES[canvas.dataset.ascii ?? ''] ?? SCENES.hero);
  });
}

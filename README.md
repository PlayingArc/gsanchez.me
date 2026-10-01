# Portfolio

One-page portfolio built with [Astro](https://astro.build). The build is static, so it can be hosted anywhere.

```
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Where things live

| Path | What |
|---|---|
| `src/data/site.ts` | **All content**: name, bio, links, experience, projects, and each demo's URL (`href`) |
| `src/styles/global.css` | Palette tokens (top of file), layout, CRT styling |
| `src/scripts/ascii-field.ts` | Live ASCII backgrounds. The hero uses a lattice of rotating bars (after play.core's `sdf/rectangles`) that turn toward the pointer; contact uses large melting boxes. `SCENES` at the bottom tunes them |
| `src/lib/ascii-type.ts` + `src/scripts/ascii-name.ts` | The name in ANSI Shadow block letters (generated at build time from `profile`), plus the pointer shimmer |
| `src/scripts/dashboards.ts` | The static TV screens, one renderer per `Preview` in site.ts (HTML+SVG at 640×480, placeholder data) |
| `resume/resume.html` | The résumé behind `public/gerardo-sanchez-resume.pdf`; see below |
| `.claude/skills/portfolio-change/` | Checklist for agents: where a demo, experience or copy change has to propagate |
| `src/scripts/tv-wall.ts` | TV stack: power-on, live ticking, hover details, and the zoom into a dashboard |
| `src/components/Work.astro` | TV layout: which set goes where, size, casing (`sets`) |
| `src/scripts/scramble.ts` | Decode-on-scroll and hover text effects (overlay, so layout never shifts) |

## App Tarimas demo

`public/demos/tarimas/` is the committed demo build of App Tarimas (a separate repo), served at `/demos/tarimas/`. Don't edit it by hand; rebuild it with:

```
npm run sync:tarimas                                   # clones the app's main branch
TARIMAS_DIR=../path/to/checkout npm run sync:tarimas   # or builds a local checkout
```

## Résumé

`public/gerardo-sanchez-resume.pdf` is printed from `resume/resume.html`, whose facts follow `src/data/site.ts` (it may be terser, never contradict it). It is public: no phone number. After editing the HTML:

```
npm run resume                          # headless /usr/bin/chromium; fails if it runs past one page
CHROME=/path/to/chrome npm run resume   # another browser
```

## Palette

Sampled from *Cyberfeminism Index* (Inventory Press, 2023, design by Laura Coombs): green `#4DE74C`, off-white `#F2F4F0`, ink `#0B0C0B`.

## Wiring a demo

Set `href` on the project in `src/data/site.ts`. Links starting with `#` zoom into the mockup and show a "coming soon" bar. A real URL (`/demos/x` or `https://…`) opens after the zoom. When real screenshots exist, they can replace the mockups in `dashboards.ts`.

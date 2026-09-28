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
| `src/scripts/dashboards.ts` | The five modern dashboard mockups on the TV screens (HTML+SVG at 640×480, placeholder data) |
| `src/scripts/tv-wall.ts` | TV stack: power-on, live ticking, hover details, and the zoom into a dashboard |
| `src/components/Work.astro` | TV layout: which set goes where, size, casing (`sets`) |
| `src/scripts/scramble.ts` | Decode-on-scroll and hover text effects (overlay, so layout never shifts) |

## Palette

Sampled from *Cyberfeminism Index* (Inventory Press, 2023, design by Laura Coombs): green `#4DE74C`, off-white `#F2F4F0`, ink `#0B0C0B`.

## Wiring a demo

Set `href` on the project in `src/data/site.ts`. Links starting with `#` zoom into the mockup and show a "coming soon" bar. A real URL (`/demos/x` or `https://…`) opens after the zoom. When real screenshots exist, they can replace the mockups in `dashboards.ts`.

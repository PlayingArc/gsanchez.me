---
name: portfolio-change
description: Use when adding, renaming or removing a demo or case study on gsanchez.me, editing experience, about or role copy, or updating the résumé. Propagates the change to every place it shows up.
---

# Changing the portfolio

One change **propagates** everywhere it shows up: both locales, the TV, the résumé, the routes. A change is done when no surface still shows the old fact. Read `CONTEXT.md` first: its words (Case study, Demo dashboard, Fictional company, Internal work, TV, Channel) are the vocabulary for copy, comments and commit messages.

## 1. Classify the change

Name the change and pick its rows from the propagation map below. Work in a worktree branched from `origin/main`.

Done when: you have the list of rows (and files) this change touches.

## 2. Edit the source of truth

`src/data/site.ts` holds every string a visitor reads, in `copy.en` and `copy.es`. Edit **both** locales in the same commit, with the same facts (names, dates, numbers, claims).

- Role: `profile.role` (kept in English in both locales).
- About: `about`, `pitch`, `statement`, `now`.
- Experience: `experience.jobs` (start, end, role, company, summary, tags). Internal work is described here only, never linked or given a channel.
- Shown work: `work.projects`. A Demo dashboard is titled by what it shows; its Fictional company is named in the summary. `kind` is `Case study` / `Caso de estudio` or `Demo dashboard` / `Dashboard de demostración`. `href` starting with `/` plays live on the TV.

Done when: `git diff src/data/site.ts` shows the same change in `en` and `es`.

## 3. Propagate

Walk every row the change touches. Each row lists what to edit; the derived ones only need checking.

| Surface | Where | Add / rename / remove a demo or case study | Other changes |
|---|---|---|---|
| TV screen | `Preview` type in `src/data/site.ts`, plus a renderer in the `RENDER` map in `src/scripts/dashboards.ts` | add or drop the key and its renderer; rename its labels | — |
| Channel keys | `CRT.keys` in `src/scripts/crt-set.ts` has 4 keys; `Work.astro` only gives keys to the first 4 channels | check the new channel is still reachable (tuner, +/−) | — |
| Index table, hero count, Work count | derived from `work.projects` in `src/components/Work.astro` and `src/components/Hero.astro` | check only | — |
| Experience count, JSON-LD job title | derived from `experience.jobs` (`Hero.astro`, `OnePage.astro` uses `jobs[0].role`) | — | check only |
| Page title | `OnePage.astro` uses `profile.role` | — | role change: check only |
| Demo pages | `src/pages/en/demos/<name>.astro`, `src/pages/es/demos/<name>.astro`, the language redirect `src/pages/demos/<name>.astro`, the dashboard in `src/components/demos/`, its app in `src/demos/<name>/` (title and meta in `i18n.ts`) | create, rename or delete all of them together | — |
| Externally built demos | `public/demos/tarimas/` (`npm run sync:tarimas`), `public/{en,es}/demos/money-on-rails/` (`npm run sync:money`) | rebuild with the sync script; never hand-edit | — |
| Sitemap | `bilingual` / `single` lists in `src/pages/sitemap.xml.ts` | add, rename or drop its paths | — |
| Share images | `public/og/<name>-<locale>.png`, referenced from the demo's `Base` `image` and redirect page; shots listed in `scripts/og-images.mjs` | add the `shoot(...)` line and regenerate | hero copy change: regenerate `home-*` |
| Intro card | `src/data/demo-intros.ts`, only if it exists (it lands with PR #65, `feat/demo-chrome`) | add, rename or drop the `DemoId` and its intro in both locales; `title` matches site.ts | update `what`/`why` if the pitch changed |
| Résumé | `resume/resume.html`, then `npm run resume` (step 4) | update Selected Projects | update header, experience bullets |
| Vocabulary | `CONTEXT.md` | add the example under Case study, Demo dashboard or Internal work | new Internal work: add it there |
| README | `README.md` "Where things live" | update if a path or script changes | same |

Done when: every row of the change is edited or checked, and `rg -i '<old name or fact>' --glob '!node_modules' --glob '!dist'` returns only intended hits.

## 4. Regenerate the résumé

`resume/resume.html` follows site.ts's English copy: it may be terser, never contradicting it. Selected Projects lists every project on the site, **including the site itself** (gsanchez.me, from `work.thisSite`, linking the public mirror); never drop an entry to make the page fit. If `npm run resume` reports overflow, tighten wording or spacing instead. It is public (the repo is mirrored): no phone number, and the only email is `hello@gsanchez.me`.

```
npm run resume    # prints to public/gerardo-sanchez-resume.pdf; CHROME=... to override /usr/bin/chromium
```

The script fails if the content overflows one Letter page; trim copy until it passes.

Done when: `npm run resume` succeeds and step 5's PDF checks pass.

## 5. Verify

- [ ] `npx astro check` reports 0 errors.
- [ ] `npm run build` passes.
- [ ] `/en/` and `/es/` both render the change (`npm run dev`, or `npm run preview` after the build); every touched demo opens in both locales.
- [ ] Every new or renamed URL appears in `/sitemap.xml`; removed ones are gone.
- [ ] Résumé: `pdfinfo public/gerardo-sanchez-resume.pdf` shows `Pages: 1` and the right title; `pdftotext public/gerardo-sanchez-resume.pdf - | grep -niE 'gmail|phone|\+52'` prints nothing; the text matches site.ts.
- [ ] Screenshots: page 1 of the PDF (`pdftoppm -png -r 110 -f 1 -l 1 public/gerardo-sanchez-resume.pdf /tmp/resume`) and the changed sections in both locales, looked at, attached to the PR.

Done when: every box is ticked, with the output in the PR body.

## 6. After merge

The public mirror (PlayingArc/gsanchez.me) updates only when someone runs `scripts/publish-mirror.sh` (it clones `main` itself, cleans and scans it; `DRY_RUN=1` first). Mention in the PR that it needs a publish.

Done when: the PR says whether the mirror needs publishing.

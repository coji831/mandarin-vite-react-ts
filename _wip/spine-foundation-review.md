# Spine foundation — pre-merge UI review (rendered only)

Reviewed 2026-10-21 on branch `ui/page-anatomy-convergence` at commit `5b9f6012`.
Reviewer: Design Lead (rendered-only pass). Orchestrator: runner session, pre-merge plan
`Resume/context/spine/pre-merge-ui-review-plan.md`. Working file — not committed.

The conversion under review: page measures renamed to spine's generic vocabulary, `PageShell.css`
as the single archetype->measure map, and three per-page `max-width` literals replaced by those
tokens (`AuthForm.css` 420, `ReviewView.css` 620, `ContentBrowser.css` 1200). Values unchanged,
nothing restyled. So the bar is regression assurance, not design critique.

## Environment

- Frontend (Vite SPA): `http://localhost:5173/` — HTTP 200, PID 28336
- Backend (NestJS): `http://localhost:3001/api/v1`, `/health` 200, PID 2524 (came up clean; local DB reachable)
- Node on PATH v20.19.4 (repo declares `>=24`; the gates and both dev servers ran on it without error)
- Auth: throwaway account `spine-review@example.com` registered through the API and used once to reach
  the protected routes. Delete this account when convenient.

## Gates (orchestrator, before the browser pass)

| Gate | Result |
| --- | --- |
| `npm run design-audit:foundation` | **PASS** — 0 page-anatomy findings (spine's full audit on the same tree: 247 errors / 436 warnings / 683 findings, none page-anatomy) |
| `npm run design:lint` | 0 errors, 0 warnings, 0 infos (strict) |
| `npm run check:design-parity` | **PASS** — 40 token/var pairs |

## Measures read

`body` and every container resolved `font-family: Manrope, ui-sans-serif, system-ui, sans-serif` /
`16px` — no fallback serif anywhere. Root tokens read live: overview 960, list 1200, detail 620,
settings 1000, auth 420, `--page-pad: 24px`, `--space-md: 16px`. 101 sheets / 924 rules loaded.
Every `innerWidth` is the value read back after setting the viewport (guard held: 1440, 1280, 480).

| page | route | innerWidth | shell class / container | max-width | expected | container px | scrollWidth/innerWidth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hub | `/`, `/dashboard` | 1440, 1280 | `page-shell--hub-launcher` | 960px | 960 | 960 | 1440/1440, 1280/1280 |
| library (literal #1) | `/library` | 1440, 1280 | no `.page-shell`; `.content-browser` | 1200px | 1200 | **794** | 1440/1440, 1280/1280 |
| dense list | `/learn/radicals` | 1440, 1280 | `page-shell--browse-index` | 1200px | 1200 | 1200 / 1045 | 1440/1440, 1280/1280 |
| review (literal #2) | `/practices/review?type=pinyin&filter=all` | 1440, 1280 | no `.page-shell`; `.review-view` | 620px | 620 | 620 | 1440/1440, 1280/1280 |
| quiz (detail) | `/practices/quiz` | 1440, 1280 | `page-shell--focus-task` | 620px | 620 | 620 | 1440/1440, 1280/1280 |
| progress | `/progress` | 1440, 1280 | `page-shell--utility` | 1000px | 1000 | 1000 | 1440/1440, 1280/1280 |
| auth login (literal #3) | `/auth/login` | 1440, 1280, 480 | `page-shell--auth` | 420px | 420 | 420 (`.auth-form` maxW 420; pad 24 / **16 at 480**) | 1440/1440, 1280/1280, 480/480 |
| auth register | `/auth/register` | 1440, 480 | `page-shell--auth` | 420px | 420 | 420 (pad 16 at 480) | 1440/1440, 480/480 |
| practices hub | `/practices` | 1440 | `page-shell--hub-launcher` | 960px | 960 | 960 | 1440/1440 |

Chrome at 1440: sidebar 220x900 at x=0, `aside.right == main.left == 220` (no overlap), header 56px
spans 1220, main 1220x844, 11 nav links, nothing clipped on `/` or `/library`. Scrolling happens in
`main.app-content` (library 1764/844, radicals 1148/844) with the document staying at 900 — the
intended inner scroller.

## Verdict

**PASS — merge-safe.** All five measures resolve to their documented values through the renamed
tokens, and all three literal replacements compute to their old numbers (ContentBrowser 1200,
ReviewView 620, AuthForm 420). No container is 0-width, no page is unstyled, and
`scrollWidth == innerWidth` on all 19 measurements at 1440, 1280 and 480. The responsive gutter rule
is live: auth padding 24px at 1440/1280, 16px at 480.

**No (a) regressions.** Nothing measured is attributable to the token rename.

## Findings — all (b) pre-existing / out of scope

1. **`/library` — no `.page-shell`.** `document.querySelector('.page-shell')` is null; the page renders
   `main.app-content > .content-browser`. The 1200 cap comes from the ContentBrowser token, not
   `--browse-index`. Values unchanged, so not a rename defect; page-anatomy backlog item.
   *Decision for the owner: this is the one structural gap the pass found — the page-anatomy
   convergence has not reached `/library` yet. Merge-safe as-is.*
2. **`/library` — body is 794px inside a 1200px cap** (auto cross margins ~205.7px each side; the flex
   item sizes to content instead of stretching). 2 columns x 365px, 20 cards, grid 746px, no zero-width
   card. Pre-existing layout behaviour, independent of the value swap.
3. **`/practices/review` — no `.page-shell`**; the 620 comes from `.review-view`. Session loaded live
   ("Review · Pinyin-syllables", "1 of 20", character card present), so the measure was read against
   real content.
4. **`/practices/quiz` — empty state** ("Select a quiz type from the practices page to begin.") inside
   `page-shell--focus-task` at 620. Empty state, not breakage.
5. **`/learn/radicals` at 1440 — `.learn-layout` 1205px inside the 1200 shell** (5px child overflow;
   the shell has `overflow: visible`, so it lands in the 10px centring gap and produces no document
   overflow: 1440/1440). Pre-existing.
6. **Auth routes redirect to `/` while authenticated.** Expected guard behaviour.
7. **A `400 Bad Request` resource** fires on `/auth/login`, `/auth/register` and guest `/`. Endpoint
   level, no measure depends on it, unrelated to the measures.
8. **No `<footer>`** on `/` or `/library` (sidebar + top bar only). Observation only.

## Not measured

- Document-level scroll on `/learn/radicals`: the app scrolls `main`, so the inner-scroller figures are
  reported instead; no document scroll figure is claimed.
- Narrow-viewport re-check for `/library` and `/learn/radicals` (only auth and hub were re-run at 480;
  1280 covered the tightest content page).
- `/practices/review` traversal past the first item ("1 of 20"); items were not answered.

## Out of scope, as planned

Per-page restyling, the unapplied locked theme (`#d8a45c` / radius 0, ADR-007/011 "Night Bench"),
component-by-component migration, the archetype prop-id rename ripple, gitignored `mcp.json`, the
local-only CI gate, and pre-existing drift (`check:system-map`, `check:doc-links`).

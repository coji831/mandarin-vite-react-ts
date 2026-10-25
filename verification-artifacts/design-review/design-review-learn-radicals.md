> **Provenance.** Produced by S7 of the spine-hybrid migration, by the `layout-critic` role installed in
> this same step. Browser-rendered over Storybook (MSW-mocked states) and over the live dev route where
> the API is absent. No source and no stylesheet was read for this pass.

# Design review — /learn/radicals

Critic pass over `/learn/radicals` (archetype: learn hub; register: Night Bench instrument) against
ADR-011 + `docs/guides/design/page-archetypes.md` + `docs/guides/design/design-quality-rubric.md`.

Width preamble: `innerWidth` 1440 / 1024 / 320 · states looked at: Browse (default), Loading, Trees
loaded, Trees loading (skeleton), Error · capture cropped at the editor-panel width, so wide-step
geometry was read at the verified width rather than off the image.

Surface note: `http://localhost:5173/learn/radicals` renders the app shell but has no API (port 3001
refused), so its grid shows the error state. Every data-bearing state below was rendered from the page's
own story (`Pages/Learn/Radicals`), which is the same component tree with MSW fixtures.

## Findings

### F1 — the Trees loading skeleton reserves 60 px where the loaded content is ~205 px [VERDICT: VISUAL] [severity: high]

- **Brief says** — "no layout shift (CLS): skeleton dims = final dims, fixed shell + inner scroll"
  (`docs/guides/design/design-quality-rubric.md`, "Performance").
- **Render shows** — `trees-loading` paints exactly **one** skeleton block: `1088 × 60 px`,
  `.skeleton.w-full.radius-lg`, `animation: skeleton-shimmer`. The loaded `trees` state paints **two**
  bordered panels plus a caption in the same region (1440 capture, y 145–270 and y 278–350, versus the
  single bar at y 196–256). The page therefore grows ≈145 px at the moment the fetch settles, which is
  the shift the rubric names.
- **Why it costs the learner** — the tree they are about to read is pushed down and the tab strip they
  were reaching for moves, at the one moment they are deciding whether the page worked.
- **Proposed change** — the skeleton must occupy the *final* geometry: one shimmer block per panel, at
  the panel's real height, in the same order the panels load (admissions panel first, tree panel
  second). Outcome, not a value.

### F2 — the radical cards do not fill their grid cells, and the shortfall grows as the width shrinks [VERDICT: VISUAL] [severity: medium]

- **Brief says** — "no 320px overflow; **data volume stable**" and "no structural drift"
  (`design-quality-rubric.md` § browser checklist row 7 and row 14).
- **Render shows** — cards/rows and cell width, measured at all three widths:

  | width | cards per row | card width | cell width | unused per cell |
  | --- | --- | --- | --- | --- |
  | 1440 | 7 | 140 px | 151 px | 11 px |
  | 1024 | 4 | 140 px | 173 px | **33 px (19 %)** |
  | 320 | 1 | 120 px | 213 px | **93 px (44 %)** |

  The card is a fixed width and the column is elastic, so the widest void in the layout is at the
  narrowest viewport — the opposite of every other element on the page, which stretches.
- **Why it costs the learner** — at 320 (a supported width) the browse grid reads as a column of narrow
  tiles pinned to the left with an empty lane beside them, so the page looks unfinished exactly where
  space is scarcest.
- **Proposed change** — the card should fill its column (the cell is the card), so one card at 320 is one
  full-width row. If the card must stay fixed for optical glyph centring, the *grid* must not claim the
  leftover width as a column.

### F3 — the route's two tabs answer "where is the filter" two different ways [VERDICT: VISUAL] [severity: low]

- **Brief says** — "Golden-Template parity — side-by-side with the archetype exemplar story — no
  structural drift" (`design-quality-rubric.md` row 14).
- **Render shows** — Browse's search input spans its filter block: **1128 px** at 1440, **715 px** at
  1024. Trees' search input is a **220 px** control centred in the row (icon at x 701, field 725–945,
  inside a 1205 px content region), with the row otherwise empty. Same route, same job, two shapes.
- **Why it costs the learner** — the filter they learned in one tab is a different object in the other,
  which is the cheapest possible way to lose a returning user's confidence.
- **Proposed change** — one filter rule for both tabs, stated as an outcome: a route's filter control
  begins at the content's left edge and owns the row it sits on.

### F4 — two rules are drawn as typography, where the system has a hairline [VERDICT: VISUAL] [severity: medium]

- **Brief says** — "A hairline is for grouping, not for a section boundary" (ADR-011-locked system rule,
  as carried in the role's locked list) and "one mechanism per fact" (`design-review` dimension 7).
- **Render shows** — two second mechanisms on one route:
  1. the Trees caption `─── Your known radicals (★ mastered) ───` — three runs of box-drawing characters
     (U+2500) typed as if they were a rule;
  2. the tab strip's group separator is a literal `|` text node between Browse/Trees and
     Radical/Phonetic (the accessibility tree carries it as text, `generic: "|"`).
  Both are glyphs standing in for a border, so neither scales, neither respects the hairline token, and
  a screen reader reads the decoration aloud.
- **Why it costs the learner** — the rule text is announced as noise, and the two "dividers" disagree
  with every real border on the page.
- **Proposed change** — the caption becomes real text plus a real hairline element; the tab groups are
  separated by the same hairline (or by spacing), never by a typed character.

### F5 — the "Top 20 only" switch has no visible track boundary [VERDICT: VISUAL] [severity: medium] [SHARED]

- **Brief says** — "UI boundaries and states at 3:1 (SC 1.4.11)" and "Native element first"
  (`.github/instructions/a11y-floor.instructions.md`).
- **Render shows** — the switch's painted track is `72 × 44 px`, filled `rgb(50, 39, 26)` with
  `border-width: 2px` and **`border-color: transparent`**. In the 1440 Browse capture the track is not
  separable from the filter-bar surface behind it; only the knob is visible, so the control reads as a
  floating dot rather than a two-state switch. (At 320 the same track is legible because the surface
  behind it differs.)
- **Why it costs the learner** — an off/on control whose off-state boundary is invisible is a control
  the reader has to guess at, and arguably cannot see at all.
- **Proposed change** — the track gets a boundary that clears 3:1 against its surface, or the off state
  gets a fill that does. **This is a shared `Switch` fix, not a route-local edit** — route it to the
  design lead.

### F6 — the route's mode switch is a 100 px footer card, and nothing in the brief says where it belongs [VERDICT: BRIEF] [severity: medium]

- **Brief says** — nothing. ADR-011 fixes register, accent budget, corners and type; the archetype table
  fixes zone order and density; the rubric's states row asks only that states exist and map to stories.
  **No line anywhere states where a route's mode switch lives.**
- **Render shows** — the tab strip renders as `.box-card-elevated flex-center gap-sm`, **1152 × 100 px**,
  with its top at **y 804 in a 900 px viewport**: a footer card occupying 11 % of the viewport to hold
  four buttons. In Trees it sits 58 px below the last content; in Browse it abuts the grid's bottom edge,
  so content moves under it as the grid fills.
- **Why it costs the learner** — a mode switch they use repeatedly is at the far end of the page from
  the content it switches, and it moves with content height instead of holding a place.
- **Proposed change** — insert a line in `docs/guides/design/page-archetypes.md`: *a learn route's mode
  switch is a header control, immediately below the page heading and above the filter row; it does not
  live in a footer card.* (Then F4's separator and F6's card both collapse into one decision.)

## Noted, not a finding

- The 320 render clips the search placeholder ("Search by pinyin, me…") with no document overflow. Noted
  because the rubric's reflow row is about overflow, and there is none: `scrollWidth 320 === clientWidth
  320` at 320, and no element extends past the right edge. If the placeholder matters it is a microcopy
  decision, not a layout defect.
- The fixed 140 px card width looks deliberate (it holds the glyph's optical centre steady across
  columns). F2 asks the card to fill at narrow widths, which may be the wrong ask for this component;
  the design lead should decide, and it is named here rather than settled.
- The Trees empty state and the Phase-3 phonetic tree were not opened. Owed, not judged.

## Research

None used. Every claim above is a measurement of this repository's render or a quotation of this
repository's brief.

## Verdict on the route

The route is on-system in register, type and density, and its reflow behaviour is correct at 320. It is
**not** fit for its brief in three places the brief already covers: its loading geometry shifts the page
(F1), its grid leaves a growing void as width falls (F2), and it draws rules as characters (F4). F5 is a
shared component defect the route merely exposes. F6 is the one place the brief is genuinely silent, and
until it is written, the tab strip will keep being re-decided per route.

## Withdrawn

**"The loading spinner is too low-contrast against the canvas."** Withdrawn before it was priced: the
arc's computed colour was not captured (the state resolved to Error while the measurement ran), so the
claim had no reading. It is re-opened in S8, where the browser pass owns contrast and axe.

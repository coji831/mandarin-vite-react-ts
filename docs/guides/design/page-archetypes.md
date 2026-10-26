---
purpose: The page-level contract — a finite set of named Focus-First page skeletons every page parameterizes
status: active
last-verified: 2026-10-26
type: design
audience: all
---

# PinyinPal Page Archetypes — Focus-First Page Library

**Last Updated:** 2026-10-26
**Audience:** AI Coding Agents
**Purpose:** The page-level contract that makes cross-page consistency _structural_. A finite set of named page skeletons — every page is a parameterization of one archetype. Read this before designing any new page; the archetype _is_ the consistency contract, and the ledger (`.github/page-inventory.json`) is the living catalog.

> **How to use this file:** (1) pick the archetype for your page from the mode/page table in §0; (2) fill its anatomy, states, CTA slot, and composition map from the YAML block — "none invented"; (3) write the per-epic design spec (`per-epic-design-spec.md`) naming `archetype: <id>`; (4) generate the Step 1 story conforming to the skeleton; (5) score against the design-quality rubric (`design-quality-rubric.md`).

---

## §0 Focus-First Paradigm

**PinyinPal is a Focus-First app — a dual-mode consumer learning app.** Browsing is a launcher; every learning action happens in a chrome-recessed, single-primary-action Focus surface. The product's unit of value is the **session** (a review, a quiz, a reading, a conversation, a timed exam, a speaking drill). Every minute the user is either **(a) choosing the next session (Browse)** or **(b) inside a session (Focus)**. There is no third kind of moment.

Two structural modes:

| Mode   | Chrome state                                                            | Page =                                                |
| ------ | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Browse | Rail **expanded** + standard top bar                                    | Entry points; density up                              |
| Focus  | Rail **collapsed** (icon rail) + **recessed** top bar; task fills frame | One task, exactly one CTA, fixed data-resilient shell |
| (Auth) | **Exception** — no rail; centered single-column                         | One CTA (credential action)                           |

Every route declares its mode as part of its page archetype — never ad hoc.

### The 6 non-negotiables (5 + page-anatomy law)

1. **Dual-mode chrome law** — Browse = rail expanded + standard top bar; Focus = rail collapsed + recessed top bar. Enforced via the page's declared mode (archetype), not per-page taste.
2. **One primary action per view, position-locked** — Focus: the task-completion CTA at the natural completion point (e.g. the Review session's `rating-again/good/easy` cluster). Browse: one top entry CTA. All secondary actions are `ghost`/`icon` (`Button` variants). This upgrades ui-composition's "one CTA" from a _count_ to a _position contract_.
3. **Preview-detail separation as the master-detail law** — lists/launchers show previews only; detail/task is a Focus surface; never inline full detail into a list; never stack dense grids in a Focus surface. See `ui-composition.instructions.md` §7.
4. **Fixed-height data-resilient shell in every Focus surface** (ADR-002) — stable frame, inner scroll, skeleton dims = final dims. Chrome never scrolls; content does.
5. **Density + spacing contract** — Focus surfaces stay consumer-comfortable (`gap-lg/md/sm/xs` hierarchy per `design-reasoning.md` §5.3; never the same gap at different levels); density rises only in Browse indexes and the HSK exam scan surface.
6. **No page-scoped layout CSS, ever (page-anatomy law)** - every page composes PageShell
   (per-archetype `--page-measure-*`) -> PageStack (section rhythm) -> PageGrid (card home). No
   page max-width / `margin:...auto` wrapper / `grid-template-columns` in `*Page.css`
   (`design-audit`: `missing-layout-token` / `page-scoped-layout-css` / `page-scoped-grid`). The
   anatomy ledger (`.github/page-inventory.json` shell/measure/gutter/header) is the machine
   contract; drift leaders converge in the S2 wave order (D5).

### Mode / page mapping (epics 25–40)

| Page type                                               | Epic(s)            | Mode                  | Archetype  | Key paradigm rules                                                                                 |
| ------------------------------------------------------- | ------------------ | --------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Learn home / dashboard                                  | 26, 40             | **Browse**            | `overview` | expanded rail; value-moment CTA top; card family; one focal point/section                          |
| Lists / browse (Library, ContentBrowser)                | 26·28·32·33·40     | **Browse**            | `list`     | expanded rail; preview rows; row→Focus; density to consumer max                                    |
| Review session                                          | North Star         | **Focus**             | `detail`   | collapsed rail; completion CTA; flat cards (§4.1); fixed shell                                     |
| Quiz                                                    | 26, 28             | **Focus**             | `detail`   | same skeleton as Review (consistency by archetype)                                                 |
| Chat / assistant                                        | 30, 31             | **Focus**             | `detail` * | collapsed rail; fixed shell + inner scroll; anchored composer; live region (4.1.3); one CTA = send |
| HSK exam                                                | 37                 | **Focus**             | `detail` * | most chrome-recessed; timer in top bar; dense scan; 2.2.1 timing                                   |
| Speaking / ASR                                          | 36                 | **Focus**             | `detail` * | full-bleed; media controls; non-color feedback (1.4.1)                                             |
| Lexical detail (character/word/radical/chengyu/grammar) | 28·32·33           | **Focus**             | `detail`   | collapsed rail; a session is a ROUTE (`/learn/hub/:entityType/:entityId`), never a modal           |
| Settings / account                                      | 25/39 shell family | **Browse** (settings) | `settings` | expanded rail; standard settings anatomy; one primary per section                                  |
| Auth                                                    | 25/39 shell family | neither (exception)   | `auth`     | no rail; centered single-column; one CTA                                                           |

\* Chat, the HSK exam and speaking/ASR were `focus-chat` / `focus-timed` / `focus-media`; those names
are RETIRED (spine `registry/renames.md`) and they are all `detail` with a different body. The eight
remaining spine archetypes (`create-edit`, `search`, `profile`, `notifications`, `reports`, `empty`,
`not-found`, `wizard`) have no PinyinPal page mapped yet — see the library below.

**The paper surface is a register, not a mode, and not an archetype.** ADR-011 decision 4 makes the
register per-archetype: the dark instrument surface carries data, wayfinding and tasks; the **paper
surface is the long-form reading page only** (the case `focus-media` used to name). Because long-form
reading is now `detail` with a different body, the archetype id alone cannot select the register — the
reading page **declares** it: `PageShell surface="paper"` (ADR-012). Every other page, and all chrome,
stays on the instrument register; a page never paints a register in its own CSS, and the declaration is
never a theme switch (ADR-001 stands). The reading page's own content surface is a separate epic's job.

---

## The 13 Archetypes (spine's closed generic set)

Each archetype is a YAML block. **Composition maps may only name `component-registry.json` components** — `check:page-inventory` fails on any non-registry name. Token references are names only (`--space-*`, `--font-*`, `--color-*`, `--surface-*`); new tokens still flow through the `DESIGN.md` + `globals.css` + `design-audit` parity path.

**Page anatomy & measure (the shell law):** the archetype name IS the measure token name: every
archetype has a `--page-measure-<archetype>` in DESIGN.md `tokens.layout` <-> globals.css `:root`
(parity-gated #14) and a `.page-shell--<archetype>` class in `PageShell.css`. Measures: `overview`
960 / `list` 1200 / `detail` 620 / `create-edit` 720 / `settings` 1000 / `auth` 420 / `search`
1000 / `profile` 960 / `notifications` 760 / `reports` 1200 / `empty` 620 / `not-found` 620 /
`wizard` 720 px. The mapping is one-to-one, so `PageShell` needs no translation table. Pages
compose `PageShell(measure) -> PageStack(rhythm) -> PageGrid(gutter)`; the
per-page anatomy (shell/measure/gutter/header) is declared in `.github/page-inventory.json`
(verified by `check:page-inventory`) - this doc defines the archetypes; the ledger is authoritative
per page. Never add a `--page-measure-*` name spine's registry lacks.

### 1. `overview`

**spine:** a launch surface: destinations, not content (960px).

```yaml
archetype: overview
mode: browse
epics: [26, 40]
pages: Learn home / dashboard
chrome:
  rail: expanded
  top-bar: standard
  shell: page scrolls as one surface; data-resilient on dynamic sections
anatomy:
  - region: header
    contents: [title (h1), value-moment CTA (top-right)]
  - region: focal-point
    contents: [one primary card / hero section with the next best action]
  - region: sections
    contents: [one focal point per section; card family; ≤6-7 items per section → grid/pagination]
cta-slot:
  position: top (one entry CTA per view)
  primary: Button variant="primary"
  secondary: Button variant="ghost" | variant="secondary"
composition-map:
  section: Box variant="dark"
  focal-point: Card
  items: Card
  progress: ProgressBar
  guest-gate: GuestUpsell
  meta: Badge | Chip | ClassificationBadge
states: [loading, empty, error, edge]
density: consumer-comfortable (space-lg/md/sm hierarchy; §5.3 no same-gap collapse)
a11y:
  - one h1; sections use h2; never skip levels
  - visible focus-visible ring on every interactive element (WCAG 2.4.11)
  - guest CTA announced; no color-only states
golden-template: Learn home exemplar story (epic 26 first page — the guest-lane value surface)
generation: "pick archetype → per-epic design spec (archetype: overview) → Step 1 story on the host page container → user preview gate → Step 2"
```

### 2. `list`

**spine:** a dense browsable index (grid + filters) (1200px).

```yaml
archetype: list
mode: browse
epics: [26, 28, 32, 33, 40]
pages: Library, ContentBrowser (words / characters / radicals / grammar / chengyu / readers)
chrome:
  rail: expanded
  top-bar: standard
  shell: fixed header + scrollable list area; row → Focus surface
anatomy:
  - region: header
    contents: [title (h1), one top entry CTA]
  - region: toolbar
    contents: [SearchInput, FilterChip(s), FilterControls]
  - region: list
    contents: [preview rows only — no inline detail; row → Focus surface]
cta-slot:
  position: top (one entry CTA); each row is a secondary "open" action
  primary: Button variant="primary"
  secondary: Button variant="ghost" | variant="secondary"
composition-map:
  search: SearchInput
  filters: FilterChip | FilterControls
  list: ContentBrowser | Box variant="item"
  row-selected: Box variant="item" + left border --color-primary-border
  detail-link: TextLink
  meta: Badge | ClassificationBadge
states: [loading, empty, error, disabled, edge]
density: consumer max (denser than Focus, NOT enterprise table density; keep --space-sm/--space-md row breathing room)
a11y:
  - filter chips expose aria-pressed; list semantics (listitem/row)
  - selected state shown by border + text, not color alone (1.4.1)
  - focus-visible on rows; keyboard reachable
golden-template: LibraryPage → list exemplar
generation: "pick archetype → per-epic design spec (archetype: list) → Step 1 story → user preview gate → Step 2"
```

### 3. `detail`

**spine:** one subject, one task (620px).

```yaml
archetype: detail
mode: focus
epics: [26, 28] + North Star Review
pages: Review session, Quiz (all modes), Lexical session (character/word/radical/chengyu/grammar detail)
chrome:
  rail: collapsed (icon rail)
  top-bar: recessed
  shell: fixed data-resilient shell (ADR-002); inner scroll; skeleton dims = final dims
anatomy:
  - region: top-bar
    contents: [ProgressBar, timer (if any), minimal chrome]
  - region: task
    contents: [one flat card (§4.1 — no shadows), content-first]
  - region: completion
    contents: [rating / next-action cluster at the natural completion point]
cta-slot:
  position: bottom-of-task (completion CTA cluster)
  primary: Button variant="rating-again" | variant="rating-good" | variant="rating-easy" | variant="primary"
  secondary: Button variant="ghost" | variant="icon"
composition-map:
  progress: ProgressBar
  task-card: Card (--surface-dark, --surface-border, flat)
  rating: Button variant="rating-again" | "rating-good" | "rating-easy"
  feedback: Box variant="pass" | "fail" (with text, not color alone)
  audio: Button variant="ghost"
states: [loading, empty (session complete), error, disabled (submit), edge]
density: consumer-comfortable; flat cards; single focal point
a11y:
  - live region (4.1.3) for answer feedback
  - keyboard-navigable rating cluster; focus order matches visual order
  - visible focus-visible ring (2.4.11); touch targets ≥28px (--size-touch)
golden-template: ReviewView — the **North Star** every focus page is compared against
generation: "pick archetype → per-epic design spec (archetype: detail) → Step 1 story matching the ReviewView exemplar → user preview gate → Step 2"
```

**A `detail` page is a route, never a modal.** The lexical session
(`/learn/hub/:entityType/:entityId`, `pages/learn/hub/LexicalEntityPage.tsx`) is the reference: the
entity body renders inside `PageShell(detail)` under Focus chrome, so it has a URL, a history entry
and a Back control. `design-audit:foundation` fails a `<Modal>` that hosts a session surface
(`session-modal`) and fails a dispatcher mounted outside a routed `detail` page (`session-route`).

### 4. `settings`

**spine:** multi-item configuration or readout (1000px).

```yaml
archetype: settings
mode: browse (settings)
epics: [25, 39] shell family
pages: Settings, Profile, account surfaces
chrome:
  rail: expanded
  top-bar: standard
  shell: standard settings anatomy; page scrolls as one surface
anatomy:
  - region: header
    contents: [title (h1)]
  - region: sections
    contents: [sectioned settings; one primary CTA per section]
cta-slot:
  position: one primary per section, standard position
  primary: Button variant="primary"
  secondary: Button variant="secondary" | "ghost"
composition-map:
  section: Box variant="dark"
  toggle: ToggleSwitch
  input: Input | Textarea | RadioGroup | Dropdown
  save: Button variant="primary"
  cancel: Button variant="ghost"
  meta: TextLink | Badge
states: [loading, empty, error, disabled (unsaved/invalid), edge]
density: consumer-comfortable; grouped sections with hierarchy spacing (§5.3)
a11y:
  - every input has a visible label or aria-label
  - focus order/trap correct in any Modal/Dropdown (2.4.3)
  - error messages linked to inputs (aria-describedby)
golden-template: settings/account exemplar (epic 25/39 shell family)
generation: "pick archetype → per-epic design spec (archetype: settings) → Step 1 story → user preview gate → Step 2"
```

### 5. `auth`

**spine:** a short form with no destinations (420px). Generic already - the one archetype whose
name did not change.

```yaml
archetype: auth
mode: exception (neither Browse nor Focus)
epics: [25, 39] shell family
pages: Login, Register
chrome:
  rail: none
  top-bar: none
  shell: centered single-column
anatomy:
  - region: brand
    contents: [logo / app mark]
  - region: title
    contents: [title (h1)]
  - region: form
    contents: [credential fields, submit CTA]
  - region: links
    contents: [switch-form / recovery TextLinks]
cta-slot:
  position: one primary submit CTA
  primary: Button variant="primary"
  secondary: Button variant="ghost" | TextLink
composition-map:
  container: Box variant="dark" | "card"
  input: Input (email/password)
  submit: Button variant="primary"
  links: TextLink
  error: inline error linked to inputs (aria-describedby)
states: [loading (submitting), empty, error (invalid credentials + inline), disabled (invalid form), edge]
density: consumer-comfortable; single column
a11y:
  - form labels + aria-describedby error association
  - focus management on error; visible focus-visible ring
  - touch targets ≥28px (--size-touch, 2.5.8)
golden-template: LoginPageFull / RegisterPageFull exemplars
generation: "pick archetype → per-epic design spec (archetype: auth) → Step 1 story → user preview gate → Step 2"
```

### 6. `create-edit`

**spine:** a form that writes one record (720px).

```yaml
archetype: create-edit
mode: browse
epics: []
pages: none yet - the archetype is available for the next record-writing form
chrome:
  rail: expanded
  top-bar: standard
  shell: page scrolls as one surface; the form is the only content region
anatomy:
  - region: header
    contents: [title (h1), optional back TextLink]
  - region: form
    contents: [fields grouped by section; one submit at the end]
  - region: actions
    contents: [primary submit, secondary cancel]
cta-slot:
  position: end of the form (submit); cancel stays secondary
  primary: Button variant="primary"
  secondary: Button variant="ghost"
composition-map:
  section: Box variant="dark"
  field: Input | Textarea | Dropdown | RadioGroup | ToggleSwitch
  submit: Button variant="primary"
  cancel: Button variant="ghost"
  error: inline error linked to inputs (aria-describedby)
states: [loading, error (validation), disabled (invalid/pristine), edge]
density: consumer-comfortable; single column at the 720px reading measure
a11y:
  - every field has a visible label or aria-label
  - validation errors linked with aria-describedby; focus moves to the first error
  - disabled submit announced, never color-only
golden-template: none yet - the first create/edit form becomes the exemplar
generation: "pick archetype → per-epic design spec (archetype: create-edit) → Step 1 story → user preview gate → Step 2"
```

### 7. `search`

**spine:** a query and its results (1000px).

```yaml
archetype: search
mode: browse
epics: []
pages: none yet - Library search is inline today; a dedicated results page would be this archetype
chrome:
  rail: expanded
  top-bar: standard
  shell: query pinned at the top; results scroll beneath
anatomy:
  - region: query
    contents: [SearchInput, FilterControls]
  - region: meta
    contents: [result count, active filters]
  - region: results
    contents: [preview rows / result cards only - no inline detail]
cta-slot:
  position: top (the query is the action); each result is a secondary open
  primary: Button variant="primary" (submit query)
  secondary: Button variant="ghost" | TextLink
composition-map:
  query: SearchInput
  filters: FilterChip | FilterControls
  results: ContentBrowser | Box variant="item"
  empty: EmptyState
  meta: Badge
states: [loading, empty (no results), error, disabled (empty query), edge]
density: consumer-comfortable; results dense enough to scan
a11y:
  - query input labelled; result count announced in a live region
  - keyboard-reachable results; focus-visible ring on rows
golden-template: none yet
generation: "pick archetype → per-epic design spec (archetype: search) → Step 1 story → user preview gate → Step 2"
```

### 8. `profile`

**spine:** one identity plus its activity (960px).

```yaml
archetype: profile
mode: browse
epics: [25, 39] shell family
pages: ProfilePage (today a `settings` placeholder - re-classify it to `profile` when the real
  identity + activity surface is built)
chrome:
  rail: expanded
  top-bar: standard
  shell: page scrolls as one surface; identity header is not sticky
anatomy:
  - region: identity
    contents: [avatar/initials, display name (h1), one line of meta]
  - region: activity
    contents: [one activity section per family; one focal point per section]
  - region: actions
    contents: [one primary account action; the rest ghost]
cta-slot:
  position: identity header (one primary alongside the name)
  primary: Button variant="primary"
  secondary: Button variant="ghost" | TextLink
composition-map:
  identity: Box variant="dark"
  avatar: Icon
  activity: Card | ProgressBar
  meta: Badge | ClassificationBadge
  empty: EmptyState
states: [loading, default, empty (no activity), error, edge]
density: consumer-comfortable; identity first, activity below
a11y:
  - one h1 (the display name); activity sections use h2
  - avatar is decorative unless it is the only name - then it carries the label
golden-template: none yet
generation: "pick archetype → per-epic design spec (archetype: profile) → Step 1 story → user preview gate → Step 2"
```

### 9. `notifications`

**spine:** a chronological stream (760px).

```yaml
archetype: notifications
mode: browse
epics: []
pages: none yet
chrome:
  rail: expanded
  top-bar: standard
  shell: fixed filter row + scrollable stream
anatomy:
  - region: header
    contents: [title (h1), mark-all-read as a secondary]
  - region: stream
    contents: [chronological rows; new/read state shown by text + weight, not color alone]
cta-slot:
  position: header (one primary); each row is a secondary open
  primary: Button variant="primary"
  secondary: Button variant="ghost" | TextLink
composition-map:
  row: Box variant="item"
  meta: Badge | Chip
  empty: EmptyState
  loading: Skeleton
states: [loading, empty, error, edge (all read)]
density: consumer-comfortable; one row family, no nesting
a11y:
  - list semantics on the stream; unread state announced in text
  - no auto-advancing content; focus-visible on rows
golden-template: none yet
generation: "pick archetype → per-epic design spec (archetype: notifications) → Step 1 story → user preview gate → Step 2"
```

### 10. `reports`

**spine:** tables and charts (1200px).

```yaml
archetype: reports
mode: browse
epics: []
pages: none yet - ProgressPage stays `settings` until it grows a real reporting surface
chrome:
  rail: expanded
  top-bar: standard
  shell: page scrolls as one surface; filters stay at the top of each report block
anatomy:
  - region: header
    contents: [title (h1), date-range / filter controls]
  - region: summary
    contents: [a small set of headline figures (ProgressBar / Badge)]
  - region: tables
    contents: [one table or chart per question; no more than one focal block per section]
cta-slot:
  position: header (export / primary action)
  primary: Button variant="primary"
  secondary: Button variant="ghost" | Dropdown
composition-map:
  filter: FilterControls | Dropdown
  figure: ProgressBar | Badge
  table: Grid | Box variant="item"
  empty: EmptyState
states: [loading, empty (no data yet), error, disabled (filter pending), edge]
density: consumer max - the densest browse surface, still not enterprise table density
a11y:
  - tables use real table semantics or labelled grids; charts never color-only
  - filter changes do not move focus
golden-template: none yet
generation: "pick archetype → per-epic design spec (archetype: reports) → Step 1 story → user preview gate → Step 2"
```

### 11. `empty`

**spine:** one message and one way out (620px).

```yaml
archetype: empty
mode: browse
epics: []
pages: none yet (page-level empty; a section-level empty is `EmptyState` inside any archetype)
chrome:
  rail: expanded
  top-bar: standard
  shell: single centred message region
anatomy:
  - region: message
    contents: [EmptyState - one sentence on why it is empty]
  - region: action
    contents: [one way out (CTA or TextLink)]
cta-slot:
  position: below the message, centred
  primary: Button variant="primary"
  secondary: TextLink
composition-map:
  message: EmptyState
  action: Button variant="primary"
  secondary-action: TextLink
states: [default, edge (CTA unavailable)]
density: consumer-comfortable; one focal point, no sections
a11y:
  - the message is the h1; the CTA is the only tab stop besides chrome
golden-template: none yet
generation: "pick archetype → per-epic design spec (archetype: empty) → Step 1 story → user preview gate → Step 2"
```

### 12. `not-found`

**spine:** one message and one way back (620px).

```yaml
archetype: not-found
mode: browse
epics: []
pages: none yet (404 route)
chrome:
  rail: expanded
  top-bar: standard
  shell: single centred message region
anatomy:
  - region: message
    contents: [ErrorScreen - one sentence on what was not found]
  - region: action
    contents: [one way back (home / previous surface)]
cta-slot:
  position: below the message, centred
  primary: Button variant="primary"
  secondary: TextLink
composition-map:
  message: ErrorScreen
  action: Button variant="primary"
  secondary-action: TextLink
states: [default]
density: consumer-comfortable; one focal point
a11y:
  - the message is the h1; the way back is the first tab stop in the content region
golden-template: none yet
generation: "pick archetype → per-epic design spec (archetype: not-found) → Step 1 story → user preview gate → Step 2"
```

### 13. `wizard`

**spine:** a sequence of steps (720px).

```yaml
archetype: wizard
mode: focus
epics: []
pages: none yet (onboarding / placement test are the likely first consumers)
chrome:
  rail: collapsed (icon rail)
  top-bar: recessed; step position in the top bar
  shell: fixed shell; one step visible at a time, inner scroll
anatomy:
  - region: stepper
    contents: [step position (ProgressBar), step label]
  - region: step
    contents: [one step body - a form section, a choice, or a reading]
  - region: controls
    contents: [next/back at the natural completion point]
cta-slot:
  position: bottom of the step (next/submit); back is secondary
  primary: Button variant="primary"
  secondary: Button variant="ghost"
composition-map:
  stepper: ProgressBar
  step: Box variant="dark"
  field: Input | RadioGroup | Dropdown
  next: Button variant="primary"
  back: Button variant="ghost"
states: [loading, error (step validation), disabled (step incomplete), edge (last step)]
density: consumer-comfortable; exactly one step's worth of content
a11y:
  - step changes announced in a live region; focus moves to the new step heading
  - the stepper states the position in text, not only as a bar
golden-template: none yet
generation: "pick archetype → per-epic design spec (archetype: wizard) → Step 1 story → user preview gate → Step 2"
```

---

## Retired archetypes (kept as a record, not choosable)

These three never had a measure token and were retired without a replacement (spine
`registry/renames.md:35`) - a conversation, a timed task and long-form reading are all
`detail` with a different body. Their entries are kept so the reasoning is not lost.

### RETIRED - `focus-chat`

**RETIRED, no replacement** (spine `registry/renames.md`): a conversation is `detail` with a
different body. Kept here as a record, not as a choosable archetype.

```yaml
archetype: focus-chat
retired: true
maps-to: detail
mode: focus
epics: [30, 31]
pages: Chat / assistant
chrome:
  rail: collapsed (icon rail)
  top-bar: recessed
  shell: fixed shell + inner scroll on the thread; composer anchored (chrome never scrolls)
anatomy:
  - region: top-bar
    contents: [title, status]
  - region: thread
    contents: [message rows (inner scroll), typing indicator]
  - region: composer
    contents: [anchored input + send CTA]
cta-slot:
  position: composer — one CTA = send
  primary: Button variant="primary" (icon) in the composer
  secondary: Button variant="ghost" | variant="icon"
composition-map:
  message-row: Box variant="surface" | "dark"
  composer: Input | Textarea
  send: Button variant="primary"
  typing: Skeleton | Spinner
  error: ErrorScreen | inline error with retry
states:
  [loading (typing), empty (welcome), error (failed message + retry), disabled (sending), edge]
density: consumer-comfortable; reading-friendly line lengths
a11y:
  - live region (4.1.3) announcing new messages/status
  - focus management on composer; aria-label on icon-only send
  - contrast on message text; 320px reflow, no horizontal scroll
golden-template: first assistant page exemplar (epic 30)
generation: "pick archetype → per-epic design spec (archetype: focus-chat) → Step 1 story → user preview gate → Step 2"
```

### RETIRED - `focus-timed`

**RETIRED, no replacement** (spine `registry/renames.md`): a timed task is `detail` with a
different body. Kept here as a record, not as a choosable archetype.

```yaml
archetype: focus-timed
retired: true
maps-to: detail
mode: focus
epics: [37]
pages: HSK exam
chrome:
  rail: collapsed (icon rail) — most chrome-recessed surface
  top-bar: recessed; timer prominent in the top bar
  shell: fixed shell + inner scroll; dense scan area
anatomy:
  - region: top-bar
    contents: [timer (prominent), question position]
  - region: scan
    contents: [dense question grid / scan surface]
  - region: answer
    contents: [answer controls + submit/next at the completion point]
cta-slot:
  position: natural completion point (submit / next)
  primary: Button variant="primary" (submit/next)
  secondary: Button variant="ghost" | variant="icon"
composition-map:
  timer: ProgressBar (time) + --font-xl bold
  level-meta: ClassificationBadge | Badge
  scan: Grid
  item: Card (flat)
  answer: Button variant="tone-*" | "primary" | RadioGroup
states: [loading, empty, error, disabled, edge (time-up)]
density: densest consumer surface (grid scan) — still NOT enterprise density
a11y:
  - timing adjustable/pausable where possible (WCAG 2.2.1)
  - non-color feedback for correct/incorrect (1.4.1)
  - visible focus-visible ring; keyboard navigation across the scan grid
golden-template: first exam page exemplar (epic 37)
generation: "pick archetype → per-epic design spec (archetype: focus-timed) → Step 1 story → user preview gate → Step 2"
```

### RETIRED - `focus-media`

**RETIRED, no replacement** (spine `registry/renames.md`): long-form reading is `detail` with a
different body. Kept here as a record, not as a choosable archetype.

```yaml
archetype: focus-media
retired: true
maps-to: detail
mode: focus
epics: [36]
pages: Speaking / ASR, stroke/media surfaces
chrome:
  rail: collapsed (icon rail)
  top-bar: recessed / minimal
  shell: full-bleed media area; fixed shell where dynamic
anatomy:
  - region: top-bar
    contents: [minimal title/status]
  - region: media
    contents: [visualization / animation area, full-bleed]
  - region: controls
    contents: [record/play/pause controls, centered primary]
cta-slot:
  position: primary control (record) centered
  primary: Button variant="control" | "circle"
  secondary: Button variant="ghost" | variant="icon"
composition-map:
  visualization: CharacterStrokePlayer | AnimationCanvas
  primary-control: Button variant="control" | "circle"
  level: ProgressBar
  mic-error: ErrorScreen | inline error with guidance
  feedback: Box variant="pass" | "fail" + text (non-color)
states:
  [
    loading (mic permission),
    empty (no media),
    error (mic denied + guidance),
    disabled (recording lockout),
    edge,
  ]
density: consumer-comfortable; media gets the frame
a11y:
  - non-color feedback for ASR/score indication (1.4.1)
  - touch targets ≥28px (--size-touch, 2.5.8)
  - live region for ASR status; keyboard-reachable media controls
golden-template: first ASR page exemplar (epic 36)
generation: "pick archetype → per-epic design spec (archetype: focus-media) → Step 1 story → user preview gate → Step 2"
```

---

## The Generation Contract (how AI consumes the library)

```
input  = { business_need:  BM-1 §tier + epic ACs
           archetype:      id from this file (the YAML block)
           tokens:         DESIGN.md + globals.css
           components:     component-registry.json
           exemplar:       Golden Template story (same family) }
output = { phase_a_story:  <HostPage>Full.stories.tsx  (no logic)
           states:         loading/empty/error/disabled/edge stories
           composition:    regions → registry components, nothing invented }
gates  = user preview gate → design-audit · check:page-inventory ·
         test-storybook · addon-a11y · pre-delivery checklist
```

- The archetype's **composition map is the strict constraint** ("fill region X with `Card`, never a raw div; single CTA = `Button variant='primary'`").
- The **Golden Template is the "build using this exact structural pattern" baseline** — the agent never builds from blank.
- Two pages of the same archetype _cannot_ differ in anatomy: there is no anatomy to invent, only to fill.

## Ledger & Gates

- **`.github/page-inventory.json`** — one entry per page container: `{ route, component, archetype, story, states[], status: conforms|diverges }`. This is the machine-readable page contract and the divergence snapshot.
- **`check:page-inventory`** (gate #7 in `project-workflow.instructions.md`) fails if a page lacks an entry, uses an unregistered archetype, names a non-registry component in its composition map, is missing its `Full` story, or declares no/illegal states.
- **`design-quality-rubric.md`** — the human scoring companion (what "good" means, how to measure it).

**See also:** `design-reasoning.md` (design philosophy + token freeze + external borrowing) • `per-epic-design-spec.md` (the spec template that consumes this library) • `design-quality-rubric.md` (the scoring companion) • `frontend-pre-delivery-checklist.instructions.md` (shipped gate artifact).

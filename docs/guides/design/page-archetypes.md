---
purpose: The page-level contract — a finite set of named Focus-First page skeletons every page parameterizes
status: active
last-verified: 2026-08-17
type: design
audience: all
---

# PinyinPal Page Archetypes — Focus-First Page Library

**Last Updated:** 2026-08-17
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

### The 5 non-negotiables

1. **Dual-mode chrome law** — Browse = rail expanded + standard top bar; Focus = rail collapsed + recessed top bar. Enforced via the page's declared mode (archetype), not per-page taste.
2. **One primary action per view, position-locked** — Focus: the task-completion CTA at the natural completion point (e.g. the Review session's `rating-again/good/easy` cluster). Browse: one top entry CTA. All secondary actions are `ghost`/`icon` (`Button` variants). This upgrades ui-composition's "one CTA" from a _count_ to a _position contract_.
3. **Preview-detail separation as the master-detail law** — lists/launchers show previews only; detail/task is a Focus surface; never inline full detail into a list; never stack dense grids in a Focus surface. See `ui-composition.instructions.md` §7.
4. **Fixed-height data-resilient shell in every Focus surface** (ADR-002) — stable frame, inner scroll, skeleton dims = final dims. Chrome never scrolls; content does.
5. **Density + spacing contract** — Focus surfaces stay consumer-comfortable (`gap-lg/md/sm/xs` hierarchy per `design-reasoning.md` §5.3; never the same gap at different levels); density rises only in Browse indexes and the HSK exam scan surface.

### Mode / page mapping (epics 25–40)

| Page type                                | Epic(s)            | Mode                 | Archetype      | Key paradigm rules                                                                                 |
| ---------------------------------------- | ------------------ | -------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| Learn home / dashboard                   | 26, 40             | **Browse**           | `hub-launcher` | expanded rail; value-moment CTA top; card family; one focal point/section                          |
| Lists / browse (Library, ContentBrowser) | 26·28·32·33·40     | **Browse**           | `browse-index` | expanded rail; preview rows; row→Focus; density to consumer max                                    |
| Review session                           | North Star         | **Focus**            | `focus-task`   | collapsed rail; completion CTA; flat cards (§4.1); fixed shell                                     |
| Quiz                                     | 26, 28             | **Focus**            | `focus-task`   | same skeleton as Review (consistency by archetype)                                                 |
| Chat / assistant                         | 30, 31             | **Focus**            | `focus-chat`   | collapsed rail; fixed shell + inner scroll; anchored composer; live region (4.1.3); one CTA = send |
| HSK exam                                 | 37                 | **Focus**            | `focus-timed`  | most chrome-recessed; timer in top bar; dense scan; 2.2.1 timing                                   |
| Speaking / ASR                           | 36                 | **Focus**            | `focus-media`  | full-bleed; media controls; non-color feedback (1.4.1)                                             |
| Settings / account                       | 25/39 shell family | **Browse (utility)** | `utility`      | expanded rail; standard settings anatomy; one primary per section                                  |
| Auth                                     | 25/39 shell family | neither (exception)  | `auth`         | no rail; centered single-column; one CTA                                                           |

---

## The 8 Archetypes

Each archetype is a YAML block. **Composition maps may only name `component-registry.json` components** — `check:page-inventory` fails on any non-registry name. Token references are names only (`--space-*`, `--font-*`, `--color-*`, `--surface-*`); new tokens still flow through the `DESIGN.md` + `globals.css` + `design-audit` parity path.

### 1. `hub-launcher`

```yaml
archetype: hub-launcher
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
generation: "pick archetype → per-epic design spec (archetype: hub-launcher) → Step 1 story on the host page container → user preview gate → Step 2"
```

### 2. `browse-index`

```yaml
archetype: browse-index
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
golden-template: LibraryPage → browse-index exemplar
generation: "pick archetype → per-epic design spec (archetype: browse-index) → Step 1 story → user preview gate → Step 2"
```

### 3. `focus-task`

```yaml
archetype: focus-task
mode: focus
epics: [26, 28] + North Star Review
pages: Review session, Quiz (all modes)
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
generation: "pick archetype → per-epic design spec (archetype: focus-task) → Step 1 story matching the ReviewView exemplar → user preview gate → Step 2"
```

### 4. `focus-chat`

```yaml
archetype: focus-chat
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

### 5. `focus-timed`

```yaml
archetype: focus-timed
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

### 6. `focus-media`

```yaml
archetype: focus-media
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

### 7. `utility`

```yaml
archetype: utility
mode: browse (utility)
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
generation: "pick archetype → per-epic design spec (archetype: utility) → Step 1 story → user preview gate → Step 2"
```

### 8. `auth`

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

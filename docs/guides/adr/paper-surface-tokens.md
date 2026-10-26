---
purpose: "ADR-012 — lands ADR-011 consequence 3's paper surface token family through ADR-005's route: the nine names, their values, why they are PinyinPal domain names rather than spine generics, and how the reading page selects the register."
status: ratified
date: 2026-10-26
relates-to: "ADR-011 (Night Bench) · ADR-005 (Token Freeze) · ADR-001 (Dark Mode Only) · ADR-008 (text tiers)"
last-verified: 2026-10-26
type: adr
audience: agents
---

# ADR-012 — Paper Surface Tokens (landing ADR-011 consequence 3)

**Status:** ratified (implements a ratified ADR; no new visual direction is chosen here)
**Date:** 2026-10-26
**Decided by:** agent implementation under ADR-011 consequence 3 + the ADR-005 procedure

## Context

ADR-011 (Night Bench) ratified a **per-archetype register**: the dark instrument surface carries data,
wayfinding and tasks; a **light warm-paper surface is added for long-form reading only**. Its consequence 3
names the token family that has to exist for that surface, and its open item 2 is "land the paper token
family through ADR-005".

ADR-005's procedure is not a formality — a token lands in `DESIGN.md` **and** `globals.css` in the same
change, passes `design:lint` + `design-audit`, is parity-gated, and is recorded as an ADR. Three facts
shape this landing:

1. **The live vocabulary is spine's.** Steps 1a/1b of the spine-hybrid migration adopted spine's semantic
   names (`--canvas`, `--card`, `--hairline`, `--ink-1/2/3`, `--accent-*`) with Night Bench values, and gate
   #15 (`check:spine-parity`) now fails any new generic name.
2. **Spine owns no paper name.** Spine's paper is `themes.reading-room`, and it is retired there as a
   _theme_. Using that theme would resurrect a retired mechanism and re-point the same semantic names at
   runtime — exactly what ADR-011 consequence 1 forbids.
3. **`focus-media` — ADR-011's word for the reader — is retired.** Spine's rename made long-form reading
   `detail` with a different body, so an archetype id can no longer select the register on its own.

## Decision

1. **Land exactly the nine names ADR-011 consequence 3 lists**, and nothing else:
   `--surface-paper`, `--surface-paper-alt`, `--surface-paper-border`, `--surface-paper-track`,
   `--text-paper-primary`, `--text-paper-secondary`, `--text-paper-tertiary`, `--size-well`,
   `--size-focal-glyph`. No type token and no accent token (consequence 4 — the display tiers, the font
   pair and the accent split already exist).
2. **These are PinyinPal domain names, not spine generics.** They are recorded in the hand-maintained
   `domain` set of `tools/spine-token-names.json` (gate #15) with the reason: spine has no paper name to
   align to, so the family is product-scoped by construction, not a generic spine is missing by oversight.
3. **Values are the locked paper ladder the ADR was decided on** — the same ladder ADR-011 § Verification
   measured (0 contrast failures across 60 text nodes at 1280/768/390):
   plane `#ece2cd`, sheet `#f4efe3`, grouping `#dccfae`, track = primary ink 44% into the sheet,
   ink `#2a231b` / `#574e42` / `#6b6454`.
   Contrast on plane / sheet: **12.05 / 13.51**, **6.34 / 7.11**, **4.57 / 5.12**.
4. **The register is selected by declaration, at the shared layer.** `PageShell` takes
   `surface?: "instrument" | "paper"` (default `instrument`) and paints the paper plane + default ink from
   this family. The reading page declares `surface="paper"`; nothing else does, and no page paints a
   register in its own CSS. This is the one surface PageShell carries, because a register belongs to the
   page region rather than to any single child component.
5. **Sizes.** `--size-well: 40px` is spine's `size.well` primitive (the glyph tile square — the same token
   that fixes the 18px tile well ADR-011 § Verification records as a flat-ramp defect).
   `--size-focal-glyph: 48px` is the focal hanzi dimension the North Star review recorded as a raw value
   with no token; it has no spine equivalent and stays a domain name.

## Consequences

- **No page is restyled.** The token family exists and the register is wired; the reading page's own
  content surface belongs to a later epic, which declares `surface="paper"` there.
- **Not a light mode.** `--canvas`/`--ink-*` are never re-pointed, there is no theme switch, no user
  preference, no `[data-theme]` (ADR-001 stands; ADR-011 consequence 1).
- **Gate #14 grew to cover the whole `--size-*` family** (the `size` family now collects `touch`, `well`,
  `focal-glyph` and reverse-checks every `--size-*` var), so the two new sizes cannot drift from the spec.
- **Open, deliberately:** ADR-011 open item 1 (the saturated-fill cap vs ADR-007/010) is untouched, and
  **accent-as-text on paper** has no token — consequence 4 cites `--color-primary-dark` (`#92400E`), a name
  step 1a retired (`--accent-ink` now holds the dark register's amber, which fails on paper). Choosing a
  paper accent ink is a new decision, not a rename, and was not taken here.

## Alternatives considered

- **Reuse `themes.reading-room`** — rejected: it re-points the same semantic names, which is runtime
  theming, and spine retired it (ADR-011 consequence 1; the Design Lead's step-1b scope ruling explicitly
  keeps the paper surface out of the paint migration for this reason).
- **Alias the paper family onto `--canvas`/`--ink-*`** — rejected: that is "a second token set for the same
  surface", the failure mode consequence 1 names. The paper family is a different surface's set.
- **Make `detail` mean paper** — rejected: `detail` also carries the Review session, the quiz, chat and the
  HSK exam, which must stay on the instrument register.

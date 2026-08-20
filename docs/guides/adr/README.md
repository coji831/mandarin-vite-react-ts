---
purpose: "Index of Architecture Decision Records (ADRs) — ADR-001…005 in design-reasoning.md, ADR-006 here, plus the machine decision-log catalog"
status: active
last-verified: 2026-08-18
type: area-index
audience: all
---

# Architecture Decision Records (ADR) — Index

**Last Updated:** August 18, 2026

This directory holds standalone ADR records. ADRs live in two places by design:

- **Inline ADRs (ADR-001…005)** — the design-system ADRs live as sections inside
  [`docs/guides/design/design-reasoning.md`](../design/design-reasoning.md) (Dark Mode Only · Fixed-Height
  Data Shells · No Decorative Animation · Quiz Cards Are Flat · Token Freeze).
- **Standalone ADR (ADR-006)** — [`data-tiering-architecture.md`](data-tiering-architecture.md) — the
  4-tier data architecture (storage / cache / dependency rules), currently `proposed`.

The **machine catalog** of every tracked decision (ADRs, the D-tracker, the OI record, and the BM-1
business register) is [`decision-log.json`](../../../.github/decision-log.json) — the single source of
truth for the map's Architecture / Decisions layer. Never maintain a second hand-written decision list;
add a decision to the JSON, and its record file lives here or in `design-reasoning.md`.

## Records

| Decision | Title                                                                     | Status     | Where                                                          |
| -------- | ------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| ADR-001  | Dark Mode Only — No Light Mode                                            | `ratified` | `design-reasoning.md`                                          |
| ADR-002  | Fixed-Height Data Shells                                                  | `ratified` | `design-reasoning.md`                                          |
| ADR-003  | No Decorative Animation                                                   | `ratified` | `design-reasoning.md`                                          |
| ADR-004  | Quiz Cards Are Flat (No Shadows)                                          | `ratified` | `design-reasoning.md`                                          |
| ADR-005  | Token Freeze — new tokens only via DESIGN.md + globals.css + design-audit | `ratified` | `design-reasoning.md`                                          |
| ADR-006  | Data Tiering Architecture — 4 data tiers (storage/cache/dependency rules) | `proposed` | [`data-tiering-architecture.md`](data-tiering-architecture.md) |

## Writing a new ADR

1. Add a record to `.github/decision-log.json` (id, title, status, file, date).
2. Write the record file here (`docs/guides/adr/<topic>.md`) or, for design-system decisions, as a section
   in `design-reasoning.md` — following the ADR shape: Context / Decision / Consequences / Status.
3. Mark the status per the Decisions vocabulary: `proposed` · `ratified` · `superseded`.

**See also:** `design-reasoning.md` (ADR-001…005 + External Borrowing Protocol) · `decision-log.json`
(machine catalog) · `docs/planning/epics-25-40.md` (D-tracker + OI record).

# Verification Artifacts

Structured outputs produced by agents during verification, review, and audit stages. This directory is **gitignored** — it is the local on-disk evidence record, not part of the committed tree on `main`.

## Purpose

Verification artifacts provide auditable evidence that a work package was completed correctly:

- Human review of agent decisions without re-running the full pipeline
- Restart-safe proof of completed verification gates (test baselines, release-safety gates)
- Records of code-review audits, UIUX audits, and browser-captured screenshots

## Naming Convention

```
<artifact-type>-<epic>-<story>.<ext>
```

Examples:

- `test-report-24-1.md`
- `release-safety-gate-24-14.md`

## Current Artifacts

| Artifact                                | Type        | What it records                                                                                                                      |
| --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `test-report-24-1.md`                   | Test report | Epic 24 T1 pre-migration baseline (test:full / test:integration counts) + P0-1 stopgap post-change verification                      |
| `release-safety-gate-24-14.md`          | Gate result | Story 24-14 DoD verification (all 12 gates) + pre-flight sign-off + post-flip prod-boot smoke (24-15) + rollback/watch-window record |
| `epic-25-integration-review.md`         | Review      | Code Reviewer integration-readiness audit of the calibrated guest-access state against the current code (Epic 25 scope)              |
| `northstar-canonization-review.md`      | Review      | Working record for the north-star page canonization review (8-gate protocol)                                                         |
| `uiux-audit-practices-full-userflow.md` | Audit       | UIUX audit of the PracticesPage full userflow (machine layers L1–L3 + Storybook walk + screenshots)                                  |
| `dashboard-demo-*.png`                  | Screenshots | Browser-captured screenshots supporting earlier audits/reviews                                                                       |

## Behavior Rules

- **Agents write artifacts here** when producing structured output during verification/review/audit stages.
- **Committed docs may backtick-reference these files** (e.g. `release-safety-gate-24-14.md`, `test-report-24-1.md` from the epic-24 docs) for traceability — but because this directory is gitignored, those references do not resolve on `main`. The essential content should be extracted into tracked docs (see the 24-16 release-prep proposal) so the committed record stands on its own.
- **Directory is the local evidence record** — not tracked, not deployed.
- **Retention**: local-only. The `.gitkeep` placeholder anchors the directory.

## Integration with committed docs

Epic/story docs (e.g. `docs/issue-implementation/epic-24-*/**`) cite these artifacts for gate and test evidence. The owner's extraction decision determines whether that evidence is condensed into tracked docs (`docs/audits/` or the epic implementation READMEs) or left as local-only records.

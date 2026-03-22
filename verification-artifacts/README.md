# Verification Artifacts

This directory stores structured outputs produced by agents during verification, review, and audit stages of the SOLAR-Ralph pipeline.

## Purpose

Verification artifacts provide auditable evidence that a work package was completed correctly. They allow:

- Human review of agent decisions without re-running the full pipeline
- Restart-safe proof of completed verification gates
- Pattern analysis across stories to improve agent quality over time

## Artifact Types

| Artifact                       | Produced By                      | Format                                          | Retention                    |
| ------------------------------ | -------------------------------- | ----------------------------------------------- | ---------------------------- |
| `test-report-<story>.txt`      | Frontend/Backend Test Specialist | Plain text (Jest/Vitest output)                 | Until story closed + 30 days |
| `review-findings-<story>.md`   | Frontend/Backend Review Auditor  | Markdown (severity-ordered findings)            | Until story closed + 30 days |
| `security-findings-<story>.md` | Security Auditor                 | Markdown (findings + residual risk)             | Until story closed + 90 days |
| `repro-script-<story>.sh`      | Bug Investigation Specialist     | Shell/curl or Vitest integration test           | Until bug fix verified       |
| `repro-log-<story>.txt`        | Bug Investigation Specialist     | Terminal output confirming repro                | Until bug fix verified       |
| `design-plan-<story>.md`       | Design Planning Architect        | Markdown (work packages + verification targets) | Until story closed           |

## Naming Convention

```
<artifact-type>-<epic>-<story>.<ext>
```

Examples:

- `test-report-15-3.txt`
- `review-findings-15-3.md`
- `security-findings-15-3.md`
- `repro-script-15-3.sh`

## Behavior Rules

- **Agents write artifacts here** when producing structured output during pipeline stages.
- **The governor references artifacts** when verifying stage exit criteria before advancing the pipeline.
- **Log-Backpressure Gate**: Pipeline 3 (Bug Fix) may not mark `WORK_PACKAGE_COMPLETE` until a `repro-log-*.txt` artifact confirms the reproduction script no longer produces the original error.
- **Artifacts are not canon**: They supplement `.ai_ledger.md` but do not replace it. The ledger remains the source of truth for pipeline state.
- **Retention**: Artifacts older than 30 days for standard stories (90 days for security) may be deleted. The `.gitkeep` placeholder keeps the directory tracked.

## Integration with AGENTS.md

The **Verification Contract** in `AGENTS.md` requires all verification evidence to be present before a `WORK_PACKAGE_COMPLETE` promise is written. Referencing the artifact path in the ledger Completion Notes section satisfies this requirement.

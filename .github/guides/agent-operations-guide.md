# Agent Operations Guide

This guide explains how to use the phase 1 SOLAR-Ralph files safely.

## Entry Points

- Use `AGENTS.md` as the control-plane contract.
- Use the Orchestration Governor when a request spans multiple domains or needs delegation.
- Use skills for repeatable workflows such as story execution, doc sync, memory curation, and recursive remediation.

## Operating Sequence

1. Read the request, `.github/AGENTS.md`, and `.github/.ai_ledger.md`.
2. Identify the smallest next work package.
3. Pick the specialist or skill that owns the work.
4. Run focused verification immediately after implementation.
5. Record outcomes in `.github/.ai_ledger.md`.
6. Stop only when the ledger contains a non-pending completion promise.

## Review And Adversarial Use

- Run the frontend or backend review path before calling work complete.
- Run the Security Auditor whenever auth, cookies, JWT, validation, CORS, secrets, or permission boundaries are touched.
- Record reviewer findings and residual risk in the ledger.

## Recursive Loop Rules

- Keep the loop narrow: one failure, one hypothesis, one repair.
- Default limit: three iterations per work package.
- Escalate if the same failure repeats without a stronger hypothesis.
- Phase 1 uses stop-time ledger checks instead of a larger command catalog.

## Hook Reality In Phase 1

The current hook configuration uses supported workspace hook events. It does not attempt unsupported event names from the research document. Failure capture is therefore centered on `PostToolUse` and `Stop` behavior plus ledger updates.

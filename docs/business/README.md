---
purpose: Area index for the business domain — the locked product/business model and its supporting research
status: active
last-verified: 2026-08-17
type: area-index
---

# Business Documentation

> Area index for the business domain — the locked product/business model and its supporting research.
> **Last Updated:** August 17, 2026

## Purpose

This folder holds PinyinPal's **business documentation**, split into three classes:

| Class       | Content                                                                           | Edit policy                                                                                                         |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Class 1** | The **locked business model** — owner-approved, RATIFIED                          | Changes only via owner approval → new **BM-<n>** decision → Change Log row → `Last Updated` bump, all in one commit |
| **Class 2** | **Research & reference** — market findings, feature validation, feature inventory | Freely editable; `Last Updated` bump + git only; supersede via banner, never rewrite cited evidence                 |
| **Class 3** | **Knowledge-base notes** (future)                                                 | Same as Class 2                                                                                                     |

## Files

| Doc                                                            | Class        | Description                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Business Model](business-model.md)                            | 1 — RATIFIED | The owner-approved business model: **Demo-Guest + Data-Driven Learning Road**. Positioning, tiers & access matrix, pricing, funnel, cost model, unit economics, risk posture, locked business rules (L1–L8, P11-AMEND), retirements/re-framings, and the ratified-vs-open-vs-deferred register. **Source of truth.** |
| [Research Findings 2026](research/research-findings-2026.md)   | 2 — research | 2026 research round (M1–M19): market size, competitors, pricing/WTP, conversion/funnel, voice/AI-tutor, HSK 3.0 syllabus, tone/ASR vendors, SRS/FSRS, RAG/embeddings, LLM/voice costs, GDPR/consent, observability.                                                                                                  |
| [Feature Validation 2026](research/feature-validation-2026.md) | 2 — research | 2026 trend/standard fact-check + LLM/RAG-readiness audit (Axes 1–2) of the feature inventory.                                                                                                                                                                                                                        |
| [Feature Inventory](research/feature-inventory.md)             | 2 — research | The consolidated feature inventory (84 features) — registered-user full-access view with statuses (LIVE-NOW / FIX / BUILD / GATED / REMOVE).                                                                                                                                                                         |

## Change Policy

- **Class 1 (Business Model):** RATIFIED rules change only on owner approval. The flow is: owner approves a change → a new **BM-<n>** decision is recorded → a Change Log row is added → `Last Updated` is bumped — **all in one commit**. OPEN (planning-reference) items inside the business model are editable with a `Last Updated` bump only.
- **Class 2 (research):** freely editable — content updates use a `Last Updated` bump plus git. Never rewrite cited evidence in place; supersede via a banner note at the top instead.

## Document Status Vocabulary

Statuses used consistently across the business docs:

- **RATIFIED** — owner-approved and locked; changes only via the **BM-<n>** gate (Change Policy).
- **OPEN** — planning-reference; editable with a `Last Updated` bump only.
- **DEFERRED** — explicitly not business; moved to later epic planning.

## Provenance

> **History:** These documents are the official, ratified source of truth. They are fully self-contained; the committed copies are the only source of record.

## See also

- [Project Documentation](../README.md)

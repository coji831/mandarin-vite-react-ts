# Epic 18: Foundations

## Epic Summary

**Goal:** Provide pinyin reference and stroke order animations as the foundational building blocks for absolute beginners, following the adult Mandarin learning roadmap (Phase 1: The Blueprint).

**Key Points:**

- Interactive pinyin guide with tone chart, audio examples (via existing TTS service), and tone change rules (3rd tone sandhi, 一/不 tone changes)
- Animated stroke order demonstrations using Hanzi Writer npm library (MIT license, 9000+ characters, built-in playback controls)
- Static JSON content in `public/data/` — no backend API dependencies
- Phase 1 of learning roadmap: must be delivered before characters/vocabulary content
- Reuses existing AudioService/Google Cloud TTS for tone audio generation

**Status:** Planned

**Last Update:** June 14, 2026

## Background

## User Stories

This epic consists of the following user stories:

1. **Story 17.1: Knowledge Hub Structure** _(link to `story-17-1-knowledge-hub-structure.md`)_
   - As a **frontend developer**, I want to **scaffold the Knowledge Hub feature folder and navigation**, so that **reference materials are organized and accessible from the main menu**.

2. **Story 17.2: Pinyin System Guide** _(link to `story-17-2-pinyin-system-guide.md`)_
   - As a **learner**, I want to **access an interactive pinyin reference with tone examples**, so that **I can master correct pronunciation and tone distinctions before learning characters**.

3. **Story 17.3: Stroke Order Animations** _(link to `story-17-3-stroke-order-animations.md`)_
   - As a **learner**, I want to **watch animated stroke order demonstrations**, so that **I can learn proper handwriting technique for common characters**.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- **Story 17.1** establishes infrastructure (folder structure, navigation, routing) — first, to scaffold the Knowledge Hub
- **Story 17.2** focuses on pinyin — most critical per roadmap ("master pinyin first")
- **Story 17.3** focuses on stroke animations — second foundational skill

Stories must be delivered in order because Story 17.1 provides the scaffolding that Stories 17.2 and 17.3 depend on.

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes

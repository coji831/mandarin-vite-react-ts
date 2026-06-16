# Epic 18: Foundations

## Epic Summary

**Goal:** Provide pinyin reference and stroke order animations as the foundational building blocks for absolute beginners, following the adult Mandarin learning roadmap (Phase 1: The Blueprint).

**Key Points:**

- Interactive pinyin guide with tone chart, audio examples (via existing TTS service), and tone change rules (3rd tone sandhi, 一/不 tone changes)
- Animated stroke order demonstrations using Hanzi Writer npm library (MIT license, 9000+ characters, built-in playback controls)
- **Audio-to-Type learning loop** — Phase 1 gate quiz: hear audio → type pinyin → select tone. ≥90% accuracy to unlock Phase 2.
- **8 basic strokes reference** (点横竖撇捺提折钩) + **4 stroke order rules** (top-bottom, left-right, outside-inside, close-last)
- **Character Detail Hub** — unified hero-center overlay showing all character info (pinyin, audio, stroke, radicals, mnemonics, examples). Replaces the existing FlashCardPage.
- Static JSON content in `public/data/` — no backend API dependencies
- Phase 1 of learning roadmap: must be delivered before characters/vocabulary content
- Reuses existing AudioService/Google Cloud TTS for tone audio generation

**Status:** Planned

**Last Update:** June 16, 2026

## Background

## User Stories

This epic consists of the following user stories:

1. **Story 17.1: Knowledge Hub Structure** _(link to `story-17-1-knowledge-hub-structure.md`)_
   - As a **frontend developer**, I want to **scaffold the Knowledge Hub feature folder and navigation**, so that **reference materials are organized and accessible from the main menu**.

2. **Story 17.2: Pinyin System Guide** _(link to `story-17-2-pinyin-system-guide.md`)_
   - As a **learner**, I want to **access an interactive pinyin reference with tone examples, tone pair drills, and tone change rules**, so that **I can master correct pronunciation and tone distinctions before learning characters**.

3. **Story 17.3: Stroke Order Animations** _(link to `story-17-3-stroke-order-animations.md`)_
   - As a **learner**, I want to **watch animated stroke order demonstrations and reference the 8 basic strokes + 4 stroke rules**, so that **I can learn proper handwriting technique for common characters**.

4. **Story 17.4: Character Detail Hub** _(link to `story-17-4-character-detail-hub.md`)_
   - As a **learner**, I want to **tap any character to see all its info in one unified overlay (pinyin, stroke animation, radicals, mnemonics, examples)**, so that **I can learn holistically without switching tabs**. Replaces the existing FlashCardPage.

5. **Story 17.5: Audio-to-Type Quiz** _(link to `story-17-5-audio-to-type-quiz.md`)_
   - As a **learner**, I want to **take an audio-to-type quiz that tests pinyin typing and tone selection**, so that **I can demonstrate Phase 1 mastery and unlock Phase 2**.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- **Story 17.1** establishes infrastructure (folder structure, navigation, routing) — first, to scaffold the Knowledge Hub
- **Story 17.2** focuses on pinyin — most critical per roadmap ("master pinyin first")
- **Story 17.3** focuses on stroke reference + animations — second foundational skill
- **Story 17.4** builds the Character Detail Hub — unified overlay, replaces FlashCardPage
- **Story 17.5** builds the Audio-to-Type quiz — Phase 1 gate (≥90% to pass)

Stories 17.1-17.3 must be delivered first. Stories 17.4-17.5 depend on Story 17.1 (routing infrastructure).

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes

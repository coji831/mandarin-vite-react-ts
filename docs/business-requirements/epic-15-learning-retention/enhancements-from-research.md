# Epic 15 Enhancements from Research

**Source**: [Vocabulary Retention Research](../../knowledge-base/vocabulary-retention-research.md) (full research document)

This document maps research-based retention techniques to their implementation in Epic 15.

## Related Knowledge Base Articles

For deeper understanding of the concepts behind these implementations:

- [Cognitive Science of Active Recall](../../knowledge-base/cognitive-science-active-recall.md) - Testing effect, desirable difficulty, interleaving
- [Spaced Repetition Algorithms](../../knowledge-base/spaced-repetition-algorithms.md) - FSRS vs SM-2, optimal interval calculation
- [Gamification Psychology](../../knowledge-base/gamification-psychology-learning.md) - Loss aversion, variable rewards, ethical design
- [Chinese Character Structure](../../knowledge-base/chinese-character-structure.md) - Radicals, phonetic components, decomposition
- [Full Research Document](../../knowledge-base/vocabulary-retention-research.md) - Complete original research

## Related Implementation Guides

For step-by-step implementation instructions:

- [Quiz State Management Guide](../../guides/quiz-state-management-guide.md) - React reducer patterns, interleaving logic, localStorage persistence
- [Gemini API Integration Guide](../../guides/gemini-api-integration-guide.md) - AI feedback setup, rate limiting, caching strategies
- [Tone Input Component Guide](../../guides/tone-input-component-guide.md) - Tone mark conversion, validation rules, mobile UX
- [Spaced Repetition Integration Guide](../../guides/spaced-repetition-integration-guide.md) - Unified algorithm, backward compatibility, feature detection
- [Redis Caching for Quiz Features](../../guides/redis-caching-quiz-guide.md) - Cache key strategies, TTL patterns, invalidation
- [Troubleshooting Quiz Features](../../guides/troubleshooting-quiz-features.md) - Common issues and solutions

## Integrated Now (Category 1)

These enhancements have been integrated into the Epic 15 design and will be implemented as part of the current epic:

### 1. Interleaving Strategy (Mixed Practice)

- **Research**: Cognitive science shows interleaving creates "contextual interference" leading to superior long-term retention despite slower initial learning
- **Implementation**: Story 15.2/15.4 - Question types randomized per word instead of blocked practice
- **Technical**: `useInterleaving.ts` hook shuffles question type array per quiz session
- **AC Added**: "Question types interleaved per word (randomized, not blocked by type)"

### 2. Tone Input Mechanics

- **Research**: Specific tone mark rules (a > o > e > i/u), numeric notation (ma3 → mǎ), long-press mobile input
- **Implementation**: Story 15.2 - `ToneInput.tsx` component with validation
- **Technical**: Validates tone placement rules, supports numeric suffix conversion
- **AC Added**: "Tone input supports numeric notation (ma3 → mǎ) and validates tone mark rules (a>o>e>i/u)"

### 3. Streak Freeze Currency

- **Research**: Ethical gamification—loss aversion with achievement rewards; prevents streak anxiety
- **Implementation**: Story 15.3 - Earn 1 freeze per 10 perfect quizzes, spend to protect streak
- **Technical**: Database field `streak_freezes` in study_streaks table
- **AC Added**: "Streak freeze currency system (earn 1 per 10 perfect quizzes, spend to protect streak)"

### 4. AI-Enhanced Error Feedback

- **Research**: Personalized explanations of confusion (phonetic vs semantic) accelerate learning; addresses "why wrong" gap
- **Implementation**: Story 15.4 - Gemini API generates contextual error explanations
- **Technical**: `POST /api/quiz/feedback` endpoint with Redis caching (24h TTL)
- **AC Added**: "Error feedback explains confusion with AI-generated context (phonetic vs semantic errors)"
- **🤖 AI Integration**: LLM-powered (core feature enhancement)

### 5. Variable Rewards (Mystery Boxes)

- **Research**: Variable reward schedules prevent habituation; dopamine loop via unpredictability
- **Implementation**: Story 15.5 - Random reward drops (cosmetics, XP boost, streak freeze) after milestones
- **Technical**: `MysteryBoxReward.tsx` component with 5% drop rate logic
- **AC Added**: "Mystery boxes drop random rewards after milestone quizzes (5% drop rate)"

### 6. Basic Leech Tracking

- **Research**: "Leeches" consume study time without retention; identification enables targeted intervention
- **Implementation**: Story 15.1/15.4 - Flag words after 5 consecutive failures
- **Technical**: `lapse_count` column in progress table, `GET /api/progress/leeches` endpoint
- **AC Added**: "Leech tracking flags words after 5 consecutive failures ('struggling words' indicator)"

---

## Future Epics (Category 2)

These advanced techniques require separate epic development due to complexity or dependencies. See [TODO.md](../../../TODO.md) for tracking.

### Epic: Advanced Spaced Repetition (FSRS)

- **Research**: ML-powered FSRS v6 algorithm with DSR model (Difficulty, Stability, Retrievability); 20-30% fewer reviews for same retention
- **Why Separate**: Requires mathematical modeling, ML parameter optimization (21 parameters), backend algorithm refactor
- **Dependencies**: Epic 15 (current spaced repetition must exist first)
- **🤖 AI Integration**: ML-powered (core algorithm)

### Epic: Handwriting Recognition System

- **Research**: Canvas-based input (40x40mm optimal), stroke-order validation, CNN for 30K+ characters; highest retention value
- **Why Separate**: Requires ML model integration (Apple-style CNN or OpenAI Vision API), significant R&D for stroke recognition, mobile optimization critical
- **Dependencies**: Epic 15 (quiz infrastructure must exist)
- **🤖 AI Integration**: CNN deep learning (core feature)

### Epic: Radical-Based Learning

- **Research**: Radical decomposition for discrimination learning; semantic radical + phonetic component awareness
- **Why Separate**: Requires 214 Kangxi radical database, character breakdown logic, integration with Knowledge Hub
- **Dependencies**: Epic 15 (quiz system), Epic 17 (Knowledge Hub for radical database)
- **🤖 AI Integration**: Optional LLM for radical etymology + mnemonics (enhancement layer)

### Epic: Progress Visualization Dashboard

- **Research**: Mastery heatmaps (red/green zones) for self-efficacy; retention curves; weak area identification
- **Why Separate**: Requires data aggregation service, charting library (Chart.js/D3), UI/UX design work
- **Dependencies**: Epic 15 (quiz data must exist for visualization)
- **🤖 AI Integration**: None (algorithmic data visualization)

---

## Research Reference

**Document**: [Vocabulary-Retention-Feature-Design.md](./Vocabulary-Retention-Feature-Design.md)

**Key Sections Referenced**:

- Cognitive Foundations of Active Recall (interleaving)
- Algorithmic Precision in Spaced Repetition (FSRS)
- Multi-Modal Quiz Design (tone input, handwriting)
- Gamification and Psychology of Engagement (streaks, variable rewards, loss aversion)
- Scaffolding through Radical Awareness
- Managing User Lifecycle (leech mitigation)

---

**Last Updated**: February 11, 2026

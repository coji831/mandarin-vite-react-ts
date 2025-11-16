# Epic 12: Conversation UI and Data Enhancements

## Epic Summary

**Goal:**
Modernize the backend and redesign the conversation UI to deliver an accessible, interactive, and educational turn-based Mandarin conversation experience. This includes updating the API to return a richer conversation structure (Chinese, pinyin, English, speaker, audio), and providing learners with clear, toggleable, and accessible controls for each conversation turn.

**Key Points:**

- Refactor the local backend for modern Google API usage and secure credential handling, ensuring compatibility with Vercel API structure.
- Standardize backend error handling and logging with structured error objects and request IDs.
- Update the conversation API to return a new, detailed ConversationTurn structure (Chinese, pinyin, English, speaker, audio URLs).
- Ensure that any integration with Gemini API (or other LLMs) minimizes token usage by sending only concise, necessary prompts and context.
- Ensure the UI displays and toggles pinyin and English, and supports per-turn audio playback and navigation.
- Follow Google Cloud API and leading UI/UX patterns for turn-based conversation interfaces.

**Status:** In Progress (Story 12.6 Completed)

**Last Update:** 2025-11-16

## Background

Mandarin learners benefit from seeing pinyin and English meaning alongside Chinese text, and from interactive, turn-based conversation practice. The current system lacks consistent support for these features, and backend code is not fully modernized or easily portable to Vercel APIs. This epic addresses these gaps to improve comprehension, retention, and user experience.

## User Stories

This epic consists of the following user stories:

1. **Backend Refactor for Modern Google API and Vercel Compatibility**

- As a developer, I want the local backend refactored to use modern Google API libraries and async/await, with a structure that is easy to migrate to Vercel API format, so that the codebase is maintainable and portable.

2. **Consistent Error Handling and Logging in All APIs**

- As a developer, I want all backend APIs to use structured error objects and include request IDs in logs, so that debugging and support are easier and more reliable.

3. **Update Conversation API to Return Rich ConversationTurn Structure**

- As a developer, I want the conversation API to return a detailed ConversationTurn object for each turn (including Chinese, pinyin, English, speaker, and audio URLs), so that the frontend can display all necessary information for learners.

4. **Display and Toggle Pinyin/English in Conversation UI**

- As a learner, I want to see pinyin and English meaning for each line in a generated conversation, and be able to toggle their visibility, so that I can understand pronunciation and meaning without leaving the app. **(Completed 2025-11-16)**

5. **Turn-Based Navigation and Highlighting in Conversation UI**

- As a learner, I want to step through a conversation turn by turn, with clear highlighting of the current turn, so that I can focus on one exchange at a time and practice speaking/listening.

6. **Per-Turn Audio Playback Controls in Conversation UI**

- As a learner, I want to play, pause, and replay audio for each turn individually, so that I can repeat and practice each exchange as needed.

## Story Breakdown Logic

- Stories 12.1–12.2 focus on backend modernization and error handling (planned)
- Stories 12.3–12.4 focus on frontend conversation UI, audio, and accessibility (planned)

Stories are divided to first address technical debt and backend compatibility, then deliver user-facing enhancements in a logical, dependency-aware sequence.

## Acceptance Criteria

- [ ] Local backend refactored for modern Google API usage and secure credential handling, compatible with Vercel API structure.
- [ ] Backend/Vercel APIs return structured errors and meaningful logs with request IDs.
- [ ] Conversation generation and UI support pinyin and English meaning, with display and toggleable playback.
  - [x] Turn-based conversation UI with per-turn audio controls and accessibility features.
- [ ] All new features covered by unit/integration tests and documented.

## Architecture Decisions

- Decision: Modularize backend logic for Google APIs and error handling

  - Rationale: Enables code sharing and easy migration between local backend and Vercel APIs
  - Alternatives considered: Keep separate codebases for local and Vercel APIs
  - Implications: Slightly more upfront work, but easier long-term maintenance

- Decision: UI follows Google/industry best practices for turn-based conversation
  - Rationale: Ensures accessibility, clarity, and user familiarity
  - Alternatives considered: Custom UI patterns
  - Implications: Faster onboarding, better UX, easier testing

## Implementation Plan

1. Refactor local-backend for modern Google API usage and modular structure
2. Standardize backend error handling and logging
3. Update conversation generation to include pinyin and English meaning
4. Implement frontend toggles and audio controls for conversation turns
5. Redesign UI for turn-based navigation, highlighting, and accessibility

## Risks & mitigations

- Risk: Backend refactor breaks existing clients — Severity: High

  - Mitigation: Use feature flags, thorough testing, and phased rollout
  - Rollback: Revert to previous backend version

- Risk: Increased API cost from per-turn audio — Severity: Medium

  - Mitigation: Cache audio, batch requests, monitor usage
  - Rollback: Limit audio features or add quotas

- Risk: UI complexity or accessibility gaps — Severity: Medium
  - Mitigation: Follow best practices, conduct accessibility review
  - Rollback: Simplify UI, remove advanced features if needed

## Implementation notes

- Conventions: follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- Operational notes: Structure backend code for easy migration to Vercel APIs; follow Google/industry UI/UX patterns for turn-based conversation

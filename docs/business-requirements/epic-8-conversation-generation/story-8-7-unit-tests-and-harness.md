# Story 8.7: Local Harness & Validation (CI-friendly)

## Description

**As a** developer,
**I want to** have automated testing and validation for conversation features,
**So that** conversation functionality works reliably in CI environments and local development without external dependencies.

## Business Value

This story ensures the reliability and maintainability of the conversation system through comprehensive automated testing. By providing a local harness that can run in CI environments, we catch regressions early and enable confident deployment of conversation features. The harness validates the entire conversation pipeline from generation to audio playback without requiring production credentials.

## Acceptance Criteria

- [x] Local harness script `scripts/harness-local.js` starts `local-backend` with conversation enabled
- [x] Harness runs scripted checks against text and audio endpoints automatically
- [x] Validation includes fixture shape verification and conversation turn length constraints
- [x] Harness tears down cleanly after test completion
- [x] Tests run without requiring external TTS calls or production credentials
- [x] CI integration validates conversation features on every pull request (harness is CI-ready)
- [x] Harness provides clear pass/fail results with detailed error reporting
- [x] Test execution time is under 30 seconds for rapid feedback

## Business Rules

1. Harness must run completely offline without external API dependencies
2. All conversation fixtures must pass schema validation checks
3. Generated conversations must conform to 3-5 turns business rule
4. Audio endpoints must return valid URLs that can be fetched successfully
5. Test failures must provide actionable error messages for debugging

## Related Issues

- #8-1 / [**Design Conversation Schema & Scaffolder**](./story-8-1-design-schema-and-scaffolder.md) (Validates schemas from this story)
- #8-2 / [**Scaffolder — Text endpoint**](./story-8-2-scaffolder-text-endpoint.md) (Tests this endpoint)
- #8-3 / [**Scaffolder — Audio endpoint (deterministic)**](./story-8-3-scaffolder-audio-endpoint.md) (Tests this endpoint)
- #8-5 / [**Generator — Text generation & cache (backend)**](./story-8-5-generator-text-cache.md) (Will test real generator when available)

## Implementation Status

- **Status**: Completed
- **PR**: [pending or current PR number]
- **Merge Date**: 2025-10-11
- **Key Commit**: [latest commit hash] (Harness script, fixture validation, and backend integration finalized)

## User Journey

1. Developer makes changes to conversation-related code
2. Developer runs local harness to validate changes before commit
3. Harness starts local backend with conversation features enabled
4. Automated tests verify text endpoint responses and audio endpoint functionality
5. Schema validation confirms all fixtures meet requirements
6. Test results provide immediate feedback on any regressions
7. CI runs same harness on pull requests to prevent broken code from merging
8. Team has confidence that conversation features work as expected

# TODO — Project-wide (GitHub-friendly)

**Audience:** Project maintainers, developers tracking tasks  
**Last Updated:** January 2026

This file is a simple, human-editable TODO list compatible with GitHub (checkboxes are interactive in PRs and on GitHub.com).

Usage:

- Edit items locally or on GitHub and check boxes when work is complete.
- To escalate a checklist item into a tracked GitHub Issue, use the `gh` CLI (examples below) or create the Issue via the GitHub UI.

Sections

- Bugs: critical fixes and regressions
- Todo (near-term): prioritized tasks to do soon
- Backlog (future): ideas and lower-priority work
- Done (archive): moved items once completed

---

## Bugs (urgent)

## Todo (near-term)

## Backlog

- [ ] Refactor services to direct export pattern - Remove Service wrapper classes, export audioApi/conversationApi objects like progressService (Epic 14 follow-up)

- [ ] Migrate auth to React Query + Axios - Replace custom `authFetch` with industry standards
- [ ] Improve backend error logging - Add structured error objects and request IDs

## Done

- [x] Re-organize features - Moved `conversation/` under `mandarin/`
- [x] Unify data objects - Standardized `Card`, `Word`, `ConversationTurn`
- [x] Overhaul services layer - Designed unified services with fallback logic
- [x] Add data/audio services - Implemented vocabulary and TTS service functions
- [x] Migrate components to services - Refactored all components to use services layer
- [x] Ensure service fallback - Added robust fallback and backend swap support
- [x] Modernize backend Google API integration - Simplify credential handling
- [x] Add pinyin/English support to conversations - Display and audio playback
- [x] Support turn-based conversations - UI indicators and per-turn audio controls
- [x] Refactor frontend services layer - Centralize API baseURL configuration across services

---

## How to Create GitHub Issues

**Quick command (using GitHub CLI):**

```bash
# Create issue from TODO item
gh issue create --title "Refactor frontend services layer" --body "Centralize API baseURL configuration across services. See TODO.md for context."

# List existing issues
gh issue list
```

**Best Practice:** For tasks requiring >2 hours or affecting multiple files, create a GitHub issue with:

- Detailed implementation plan
- Affected files/components
- Acceptance criteria
- Estimated effort

Then reference the issue number in TODO.md: `- [ ] Task summary (#123)`

---

Last updated: January 2026

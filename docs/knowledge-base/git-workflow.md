# Git Workflow & Conventions

**Category:** Getting Started  
**Last Updated:** December 9, 2025

---

## Overview

This project follows **Conventional Commits** and a feature-branch workflow.

**Key Files:**

- [Git Convention Guide](../guides/git-convention.md) - Full reference
- [Commit Message Template](../templates/commit-message-template.md) - Examples

---

## Quick Start

```bash
# Create feature branch
git checkout -b epic-11-service-layer

# Make changes and stage
git add src/features/mandarin/services/

# Commit with conventional format
git commit -m "feat(story-11-2): add progress sync service"

# Push to remote
git push origin epic-11-service-layer
```

---

## Conventional Commits

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat** - New feature
- **fix** - Bug fix
- **refactor** - Code restructuring (no behavior change)
- **docs** - Documentation changes
- **test** - Test additions or fixes
- **chore** - Build/config changes (no app code)
- **style** - Code style/formatting (no logic change)

### Examples

```bash
# Feature
git commit -m "feat(story-11-2): add AudioService with fallback"

# Bug fix
git commit -m "fix(reducer): prevent duplicate entries in itemIds array"

# Documentation
git commit -m "docs(cookbook): add testing setup guide"

# Refactor
git commit -m "refactor(component): extract VocabularyCard to separate file"

# Test
git commit -m "test(service): add unit tests for AudioService"

# Chore
git commit -m "chore(deps): upgrade vite to 5.0"
```

---

## Scopes

### Common Scopes

- `epic-11` - Epic-level changes
- `story-11-2` - Story-specific work
- `component` - Component changes
- `hook` - Custom hook changes
- `reducer` - Reducer/state changes
- `service` - Service layer changes
- `api` - Backend API changes
- `docs` - Documentation changes

### Multi-Scope Commits

```bash
# Affects multiple areas
git commit -m "refactor(reducer,hook): consolidate progress logic"
```

---

## Branching Strategy

### Branch Naming

```bash
# Epic branch (primary)
epic-<num>-<slug>

# Feature branch (optional)
feature/<short-description>

# Bug fix branch
fix/<short-description>

# Examples
epic-11-service-layer-overhaul
feature/add-audio-fallback
fix/progress-not-saving
```

### Branch Workflow

```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b epic-11-service-layer

# 2. Work on branch (multiple commits)
git add .
git commit -m "feat(story-11-1): initial service interfaces"
git commit -m "feat(story-11-2): implement AudioService"

# 3. Push to remote
git push origin epic-11-service-layer

# 4. Create pull request (GitHub)
# - Title: "Epic 11: Service Layer Overhaul"
# - Link to epic BR & implementation docs

# 5. After approval, merge to main
git checkout main
git pull origin main
git merge epic-11-service-layer
git push origin main

# 6. Clean up branch
git branch -d epic-11-service-layer
git push origin --delete epic-11-service-layer
```

---

## Daily Workflow

### Starting Work

```bash
# Update local main
git checkout main
git pull origin main

# Create/switch to feature branch
git checkout -b epic-12-conversation-ui
```

### Making Changes

```bash
# Check status
git status

# Stage files
git add src/features/mandarin/pages/ConversationPage.tsx

# Or stage all
git add .

# Commit with message
git commit -m "feat(story-12-1): add conversation generation UI"

# Push to remote
git push origin epic-12-conversation-ui
```

### Reviewing Changes

```bash
# See unstaged changes
git diff

# See staged changes
git diff --cached

# See commit history
git log --oneline --graph --all
```

---

## Commit Best Practices

### 1. Small, Focused Commits

```bash
# ❌ Bad: One commit with everything
git commit -m "feat(epic-11): add services, update reducers, fix tests"

# ✅ Good: Separate commits
git commit -m "feat(story-11-1): define service interfaces"
git commit -m "feat(story-11-2): implement AudioService"
git commit -m "test(service): add AudioService unit tests"
```

### 2. Descriptive Messages

```bash
# ❌ Bad: Vague
git commit -m "fix stuff"

# ✅ Good: Specific
git commit -m "fix(reducer): prevent duplicate word IDs in lists state"
```

### 3. Present Tense

```bash
# ❌ Bad: Past tense
git commit -m "feat(component): added VocabularyCard component"

# ✅ Good: Present tense
git commit -m "feat(component): add VocabularyCard component"
```

### 4. Update Docs in Same Commit

```bash
# Update both code and docs
git add src/features/mandarin/services/audioService.ts
git add docs/business-requirements/epic-11-service-layer-overhaul/story-11-2-audio-service.md
git add docs/issue-implementation/epic-11-service-layer-overhaul/story-11-2-audio-service.md

git commit -m "feat(story-11-2): implement AudioService with fallback

- Add AudioService interface
- Implement API + local fallback
- Update story BR and implementation docs"
```

---

## Undoing Changes

### Unstage Files

```bash
# Unstage all
git reset

# Unstage specific file
git reset src/features/mandarin/pages/FlashCardPage.tsx
```

### Discard Changes

```bash
# Discard all unstaged changes (⚠️ destructive)
git checkout .

# Discard specific file
git checkout src/features/mandarin/pages/FlashCardPage.tsx
```

### Amend Last Commit

```bash
# Fix typo in commit message
git commit --amend -m "feat(story-11-2): add AudioService (fixed typo)"

# Add forgotten file to last commit
git add src/features/mandarin/services/audioService.test.ts
git commit --amend --no-edit
```

### Revert Commit

```bash
# Create new commit that undoes changes
git revert <commit-hash>
```

---

## Pull Requests

### PR Title

Follow Conventional Commits format:

```
feat(epic-11): Service Layer Overhaul
fix(reducer): Prevent duplicate word IDs
docs(cookbook): Add Git workflow guide
```

### PR Description Template

```markdown
## Summary

Implements service layer with interfaces and fallback mechanisms (Epic 11).

## Changes

- Add service interfaces (AudioService, ProgressService)
- Implement AudioService with API + local fallback
- Update reducers to use services
- Add service unit tests

## Related Docs

- Epic BR: `docs/business-requirements/epic-11-service-layer-overhaul/README.md`
- Epic Implementation: `docs/issue-implementation/epic-11-service-layer-overhaul/README.md`

## Testing

- [x] Unit tests pass
- [x] Manual testing completed
- [x] No TypeScript errors
- [x] Linting clean

## Screenshots

(If UI changes)
```

---

## Common Issues

### Merge Conflicts

```bash
# Pull latest changes
git pull origin main

# Fix conflicts in editor (look for <<<<<<, ======, >>>>>>)
# Edit files to resolve

# Stage resolved files
git add .

# Continue merge
git commit -m "merge: resolve conflicts from main"
```

### Accidentally Committed to Main

```bash
# Create branch from current state
git branch epic-11-service-layer

# Reset main to remote state
git reset --hard origin/main

# Switch to new branch
git checkout epic-11-service-layer
```

### Forgot to Pull Before Starting

```bash
# Stash local changes
git stash

# Pull latest
git pull origin main

# Apply stashed changes
git stash pop
```

---

## Git Aliases (Optional)

Add to `~/.gitconfig`:

```ini
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  unstage = reset HEAD --
  last = log -1 HEAD
  lg = log --oneline --graph --all --decorate
```

Usage:

```bash
git co -b epic-11-service-layer  # Instead of: git checkout -b ...
git st                           # Instead of: git status
git lg                           # Pretty log
```

---

## Next Steps

- [Commit Message Template](../templates/commit-message-template.md) - More examples
- [Git Convention Guide](../guides/git-convention.md) - Full reference
- [Business Requirements Format](../guides/business-requirements-format-guide.md) - Epic/story structure

---

**Related Guides:**

- [Testing Setup](./testing-setup.md) - Run tests before committing
- [Linting Setup](./linting-setup.md) - Check code quality

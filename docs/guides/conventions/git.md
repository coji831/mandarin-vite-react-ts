# Branch Strategy and Git Workflow

**Last Updated:** 2026-08-02  
**Purpose:** Branch management strategy, commit conventions (Conventional Commits), and PR workflow  
**Audience:** All developers

This document outlines our project's branch management strategy, commit conventions, and pull request workflow.

## Current Branch Strategy: Epic-Based Development

Our project follows a single-branch-per-epic approach:

### Key Principles

1. **One Branch Per Epic**: All stories within an epic are developed on the same branch
2. **Sequential Story Development**: Stories are implemented in order within the epic branch
3. **Single Epic PR**: The entire epic is reviewed and merged as one unit
4. **Feature-Complete Merging**: Epics are only merged when fully completed

### Workflow

1. Create an epic branch from `main`: `git checkout -b epic-X-name`
2. Implement stories sequentially on this branch
3. Commit each story with conventional commit messages
4. When all stories are complete, create a PR for the entire epic
5. After review, merge the epic branch into `main`

## Feature Flags (Optional)

For incomplete epics that need early merging, use feature flags:

```tsx
{
  process.env.FEATURE_USER_AUTHENTICATION && <LoginButton />;
}
```

## Commit Message Conventions

All commits **must** follow the [Conventional Commits format](../templates/commit-message-template.md)

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or modifying tests
- **chore**: Changes to build process, tooling, etc.

### Scopes

- **epic-X**: Changes related to entire epic X
- **story-X-Y**: Changes related to story Y in epic X
- **component**: Changes to a specific component
- **hook**: Changes to a custom hook
- **api**: Changes to API integration
- **docs**: Changes to documentation
- **test**: Changes to tests

### Examples

```
feat(story-4-2): add layout component with outlet
fix(flashcard): correct text-to-speech integration
docs(workflow): update branch strategy documentation
refactor(story-3-1): extract progress logic to custom hook
```

## Pull Request Guidelines

### PR Naming Convention

- **Story-level:** `[EPIC-X] Story X.Y: Brief description`
  - Example: `[EPIC-4] Story 4.2: Create Layout Component with Outlet`
- **Epic-level:** `EPIC-X: <short epic summary>`
  - Example: `EPIC-4: Create Layout Component with Outlet`

> Conventional Commits `<type>(<scope>): <summary>` applies to **commits**, not the PR title.

### PR Description Template

Use the canonical template at `.github/PULL_REQUEST_TEMPLATE.md` (auto-loaded for PRs).

### PR Checklist

The PR checklist lives in the canonical template at `.github/PULL_REQUEST_TEMPLATE.md` — its sections are the source of truth:

- **Quality Gates / Testing** — Tier 1 (per-change / pre-commit) and Tier 2 (pre-merge / story-complete / epic-close)
- **Doc Truth-Check** — docs match shipped code before merge
- **Merge-Readiness** — review feedback addressed, CI passes, PR number + `Status`/`PR`/`Merge Date`/`Key Commit` backfilled into BR/impl docs (same commit)

## Branch Naming Conventions

- Epic branches: `epic-X-name`
- Feature branches (when needed): `feature/short-description`
- Bugfix branches: `fix/short-description`
- Documentation branches: `docs/short-description`

## Git Commands Reference

```bash
# Create epic branch
git checkout -b epic-5-user-authentication

# Commit story implementation
git commit -m "feat(story-5-1): implement user registration form"

# Update documentation
git commit -m "docs(epic-5): update implementation status for story 5-1"

# Fix a bug in a story
git commit -m "fix(story-5-1): correct form validation error handling"

# Refactor code
git commit -m "refactor(story-5-1): extract form validation to custom hook"
```

## Squash / Reset / Reflog Recovery

**When Adopted:** Epic 21 (git history surgery during the epic)

### `git reset` modes

| Command             | Moves HEAD | Resets index (staging) |  Touches worktree  |
| ------------------- | :--------: | :--------------------: | :----------------: |
| `git reset --soft`  |     ✅     |           ❌           |         ❌         |
| `git reset` (mixed) |     ✅     |           ✅           |         ❌         |
| `git reset --hard`  |     ✅     |           ✅           | ✅ (⚠ destructive) |

- `git reset --soft <ref>` moves HEAD but **keeps the index and worktree** — the staged diff is exactly the combined changes of everything since `<ref>`. This is the safe way to squash multiple commits into one.
- `git reset` (mixed, the default) additionally **unstages** — files revert to "modified, not staged" while worktree content is untouched.
- `git reset --hard` also discards worktree changes — only use when you are certain.

### Squash-to-one via soft reset

```bash
# Combine the last N commits into a single commit (staged diff = all their changes)
git reset --soft HEAD~N
git add -A
git commit -m "feat(epic-N): ..."
```

### Verify state with actual git commands — never reconstruct from `.git`

After any reset, confirm the real state with git itself instead of reconstructing from `.git` internals:

```bash
git status --porcelain      # exact staged/unstaged/untracked file list
# Staged file count:
git diff --cached --name-only
# How many commits are actually on the branch:
git rev-list --count HEAD
# Current HEAD commit:
git log -1 --oneline
```

### Anything reset away is recoverable

- **`git reflog`** — the full history of where HEAD pointed. Every commit you reset away is still reachable by its SHA.
- **`ORIG_HEAD`** — git records the previous HEAD during `reset`/`merge`/`rebase`, so `git reset --hard ORIG_HEAD` restores the pre-reset state.
- Only `git gc` (prune) permanently removes unreachable commits — until then, a reset-away commit is not lost.

### Common recovery

```bash
git reflog                  # find the SHA you need
git reset --hard <sha>      # restore branch tip to that commit
# Or restore a single file from a reflog commit:
git checkout <sha> -- path/to/file
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Feature Flag Best Practices](https://martinfowler.com/articles/feature-toggles.html)
- [Project Workflow Guide](../operations/workflow.md)
- [AI Workflow Commands](../../automation/structured-ai-prompts.md)

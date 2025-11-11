# Branch Strategy and Git Workflow

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

## Improvement: Feature-Flagged Development

To enhance our workflow while maintaining the epic branch approach, we're implementing feature flags:

### Benefits

- Allow merging of incomplete epics for easier collaboration
- Enable isolated testing of features in production-like environments
- Support gradual rollout of features
- Reduce merge conflicts by more frequent integration

### Implementation

1. Use environment variables for simple feature flags
2. For complex features, implement a feature flag service
3. Wrap features in conditional rendering based on flags
4. Document flag status in epic documentation

Example:

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

```
[EPIC-X] Story X.Y: Brief description
```

Example: `[EPIC-4] Story 4.2: Create Layout Component with Outlet`

### PR Description Template

```markdown
## Description

Implements Story X.Y: [Story Title]

## Changes

- List of key changes
- Components added/modified
- APIs integrated

## Testing

- How was this tested?
- Any special setup needed?

## Screenshots

[If applicable]

## Related Issues

Closes #XX
Related to #YY
```

### PR Checklist

- [ ] Code follows project conventions
- [ ] Documentation is updated
- [ ] Tests are added/updated
- [ ] All CI checks pass
- [ ] Story status is updated in both business requirements and implementation docs

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

## Integration with CI/CD

- Each PR triggers automated checks
- Epic branches can be deployed to staging environments
- Feature flag status is managed via environment variables

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Feature Flag Best Practices](https://martinfowler.com/articles/feature-toggles.html)
- [Project Workflow Guide](./workflow.md)
- [AI Workflow Commands](./structured-ai-prompts.md)

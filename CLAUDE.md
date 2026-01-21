# Claude Code Context - Mandarin Learning App

> **Migration from GitHub Copilot Enterprise**
> This file replaces `.github/copilot-instructions.md` as the primary AI context for Claude Code.
> Last Updated: 2026-01-21

---

## 🚀 Quick Start Commands

```bash
# Installation
npm install

# Development (runs both frontend + backend)
npm run dev                    # Frontend: port 5173, Backend: port 3001

# Individual services
npm run dev:frontend           # Vite dev server only
npm run dev:backend            # Express server only

# Testing & Quality
npm test                       # Run Jest tests
npm run lint                   # ESLint check
tsc --noEmit                   # Type check

# Database
npm run db:migrate             # Run Prisma migrations
npm run db:studio              # Open Prisma Studio
npm run db:seed                # Seed test data
```

---

## 🏗️ Project Architecture

**Monorepo Structure** (npm workspaces):
- `apps/frontend/` - React + TypeScript + Vite
- `apps/backend/` - Express + Prisma + PostgreSQL (deployed to Railway)
- `packages/shared-types/` - Shared TypeScript types
- `packages/shared-constants/` - API endpoints, constants

**Technology Stack:**
- Frontend: React 18, TypeScript, Vite, React Router
- Backend: Express, Prisma ORM, PostgreSQL (Supabase)
- State: Context API + useReducer with localStorage persistence
- Auth: JWT with httpOnly cookies, bcrypt password hashing
- External APIs: Google Cloud TTS, Google Cloud Storage, Gemini AI
- Deployment: Frontend (Vercel), Backend (Railway)

For detailed architecture: @docs/architecture.md

---

## 🧠 State Management Patterns

### Reducer Pattern
```typescript
// Naming: {domain}Reducer.ts (listsReducer.ts, uiReducer.ts, userReducer.ts)
// Action types: SCREAMING_SNAKE_CASE with domain prefix
// Examples: UI/SET_LOADING, MARK_WORD_LEARNED, USER/SET_ID

// ✅ Correct: Reading state with selector
const selectedWords = useProgressState(s => s.ui?.selectedWords ?? []);
const loading = useProgressState(s => s.ui?.isLoading ?? false);

// ✅ Correct: Dispatching actions
const { markWordLearned, setSelectedList } = useProgressActions();
handleClick = () => markWordLearned(wordId);

// ❌ Incorrect: Reading entire state
const state = useProgressState(s => s); // Too broad, causes re-renders
```

### State Shape Convention
- **Normalized Data**: `{itemsById}` (lookup) + `{itemIds}` (order)
- **Root State**: `{ lists, user, ui, progress }`
- **Immutability**: Always use spread operators, never mutate
- **Type Safety**: Define types in `types/` directory

### Progress State (Epic 13)
- **Source**: Backend API (`/api/v1/progress/*`) with JWT authentication
- **Persistence**: PostgreSQL database (user-isolated via `userId`)
- **Selectors**: Always use `selectWordsById(state)` - avoid direct access
- **Cross-Device Sync**: Progress syncs automatically via backend

---

## 🏷️ Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VocabularyCard.tsx` |
| Hooks | camelCase with `use` prefix | `useProgressState.ts` |
| Reducers | `{domain}Reducer.ts` | `listsReducer.ts` |
| Action Types | SCREAMING_SNAKE_CASE | `MARK_WORD_LEARNED` |
| Action Creators | camelCase verbs | `markWordLearned()` |
| Folders | kebab-case | `vocabulary-list/` |
| Variables/Functions | camelCase | `fetchUserData()` |
| Types | PascalCase | `WordProgress`, `RootState` |

### File Structure
```
apps/frontend/src/features/{feature}/
├── components/          # Feature-specific components
├── hooks/              # Custom hooks
├── pages/              # Route components
├── reducers/           # State reducers
├── router/             # Feature routes
├── types/              # TypeScript types
└── docs/               # Feature documentation
```

---

## 📚 Documentation System

### Epic & Story Structure
```
docs/business-requirements/epic-{num}-{slug}/
├── README.md                               # Epic overview
└── story-{epic}-{story}-{short}.md         # Story requirements

docs/issue-implementation/epic-{num}-{slug}/
├── README.md                               # Epic implementation
└── story-{epic}-{story}-{short}.md         # Story implementation
```

### Templates (MUST USE - Strict Compliance)
- Epic BR: @docs/templates/epic-business-requirements-template.md
- Story BR: @docs/templates/story-business-requirements-template.md
- Epic Implementation: @docs/templates/epic-implementation-template.md
- Story Implementation: @docs/templates/story-implementation-template.md
- Commit Messages: @docs/templates/commit-message-template.md

**CRITICAL**: Always cross-check with templates. Do NOT add non-template sections.

---

## 🔄 Story Development Workflow

```
1. Review Requirements
   ├─ Read story BR + epic BR
   ├─ Read story implementation + epic implementation
   └─ Note unclear AC in "Questions / Clarifications"

2. Plan Changes
   ├─ Identify impacted feature folders
   ├─ Check design.md and architecture.md
   └─ Prepare file headers if adding public APIs

3. Implement Code
   ├─ Follow code conventions (see below)
   ├─ Keep scope to story AC only
   └─ Maintain state management rules

4. Tests
   ├─ Add unit/component tests
   ├─ Cover happy path + edge case
   └─ Test reducers/actions/selectors in isolation

5. Run Locally
   ├─ npm run dev
   └─ Manual sanity check against AC

6. Update Documentation
   ├─ Mark AC progress in story BR
   ├─ Record decisions in story implementation
   └─ Update Last Update dates

7. Pre-Commit Gates
   ├─ npm test (must pass)
   ├─ tsc --noEmit (must be clean)
   ├─ npm run lint (if configured)
   └─ Verify quality gates + cross-doc alignment

8. Commit
   └─ Use Conventional Commits: <type>(story-{epic}-{story}): <summary>
```

**Checklist**: `Review → Plan → Implement → Test → Run → Docs → Gates → Commit`

---

## 🛠️ Code Conventions

### Core Principles
- TypeScript for all React code
- Functional components + React hooks
- Named function declarations: `function MyComponent() {}`
- Use `type` over `interface` (unless extending)
- ES module syntax (`import`/`export`)
- Explicit type annotations
- Avoid `any` type

### State Management Rules
- Reducers: `{domain}Reducer.ts` pattern
- Actions: Verb-based, from `useProgressActions()` hook
- Selectors: Use `useProgressState(s => s.slice?.value ?? fallback)`
- Immutability: Spread operators only, no mutation
- Normalized: `{itemsById}` + `{itemIds}` pattern

### Testing Patterns
- Reducer tests: Isolated action tests
- Hook tests: Memoization + stable references
- Component tests: Mock context for state/actions
- File naming: `ComponentName.test.tsx`

**Detailed conventions**: @docs/guides/code-conventions.md
**SOLID principles**: @docs/knowledge-base/solid-principles.md

---

## 🌿 Git & Branching

### Branch Naming
- Primary: `epic-{num}-{slug}` (e.g., `epic-13-production-backend-architecture`)
- Optional: `feature/{short}` or `fix/{short}`

### Conventional Commits
```
<type>(<scope>): <description>

Types: feat, fix, refactor, docs, test, chore, wip
Scopes: epic-{num}, story-{epic}-{story}, component, hook, api, docs

Examples:
feat(story-13-4): implement progress sync reducer
fix(epic-13): resolve cookie forwarding in Vite proxy
docs(story-13-6): update implementation plan
```

**Full guide**: @docs/guides/git-convention.md

---

## ✅ Quality Gates (Before Merge)

- [ ] Tests passing (`npm test`)
- [ ] Type check clean (`tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Documentation updated (BR, implementation, design, architecture, API specs)
- [ ] File headers updated for public surfaces
- [ ] All AC complete or documented exception
- [ ] Cross-doc alignment verified

---

## 🤖 Automation Protocol

### Trigger
When you see **"refer #file:automation"** or **"refer the automation folder"** in a request:
1. Read story/epic BR + implementation docs FIRST
2. Follow Story-Level Development Workflow sequentially
3. Use templates EXACTLY - preserve headings verbatim
4. Enforce code conventions + SOLID principles
5. Follow git conventions for branches/commits/PRs
6. STOP on ambiguity - return list of blockers + 2 options
7. Do NOT run git commands or write files until explicitly instructed

### Structured AI Prompt Format
```
[TASK]: <task>
[CONTEXT]: <file or epic/story>
[PARAMETERS]: <inputs>
[OUTPUT]: <format>
[CONSTRAINTS]: <rules>
```

**Detailed examples**: @docs/automation/structured-ai-prompts.md

---

## 📁 Key File References

### Architecture & Design
- System architecture: @docs/architecture.md
- Feature design: @apps/frontend/src/features/mandarin/docs/design.md
- API specifications: @apps/backend/docs/api-spec.md

### Guides (Project-Specific)
- Code conventions: @docs/guides/code-conventions.md
- Git workflow: @docs/guides/git-convention.md
- Development workflow: @docs/guides/workflow.md
- Backend setup: @docs/guides/backend-setup-guide.md
- Vite configuration: @docs/guides/vite-configuration-guide.md
- Testing guide: @docs/guides/testing-guide.md
- Redis caching: @docs/guides/redis-caching-guide.md
- Environment setup: @docs/guides/environment-setup-guide.md
- Troubleshooting: @docs/guides/troubleshooting.md

### Knowledge Base (Transferable Patterns)
- Frontend patterns: @docs/knowledge-base/frontend-react-patterns.md
- Advanced React: @docs/knowledge-base/frontend-advanced-patterns.md
- State management: @docs/knowledge-base/frontend-state-management.md
- Backend architecture: @docs/knowledge-base/backend-architecture.md
- Authentication: @docs/knowledge-base/backend-authentication.md
- Clean Architecture: @docs/knowledge-base/backend-advanced-patterns.md
- Caching strategies: @docs/knowledge-base/integration-caching.md
- SOLID principles: @docs/knowledge-base/solid-principles.md

### Templates & Formats
- All templates: @docs/templates/README.md
- Business requirements format: @docs/guides/business-requirements-format-guide.md
- Implementation format: @docs/guides/implementation-format-guide.md

---

## 🗂️ Path-Specific Context

Claude Code automatically loads additional context based on your working directory:

- Working in `apps/frontend/` → See `.claude/rules/frontend.md`
- Working in `apps/backend/` → See `.claude/rules/backend.md`
- Working in `docs/` → See `.claude/rules/docs.md`
- Working in auth features → See `.claude/rules/auth.md`

These rules provide focused, token-efficient context for each part of the codebase.

---

## 🎯 Code Quality Principles

1. **Keep it Simple**: No over-engineering. Only implement what's requested.
2. **No Premature Abstraction**: Three similar lines > unnecessary helper
3. **No Backwards Compatibility Hacks**: Delete unused code completely
4. **Security First**: Prevent XSS, SQL injection, command injection (OWASP Top 10)
5. **Type Safety**: Leverage TypeScript, avoid `any`
6. **Immutability**: Never mutate state directly
7. **Testability**: Write testable code with clear separation of concerns
8. **Documentation**: Update docs when changing public APIs or architecture

---

## 🔗 Related Resources

- Primary instructions (legacy): @.github/copilot-instructions.md
- Project README: @README.md
- Business requirements index: @docs/business-requirements/README.md
- Implementation index: @docs/issue-implementation/README.md
- Knowledge base index: @docs/knowledge-base/README.md
- Guides index: @docs/guides/README.md

---

**For questions or clarifications, always refer to the relevant documentation files referenced above.**

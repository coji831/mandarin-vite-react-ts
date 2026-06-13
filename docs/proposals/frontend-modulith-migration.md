# Proposal: Frontend Modulith Migration

**Status:** Draft
**Author:** AI Agent
**Date:** 2026-06-12
**Related:** docs/guides/references/frontend-modular-monolith-micro-fe.md
**Goal:** Align frontend structure with backend modulith pattern, prepare for future micro-frontend extraction

---

## 1. Current State

### Structure Scorecard

```
src/
├── components/       # Shared UI (Button, Input, ToggleSwitch)     ✅
├── config/           # App config                                  ✅
├── constants/        # Shared constants                            ✅
├── features/         # 5 feature modules (see below)              ⚠️
│   ├── auth/         # Complete: barrel, context, pages            ✅
│   ├── quiz/         # Complete: barrel, context, reducers         ✅
│   ├── vocabulary/   # Complete: barrel, all sub-folders           ✅
│   ├── gamification/ # Missing barrel, missing context/services    ⚠️
│   └── dashboard/    # Most skeletal: no barrel, 2 folders only    ❌
├── layouts/          # App layout components                       ✅
├── pages/            # Page orchestrators                          ✅
├── router/           # React Router config                         ✅
├── services/         # Axios client (thin)                         ✅
├── App.tsx           # Root component                              ✅
└── main.tsx          # Entry point                                 ✅
```

### Key Audit Findings

| Finding                                         | Severity | Count                       |
| ----------------------------------------------- | -------- | --------------------------- |
| Cross-feature internal imports                  | ✅ None  | 0                           |
| Features missing top-level barrel               | ⚠️       | 2 (dashboard, gamification) |
| Pages bypassing barrels (deep imports)          | ❌       | 15                          |
| Stale conversation components (backend deleted) | ⚠️       | 7 files                     |
| Missing `shared/` layer                         | 🟢 Low   | —                           |
| Feature structural inconsistency                | ⚠️       | 4 of 5 have gaps            |

---

## 2. Target Architecture

```
src/
├── shared/                    # 🆕 Technical Foundation — no business logic
│   ├── components/            # Moved from src/components/ + shared UI
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ToggleSwitch.tsx
│   ├── hooks/                 # 🆕 Shared hooks (useMediaQuery, etc.)
│   ├── api/                   # Base apiClient with auth interceptors
│   ├── utils/                 # Shared utilities
│   └── types/                 # Shared global types
│
├── features/                  # Each feature follows the same pattern:
│   ├── <name>/
│   │   ├── components/        # Feature-specific UI
│   │   ├── hooks/             # Feature-specific hooks
│   │   ├── context/           # Feature contexts (if needed)
│   │   ├── reducers/          # Feature state management
│   │   ├── services/          # API calls (uses shared/apiClient)
│   │   ├── types/             # Feature-specific types
│   │   ├── utils/             # Feature utilities
│   │   └── index.ts           # 🎯 Public API barrel
│   └── index.tsx              # 🎯 Feature barrel (exports all public APIs)
│
├── pages/                     # Orchestrators — only import from feature barrels
│   ├── <Page>.tsx
│   └── ...
│
├── layouts/                   # App layout components (same as now)
├── router/                    # Routing config (same as now)
├── config/                    # App config (same as now)
├── constants/                 # Shared constants (same as now)
├── App.tsx                    # Root (same as now)
└── main.tsx                   # Entry point (same as now)
```

---

## 3. Migration Phases

### Phase 1: Quick Wins (Est. 2 hours)

Create missing barrel files and fix deep imports — no structural moves.

| Step | File                             | Action                                                                  |
| ---- | -------------------------------- | ----------------------------------------------------------------------- |
| 1.1  | `features/dashboard/index.ts`    | **Create barrel** exporting `components/` and `services/`               |
| 1.2  | `features/gamification/index.ts` | **Create barrel** exporting `components/`, `hooks/`, `types/`, `utils/` |
| 1.3  | `features/index.tsx`             | Add `auth`, `dashboard`, `gamification` to the feature barrel           |
| 1.4  | All `pages/*.tsx`                | Fix 15 deep imports to use barrel exports instead                       |
| 1.5  | `layouts/*.tsx`                  | Fix deep imports to use barrel exports                                  |

**Affected files (from audit):**

| File                     | Current Import                                          | Target                  |
| ------------------------ | ------------------------------------------------------- | ----------------------- |
| `DashboardPage.tsx`      | `../features/gamification/components`                   | `features/gamification` |
| `DashboardPage.tsx`      | `../features/dashboard/components/LeechWidget`          | `features/dashboard`    |
| `DashboardPage.tsx`      | `../features/gamification/hooks/useGamificationAPI`     | `features/gamification` |
| `DashboardPage.tsx`      | `../features/gamification/types/GamificationTypes`      | `features/gamification` |
| `FlashCardPage.tsx`      | `../features/vocabulary/services/vocabularyDataService` | `features/vocabulary`   |
| `VocabularyListPage.tsx` | `../features/vocabulary/types`                          | `features/vocabulary`   |
| `VocabularyListPage.tsx` | `../features/vocabulary/services/vocabularyDataService` | `features/vocabulary`   |
| `VocabularyListPage.tsx` | `../features/vocabulary/utils`                          | `features/vocabulary`   |
| `FlashCardPage.test.tsx` | `../../features/quiz/context`                           | `features/quiz`         |
| `FlashCardPage.test.tsx` | `../../features/quiz/reducers/rootReducer`              | `features/quiz`         |
| `LearnLayout.tsx`        | `../features/quiz/context`                              | `features/quiz`         |

### Phase 2: Stale Code Cleanup (Est. 1 hour)

Remove or quarantine frontend conversation code that depends on the deleted backend module.

| Step | File                                                                  | Action                                          |
| ---- | --------------------------------------------------------------------- | ----------------------------------------------- |
| 2.1  | `features/vocabulary/types/Conversation.ts`                           | **Remove** — all conversation types             |
| 2.2  | `features/vocabulary/components/ConversationBox.tsx`                  | **Remove** — uses ConversationService           |
| 2.3  | `features/vocabulary/components/ConversationTurns.tsx`                | **Remove** — renders ConversationTurns          |
| 2.4  | `features/vocabulary/hooks/useConversationGenerator.ts`               | **Remove** — calls conversation API             |
| 2.5  | `features/vocabulary/services/conversationService.ts`                 | **Remove** — POSTs to `/v1/conversations` (404) |
| 2.6  | `features/vocabulary/services/__tests__/conversationService.test.ts`  | **Remove**                                      |
| 2.7  | `features/vocabulary/utils/schemaLoader.ts`                           | **Review** — remove `loadConversationSchema()`  |
| 2.8  | `features/vocabulary/components/__tests__/ConversationTurns.test.tsx` | **Remove**                                      |

> **Note:** If conversation features are planned for re-implementation, quarantine files to `archive/conversation/` instead of deleting.

### Phase 3: Structural Consistency (Est. 3 hours)

Fill structural gaps in feature modules and create `shared/` layer.

| Step | File                              | Action                                                                            |
| ---- | --------------------------------- | --------------------------------------------------------------------------------- |
| 3.1  | `features/dashboard/types/`       | **Create** — move types from `components/`                                        |
| 3.2  | `features/gamification/services/` | **Create** — move API logic from `hooks/useGamificationAPI.ts`                    |
| 3.3  | `features/gamification/context/`  | **Create** — if gamification has shared state                                     |
| 3.4  | `features/quiz/utils/`            | **Create** — extract from `hooks/` or `components/`                               |
| 3.5  | `features/vocabulary/context/`    | **Create** — if vocabulary has shared state                                       |
| 3.6  | `shared/components/`              | **Move** `src/components/` → `shared/components/` (preserve sub-folder structure) |
| 3.7  | `shared/api/`                     | **Create** or keep `src/services/` as-is (already thin)                           |
| 3.8  | `shared/hooks/`                   | **Create** — extract truly cross-feature hooks                                    |
| 3.9  | `shared/utils/`                   | **Create** — move truly cross-feature utils from feature folders                  |
| 3.10 | `features/index.tsx`              | **Verify** all 5 features exposed through barrels                                 |

### Phase 4: Boundary Enforcement (Est. 30 min)

Add ESLint rules to prevent architecture violations.

```json
// In eslint.config.js
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": [
              "**/features/*/components/**",
              "**/features/*/hooks/**",
              "**/features/*/services/**",
              "**/features/*/types/**",
              "**/features/*/utils/**",
              "**/features/*/context/**",
              "**/features/*/reducers/**"
            ],
            "message": "Import from the feature's barrel (index.ts) instead of internal paths."
          }
        ]
      }
    ]
  }
}
```

---

## 4. Migration Strategy

### Approach: In-Place, Feature-by-Feature

Rather than a big-bang restructure, migrate one feature at a time:

```
Week 1: Phase 1 (barrels + deep import fixes)
Week 1: Phase 2 (stale conversation cleanup)
Week 2: Phase 3 (structural consistency)
Week 2: Phase 4 (ESLint enforcement)
```

Each Phase should be a single PR with:

1. **Structural changes** only (no logic changes)
2. **Updated barrel exports**
3. **Updated import paths** in pages/layouts
4. **Tests pass** — no regressions

### Rollback Plan

- Barrel files are additive — can be removed safely
- Deep import fixes are path-only changes — revert paths to undo
- Conversation cleanup is the only destructive step — quarantine first, delete after validation

---

## 5. Open Questions

1. **Conversation feature** — Is it being re-implemented (Epic 8) or permanently removed? Determines whether we delete or quarantine.
2. **`shared/` vs `src/components/`** — Is it worth the move, or is the current `components/` effectively the shared layer already? The rename would make the architecture more explicit.
3. **Feature `pages/`** — Some features have their own `pages/` (auth has `AuthPage.tsx`). Should all pages live in `src/pages/` or be co-located in features?
4. **`services/` at root** — Currently only has `axiosClient.ts`. Should it stay or become `shared/api/`?

# Copilot Instructions for AI Coding Agents

This guide provides essential knowledge for AI agents working in the `mandarin-vite-react-ts` codebase. Follow these instructions to be immediately productive and maintain project conventions.

## 🏗️ Big Picture Architecture

- **Frontend:** React + TypeScript, built with Vite. Feature-based organization in `src/features/`.
- **State Management:** Reducer-based architecture using Context API. State is split into `lists`, `user`, and `ui` slices, with automatic localStorage persistence.
- **Backend:** Serverless functions in `api/` (Text-to-Speech), plus optional local Express backend in `local-backend/`.
- **Data:** Vocabulary and examples loaded from CSV/JSON in `public/data/`, processed via `src/utils/csvLoader.ts`.
- **Routing:** React Router, with routes defined in `src/router/` and constants in `src/constants/paths.ts`.

## 🧩 Critical Workflows

- **Development:**
  - Install dependencies: `npm install`
  - Start dev server: `npm run dev` (default port: 5173)
- **Testing:**
  - Run tests: `npm test` (Jest + React Testing Library)
- **Deployment:**
  - Vercel CLI: `vercel` (see `vercel.json` for config)
- **Data Update:**
  - Add/modify vocabulary: update CSVs in `public/data/vocabulary/` (format: `No,Chinese,Pinyin,English`)
  - Use `csvLoader.ts` for parsing and normalization

## 📝 Project-Specific Patterns & Conventions

### Code Conventions

- Use TypeScript and React functional components throughout
- Prefer named function declarations for components
- Use `type` for type definitions unless extending external types
- Always use explicit type annotations; avoid `any`
- Feature code lives in its own folder under `src/features/`
- Route constants in `src/constants/paths.ts`; use React Router for navigation
- Vocabulary data is always loaded via CSV and `csvLoader.ts`

### State Management

- Reducer files: `{domain}Reducer.ts` in `src/features/{feature}/reducers/`
- Action types: SCREAMING_SNAKE_CASE, prefixed by domain (e.g., `UI/SET_LOADING`)
- Action creators: Exported from `useProgressActions()` hook, verb-based camelCase
- Selectors: Use `useProgressState(selector)` with inline arrow functions, always access via slice (`s.ui.*`, `s.lists.*`, `s.user.*`)
- State shape: `{ lists, user, ui }` with normalized data (`itemsById`, `itemIds`)
- Immutability: Use spread operators, never mutate state directly
- Type definitions in `src/types/`

### Testing

- Reducer tests: Each action type in isolation, files in `__tests__/`
- Component tests: Mock context providers, test selector/action creator usage

### Routing

- Page components in `pages` subdirectory of feature
- Use nested routes for complex features
- Path constants from `src/constants/paths.ts`

**Component Design:**

- No prop drilling; all components access context via hooks
- Card-based UI for vocabulary lists and progress
  **Multi-User Support:**
- Progress is scoped per user/device (see `useUserIdentity()`)
  **Feature Isolation:**
- Each feature in `src/features/` is self-contained with its own components, logic, and docs

## 🤖 AI Automation & Prompting

- All AI prompt interactions should follow the structured format in `docs/automation/structured-ai-prompts.md`:
  ```
  [TASK]: <specific task description>
  [CONTEXT]: <file path or epic/story reference>
  [PARAMETERS]: <specific parameters needed>
  [OUTPUT]: <expected output format>
  [CONSTRAINTS]: <any limitations or requirements>
  ```
- See `docs/automation/ai-file-operations.md` for step-by-step workflow guidance (design, plan, implement, document).
- Always use project templates from `docs/templates/` for requirements, stories, and implementation docs.
- Reference business requirements in `docs/business-requirements/` and implementation docs in `docs/issue-implementation/`.

## 📄 Business Requirements & Implementation Docs

- **Documentation Naming Conventions:**

  - Epic business requirements: `README.md` under `docs/business-requirements/{epic-folder}/`
  - Epic implementation docs: `README.md` under `docs/issue-implementation/{epic-folder}/`
  - Story business requirements: `story-<epic>.<story>-<short-title>.md` under the epic's BR folder
  - Story implementation docs: `implementation-<epic>.<story>-<short-title>.md` under the epic's implementation folder
  - All docs must use the official templates and section order from `docs/templates/`
  - All docs must include cross-references (epic/story ↔ implementation) and status/owner/last updated fields

- All epic business requirements must be a `README.md` under their own folder in `docs/business-requirements/{epic-folder}/`, with each story as a separate markdown file in the same folder.
- All implementation docs must be a `README.md` under their own folder in `docs/issue-implementation/{epic-folder}/`, with each story implementation as a separate markdown file in the same folder.
- For every epic or story, ensure the business requirements and implementation docs are aligned:
  - Section names, order, and required fields must match the template exactly.
  - Cross-reference related docs (epic/story ↔ implementation) using links.
  - Status, rationale, and technical details must be consistent between both docs.
- When updating or creating requirements/implementation docs, always verify:
  - Template compliance (section headers, required fields)
  - Alignment and cross-referencing between business and implementation docs
  - Use the structured prompt format for all AI-assisted documentation tasks

## 🔗 Integration Points

- **TTS API:**
  - Frontend calls serverless functions in `api/get-tts-audio.js` for audio playback
- **Local Backend:**
  - For advanced dev, use `local-backend/server.js` (Express)

## 📁 Key Files & Directories

- `src/features/mandarin/` — Mandarin learning feature
- `public/data/vocabulary/` — Vocabulary CSVs
- `api/` — Serverless backend (TTS)
- `src/utils/csvLoader.ts` — Data loader utility
- `src/router/Router.tsx` — App routing
- `src/constants/paths.ts` — Route constants
- `docs/architecture.md` — System overview
- `src/features/mandarin/docs/design.md` — Feature design

## 🛡️ How to Stay Aligned

- Always use provided templates in `docs/templates/` for new requirements and stories
- Reference business requirements in `docs/business-requirements/`
- Follow reducer/context patterns for all new stateful features
- Use CSV format for vocabulary data

---

_If any section is unclear or missing, ask for clarification or request additional documentation from maintainers._

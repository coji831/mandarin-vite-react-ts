

<!-- coverage:generated -->
<!-- generated 2026-10-31 by scripts/generate-system-map.mjs — DO NOT EDIT; run `npm run generate:system-map` -->

# Coverage Ledger (generated)

Answers *“is everything documented?”* across the whole system. Rows are derived from the filesystem + leaf front-matter + machine-check catalogs — never hand-synced. Active-only score (retired/doc-only/n/a excluded). See `docs/README.md` for the aggregate map rows.

## Scoreboard

| Area | Documented | Partial | Undocumented | Active | Total |
| --- | --- | --- | --- | --- | --- |
| A1 Frontend Features | 3 | 5 | 7 | 15 | 15 |
| A2 Frontend Pages | 18 | 0 | 0 | 18 | 20 |
| A3 Frontend Shared | 0 | 1 | 10 | 11 | 11 |
| A4 Backend Modules | 3 | 12 | 0 | 15 | 15 |
| A5 Backend Shared / Infra | 0 | 8 | 0 | 8 | 8 |
| A6 Packages | 0 | 0 | 3 | 3 | 3 |
| A7 Content / Data | 0 | 9 | 0 | 9 | 9 |
| A8 Infra | 1 | 2 | 0 | 3 | 4 |
| A9 Tooling / Scripts | 0 | 2 | 0 | 2 | 2 |
| A10 Agentic / Dev-Flow | 37 | 11 | 0 | 48 | 48 |


<a id="a1"></a>

## A1 — Frontend Features (15)  ·  score 3/15 documented · 5 partial · 7 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| auth | ✅ | apps/frontend/src/features/auth/docs/design.md | **partial** ⚠️ review (last-verified 2026-07-20 > 6 weeks) | — | module-boundaries |
| character-hub | ✅ | apps/frontend/src/features/character-hub/docs/design.md | **partial** ⚠️ review (last-verified 2026-07-22 > 6 weeks) | — | module-boundaries |
| chengyu | ✅ | — | **undocumented** | **write features/chengyu/docs/design.md** | module-boundaries |
| dashboard | ✅ | apps/frontend/src/features/dashboard/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-18 > 6 weeks) | — | module-boundaries |
| foundations | ✅ | apps/frontend/src/features/foundations/docs/design.md | documented | — | module-boundaries |
| grammar | ✅ | — | **undocumented** | **write features/grammar/docs/design.md** | module-boundaries |
| lexical-hub | ✅ | — | **undocumented** | **write features/lexical-hub/docs/design.md** | module-boundaries |
| library | ✅ | — | **undocumented** | **write features/library/docs/design.md** | module-boundaries |
| phonetic-clusters | ✅ | — | **undocumented** | **write features/phonetic-clusters/docs/design.md** | module-boundaries |
| progress | ✅ | — | **undocumented** | **write features/progress/docs/design.md** | module-boundaries |
| quiz | ✅ | apps/frontend/src/features/quiz/docs/design.md | documented | — | module-boundaries |
| radicals | ✅ | apps/frontend/src/features/radicals/docs/design.md | **partial** ⚠️ review (last-verified 2026-07-08 > 6 weeks) | — | module-boundaries |
| readers | ✅ | apps/frontend/src/features/readers/docs/design.md | documented | — | module-boundaries |
| review | ✅ | apps/frontend/src/features/review/docs/design.md | **partial** ⚠️ review (last-verified 2026-07-20 > 6 weeks) | — | module-boundaries |
| word-hub | ✅ | — | **undocumented** | **write features/word-hub/docs/design.md** | module-boundaries |

<a id="a2"></a>

## A2 — Frontend Pages (20)  ·  score 18/18 documented · 0 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| / | ✅ | apps/frontend/src/pages/dashboard/DashboardPageFull.stories.tsx | documented | — | page-inventory |
| /learn | — | docs/guides/design/page-archetypes.md | doc-only (route without page container (redirect/planned)) | — | page-inventory |
| /practices | ✅ | apps/frontend/src/pages/practices/PracticesPageFull.stories.tsx | documented | — | page-inventory |
| /library | ✅ | apps/frontend/src/pages/LibraryPageFull.stories.tsx | documented | — | page-inventory |
| /learn/readers | ✅ | apps/frontend/src/pages/learn/readers/ReadersPageFull.stories.tsx | documented | — | page-inventory |
| /learn/radicals | ✅ | apps/frontend/src/pages/learn/radicals/RadicalsPageFull.stories.tsx | documented | — | page-inventory |
| /learn/grammar | ✅ | apps/frontend/src/pages/learn/grammar/GrammarPageFull.stories.tsx | documented | — | page-inventory |
| /learn/chengyu | ✅ | apps/frontend/src/pages/learn/chengyu/ChengyuPageFull.stories.tsx | documented | — | page-inventory |
| /practices/review | ✅ | apps/frontend/src/pages/practices/ReviewPageFull.stories.tsx | documented | — | page-inventory |
| /practices/quiz | ✅ | apps/frontend/src/pages/practices/QuizPageFull.stories.tsx | documented | — | page-inventory |
| /progress | ✅ | apps/frontend/src/pages/ProgressPageFull.stories.tsx | documented | — | page-inventory |
| /auth/login | ✅ | apps/frontend/src/pages/LoginPageFull.stories.tsx | documented | — | page-inventory |
| /auth/register | ✅ | apps/frontend/src/pages/RegisterPageFull.stories.tsx | documented | — | page-inventory |
| /settings | ✅ | apps/frontend/src/pages/SettingsPageFull.stories.tsx | documented | — | page-inventory |
| /profile | ✅ | apps/frontend/src/pages/ProfilePageFull.stories.tsx | documented | — | page-inventory |
| /learn/foundations | ✅ | apps/frontend/src/pages/learn/foundations/FoundationsPageFull.stories.tsx | documented | — | page-inventory |
| /learn/foundations/reference | ✅ | apps/frontend/src/pages/learn/foundations/FoundationsReferencePageFull.stories.tsx | documented | — | page-inventory |
| /learn/phonetic-clusters | ✅ | apps/frontend/src/pages/learn/phonetic-clusters/PhoneticClustersPageFull.stories.tsx | documented | — | page-inventory |
| /learn/basic | — | — | doc-only (route without page container (redirect/planned)) | — | page-inventory |
| * | ✅ | apps/frontend/src/pages/NotFoundPageFull.stories.tsx | documented | — | page-inventory |

<a id="a3"></a>

## A3 — Frontend Shared (11)  ·  score 0/11 documented · 1 partial · 10 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| api | ✅ | — | **undocumented** | **write doc for api** | design-audit |
| audio | ✅ | — | **undocumented** | **write doc for audio** | design-audit |
| components | ✅ | apps/frontend/src/shared/components/README.md | **partial** ⚠️ review (last-verified 2026-08-18 > 6 weeks) | — | registry-stories + design-audit |
| config | ✅ | — | **undocumented** | **write doc for config** | design-audit |
| constants | ✅ | — | **undocumented** | **write doc for constants** | design-audit |
| hooks | ✅ | — | **undocumented** | **write doc for hooks** | design-audit |
| hub-entry | ✅ | — | **undocumented** | **write doc for hub-entry** | design-audit |
| layouts | ✅ | — | **undocumented** | **write doc for layouts** | design-audit |
| services | ✅ | — | **undocumented** | **write doc for services** | design-audit |
| store | ✅ | — | **undocumented** | **write doc for store** | design-audit |
| types | ✅ | — | **undocumented** | **write doc for types** | design-audit |

<a id="a4"></a>

## A4 — Backend Modules (15)  ·  score 3/15 documented · 12 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| audio | ✅ | apps/backend/docs/api/tts.md | documented | — | module-boundaries |
| auth | ✅ | apps/backend/docs/api/auth.md | documented | — | module-boundaries |
| characters | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| chengyu | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| foundations | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| grammar | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| health | ✅ | apps/backend/docs/api/health.md | documented | — | module-boundaries |
| mnemonics | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| phonetic-clusters | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| progression | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| quiz | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| radicals | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| readers | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| review | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |
| words | ✅ | apps/backend/docs/design.md | **partial** ⚠️ design.md line + epic docs; no API spec (api/README.md self-declares this) | — | module-boundaries |

<a id="a5"></a>

## A5 — Backend Shared / Infra (8)  ·  score 0/8 documented · 8 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| app | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |
| shared/config | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |
| shared/docs | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |
| shared/errors | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |
| shared/infrastructure | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |
| shared/middleware | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |
| shared/types | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |
| shared/utils | ✅ | apps/backend/docs/design.md | **partial** ⚠️ review (last-verified 2026-08-23 > 6 weeks) | — | module-boundaries |

<a id="a6"></a>

## A6 — Packages (3)  ·  score 0/3 documented · 0 partial · 3 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| shared-constants | ✅ | — | **undocumented** | **write packages/shared-constants/README.md** | typecheck/build |
| shared-types | ✅ | — | **undocumented** | **write packages/shared-types/README.md** | typecheck/build |
| shared-utils | ✅ | — | **undocumented** | **write packages/shared-utils/README.md** | typecheck/build |

<a id="a7"></a>

## A7 — Content / Data (9)  ·  score 0/9 documented · 9 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| characters | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| pinyin | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| radicals | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| references | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| seed | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| strokes | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| tones | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| words | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ pipeline documented in seed-pipeline.md; per-type schema/authoring not | — | validate:* |
| manifest.json | ✅ | docs/guides/data/seed-pipeline.md | **partial** ⚠️ authoring inventory; no dedicated doc | — | validate:* |

<a id="a8"></a>

## A8 — Infra (4)  ·  score 1/3 documented · 2 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| terraform/ | ✅ | terraform/README.md | **partial** ⚠️ review (last-verified 2026-09-04 > 6 weeks) | — | terraform plan workflows |
| .github/workflows/ | ✅ | docs/guides/operations/infrastructure.md | **partial** ⚠️ review (last-verified 2026-06-12 > 6 weeks) | — | terraform plan workflows |
| vercel.json | ✅ | — | n/a (config — self-evident) | — | — |
| backend/DATABASE.md (redirect) | — | docs/guides/setup/database.md | documented (redirect → guides/setup/database.md) | — | — |

<a id="a9"></a>

## A9 — Tooling / Scripts (2)  ·  score 0/2 documented · 2 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| scripts/ | ✅ | project-workflow gate table | **partial** ⚠️ gate table documents intent; scripts self-documenting | — | check:* / validate:* |
| tools/ | ✅ | — | **partial** ⚠️ design-audit self-documenting | — | design-audit |

<a id="a10"></a>

## A10 — Agentic / Dev-Flow (48)  ·  score 37/48 documented · 11 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| **Agentic layer (instructions 18 + agents 11 + skills 7)** | ✅ | .github/AGENTS.md | **documented** ⚠️ layer-level: AGENTS.md `last-verified: 2026-09-06` | — | check:system-map |
| instructions/a11y-floor | ✅ | .github/instructions/a11y-floor.instructions.md | documented | — | check:system-map |
| instructions/backend-error-messages | ✅ | .github/instructions/backend-error-messages.instructions.md | documented | — | check:system-map |
| instructions/documentation-standards | ✅ | .github/instructions/documentation-standards.instructions.md | documented | — | check:system-map |
| instructions/frontend-api-client | ✅ | .github/instructions/frontend-api-client.instructions.md | documented | — | check:system-map |
| instructions/frontend-component-architecture | ✅ | .github/instructions/frontend-component-architecture.instructions.md | documented | — | check:system-map |
| instructions/frontend-css-styling | ✅ | .github/instructions/frontend-css-styling.instructions.md | documented | — | check:system-map |
| instructions/frontend-input-handling | ✅ | .github/instructions/frontend-input-handling.instructions.md | documented | — | check:system-map |
| instructions/frontend-pre-delivery-checklist | ✅ | .github/instructions/frontend-pre-delivery-checklist.instructions.md | documented | — | check:system-map |
| instructions/prisma-schema-changes | ✅ | .github/instructions/prisma-schema-changes.instructions.md | documented | — | check:system-map |
| instructions/quiz-architecture | ✅ | .github/instructions/quiz-architecture.instructions.md | documented | — | check:system-map |
| instructions/react-external-libs | ✅ | .github/instructions/react-external-libs.instructions.md | documented | — | check:system-map |
| instructions/solar-agent-chain | ✅ | .github/instructions/solar-agent-chain.instructions.md | documented | — | check:system-map |
| instructions/storybook-production-alignment | ✅ | .github/instructions/storybook-production-alignment.instructions.md | documented | — | check:system-map |
| instructions/testing-standards | ✅ | .github/instructions/testing-standards.instructions.md | documented | — | check:system-map |
| instructions/theme-delta | ✅ | .github/instructions/theme-delta.instructions.md | documented | — | check:system-map |
| instructions/token-discipline | ✅ | .github/instructions/token-discipline.instructions.md | documented | — | check:system-map |
| instructions/ui-composition | ✅ | .github/instructions/ui-composition.instructions.md | documented | — | check:system-map |
| instructions/uiux-design-protocol | ✅ | .github/instructions/uiux-design-protocol.instructions.md | documented | — | check:system-map |
| agents/architect | ✅ | .github/agents/architect.agent.md | documented | — | check:system-map |
| agents/backend-engineer | ✅ | .github/agents/backend-engineer.agent.md | documented | — | check:system-map |
| agents/code-reviewer | ✅ | .github/agents/code-reviewer.agent.md | documented | — | check:system-map |
| agents/design-lead | ✅ | .github/agents/design-lead.agent.md | documented | — | check:system-map |
| agents/docs-writer | ✅ | .github/agents/docs-writer.agent.md | documented | — | check:system-map |
| agents/frontend-engineer | ✅ | .github/agents/frontend-engineer.agent.md | documented | — | check:system-map |
| agents/governor-v5 | ✅ | .github/agents/governor-v5.agent.md | documented | — | check:system-map |
| agents/hermes | ✅ | .github/agents/hermes.agent.md | documented | — | check:system-map |
| agents/investigator | ✅ | .github/agents/investigator.agent.md | documented | — | check:system-map |
| agents/layout-critic | ✅ | .github/agents/layout-critic.agent.md | documented | — | check:system-map |
| agents/uiux-designer | ✅ | .github/agents/uiux-designer.agent.md | documented | — | check:system-map |
| skills/add-instruction | ✅ | .github/skills/add-instruction/SKILL.md | documented | — | check:system-map |
| skills/add-theme | ✅ | .github/skills/add-theme/SKILL.md | documented | — | check:system-map |
| skills/backend-audit | ✅ | .github/skills/backend-audit/SKILL.md | documented | — | check:system-map |
| skills/design-review | ✅ | .github/skills/design-review/SKILL.md | documented | — | check:system-map |
| skills/docs-audit | ✅ | .github/skills/docs-audit/SKILL.md | documented | — | check:system-map |
| skills/frontend-audit | ✅ | .github/skills/frontend-audit/SKILL.md | documented | — | check:system-map |
| skills/prisma-migration | ✅ | .github/skills/prisma-migration/SKILL.md | documented | — | check:system-map |
| conventions/api-client | ✅ | docs/guides/conventions/api-client.md | **partial** ⚠️ review (last-verified 2026-08-07 > 6 weeks) | — | check:system-map |
| conventions/backend | ✅ | docs/guides/conventions/backend.md | **partial** ⚠️ review (last-verified 2026-09-03 > 6 weeks) | — | check:system-map |
| conventions/data-import-scripts | ✅ | docs/guides/conventions/data-import-scripts.md | **partial** ⚠️ review (last-verified 2026-07-24 > 6 weeks) | — | check:system-map |
| conventions/frontend | ✅ | docs/guides/conventions/frontend.md | **partial** ⚠️ review (last-verified 2026-08-18 > 6 weeks) | — | check:system-map |
| conventions/git | ✅ | docs/guides/conventions/git.md | **partial** ⚠️ review (last-verified 2026-08-02 > 6 weeks) | — | check:system-map |
| conventions/naming-standards | ✅ | docs/guides/conventions/naming-standards.md | **partial** ⚠️ review (last-verified 2026-06-08 > 6 weeks) | — | check:system-map |
| conventions/security | ✅ | docs/guides/conventions/security.md | **partial** ⚠️ review (last-verified 2026-06-07 > 6 weeks) | — | check:system-map |
| conventions/state-management | ✅ | docs/guides/conventions/state-management.md | **partial** ⚠️ review (last-verified 2026-06-03 > 6 weeks) | — | check:system-map |
| AGENTS.md | ✅ | .github/AGENTS.md | **partial** ⚠️ review (last-verified 2026-09-06 > 6 weeks) | — | check:system-map |
| copilot-instructions.md | ✅ | .github/copilot-instructions.md | **partial** ⚠️ review (last-verified August 24, 2026 > 6 weeks) | — | check:system-map |
| gate table (project-workflow) | ✅ | .github/instructions/project-workflow.instructions.md | documented | — | check:system-map |
| dev-flow-visualization.html | ✅ | docs/guides/dev-flow-visualization.html | **partial** ⚠️ review (last-verified 2026-08-18 > 6 weeks) | — | check:system-map |

## Doc-Debt Queue

Priority: (1) shipped + `undocumented` → (2) `partial` with declared gaps → (3) `doc-only` (planned, informational). Each row may read `target:`/`debt-owner:` from the leaf's front-matter; otherwise the default target/owner below.

| # | Unit | Area | Doc | Debt | Owner |
| --- | --- | --- | --- | --- | --- |
| 1 | chengyu | A1 | — | **write features/chengyu/docs/design.md** | — |
| 2 | grammar | A1 | — | **write features/grammar/docs/design.md** | — |
| 3 | lexical-hub | A1 | — | **write features/lexical-hub/docs/design.md** | — |
| 4 | library | A1 | — | **write features/library/docs/design.md** | — |
| 5 | phonetic-clusters | A1 | — | **write features/phonetic-clusters/docs/design.md** | — |
| 6 | progress | A1 | — | **write features/progress/docs/design.md** | — |
| 7 | word-hub | A1 | — | **write features/word-hub/docs/design.md** | — |
| 8 | api | A3 | — | **write doc for api** | — |
| 9 | audio | A3 | — | **write doc for audio** | — |
| 10 | config | A3 | — | **write doc for config** | — |
| 11 | constants | A3 | — | **write doc for constants** | — |
| 12 | hooks | A3 | — | **write doc for hooks** | — |
| 13 | hub-entry | A3 | — | **write doc for hub-entry** | — |
| 14 | layouts | A3 | — | **write doc for layouts** | — |
| 15 | services | A3 | — | **write doc for services** | — |
| 16 | store | A3 | — | **write doc for store** | — |
| 17 | types | A3 | — | **write doc for types** | — |
| 18 | shared-constants | A6 | — | **write packages/shared-constants/README.md** | — |
| 19 | shared-types | A6 | — | **write packages/shared-types/README.md** | — |
| 20 | shared-utils | A6 | — | **write packages/shared-utils/README.md** | — |
| 21 | auth | A1 | apps/frontend/src/features/auth/docs/design.md | — | — |
| 22 | character-hub | A1 | apps/frontend/src/features/character-hub/docs/design.md | — | — |
| 23 | dashboard | A1 | apps/frontend/src/features/dashboard/docs/design.md | — | — |
| 24 | radicals | A1 | apps/frontend/src/features/radicals/docs/design.md | — | — |
| 25 | review | A1 | apps/frontend/src/features/review/docs/design.md | — | — |
| 26 | components | A3 | apps/frontend/src/shared/components/README.md | — | — |
| 27 | characters | A4 | apps/backend/docs/design.md | — | — |
| 28 | chengyu | A4 | apps/backend/docs/design.md | — | — |
| 29 | foundations | A4 | apps/backend/docs/design.md | — | — |
| 30 | grammar | A4 | apps/backend/docs/design.md | — | — |
| 31 | mnemonics | A4 | apps/backend/docs/design.md | — | — |
| 32 | phonetic-clusters | A4 | apps/backend/docs/design.md | — | — |
| 33 | progression | A4 | apps/backend/docs/design.md | — | — |
| 34 | quiz | A4 | apps/backend/docs/design.md | — | — |
| 35 | radicals | A4 | apps/backend/docs/design.md | — | — |
| 36 | readers | A4 | apps/backend/docs/design.md | — | — |
| 37 | review | A4 | apps/backend/docs/design.md | — | — |
| 38 | words | A4 | apps/backend/docs/design.md | — | — |
| 39 | app | A5 | apps/backend/docs/design.md | — | — |
| 40 | shared/config | A5 | apps/backend/docs/design.md | — | — |
| 41 | shared/docs | A5 | apps/backend/docs/design.md | — | — |
| 42 | shared/errors | A5 | apps/backend/docs/design.md | — | — |
| 43 | shared/infrastructure | A5 | apps/backend/docs/design.md | — | — |
| 44 | shared/middleware | A5 | apps/backend/docs/design.md | — | — |
| 45 | shared/types | A5 | apps/backend/docs/design.md | — | — |
| 46 | shared/utils | A5 | apps/backend/docs/design.md | — | — |
| 47 | characters | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 48 | pinyin | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 49 | radicals | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 50 | references | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 51 | seed | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 52 | strokes | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 53 | tones | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 54 | words | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 55 | manifest.json | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 56 | terraform/ | A8 | terraform/README.md | — | — |
| 57 | .github/workflows/ | A8 | docs/guides/operations/infrastructure.md | — | — |
| 58 | scripts/ | A9 | project-workflow gate table | — | — |
| 59 | tools/ | A9 | — | — | — |
| 60 | conventions/api-client | A10 | docs/guides/conventions/api-client.md | — | — |
| 61 | conventions/backend | A10 | docs/guides/conventions/backend.md | — | — |
| 62 | conventions/data-import-scripts | A10 | docs/guides/conventions/data-import-scripts.md | — | — |
| 63 | conventions/frontend | A10 | docs/guides/conventions/frontend.md | — | — |
| 64 | conventions/git | A10 | docs/guides/conventions/git.md | — | — |
| 65 | conventions/naming-standards | A10 | docs/guides/conventions/naming-standards.md | — | — |
| 66 | conventions/security | A10 | docs/guides/conventions/security.md | — | — |
| 67 | conventions/state-management | A10 | docs/guides/conventions/state-management.md | — | — |
| 68 | AGENTS.md | A10 | .github/AGENTS.md | — | — |
| 69 | copilot-instructions.md | A10 | .github/copilot-instructions.md | — | — |
| 70 | dev-flow-visualization.html | A10 | docs/guides/dev-flow-visualization.html | — | — |
| 71 | /learn | A2 | docs/guides/design/page-archetypes.md | — | — |
| 72 | /learn/basic | A2 | — | — | — |

## Flags

- ⚠️ shared/components/README.md lists 7 of 39 shared components — stale
- ⚠️ A1 auth: review (2026-07-20 > 6 weeks)
- ⚠️ A1 character-hub: review (2026-07-22 > 6 weeks)
- ⚠️ A1 dashboard: review (2026-08-18 > 6 weeks)
- ⚠️ A1 radicals: review (2026-07-08 > 6 weeks)
- ⚠️ A1 review: review (2026-07-20 > 6 weeks)
- ⚠️ A3 components: review (2026-08-18 > 6 weeks)
- ⚠️ A5 app: review (2026-08-23 > 6 weeks)
- ⚠️ A5 shared/config: review (2026-08-23 > 6 weeks)
- ⚠️ A5 shared/docs: review (2026-08-23 > 6 weeks)
- ⚠️ A5 shared/errors: review (2026-08-23 > 6 weeks)
- ⚠️ A5 shared/infrastructure: review (2026-08-23 > 6 weeks)
- ⚠️ A5 shared/middleware: review (2026-08-23 > 6 weeks)
- ⚠️ A5 shared/types: review (2026-08-23 > 6 weeks)
- ⚠️ A5 shared/utils: review (2026-08-23 > 6 weeks)
- ⚠️ A8 terraform/: review (2026-09-04 > 6 weeks)
- ⚠️ A8 .github/workflows/: review (2026-06-12 > 6 weeks)
- ⚠️ A10 conventions/api-client: review (2026-08-07 > 6 weeks)
- ⚠️ A10 conventions/backend: review (2026-09-03 > 6 weeks)
- ⚠️ A10 conventions/data-import-scripts: review (2026-07-24 > 6 weeks)
- ⚠️ A10 conventions/frontend: review (2026-08-18 > 6 weeks)
- ⚠️ A10 conventions/git: review (2026-08-02 > 6 weeks)
- ⚠️ A10 conventions/naming-standards: review (2026-06-08 > 6 weeks)
- ⚠️ A10 conventions/security: review (2026-06-07 > 6 weeks)
- ⚠️ A10 conventions/state-management: review (2026-06-03 > 6 weeks)
- ⚠️ A10 AGENTS.md: review (2026-09-06 > 6 weeks)
- ⚠️ A10 copilot-instructions.md: review (August 24, 2026 > 6 weeks)
- ⚠️ A10 dev-flow-visualization.html: review (2026-08-18 > 6 weeks)
- ⚠️ A10 agentic layer: AGENTS.md last-verified 2026-09-06 > 6 weeks — layer-level review
- ⚠️ features/README.md declares a docs/ per-feature convention; 7 feature(s) lack docs/design.md (chengyu, grammar, lexical-hub, library, phonetic-clusters, progress, word-hub)
<!-- /coverage:generated -->

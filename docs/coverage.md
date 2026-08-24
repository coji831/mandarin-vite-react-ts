

<!-- coverage:generated -->
<!-- generated 2026-08-25 by scripts/generate-system-map.mjs — DO NOT EDIT; run `npm run generate:system-map` -->

# Coverage Ledger (generated)

Answers *“is everything documented?”* across the whole system. Rows are derived from the filesystem + leaf front-matter + machine-check catalogs — never hand-synced. Active-only score (retired/doc-only/n/a excluded). See `docs/README.md` for the aggregate map rows.

## Scoreboard

| Area | Documented | Partial | Undocumented | Active | Total |
| --- | --- | --- | --- | --- | --- |
| A1 Frontend Features | 6 | 2 | 5 | 13 | 13 |
| A2 Frontend Pages | 13 | 3 | 0 | 16 | 18 |
| A3 Frontend Shared | 0 | 1 | 10 | 11 | 11 |
| A4 Backend Modules | 3 | 12 | 0 | 15 | 15 |
| A5 Backend Shared / Infra | 8 | 0 | 0 | 8 | 8 |
| A6 Packages | 0 | 0 | 3 | 3 | 3 |
| A7 Content / Data | 0 | 9 | 0 | 9 | 9 |
| A8 Infra | 1 | 1 | 1 | 3 | 4 |
| A9 Tooling / Scripts | 0 | 2 | 0 | 2 | 2 |
| A10 Agentic / Dev-Flow | 36 | 3 | 0 | 39 | 39 |


<a id="a1"></a>

## A1 — Frontend Features (13)  ·  score 6/13 documented · 2 partial · 5 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| auth | ✅ | apps/frontend/src/features/auth/docs/design.md | documented | — | module-boundaries |
| character-hub | ✅ | apps/frontend/src/features/character-hub/docs/design.md | documented | — | module-boundaries |
| chengyu | ✅ | — | **undocumented** | **write features/chengyu/docs/design.md** | module-boundaries |
| dashboard | ✅ | apps/frontend/src/features/dashboard/docs/design.md | documented | — | module-boundaries |
| foundations | ✅ | apps/frontend/src/features/foundations/docs/design.md | documented | — | module-boundaries |
| grammar | ✅ | — | **undocumented** | **write features/grammar/docs/design.md** | module-boundaries |
| lexical-hub | ✅ | — | **undocumented** | **write features/lexical-hub/docs/design.md** | module-boundaries |
| phonetic-clusters | ✅ | — | **undocumented** | **write features/phonetic-clusters/docs/design.md** | module-boundaries |
| quiz | ✅ | apps/frontend/src/features/quiz/docs/design.md | **partial** ⚠️ review (last-verified 2026-07-01 > 6 weeks) | — | module-boundaries |
| radicals | ✅ | apps/frontend/src/features/radicals/docs/design.md | **partial** ⚠️ review (last-verified 2026-07-08 > 6 weeks) | — | module-boundaries |
| readers | ✅ | apps/frontend/src/features/readers/docs/design.md | documented | — | module-boundaries |
| review | ✅ | apps/frontend/src/features/review/docs/design.md | documented | — | module-boundaries |
| word-hub | ✅ | — | **undocumented** | **write features/word-hub/docs/design.md** | module-boundaries |

<a id="a2"></a>

## A2 — Frontend Pages (18)  ·  score 13/16 documented · 3 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| / | ✅ | apps/frontend/src/pages/dashboard/DashboardPageFull.stories.tsx | documented | — | page-inventory |
| /learn | — | docs/guides/design/page-archetypes.md | doc-only (route without page container (redirect/planned)) | — | page-inventory |
| /practices | ✅ | apps/frontend/src/pages/practices/PracticesPageFull.stories.tsx | documented | — | page-inventory |
| /library | ✅ | apps/frontend/src/pages/LibraryPageFull.stories.tsx | documented | — | page-inventory |
| /learn/readers | ✅ | apps/frontend/src/pages/learn/readers/ReadersPageFull.stories.tsx | **partial** ⚠️ page-inventory status diverges | — | page-inventory |
| /learn/radicals | ✅ | apps/frontend/src/pages/learn/radicals/RadicalsPageFull.stories.tsx | documented | — | page-inventory |
| /learn/grammar | ✅ | apps/frontend/src/pages/learn/grammar/GrammarPageFull.stories.tsx | documented | — | page-inventory |
| /learn/chengyu | ✅ | apps/frontend/src/pages/learn/chengyu/ChengyuPageFull.stories.tsx | documented | — | page-inventory |
| /practices/review | ✅ | apps/frontend/src/pages/practices/ReviewPageFull.stories.tsx | documented | — | page-inventory |
| /practices/quiz | ✅ | apps/frontend/src/pages/practices/QuizPageFull.stories.tsx | documented | — | page-inventory |
| /progress | ✅ | apps/frontend/src/pages/ProgressPageFull.stories.tsx | documented | — | page-inventory |
| /auth/login | ✅ | apps/frontend/src/pages/LoginPageFull.stories.tsx | **partial** ⚠️ page-inventory status diverges | — | page-inventory |
| /auth/register | ✅ | apps/frontend/src/pages/RegisterPageFull.stories.tsx | **partial** ⚠️ page-inventory status diverges | — | page-inventory |
| /settings | ✅ | apps/frontend/src/pages/SettingsPageFull.stories.tsx | documented | — | page-inventory |
| /profile | ✅ | apps/frontend/src/pages/ProfilePageFull.stories.tsx | documented | — | page-inventory |
| /learn/foundations | ✅ | apps/frontend/src/pages/learn/foundations/FoundationsPageFull.stories.tsx | documented | — | page-inventory |
| /learn/phonetic-clusters | ✅ | apps/frontend/src/pages/learn/phonetic-clusters/PhoneticClustersPageFull.stories.tsx | documented | — | page-inventory |
| /learn/basic | — | — | doc-only (route without page container (redirect/planned)) | — | page-inventory |

<a id="a3"></a>

## A3 — Frontend Shared (11)  ·  score 0/11 documented · 1 partial · 10 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| api | ✅ | — | **undocumented** | **write doc for api** | design-audit |
| audio | ✅ | — | **undocumented** | **write doc for audio** | design-audit |
| components | ✅ | apps/frontend/src/shared/components/README.md | **partial** ⚠️ count-truth mismatch | — | registry-stories + design-audit |
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

## A5 — Backend Shared / Infra (8)  ·  score 8/8 documented · 0 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| app | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |
| shared/config | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |
| shared/docs | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |
| shared/errors | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |
| shared/infrastructure | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |
| shared/middleware | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |
| shared/types | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |
| shared/utils | ✅ | apps/backend/docs/design.md | documented | — | module-boundaries |

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

## A8 — Infra (4)  ·  score 1/3 documented · 1 partial · 1 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| terraform/ | ✅ | — | **undocumented** | **write terraform/README.md** | terraform plan workflows |
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

## A10 — Agentic / Dev-Flow (39)  ·  score 36/39 documented · 3 partial · 0 undocumented

| Unit | Code | Doc | Status | Debt | Gate |
| --- | --- | --- | --- | --- | --- |
| **Agentic layer (instructions 14 + agents 8 + skills 5)** | ✅ | .github/AGENTS.md | **documented** ⚠️ layer-level: AGENTS.md `last-verified: 2026-08-24` | — | check:system-map |
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
| instructions/storybook-production-alignment | ✅ | .github/instructions/storybook-production-alignment.instructions.md | documented | — | check:system-map |
| instructions/testing-standards | ✅ | .github/instructions/testing-standards.instructions.md | documented | — | check:system-map |
| instructions/ui-composition | ✅ | .github/instructions/ui-composition.instructions.md | documented | — | check:system-map |
| instructions/uiux-design-protocol | ✅ | .github/instructions/uiux-design-protocol.instructions.md | documented | — | check:system-map |
| agents/architect | ✅ | .github/agents/architect.agent.md | documented | — | check:system-map |
| agents/backend-engineer | ✅ | .github/agents/backend-engineer.agent.md | documented | — | check:system-map |
| agents/code-reviewer | ✅ | .github/agents/code-reviewer.agent.md | documented | — | check:system-map |
| agents/docs-writer | ✅ | .github/agents/docs-writer.agent.md | documented | — | check:system-map |
| agents/frontend-engineer | ✅ | .github/agents/frontend-engineer.agent.md | documented | — | check:system-map |
| agents/investigator | ✅ | .github/agents/investigator.agent.md | documented | — | check:system-map |
| agents/orchestrator | ✅ | .github/agents/orchestrator.agent.md | documented | — | check:system-map |
| agents/uiux-designer | ✅ | .github/agents/uiux-designer.agent.md | documented | — | check:system-map |
| skills/add-instruction | ✅ | .github/skills/add-instruction/SKILL.md | documented | — | check:system-map |
| skills/backend-audit | ✅ | .github/skills/backend-audit/SKILL.md | documented | — | check:system-map |
| skills/docs-audit | ✅ | .github/skills/docs-audit/SKILL.md | documented | — | check:system-map |
| skills/frontend-audit | ✅ | .github/skills/frontend-audit/SKILL.md | documented | — | check:system-map |
| skills/prisma-migration | ✅ | .github/skills/prisma-migration/SKILL.md | documented | — | check:system-map |
| conventions/api-client | ✅ | docs/guides/conventions/api-client.md | documented | — | check:system-map |
| conventions/backend | ✅ | docs/guides/conventions/backend.md | documented | — | check:system-map |
| conventions/data-import-scripts | ✅ | docs/guides/conventions/data-import-scripts.md | documented | — | check:system-map |
| conventions/frontend | ✅ | docs/guides/conventions/frontend.md | documented | — | check:system-map |
| conventions/git | ✅ | docs/guides/conventions/git.md | documented | — | check:system-map |
| conventions/naming-standards | ✅ | docs/guides/conventions/naming-standards.md | **partial** ⚠️ review (last-verified 2026-06-08 > 6 weeks) | — | check:system-map |
| conventions/security | ✅ | docs/guides/conventions/security.md | **partial** ⚠️ review (last-verified 2026-06-07 > 6 weeks) | — | check:system-map |
| conventions/state-management | ✅ | docs/guides/conventions/state-management.md | **partial** ⚠️ review (last-verified 2026-06-03 > 6 weeks) | — | check:system-map |
| AGENTS.md | ✅ | .github/AGENTS.md | documented | — | check:system-map |
| copilot-instructions.md | ✅ | .github/copilot-instructions.md | documented | — | check:system-map |
| gate table (project-workflow) | ✅ | .github/instructions/project-workflow.instructions.md | documented | — | check:system-map |
| dev-flow-visualization.html | ✅ | docs/guides/dev-flow-visualization.html | documented | — | check:system-map |

## Doc-Debt Queue

Priority: (1) shipped + `undocumented` → (2) `partial` with declared gaps → (3) `doc-only` (planned, informational). Each row may read `target:`/`debt-owner:` from the leaf's front-matter; otherwise the default target/owner below.

| # | Unit | Area | Doc | Debt | Owner |
| --- | --- | --- | --- | --- | --- |
| 1 | chengyu | A1 | — | **write features/chengyu/docs/design.md** | — |
| 2 | grammar | A1 | — | **write features/grammar/docs/design.md** | — |
| 3 | lexical-hub | A1 | — | **write features/lexical-hub/docs/design.md** | — |
| 4 | phonetic-clusters | A1 | — | **write features/phonetic-clusters/docs/design.md** | — |
| 5 | word-hub | A1 | — | **write features/word-hub/docs/design.md** | — |
| 6 | api | A3 | — | **write doc for api** | — |
| 7 | audio | A3 | — | **write doc for audio** | — |
| 8 | config | A3 | — | **write doc for config** | — |
| 9 | constants | A3 | — | **write doc for constants** | — |
| 10 | hooks | A3 | — | **write doc for hooks** | — |
| 11 | hub-entry | A3 | — | **write doc for hub-entry** | — |
| 12 | layouts | A3 | — | **write doc for layouts** | — |
| 13 | services | A3 | — | **write doc for services** | — |
| 14 | store | A3 | — | **write doc for store** | — |
| 15 | types | A3 | — | **write doc for types** | — |
| 16 | shared-constants | A6 | — | **write packages/shared-constants/README.md** | — |
| 17 | shared-types | A6 | — | **write packages/shared-types/README.md** | — |
| 18 | shared-utils | A6 | — | **write packages/shared-utils/README.md** | — |
| 19 | terraform/ | A8 | — | **write terraform/README.md** | — |
| 20 | quiz | A1 | apps/frontend/src/features/quiz/docs/design.md | — | — |
| 21 | radicals | A1 | apps/frontend/src/features/radicals/docs/design.md | — | — |
| 22 | /learn/readers | A2 | apps/frontend/src/pages/learn/readers/ReadersPageFull.stories.tsx | — | — |
| 23 | /auth/login | A2 | apps/frontend/src/pages/LoginPageFull.stories.tsx | — | — |
| 24 | /auth/register | A2 | apps/frontend/src/pages/RegisterPageFull.stories.tsx | — | — |
| 25 | components | A3 | apps/frontend/src/shared/components/README.md | — | — |
| 26 | characters | A4 | apps/backend/docs/design.md | — | — |
| 27 | chengyu | A4 | apps/backend/docs/design.md | — | — |
| 28 | foundations | A4 | apps/backend/docs/design.md | — | — |
| 29 | grammar | A4 | apps/backend/docs/design.md | — | — |
| 30 | mnemonics | A4 | apps/backend/docs/design.md | — | — |
| 31 | phonetic-clusters | A4 | apps/backend/docs/design.md | — | — |
| 32 | progression | A4 | apps/backend/docs/design.md | — | — |
| 33 | quiz | A4 | apps/backend/docs/design.md | — | — |
| 34 | radicals | A4 | apps/backend/docs/design.md | — | — |
| 35 | readers | A4 | apps/backend/docs/design.md | — | — |
| 36 | review | A4 | apps/backend/docs/design.md | — | — |
| 37 | words | A4 | apps/backend/docs/design.md | — | — |
| 38 | characters | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 39 | pinyin | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 40 | radicals | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 41 | references | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 42 | seed | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 43 | strokes | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 44 | tones | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 45 | words | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 46 | manifest.json | A7 | docs/guides/data/seed-pipeline.md | — | — |
| 47 | .github/workflows/ | A8 | docs/guides/operations/infrastructure.md | — | — |
| 48 | scripts/ | A9 | project-workflow gate table | — | — |
| 49 | tools/ | A9 | — | — | — |
| 50 | conventions/naming-standards | A10 | docs/guides/conventions/naming-standards.md | — | — |
| 51 | conventions/security | A10 | docs/guides/conventions/security.md | — | — |
| 52 | conventions/state-management | A10 | docs/guides/conventions/state-management.md | — | — |
| 53 | /learn | A2 | docs/guides/design/page-archetypes.md | — | — |
| 54 | /learn/basic | A2 | — | — | — |

## Flags

- ⚠️ shared/components/README.md lists 7 of 35 shared components — stale
- ⚠️ A1 quiz: review (2026-07-01 > 6 weeks)
- ⚠️ A1 radicals: review (2026-07-08 > 6 weeks)
- ⚠️ A8 .github/workflows/: review (2026-06-12 > 6 weeks)
- ⚠️ A10 conventions/naming-standards: review (2026-06-08 > 6 weeks)
- ⚠️ A10 conventions/security: review (2026-06-07 > 6 weeks)
- ⚠️ A10 conventions/state-management: review (2026-06-03 > 6 weeks)
- ⚠️ features/README.md declares a docs/ per-feature convention; 5 feature(s) lack docs/design.md (chengyu, grammar, lexical-hub, phonetic-clusters, word-hub)
<!-- /coverage:generated -->

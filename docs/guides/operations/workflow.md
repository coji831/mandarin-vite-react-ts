# Human-Friendly Epic/Story Workflow Checklist

**Last Updated:** June 3, 2026  
**Purpose:** Step-by-step development workflow: design, plan, implement, test, review  
**Audience:** Developers executing epics and stories

**Priority Legend:**

- 🔴 **Required** — Must complete for every change
- 🟡 **Important** — Complete for medium/large features
- 🟢 **Optional** — Nice to have, situational

## Quick Path for Small Changes

For minor bug fixes or small improvements (< 1 hour):

1. **🔴 Make the change** in code
2. **🔴 Add/update tests** to cover the change
3. **🔴 Commit** with conventional commit message: `fix(scope): description`

Skip epic/story docs unless the change affects acceptance criteria or architecture.

---

## 1. Design Epic/Story

- [ ] 🔴 **Define requirements:** Feature, epic, or story requirements
- [ ] 🟡 **Update architecture:** Update `architecture.md` and feature design docs
- [ ] 🟡 **Review design:** Check completeness and convention compliance

## 2. Plan (Business Requirements)

- [ ] 🔴 **Create BR docs:** Use templates from [docs/templates/](../../templates/)
- [ ] 🔴 **Link stories:** Link epics and stories bidirectionally
- [ ] 🟡 **Review BR:** Check template compliance and cross-linking

## 3. Implement (Code & Docs)

- [ ] 🔴 **State Management:** Follow reducer/action/selector conventions (see [State Management Checklist](#state-management-implementation-checklist) below)
- [ ] 🔴 **Tests:** Add/update unit and component tests to cover new functionality
- [ ] 🔴 **Types:** Define explicit types in feature `types/` directory
- [ ] 🔴 **Documentation:** Update implementation docs and file-level comments

- [ ] 🟡 **Code Review:** Verify code follows [Frontend Conventions](../conventions/frontend.md) and [SOLID Principles](../../knowledge-base/solid-principles.md)

### State Management Implementation Checklist

For detailed state management workflow (reducers, actions, selectors, testing), see [State Management Conventions](../conventions/state-management.md).

**Quick Checklist:**

- [ ] Identify domain: `lists`, `user`, or `ui`
- [ ] Define action type with proper namespace
- [ ] Implement reducer case (immutable updates)
- [ ] Add action creator to `useProgressActions()` hook
- [ ] Write reducer tests
- [ ] Update components with new state/actions

### Testing Workflow

- [ ] **Reducer tests:** Test each action type in isolation
  - Pattern: Given state + action → assert new state
  - File: `__tests__/{reducer}.test.ts`
- [ ] **Hook tests:** Test selector memoization and action creator stability
  - Verify selectors only re-compute when dependencies change
  - Verify action creators maintain reference equality
- [ ] **Component tests:** Mock state management hooks
  - Provide mock state via `ProgressStateContext.Provider`
  - Provide mock dispatch via `ProgressDispatchContext.Provider`
  - Test component behavior with different state values
- [ ] **Integration tests:** Test full data flow
  - User action → dispatch → reducer → state update → component re-render
  - Verify localStorage persistence

## 4. Infrastructure Changes (if applicable)

**Only required for system-level changes (infrastructure, database, deployment, CI/CD)**  
**For code-only changes, skip to Step 5.**

See [Infrastructure Setup Guide](../operations/infrastructure.md) for complete workflows.

### Quick Infrastructure Checklist

- [ ] **Terraform:** Run `terraform plan` → review → apply → document (see [Terraform Workflow](../operations/infrastructure.md#terraform-quick-reference))
- [ ] **Database Schema:** Create migration → test locally → document rollback (see [Database Migrations](../operations/infrastructure.md#database-migrations-quick-reference))
- [ ] **Deployment Config:** Update vercel.json/railway.toml → test build → deploy (see [Deployment](../operations/infrastructure.md#deployment-quick-reference))
- [ ] **Environment Variables:** Add to code with validation → update .env.example → add to production → document (see [Environment Variables](../operations/infrastructure.md#environment-variables))
- [ ] **CI/CD Pipeline:** Test locally with `act` → update workflow YAML → test on PR (see [CI/CD Workflows](../operations/infrastructure.md#cicd-workflows))
- [ ] **Dependencies:** Review changelog → test → update → run security audit (see [Dependency Updates](../operations/infrastructure.md#dependency-updates))

### When Infrastructure Changes Require Documentation Updates

| Change Type        | Documentation to Update                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| New cloud resource | [Deployment Guide](deployment.md), [Environment Setup Guide](../getting-started/environment-setup.md)     |
| Database schema    | Prisma schema, migration files, affected story/epic docs                                                  |
| Deployment process | [Deployment Guide](deployment.md)                                                                         |
| New env variable   | [Environment Setup Guide](../getting-started/environment-setup.md), `.env.example`                        |
| CI/CD workflow     | [Workflow](../operations/workflow.md) (this file), README.md if developer commands changed                |
| Tooling config     | [tooling-standards.md](../setup/tooling-standards.md), [Frontend Conventions](../conventions/frontend.md) |

## 5. Open Pull Request

- [ ] 🔴 **Prepare PR:** Use template, reference story/epic
- [ ] 🔴 **Summarize changes:** Link related issues/stories
- [ ] 🟡 **Self-review:** Check diff for unintended changes

## 6. Review & Merge

- [ ] 🔴 **Code review:** Verify completeness and conventions
- [ ] 🔴 **Check AC:** Verify acceptance criteria in story/epic docs
- [ ] 🔴 **Address feedback:** Resolve all PR comments

## 7. Close Issue/Epic

- [ ] 🔴 **Mark complete:** Close issues/epics in GitHub
- [ ] 🔴 **Update status:** Update Status & Last Update in BR docs

## 8. Update Documentation

- [ ] 🔴 **Story/Epic Docs:** Update implementation status, mark AC complete, add completion notes
- [ ] 🔴 **Architecture Docs:** Update `architecture.md` and feature `design.md` if cross-cutting changes
- [ ] 🟡 **API/CSV Docs:** Update API specs or CSV structure docs if data contracts changed

### Documentation Update Triggers

**Code changes that require documentation updates:**

| Code Change                      | Documentation Required                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| **API endpoint added/modified**  | Update `apps/backend/docs/api-spec.md`, story/epic implementation docs                             |
| **State shape changed**          | Update feature `design.md`, state diagrams, affected story docs                                    |
| **CSV structure changed**        | Update CSV format docs, [Frontend Conventions](../conventions/frontend.md#project-structure)       |
| **New public component/hook**    | Add file header comment (use [file-summary-template.md](../../templates/file-summary-template.md)) |
| **Routing changes**              | Update [architecture.md](../../architecture.md), feature routing docs                              |
| **Authentication flow modified** | Update [Backend Development Guide](../setup/backend-development.md), security docs                 |
| **New dependency added**         | Update [tooling-standards.md](../setup/tooling-standards.md), package alignment table              |
| **Breaking changes**             | See [Breaking Changes Protocol](#breaking-changes-protocol) below                                  |

### Breaking Changes Protocol

**When introducing breaking changes** (API contract, state shape, component props, database schema):

1. **Deprecation Period (Recommended):**
   - Mark old API/pattern as `@deprecated` in JSDoc/comments
   - Add deprecation warning to console (dev mode only)
   - Document migration path in code comments
   - Update all internal usages to new pattern
   - Remove deprecated code in next major version

   ```typescript
   /**
    * @deprecated Use getExamples() instead. Will be removed in v2.0.
    * @see getExamples
    */
   export function fetchExamples() {
     console.warn("fetchExamples() is deprecated. Use getExamples() instead.");
     return getExamples();
   }
   ```

2. **Documentation:**
   - Add "BREAKING CHANGE" section to PR description
   - Update migration guide in relevant docs
   - Document in story/epic implementation docs
   - Add to release notes / CHANGELOG

3. **Testing:**
   - Ensure all tests pass with new pattern
   - Add tests for backward compatibility if deprecation period used
   - Verify production builds work

**Immediate breaking changes** (no deprecation):

- Use only for unused/internal code
- Still document in PR and story/epic docs
- Include migration examples

## 9. Release/Deploy

- [ ] 🔴 **Deploy:** Deploy feature to production
- [ ] 🟡 **Release notes:** Update release notes if major feature

---

## Reference Table: Files for Each Step

| Step             | Refer Files                                      | Update Files                                  | Review Files                                     |
| ---------------- | ------------------------------------------------ | --------------------------------------------- | ------------------------------------------------ |
| Design           | architecture.md, feature design.md               | architecture.md, feature design.md            | architecture.md, feature design.md               |
| Plan             | business-requirements/README.md, story templates | business-requirements, story templates        | business-requirements/README.md, story templates |
| Implement        | issue-implementation/README.md, story impl docs  | issue-implementation, feature docs, code      | issue-implementation/README.md, story impl docs  |
| Open PR          | business-requirements/README.md (PR template)    | PR description, related issues/stories        | PR template, PR description                      |
| Review & Merge   | PR template, implementation docs, acceptance     | PR comments, implementation docs              | PR template, implementation docs, acceptance     |
| Close Issue/Epic | implementation docs, status fields               | status fields, cross-links                    | implementation docs, status fields               |
| Update Docs      | all related docs, README files                   | documentation checklists, README, cross-links | all related docs, README files                   |
| Release/Deploy   | release docs, deployment guides                  | release notes, deployment docs                | release docs, deployment guides                  |

## Commit Message Convention

- [ ] All commits use Conventional Commits format ([Git Convention](../conventions/git.md#commit--pr-guidelines))
- [ ] Automated checks/code reviews enforce commit message compliance
- [ ] Always reference this requirement in documentation, PR templates, and commit requests

---

## AI Workflow & Automation

For standardized AI workflow steps, automation protocol, and structured prompt format, see:

- **Primary**: `.github/copilot-instructions.md` → sections: **Story-Level Development Workflow** and **Automation Protocol**
- **Prompt Catalog**: `docs/automation/structured-ai-prompts.md` for detailed prompt examples

---

## CSV Vocabulary Management

This project uses a CSV-based system for managing vocabulary data. Follow these steps when working with vocabulary:

1. **Structure**: CSV files are stored in `public/data/vocabulary/` with standard headers: `No,Chinese,Pinyin,English`

2. **Adding/Updating Vocabulary**:
   - Update the appropriate CSV file in `public/data/vocabulary/hsk3.0/band1/`
   - Ensure proper format with the required columns
   - Use the `csvLoader.ts` utility for processing in code

3. **Testing**:
   - Test loading using `csvLoader.ts` utility
   - Verify proper display in the vocabulary list component

4. **Documentation**:
   - Update vocabulary documentation when changing CSV structure
   - Reference the vocabulary format in implementation docs

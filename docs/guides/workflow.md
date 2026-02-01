# Human-Friendly Epic/Story Workflow Checklist

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

- [ ] 🔴 **Create BR docs:** Use templates from [docs/templates/](../templates/)
- [ ] 🔴 **Link stories:** Link epics and stories bidirectionally
- [ ] 🟡 **Review BR:** Check template compliance and cross-linking

## 3. Implement (Code & Docs)

- [ ] 🔴 **State Management:** Follow reducer/action/selector conventions (see [State Management Checklist](#state-management-implementation-checklist) below)
- [ ] 🔴 **Tests:** Add/update unit and component tests to cover new functionality
- [ ] 🔴 **Types:** Define explicit types in feature `types/` directory
- [ ] 🔴 **Documentation:** Update implementation docs and file-level comments
- [ ] 🟡 **Code Review:** Verify code follows [code-conventions.md](./code-conventions.md) and [solid-principles.md](./solid-principles.md)

### State Management Implementation Checklist

For detailed state management workflow (reducers, actions, selectors, testing), see [State Management Conventions](./code-conventions.md#state-management-conventions).

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

## 4. Open Pull Request

- [ ] 🔴 **Prepare PR:** Use template, reference story/epic
- [ ] 🔴 **Summarize changes:** Link related issues/stories
- [ ] 🟡 **Self-review:** Check diff for unintended changes

## 5. Review & Merge

- [ ] 🔴 **Code review:** Verify completeness and conventions
- [ ] 🔴 **Check AC:** Verify acceptance criteria in story/epic docs
- [ ] 🔴 **Address feedback:** Resolve all PR comments

## 6. Close Issue/Epic

- [ ] 🔴 **Mark complete:** Close issues/epics in GitHub
- [ ] 🔴 **Update status:** Update Status & Last Update in BR docs

## 7. Update Documentation

- [ ] 🔴 **Story/Epic Docs:** Update implementation status, mark AC complete, add completion notes
- [ ] 🔴 **Architecture Docs:** Update `architecture.md` and feature `design.md` if cross-cutting changes
- [ ] 🟡 **API/CSV Docs:** Update API specs or CSV structure docs if data contracts changed

## 8. Release/Deploy

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

---

## Commit Message Convention

- [ ] All commits use Conventional Commits format ([conventions.md](./conventions.md#commit--pr-guidelines))
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

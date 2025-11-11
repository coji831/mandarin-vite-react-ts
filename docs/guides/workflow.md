# Human-Friendly Epic/Story Workflow Checklist

## 1. Design Epic/Story

- [ ] Define feature, epic, or story requirements
- [ ] Update `architecture.md` and feature design docs
- [ ] Review design docs for completeness and convention compliance

## 2. Plan (Business Requirements)

- [ ] Create or update business requirements docs using templates
- [ ] Link epics and stories to related docs
- [ ] Review business requirements for template and cross-linking

## 3. Implement (Code & Docs)

- [ ] Write or update implementation docs for epic/story
- [ ] Implement code changes in feature/components
- [ ] Update file-level comments to match code logic and context usage
- [ ] Update routing configuration for new pages/features
- [ ] Test route navigation and browser history support
- [ ] Update CSV vocabulary data if vocabulary content is affected
- [ ] Test CSV data loading functionality if changes affect vocabulary system
- [ ] Review code and docs for technical accuracy and convention compliance

### State Management Implementation Checklist

When adding new state or actions to the Mandarin feature:

- [ ] **Identify the domain:** Determine if state belongs to `lists`, `user`, or `ui` reducer
- [ ] **Define action type:** Add new action type to appropriate reducer's action union
  - Use namespace prefix: `UI/`, `USER/`, or no prefix for `lists`
  - Use SCREAMING_SNAKE_CASE: `UI/SET_LOADING`, `MARK_WORD_LEARNED`
- [ ] **Implement reducer case:** Add case to reducer's switch statement
  - Use immutable update patterns (spread operators)
  - Return new state object, never mutate existing state
- [ ] **Add action creator:** Export new function from `useProgressActions()` hook
  - Use verb-based naming: `markWordLearned`, `setSelectedList`
  - Ensure proper memoization with dependencies array
- [ ] **Write reducer tests:** Add test cases in `__tests__/{reducer}.test.ts`
  - Test initial state
  - Test each action type independently
  - Verify immutability
- [ ] **Update components:** Use new state/actions in components
  - Read state: `useProgressState(s => s.ui?.newField ?? defaultValue)`
  - Update state: `const { newAction } = useProgressActions()`
- [ ] **Verify performance:** Check that components don't re-render unnecessarily
  - Use React DevTools Profiler
  - Ensure selectors are granular (not reading entire state)
- [ ] **Run tests:** Execute `npm test` to verify all tests pass

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

- [ ] Prepare PR using the template
- [ ] Reference correct story/epic in PR description
- [ ] Summarize changes and link related issues/stories

## 5. Review & Merge

- [ ] Review code and documentation for completeness
- [ ] Check acceptance criteria in story/epic docs
- [ ] Address all PR comments and feedback

## 6. Close Issue/Epic

- [ ] Mark issues/epics as closed/merged
- [ ] Update status fields and cross-links in docs

## 7. Update Documentation

- [ ] Ensure epic docs are high-level (goals, architecture, story breakdown)
- [ ] Ensure story docs have detailed implementation notes and completion details
- [ ] Update documentation checklists, README files, and cross-links
- [ ] Update feature design docs to reflect current routing structure
- [ ] Update any vocabulary documentation to reflect CSV data changes
- [ ] Ensure CSV data structure is documented if changes were made
- [ ] Verify route paths in documentation match actual implementation

## 8. Release/Deploy

- [ ] Deploy the feature
- [ ] Update release notes and deployment docs

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

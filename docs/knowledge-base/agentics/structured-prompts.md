# Structured AI Prompts

**Last Updated:** 2026-07-20
**Audience:** AI Coding Agents and Developers
**Purpose:** Deep-dive into structured prompting patterns for consistent, predictable agent behavior across tasks.

---

## Why Structured Prompts

Unstructured prompts lead to inconsistent results. A structured prompt:

- Ensures all required context is provided
- Removes ambiguity about expected output format
- Makes collaboration repeatable across sessions
- Allows agents to reason within clear constraints

---

## The Template

Every structured prompt follows five sections:

```
[TASK]: <specific task description — one clear sentence>
[CONTEXT]: <file paths, epic/story references, or code locations>
[PARAMETERS]: <specific parameters, checklists, or scope boundaries>
[OUTPUT]: <expected output format — list, diff, status update, etc.>
[CONSTRAINTS]: <limitations, boundaries, or non-goals>
```

### Section Guidelines

| Section         | Purpose                                  | Required | Common Mistakes                             |
| --------------- | ---------------------------------------- | -------- | ------------------------------------------- |
| `[TASK]`        | One clear sentence describing what to do | Always   | Too vague ("fix this") or multi-tasking     |
| `[CONTEXT]`     | Where to look for information            | Always   | Omitting file paths; assuming agent knows   |
| `[PARAMETERS]`  | Scope the task with specifics            | Often    | Too broad; missing edge cases               |
| `[OUTPUT]`      | What format the result should take       | Always   | Not specified → agent decides, may be wrong |
| `[CONSTRAINTS]` | What NOT to do or what limits apply      | Often    | Missing critical boundaries                 |

---

## Task Categories

### 1. Code Review

```
[TASK]: Review `<ComponentName>` for SOLID principles and convention compliance
[CONTEXT]: <absolute file path to component>
[PARAMETERS]:
  - Check single responsibility
  - Verify proper hook usage (no conditional hooks)
  - Identify prop drilling issues
  - Check for barrel export compliance
  - Verify CSS variable usage (no hardcoded values)
[OUTPUT]: Severity-ordered list of issues with line references and suggested fixes
[CONSTRAINTS]: Focus on maintainability and performance; skip formatting/style nits
```

### 2. Documentation Status Update

```
[TASK]: Update implementation status for completed story
[CONTEXT]: <path to story implementation doc>
[PARAMETERS]:
  - PR number: #<number>
  - Merge date: <date>
  - Key commit: <hash>
[OUTPUT]: Updated Status section with: Status, Last Updated, PR reference, and Completion Notes
[CONSTRAINTS]: Update both business requirements AND implementation docs; cross-link them
```

### 3. UI Implementation

```
[TASK]: Implement `<Feature>` page based on the wireframe
[CONTEXT]:
  - Wireframe: <path or reference>
  - Shared components: <barrel path>
  - Design tokens: DESIGN.md
  - BR: <story BR path>
  - Implementation: <story implementation path>
[PARAMETERS]:
  - Use Storybook-first approach: check components before creating
  - Use CSS variables only — no hardcoded values
  - Cover: default, loading, empty, error states
  - Create/find corresponding Storybook stories
[OUTPUT]: List of created/modified files with state coverage summary
[CONSTRAINTS]: Must pass build, tests, and design lint before reporting done
```

### 4. Bug Fix Investigation

```
[TASK]: Investigate and fix <bug description>
[CONTEXT]:
  - Affected component: <file path>
  - Error/behavior: <actual behavior vs expected>
  - Reproduction steps: <steps>
[PARAMETERS]:
  - Trace the data flow from trigger to render
  - Check for: missing state, incorrect selector, stale closure, API mismatch
  - Add test that reproduces the bug before fixing
[OUTPUT]: Root cause analysis + fix description + test that validates the fix
[CONSTRAINTS]: No architectural changes; fix must not break existing tests
```

### 5. Knowledge Base Extraction

```
[TASK]: Extract lessons from <story> to KB
[CONTEXT]:
  - Story implementation: <path>
  - Existing KB: <path to relevant KB section>
[PARAMETERS]:
  - Actionable patterns → docs/guides/ (concise, numbered steps)
  - Conceptual deep-dives → docs/knowledge-base/ (educational, tradeoffs)
  - Cross-link between source doc and KB article
[OUTPUT]: KB article path + summary of what was extracted and what was removed from source
[CONSTRAINTS]: Must maintain template compliance in source doc after extraction
```

---

## Prompt Anti-Patterns

| Anti-Pattern                     | Why It Fails                                   | Fix                                                    |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| Vague task: "Fix the UI"         | No scope — agent doesn't know what's broken    | "Fix the missing loading state in `<Component>`"       |
| Missing context: no file paths   | Agent searches or guesses → wrong file         | Always include absolute or project-relative paths      |
| No output format                 | Agent returns random format → needs rework     | "Return a numbered list" or "Update the file in-place" |
| Multiple tasks in one prompt     | Agent picks one, ignores others                | Split into separate prompts per task                   |
| No constraints                   | Agent over-engineers or changes unrelated code | "No architectural changes" / "CSS variables only"      |
| Assuming agent knows conventions | Agent uses wrong patterns                      | Reference `.github/copilot-instructions.md` explicitly |

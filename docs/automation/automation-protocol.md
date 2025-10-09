Automation Protocol: "refer #file:automation"

Purpose

This file defines the exact, authoritative behavior an AI assistant must follow whenever a user includes the phrase `refer #file:automation` in a prompt. Use this as the single source of truth for automation-related requests.

When to use

- The user will say something like: "refer #file:automation, start the implement workflow for epic X" or "refer #file:automation and create epic Y".
- On seeing `refer #file:automation`, the assistant MUST follow this protocol exactly.

Files the assistant MUST read first (in order)

1. docs/automation/ai-file-operations.md
2. docs/automation/structured-ai-prompts.md

Auxiliary files the assistant MUST consult as needed

- docs/templates/\* (choose exact template files referenced in the automation prompts)
- docs/guides/code-conventions.md
- docs/guides/solid-principles.md
- docs/guides/git-convention.md
- docs/guides/workflow.md
- docs/business-requirements/<EPIC>/README.md (if present)
- docs/issue-implementation/<EPIC>/README.md (if present)

Mandatory behavior (the assistant MUST do these steps)

1. Read the two automation files listed above in full before taking any action or producing any outputs.
2. If the user requested a workflow (for example, "start the implement workflow for epic X"), follow the structured prompt templates in `docs/automation/structured-ai-prompts.md` and the step guidance in `docs/automation/ai-file-operations.md`.
3. Always prefer templates in `docs/templates/` when creating or validating docs. Use the exact template file specified by the automation prompts; do not substitute or invent headings.
4. When creating docs: preserve the template heading names and order verbatim. Populate placeholders with realistic example content but do not remove or rearrange headings.
5. When producing code: enforce `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`. Include inline comments referencing the relevant doc sections and the implementation doc.
6. When producing git artifacts: follow `docs/guides/git-convention.md` for branch names, commit message format (Conventional Commits), and PR titles/descriptions.
7. For any ambiguous requirement, missing template, or missing critical file, STOP and return a short list of the missing items plus 2 proposed options to continue. Do not guess.
8. Do not run git commands, write files, or push to the repository unless explicitly instructed by the user after they review the produced artifacts. The assistant should only produce textual artifacts for review (patches, file contents, commit messages, PR text, status updates). If the user later instructs to apply changes, follow their explicit instruction and confirm which files to modify first.

Output contract

When the user asked to "start the implement workflow for epic X" using `refer #file:automation`, the assistant MUST output (in this order):

1. Short action summary (bulleted).
2. Implementation plan (list of target files + responsibilities).
3. Files to create/update: unified git diff patch preferred; if not possible, provide per-file full contents with absolute path headers.
4. Tests (file paths + full test contents).
5. Branch name, Conventional Commit message, PR title, and PR description.
6. Exact Status strings to insert into both business and implementation README files (absolute paths).
7. Final checklist of ambiguous decisions or blockers (if any).

Short-form prompts the assistant must accept

- The assistant must treat these equivalent instructions the same as `refer #file:automation`:
  - "Refer the automation folder and start the implement workflow for epic X"
  - "refer #file:automation and create epic Y"
  - "use the automation files to generate docs and code for epic Z"

Testing and validation

- The assistant should validate that all referenced templates exist before generating final artifacts. If templates are missing, include a stop message listing the missing templates and propose two fallback choices.

Security and safety

- Never exfiltrate secrets. If a template references environment variables or secrets, list them and stop, requesting secure user input.

Revision history

- v1.0 — 2025-10-07 — Initial protocol added.

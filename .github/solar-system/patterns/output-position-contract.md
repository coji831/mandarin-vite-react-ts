# Output Position Contract

**Scope:** Applies to all SOLAR agents that write or modify files in the **target repository** (project source files, docs, configs). Does NOT apply to SOLAR's own internal `.github/` artefacts.

---

## Write-Safe Rules

### Rule 1: Read before writing to any existing file

Before modifying any existing file in the target repository:

1. Read the **full current file** — not just the section you intend to change.
2. Identify all existing section headers and their order.
3. Confirm **exactly which section** the new content belongs to before writing.
4. Write new content **only inside the correct matching section**.
5. Do NOT add, remove, or reorder sections unless explicitly instructed by the user or the design doc.

### Rule 2: Correct section placement is required

Place content in the matching section based on:

- The section header name (exact match, not approximate)
- The semantic type of content (implementation notes go in implementation sections, not summaries)
- The file's existing structure

**Wrong-position rule:** If the correct section for new content cannot be identified with confidence — STOP. Ask the user or the Design Planning Architect which section to use. Do not place content in an approximate or nearby section. Wrong-position output is a formatting defect and a review finding.

### Rule 3: Use existing templates when creating new files

Before creating a new file in the target repository:

1. Search the target repo's `docs/templates/` directory (or equivalent) for a matching template of the same document type.
2. If a matching template is found: use it as the skeleton. Do not invent structure.
3. If no template exists: ask the user or Design Planning Architect for a skeleton before creating. Do not invent structure based on assumptions.

**Template match criteria:** A template matches when its file type (epic BR, story BR, implementation doc, API spec, etc.) matches the type of document being created. Do not use a partial or unrelated template.

### Rule 4: Never invent document structure

If neither the correct section nor a matching template can be determined:

- STOP.
- Output: `Output position unclear — please specify the target section or provide a template.`
- Do not write the content to an approximate location.
- Record the blockage in `.github/.ai_ledger.md` under Blockers.

---

## Enforcement

Agents that write to target-repo files carry an `<output_contract>` block in their instruction definition that references this file. Review agents check output-position compliance as part of the review step. A wrong-position write is classified as a formatting defect and triggers a repair iteration.

**Agents bound by this contract:**

- Implementation Specialist (and domain variants: Frontend, Backend)
- Docs Curator
- Design Planning Architect (for doc writes only; code writes are already gated by `<write_gate>`)

**Agents exempt from this contract:**

- Solar Bootstrap (writes only to `.github/` SOLAR config files, not target-repo artefacts)
- Bug Investigation Specialist (read-only; writes only reproduction scripts and ledger entries)
- Review Auditors (produce findings reports, not target-repo file content)
- Test Specialists (test files follow repo conventions loaded from `.instructions.md`, not this contract)

---

## Created

Phase 5 of SOLAR-Ralph v4 implementation (2026-04-06).

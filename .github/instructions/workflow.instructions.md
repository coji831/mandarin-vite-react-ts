---
applyTo: "[FILL IN — e.g., ** for global or apps/** for monorepo]"
---

# Workflow Context

## Documentation Update Governance (CRITICAL)

**RULE: Governor and implementation agents MUST NEVER directly edit BR or implementation documentation files.**

All documentation (BR, implementation, architecture, guides, knowledge base) updates MUST be delegated to **Docs Curator** for design review, file creation, and quality validation.

**Mandatory Three-Step Process:**

1. Design Architect designs doc structure (if changes needed)
2. Docs Curator reviews + approves design + writes files
3. Review auditor validates before commit (template compliance, cross-links, accuracy, status fields)

**Pre-Commit Validation Required:**

- Template compliance (all sections match templates)
- Cross-linking (BR ↔ Impl ↔ Epic links bidirectional)
- AC clarity (all items testable)
- Technical accuracy (no contradictions)
- Status/date field sync

**No exceptions. Do not commit documentation changes without validation by Docs Curator or auditor.**

---

- Primary workflow authority: .github/copilot-instructions.md
- Review checklist: [FILL IN — e.g., docs/guides/review-checklist.md]
- Structured prompt catalog: [FILL IN — e.g., docs/automation/structured-ai-prompts.md]
- Durable guidance belongs in docs/, not in instructions
- Active execution state belongs in .github/.ai_ledger.md
- Instructions store concise verified facts only
- Source-of-truth docs outrank instructions when they conflict

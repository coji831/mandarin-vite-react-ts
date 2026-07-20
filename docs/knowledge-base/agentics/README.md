# AI Agent Operations Guide

**Last Updated:** 2026-07-20

Central catalog for how AI coding agents operate in this project — the development pipeline, design workflows, tooling, and prompting patterns.

This section consolidates agent-operation knowledge that was previously scattered across verification artifacts, proposals, automation docs, and guide files. Each article below is a conceptual deep-dive into a specific aspect of agent operations.

---

## Articles

| Article                                                       | Description                                                                  | Source Material                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Agent Development Pipeline](./agent-development-pipeline.md) | Full lifecycle: Context → Review → Plan → Implement → Verify → Test → Gates  | `copilot-instructions.md`, `docs/guides/operations/workflow.md`                          |
| [Agent Visual Understanding](./agent-visual-understanding.md) | How agents handle visual design: Storybook-first, token integrity, MCP tools | `docs/guides/design/visual-design-workflow.md`, `docs/guides/design/design-reasoning.md` |
| [Structured AI Prompts](./structured-prompts.md)              | `[TASK][CONTEXT][PARAMETERS][OUTPUT][CONSTRAINTS]` template and examples     | `docs/automation/structured-ai-prompts.md`                                               |

## Related Resources

These existing guides are **actionable references** (not deep-dives) that agents should read during implementation:

| Resource                                                               | Type         | Purpose                                        |
| ---------------------------------------------------------------------- | ------------ | ---------------------------------------------- |
| `docs/guides/design/visual-design-workflow.md`                         | Action guide | Step-by-step Storybook-first design workflow   |
| `docs/guides/design/design-reasoning.md`                               | Action guide | Design philosophy ("Warm Minimalism")          |
| `docs/guides/operations/workflow.md`                                   | Action guide | Human-friendly epic/story workflow checklist   |
| `docs/guides/operations/review.md`                                     | Action guide | Code review checklist                          |
| `docs/guides/references/review-checklist.md`                           | Action guide | Review checklist                               |
| `.github/copilot-instructions.md`                                      | Instructions | Agent operational playbook (TL;DR, rules, etc) |
| `.github/instructions/project-workflow.instructions.md`                | Instructions | Story-level development workflow               |
| `.github/instructions/frontend-visual-design-protocol.instructions.md` | Instructions | Visual design protocol                         |
| `.github/instructions/frontend-pre-delivery-checklist.instructions.md` | Instructions | Pre-delivery UI checklist                      |

## Tooling Reference

| Tool                          | Purpose                                     | Configuration                          |
| ----------------------------- | ------------------------------------------- | -------------------------------------- |
| Storybook MCP                 | Component discovery, documentation lookup   | MCP settings                           |
| Playwright MCP                | Browser automation, screenshot verification | MCP settings                           |
| Chrome DevTools MCP           | Page inspection, performance auditing       | MCP settings                           |
| Codegraph MCP                 | Code intelligence, symbol graph exploration | MCP settings                           |
| `@google/design.md` lint tool | Token compliance linting                    | `npx @google/design.md lint DESIGN.md` |

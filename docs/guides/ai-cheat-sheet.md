# AI Workflow Cheat Sheet

## Common Prompts

- "Create epic using large/small epic template."
- "Update story doc using story template."
- "Check cross-links between business requirements and implementation."
- "Review code for linting, formatting, and test coverage."
- "Update status fields in BOTH business requirements and implementation docs for epic and story. Verify both sections are present, up to date, and correctly formatted."

## Compound Commands

- `update/story-X-Y/implementation-all --doc "docs/issue-implementation/epic-X-name/story-X-Y-name.md" --guideline "docs/issue-implementation/issue-implementation-format.md"`
- `create/commit/message --type "feat|fix|docs|style|refactor|test|chore" --scope "story-X-Y" --guideline "docs/guides/workflow.md"`

## Automation Tips

- Use scripts to check template compliance and cross-linking
- Reference guides and templates in all AI prompts
- Regularly update guides and cheat sheets as workflow evolves

## Resources

- [AI File Operations Guide](./ai-file-operations.md)
- [Workflow Checklist](./workflow.md)
- [Review Checklist](./review-checklist.md)

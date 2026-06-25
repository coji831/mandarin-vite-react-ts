---
name: add-instruction
description: "Extract a lesson from recent agent struggles and create a .instructions.md file to prevent recurrence. Use when: agent made a mistake, discovered a new convention, found a recurring issue pattern."
user-invocable: true
---

# Add Instruction Skill

## When to Use

- An agent made a mistake that should be prevented in the future
- You discovered a new convention or pattern during implementation
- A recurring issue keeps happening across stories/epics
- You want to codify a lesson learned into project-wide agent guidance

## Procedure

1. **Identify the struggle**: What mistake happened? What was the root cause?
2. **Define the file scope**: What glob pattern matches files where this rule applies? (e.g., `**/*.ts`, `**/schema.prisma`)
3. **Create the file**: Create `.github/instructions/<name>.instructions.md` with:
   - YAML frontmatter: `description` (with "Use when..." trigger words) and `applyTo` (glob pattern)
   - Body: clear DO/DON'T examples, concrete code snippets, reasoning
4. **Update copilot-instructions.md**: Add a 1-2 line summary to the "Known Pitfalls" section

## Template

````markdown
---
description: "Use when {trigger scenarios}. Covers {what this instruction prevents}."
applyTo: "{glob pattern matching affected files}"
---

# {Title}

## Rule

{One sentence rule}

## ✅ DO

```typescript
{good example with explanation}
```
````

## ❌ DON'T

```typescript
{bad example with explanation}
```

## Reasoning

{Why this rule exists — helps agents make better decisions in edge cases}

```

## Reference
See standard instruction templates and examples in `.github/instructions/` folder.
```

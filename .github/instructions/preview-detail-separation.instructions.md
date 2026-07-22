---
description: "Use when designing card/preview surfaces that link to detail views (modals, panels, expandable sections). Covers preview-vs-reward separation, information hierarchy, and avoiding content duplication."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Preview vs Detail Separation

## The Core Principle

**A card is a teaser. A detail panel is a reward.** The learner clicks the card because the card promises value. The detail panel delivers value that the card did NOT already show.

## How To Apply (Numbered Steps)

1. **Identify the preview surface** — Find the card or list item. What is its purpose? (e.g., a radical card in a grid)
2. **List all elements currently on the card** — Write them down. (Glyph, pinyin, meaning, strokes, badge, variant forms, etymology snippet, etc.)
3. **Classify each element** — Using the table below, mark each as "preview" or "reward":

| Preview (stays on card) | Reward (move to detail panel)        |
| ----------------------- | ------------------------------------ |
| Glyph (hero)            | Etymology (story)                    |
| Pinyin (how to say it)  | Variant forms (new discovery)        |
| Meaning (what it means) | Full character list (the main event) |
| Strokes (metadata)      | Notes (extra context)                |
| ★ badge (priority)      | Similar radicals (comparison)        |

4. **Remove reward elements from the card** — Duplicating detail-panel content on the card makes the detail panel feel redundant. If the card shows etymology, the learner has no reason to click.
5. **Verify the reward loop** — After clicking through, does the learner find NEW content they haven't seen? If they think "I already saw this on the card," the card has too much.

## ❌ Anti-Patterns

- **Variant forms on card**: Belong in the detail panel. Discovery of "oh, 扌 is also 手!" is the reward for clicking.
- **Character preview strip on card**: Small characters look clickable but aren't (WAGC violation). Belongs in detail panel.
- **Etymology on card**: Too much text. Deep-read element belongs in detail panel.
- **Duplicating any detail-panel section on the card**: Makes the detail panel feel redundant — the card becomes a mini-detail-panel.

## ✅ Best Practices

1. **One priority indicator per card** — A ★ badge is enough. Don't add colored border + elevated shadow + wider column. One signal, not three.
2. **Every card element must help scanning** — Glyph → "Is this the shape?", Meaning → "What is this?", ★ → "Important?", Strokes → "How complex?"
3. **Design for current architecture, not future-state** — Don't pre-implement a richer card design that belongs to a future redesign.
4. **WAGC + density + clarity** before adding anything to a card.

---

**See also:** `ui-composition.instructions.md` • `frontend-visual-design-protocol.instructions.md` • `frontend-pre-delivery-checklist.instructions.md`

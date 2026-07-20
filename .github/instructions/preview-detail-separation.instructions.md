---
description: "Use when designing card/preview surfaces that link to detail views (modals, panels, expandable sections). Covers preview-vs-reward separation, information hierarchy, and avoiding content duplication."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Preview vs Detail Separation

## The Core Principle

**A card is a teaser. A detail panel is a reward.** The learner clicks the card because the card promises value. The detail panel delivers value that the card did NOT already show.

## The Reward Loop

```
Card (preview)         →     Learner clicks     →     Detail panel (reward)
Glyph, meaning,        │                          │    New content they
basic metadata         │                          │    haven't seen yet
```

If the card already shows what's inside, there's no reason to click. If the card shows too little, there's no reason to click either. The balance is:

| Card shows              | Detail panel shows                   |
| ----------------------- | ------------------------------------ |
| Glyph (hero)            | Etymology (story)                    |
| Pinyin (how to say it)  | Variant forms (new discovery)        |
| Meaning (what it means) | Full character list (the main event) |
| Strokes (metadata)      | Notes (extra context)                |
| ★ badge (priority)      | Similar radicals (comparison)        |

## ❌ Anti-Patterns

- **Variant forms on card**: Variants belong in the detail panel. Showing them on the card steals the modal's content and adds visual density. A learner discovers "oh, 扌 is also 手!" when they click through — that's the reward.

- **Character preview strip on card**: Small character examples look clickable but aren't (WAGC violation). If they ARE clickable, they compete with the card's own CTA. Character examples belong in the detail panel.

- **Etymology on card**: Too much text for a card. Etymology is a deep-read element for the detail panel.

- **Duplicating any detail-panel section on the card**: If the detail panel has "Also written as" and the card also shows variants, the learner sees the same info twice. The card becomes a mini-detail-panel and the actual detail panel feels redundant.

## ✅ Best Practices

1. **One priority indicator per card** — If you use a ★ badge, don't also add a colored border, elevated shadow, and wider column. One signal is enough. Stacking them creates visual noise.

2. **Every card element must help scanning** — The learner scans 10+ cards in seconds. Each element must answer one question:
   - Glyph → "Is this the shape I'm looking for?"
   - Meaning → "Do I understand what this is?"
   - ★ → "Is this important to learn first?"
   - Strokes → "How complex is it?"

   If an element doesn't answer a scanning question, remove it.

3. **Design for the current architecture, not the future-state proposal** — A design proposal may show a richer card as part of a complete system redesign (e.g., inline Atlas replacing modal). Applying those card changes incrementally — without the rest of the redesign — creates duplication. The enriched card steals the detail panel's job.

4. **Think WAGC + density + clarity before adding any element to a card**:
   - **WAGC** (What Am I Gonna Click): Does this look interactive? If yes, it should BE interactive. If no, it shouldn't look interactive.
   - **Density**: Can the learner parse this card in under 2 seconds? If not, it's too dense.
   - **Clarity**: Is it obvious what this element means? If you need a legend or tooltip, reconsider.

5. **A card that makes the detail panel feel redundant is a bug** — After clicking through to the detail panel, the learner should find NEW content. If they think "I already saw this on the card," the card has too much.

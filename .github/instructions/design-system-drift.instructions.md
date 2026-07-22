---
description: "Use when editing shared components, DESIGN.md, or component-registry.json. Covers keeping DESIGN.md and component-registry.json in sync with actual component code."
applyTo: "DESIGN.md,.github/component-registry.json,apps/frontend/src/shared/components/**/*.tsx"
---

# Design System Drift Prevention

## Rule

Any change to a shared component's public API (props, variants, file path) or the design token set must be reflected in both `DESIGN.md` and `.github/component-registry.json` **in the same commit**.

## Component Registry (`component-registry.json`)

### When to update

Update `.github/component-registry.json` when ANY of these change:

- **New component added** to `shared/components/index.tsx` — add a new entry with `importPath: "shared/components"`, description, and all public props
- **New prop added** to an existing component — add the prop with its type and description
- **Prop renamed or removed** — update or remove the prop entry
- **Variant values changed** — update the `values` array for the `variant` prop
- **Component removed** — remove the entry

### Entry format

```json
"ComponentName": {
  "description": "One-sentence purpose. What problem does this solve?",
  "importPath": "shared/components",
  "props": {
    "propName": { "type": "typeString", "required": true, "description": "Optional detail" },
    "optionalProp": { "type": "enum", "values": ["a", "b"], "default": "a" }
  }
}
```

Always verify the entry matches the actual TypeScript type definition — do not guess.

## DESIGN.md

### When to update

Update the `components:` list in `DESIGN.md` when ANY of these change:

- **New shared component** added — add a `- name`, `file`, `description` entry
- **Component behavior changed** (new variants, new key props) — update the description
- **Component file path changed** — update the `file` field
- **Component removed** — remove the entry

### Token section

Update the `tokens:` section when ANY of these change in `apps/frontend/src/styles/globals.css`:

- New CSS custom property added to `:root`
- Existing token removed or renamed
- Token value changed (color, spacing, radius, etc.)

The token values in `DESIGN.md` must match the `var(--*)` values in `globals.css` exactly.

## ✅ DO

```typescript
// 1. You add a new prop to Button
export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: number; // ← new
  height?: number; // ← new
  // ...
};

// 2. Same commit: update component-registry.json
//    "width": { "type": "number", "description": "Override variant's default width (px)" },
//    "height": { "type": "number", "description": "Override variant's default height (px)" },

// 3. Same commit: update DESIGN.md component entry if description changed
```

## ❌ DON'T

```typescript
// ❌ BAD — Add prop to Button but forget to update registry
//    Next developer reads registry, doesn't know width/height exist,
//    adds CSS overrides instead of using the props.
```

## Verification

Before closing any PR that touches shared components, run:

```
# Check DESIGN.md component count matches index.tsx exports
grep -c '^  - name:' DESIGN.md
grep -c '^export {' apps/frontend/src/shared/components/index.tsx
```

Or manually verify the `components:` list in DESIGN.md matches the exports in `shared/components/index.tsx`.

---

**See also:** `frontend-visual-design-protocol.instructions.md` (design pipeline) • `ui-composition.instructions.md` (component composition) • `frontend-pre-delivery-checklist.instructions.md` (registry update check)

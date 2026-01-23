# Components API Specification

## ToggleSwitch

- **Props:**
  - `label: string` — Label for the toggle
  - `checked: boolean` — Current state
  - `onChange: (checked: boolean) => void` — Change handler
- **Usage:**

```tsx
<ToggleSwitch
  label="Enable feature"
  checked={isEnabled}
  onChange={setEnabled}
/>
```

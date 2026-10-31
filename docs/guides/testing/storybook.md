---
purpose: "How to run, view, mock and verify a Storybook story for a shared component"
status: active
last-verified: 2026-10-31
audience: agent
type: guide
---

# Storybook: run, view, verify

The rule is in `.github/instructions/storybook-production-alignment.instructions.md` (stories are
component contracts, nothing else). This file is the mechanics.

## Storybook Quick Commands

Use these commands when working with Storybook:

| Command                                                  | Purpose                                                                                    | Port |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| `npm run storybook --workspace=@mandarin/frontend`       | Start Storybook dev server                                                                 | 6006 |
| `npm run build-storybook --workspace=@mandarin/frontend` | Build static Storybook output                                                              | —    |
| `npm run test-storybook --workspace=@mandarin/frontend`  | Run story tests: vitest run --project storybook (via @storybook/addon-vitest), no coverage | —    |

**cwd note:** `storybook` / `test-storybook` / `build-storybook` live in the `@mandarin/frontend` workspace only. The table shows the canonical repo-root command forms with `--workspace=@mandarin/frontend` (as `storybook-checks.yml` does). Running bare `npm run storybook` at the root fails.

**Do not start Storybook with `npm --prefix apps/frontend run storybook`.** `--prefix` resolves the package but leaves the shell's working directory in place, and `@storybook/builder-vite` generates the iframe import map with `path.relative(process.cwd(), importPath)` — so the map keys come out absolute and **every** story dies with `TypeError: importers[path] is not a function`, even though the build "succeeds". `.storybook/main.ts` now fails fast with an actionable message when `process.cwd()` is not the workspace root (Vitest story runs are exempt — `@storybook/addon-vitest` uses its own resolution). Use `--workspace=@mandarin/frontend`, or run `npm run storybook` from `apps/frontend`.

### How to View Stories in the Browser

After running `npm run storybook --workspace=@mandarin/frontend`, Storybook opens at `http://localhost:6006`. Use the `open_browser_page` tool to open this URL, then navigate to the story via the sidebar.

Story URLs follow this pattern:

```
http://localhost:6006/?path=/story/pages-dashboard--loading
http://localhost:6006/?path=/story/pages-learn-foundations--pinyin
```

Format: `/?path=/story/<lowercased-title-with-hyphens>--<story-export-name-lowercased>`

### Available Decorators

All defined in `.storybook/decorators/`:

- `withAppLayout(path)` — wraps story in full AppLayout with sidebar
- `withLearnLayout` — wraps story in LearnLayout with pill tabs
- `withGuestAuth` — overrides auth context to unauthenticated mode

### How to Verify a Story

1. Run `npm run storybook --workspace=@mandarin/frontend` (keep running in background)
2. Open `http://localhost:6006` in the browser
3. Navigate to the story via the sidebar or direct URL
4. Verify all visual states render correctly (default, loading, error, empty)
5. For page stories, verify the full layout chain is applied via decorators

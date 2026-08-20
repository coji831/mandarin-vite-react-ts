---
purpose: Design spec for strategy-pattern SRS review sessions — flip-card practice across content types
status: active
last-verified: 2026-07-20
type: design
---

# Feature: Review — Design Spec

**Last Updated:** 2026-07-20
**Status:** Reviewed

---

## Figma Reference

- **File:** (not yet linked — add Figma file URL here)
- **Frame:** Review Session

---

## Layout

The review feature has two views controlled by URL params:

| URL                                 | View           | Purpose                 |
| ----------------------------------- | -------------- | ----------------------- |
| `/practices/review`                 | `ReviewPicker` | Source + type selection |
| `/practices/review?type=T&filter=F` | `ReviewView`   | Active review session   |

---

## Architecture (Strategy Pattern)

Review uses a **Strategy Pattern** similar to quiz:

- `ReviewStrategy` interface defines steps per content type
- Strategies: `pinyin`, `character` (multiple review modes per type)
- Step flow: `pinyin` → `tone` / `option` → `result`

---

## Components

| Component                | Source                           | Notes                                        |
| ------------------------ | -------------------------------- | -------------------------------------------- |
| `ReviewPage`             | `pages/practices/ReviewPage.tsx` | URL-driven router between picker and session |
| `ReviewPicker`           | Custom in `components/`          | Content type + source filter selection       |
| `ReviewView`             | Custom in `components/`          | Session orchestrator                         |
| `ReviewCard`             | Custom in `components/`          | Step-based card container (React.memo)       |
| `ReviewCardPinyinInput`  | Custom in `components/`          | Pinyin input step                            |
| `ReviewCardToneSelect`   | Custom in `components/`          | Tone selection step                          |
| `ReviewCardOptionSelect` | Custom in `components/`          | Multiple choice option step                  |
| `ReviewCardResult`       | Custom in `components/`          | Result step with ✅/❌ + A/G/E rating        |
| `ReviewComplete`         | Custom in `components/`          | Session complete summary                     |
| `ReviewLaunchCard`       | Custom in `components/`          | Launch card in picker                        |     | `ReviewPromptCard` | Custom in `components/` | Launch/prompt card for review start |

### Step Flow

```
ReviewCard
├── step="pinyin"     → ReviewCardPinyinInput (show character + audio + pinyin input)
├── step="tone"       → ReviewCardToneSelect (show character + tone buttons)
├── step="option"     → ReviewCardOptionSelect (show character + multiple choice)
└── step="result"     → ReviewCardResult (show correct answer + rating buttons)
```

### States

| State                | Handling                                    |
| -------------------- | ------------------------------------------- |
| **Loading initial**  | Checking available review sources           |
| **Picker default**   | Type selector + source filter options       |
| **Picker empty**     | No items available for selected type/source |
| **Session active**   | Step-based card flow                        |
| **Session complete** | ReviewComplete summary                      |
| **Error**            | Error message with retry                    |

---

## Shared Components Reused

| Component | Source                     |
| --------- | -------------------------- |
| `Button`  | `shared/components/Button` |

---

## Design Tokens Used

### Colors

| Token   | CSS Variable       | Usage                      |
| ------- | ------------------ | -------------------------- |
| Success | `--color-success`  | Correct answer ✅          |
| Error   | `--color-error`    | Wrong answer ❌            |
| Primary | `--color-primary`  | Interactive elements       |
| —       | `--text-primary`   | Character glyph, headings  |
| —       | `--text-secondary` | Instructions, meaning text |
| —       | `--text-muted`     | Hint text                  |
| —       | `--surface-dark`   | Card background            |

### Typography

| Element         | Class       | Size |
| --------------- | ----------- | ---- |
| Character glyph | `.font-4xl` | 36px |
| Pinyin          | `.font-lg`  | 16px |
| Meaning         | `.font-md`  | 14px |
| Rating buttons  | `.font-sm`  | 12px |

### Layout Classes

| Class                             | Usage                                  |
| --------------------------------- | -------------------------------------- |
| `.review-card`                    | Review card container (defined in CSS) |
| `.flex-col-center`                | Centered column                        |
| `.gap-sm` / `.gap-md` / `.gap-lg` | Flex gaps                              |
| `.p-md` / `.p-lg` / `.p-xl`       | Padding                                |

### Step-specific CSS

| File                        | Purpose            |
| --------------------------- | ------------------ |
| `ReviewCard.css`            | Review card layout |
| `ReviewCardPinyinInput.css` | Pinyin input step  |
| `ReviewCardToneSelect.css`  | Tone select step   |
| `ReviewCardResult.css`      | Result step layout |
| `ReviewComplete.css`        | Completion summary |

---

## Visual Acceptance Criteria

- [ ] Picker shows available content types with item counts
- [ ] Source filter shows Due / Recent / All with counts
- [ ] Card shows character glyph prominently with pinyin + meaning
- [ ] Pinyin step shows input field + submit + audio button
- [ ] Tone step shows 1–5 tone buttons
- [ ] Option step shows multiple choice options
- [ ] Result step shows ✅/❌ + correct answer + A/G/E rating
- [ ] Session complete shows summary stats
- [ ] All colors reference CSS variables
- [ ] WCAG AA contrast ratios
- [ ] ARIA labels on all interactive elements (audio, tone buttons, rating)
- [ ] Keyboard navigable (Tab, number keys for tones/ratings)
- [ ] Verified via Playwright browser screenshot

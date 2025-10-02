# Story 5.1: Card-Based Layout Implementation

## Description

**As a** language learner,
**I want to** see vocabulary lists in a compact card format,
**So that** I can browse more options without excessive scrolling.

## Business Value

Improves discoverability and usability of vocabulary lists, allowing users to efficiently browse and select lists. Increases engagement by reducing friction and making the interface more visually appealing and accessible.

Replace the current verbose vocabulary list display with a compact, card-based layout. Key points:

- Create a grid-based layout for vocabulary lists
- Implement VocabularyCard component with consistent styling
- Remove sample words display from main list view
- Add basic hover and focus states for interactivity
- Ensure responsive behavior across device sizes

**Status:** Completed

## Implementation Status

Status: Completed

## Acceptance Criteria

- [x] Vocabulary lists are displayed in a card-based grid layout
- [x] Cards have consistent sizing and styling
- [x] Sample words are no longer displayed in the main list view
- [x] Cards have hover and focus states for better interaction
- [x] Layout is responsive and adapts to different screen sizes
- [x] Cards display list name and description clearly
- [x] Select button is prominently placed on each card
- [x] Grid layout allows for optimal use of screen space

## Implementation Details

### Component Changes

1. Create a new `VocabularyCard.tsx` component:

```tsx
// src/features/mandarin/components/VocabularyCard.tsx
import React from "react";
import "./VocabularyCard.module.css";
import type { VocabularyList } from "../types";

interface VocabularyCardProps {
  list: VocabularyList;
  onSelect: (list: VocabularyList) => void;
}

export function VocabularyCard({ list, onSelect }: VocabularyCardProps) {
  return (
    <div className="vocabulary-card">
      <div className="card-header">
        <h3>{list.name}</h3>
      </div>
      <p className="description">{list.description}</p>
      <div className="card-footer">
        <button className="select-button" type="button" onClick={() => onSelect(list)}>
          Select
        </button>
      </div>
    </div>
  );
}
```

2. Update `VocabularyListPage.tsx` to use the card component:

```tsx
// src/features/mandarin/pages/VocabularyListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMandarinContext } from "../context/useMandarinContext";
import { VocabularyCard } from "../components/VocabularyCard";
import type { VocabularyList, Word } from "../types";
import { loadCsvVocab, VocabWord } from "../../../utils/csvLoader";
import "./VocabularyListPage.module.css";

export function VocabularyListPage() {
  const { selectVocabularyList } = useMandarinContext();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const navigate = useNavigate();

  // Fetch lists (unchanged)
  useEffect(() => {
    // existing fetch logic
  }, []);

  // Handle select (updated to not use samples)
  const handleSelect = async (list: VocabularyList) => {
    try {
      const words: VocabWord[] = await loadCsvVocab(`/data/vocabulary/${list.file}`);
      // Convert VocabWord to Word type for selectVocabularyList
      const converted: Word[] = words.map((w, idx) => ({
        wordId: w.No || String(idx + 1),
        character: w.Chinese,
        pinyin: w.Pinyin,
        meaning: w.English,
      }));

      selectVocabularyList(list.name, converted);
      navigate("/mandarin/daily-commitment");
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <div className="vocabulary-page">
      <h2>Select a Vocabulary List</h2>
      <div className="vocabulary-grid">
        {lists.map((list) => (
          <VocabularyCard key={list.name} list={list} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
```

3. Create CSS modules for styling:

```css
/* src/features/mandarin/components/VocabularyCard.module.css */
.vocabulary-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.2s ease;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.vocabulary-card:hover,
.vocabulary-card:focus-within {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: 0.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.description {
  flex-grow: 1;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #555;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.select-button {
  background-color: #4a80f0;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.select-button:hover,
.select-button:focus {
  background-color: #3a70e0;
}
```

```css
/* src/features/mandarin/pages/VocabularyListPage.module.css */
.vocabulary-page {
  padding: 1rem;
}

.vocabulary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 600px) {
  .vocabulary-grid {
    grid-template-columns: 1fr;
  }
}
```

### Testing Strategy

1. **Unit Tests**:

   - Test VocabularyCard renders with correct props
   - Verify onSelect callback is called when button is clicked
   - Test responsive behavior simulation

2. **Manual Tests**:
   - Verify grid layout on various screen sizes
   - Test keyboard navigation between cards
   - Verify visual appearance and hover states
   - Check that focus states are clearly visible

### Accessibility Considerations

- Ensure keyboard navigation works properly
- Verify contrast ratios meet WCAG standards
- Add appropriate aria attributes for screen readers

## Related Issues

- Parent Epic: [Epic 5: Vocabulary List UI Enhancement](../README.md)
- Depends on: None
- Required for: [Story 5.2: Metadata Integration and Display](./story-5-2-metadata-integration-display.md)

## Notes

- This story focuses only on the layout change and does not include the metadata integration (which is covered in Story 5.2)
- Sample word fetching code can be temporarily maintained but unused, as it will be needed for hover previews in a future story

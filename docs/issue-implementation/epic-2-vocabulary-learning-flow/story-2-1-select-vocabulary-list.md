# Implementation 2-1: Vocabulary List Selection Component

Part of [Epic 2: Vocabulary Learning Flow](./README.md)

## Technical Scope 🔵

Implementation of the vocabulary list selection component that:

- Loads and displays available vocabulary lists from JSON data
- Handles list selection with visual feedback
- Exposes selection state to parent components
- Supports dynamic loading of different vocabulary sets

## Implementation Details 🔵

```typescript
// Key component implementation pattern
interface VocabularyListSelectorProps {
  onSelect: (listId: string, listData: VocabularyList) => void;
  selectedListId: string | null;
}

const VocabularyListSelector: React.FC<VocabularyListSelectorProps> = ({
  onSelect,
  selectedListId,
}) => {
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Data fetching pattern
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch("/data/vocabularyLists.json");
        const data = await response.json();
        setLists(data);
      } catch (error) {
        console.error("Failed to load vocabulary lists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, []);

  // List rendering with selection state
  return (
    <div className="vocabulary-list-selector">
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <ul>
          {lists.map((list) => (
            <li
              key={list.id}
              className={list.id === selectedListId ? "selected" : ""}
              onClick={() => onSelect(list.id, list)}
            >
              <h3>{list.name}</h3>
              <p>{list.words.length} words</p>
              <p className="preview">
                {list.words
                  .slice(0, 3)
                  .map((w) => w.chinese)
                  .join(", ")}
                ...
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## Data Structure 🔵

```typescript
// Core data structure for vocabulary lists
interface VocabularyList {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  words: Array<{
    id: string;
    chinese: string;
    pinyin: string;
    english: string;
    examples?: Array<{
      chinese: string;
      pinyin: string;
      english: string;
    }>;
  }>;
}

// Parent component state management
const [selectedList, setSelectedList] = useState<VocabularyList | null>(null);
const [selectedListId, setSelectedListId] = useState<string | null>(null);

const handleListSelect = useCallback(
  (listId: string, listData: VocabularyList) => {
    setSelectedListId(listId);
    setSelectedList(listData);
  },
  [],
);
```

## Architecture Integration 🔵

```
[MandarinPage] ──(holds state)──► [VocabularyListSelector]
       │                                     │
       │                                     │
       ▼                                     ▼
[DailyCommitment] ◄───(receives selected list data)
```

- The component is the first step in the learning flow
- Parent component (MandarinPage) manages selection state
- Selected list data is passed to subsequent steps in the flow
- No direct connection to localStorage at this stage

## Technical Challenges & Solutions 🔵

### Challenge: Dynamic List Loading Performance

**Problem**: Loading all vocabulary lists at once caused initial render delays, especially for large lists

**Solution**: Implemented a two-step loading process:

```typescript
// First load just list metadata
const loadListMetadata = async () => {
  const response = await fetch("/data/vocabularyListsMetadata.json");
  const metadata = await response.json();
  setLists(metadata);
  setIsLoading(false);
};

// Then load full data only when selected
const loadFullListData = async (listId) => {
  setIsLoading(true);
  const response = await fetch(`/data/lists/${listId}.json`);
  const fullData = await response.json();
  onSelect(listId, fullData);
  setIsLoading(false);
};
```

### Challenge: List Selection State Management

**Problem**: Needed to maintain selection state while navigating through the multi-step flow

**Solution**: Lifted state to parent component and used URL parameters

```typescript
// Added URL state management
const location = useLocation();
const navigate = useNavigate();
const params = new URLSearchParams(location.search);

// Initialize from URL if present
useEffect(() => {
  const listIdFromUrl = params.get("listId");
  if (listIdFromUrl && lists.some((list) => list.id === listIdFromUrl)) {
    const list = lists.find((list) => list.id === listIdFromUrl);
    setSelectedListId(listIdFromUrl);
    setSelectedList(list);
  }
}, [params, lists]);

// Update URL when selection changes
useEffect(() => {
  if (selectedListId) {
    params.set("listId", selectedListId);
    navigate({ search: params.toString() }, { replace: true });
  }
}, [selectedListId, navigate, params]);
```

## Testing Implementation 🟡

```typescript
// Key test file: src/__tests__/features/mandarin/VocabularyListSelector.test.tsx

// Test mocked list data
const mockLists = [
  { id: "hsk1", name: "HSK 1", words: [] },
  { id: "hsk2", name: "HSK 2", words: [] },
];

// Mock fetch to return test data
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockLists),
  }),
) as jest.Mock;

// Test component rendering and selection
test("renders vocabulary lists and handles selection", async () => {
  const handleSelect = jest.fn();
  render(
    <VocabularyListSelector onSelect={handleSelect} selectedListId={null} />,
  );

  // Wait for lists to load
  await waitFor(() => {
    expect(screen.getByText("HSK 1")).toBeInTheDocument();
  });

  // Test selection
  fireEvent.click(screen.getByText("HSK 1"));
  expect(handleSelect).toHaveBeenCalledWith("hsk1", mockLists[0]);
});
```

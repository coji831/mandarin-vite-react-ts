import { ReviewHistory } from "./ReviewHistory";


type ReviewFlowProps = {
  loading: boolean;
  error: string;
  learnedWordIds: string[];
  selectedWords: { wordId: string; character?: string; pinyin?: string; meaning?: string; sentence?: string; sentencePinyin?: string; sentenceMeaning?: string }[];
  selectedList: string | null;
  setCurrentPage: (page: string) => void;
  setDailyWordCount: (n: number | null) => void;
  setLearnedWordIds: (ids: string[]) => void;
  setHistory: (h: Record<string, string[]>) => void;
  setInputValue: (v: string) => void;
  setReviewIndex: (n: number) => void;
  reviewIndex: number;
  handleMarkLearned: (wordId: string) => void;
  todaysWords: { wordId: string; character?: string; pinyin?: string; meaning?: string; sentence?: string; sentencePinyin?: string; sentenceMeaning?: string }[];
  currentReviewWord: { wordId: string; character?: string; pinyin?: string; meaning?: string; sentence?: string; sentencePinyin?: string; sentenceMeaning?: string } | null;
  history: Record<string, string[]>;
  onBack?: () => void;
};

function ReviewFlow(props: ReviewFlowProps) {
  const {
    loading,
    error,
    learnedWordIds,
    selectedWords,
    selectedList,
    setCurrentPage,
    setDailyWordCount,
    setLearnedWordIds,
    setHistory,
    setInputValue,
    setReviewIndex,
    reviewIndex,
    handleMarkLearned,
    todaysWords,
    currentReviewWord,
    history,
    onBack,
  } = props;
  console.log( todaysWords, currentReviewWord);
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h2>Today's Words to Learn</h2>
      <p>
        Progress: {learnedWordIds.length} / {selectedWords.length} words learned
      </p>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{ marginBottom: "1em", marginRight: "1em" }}
          disabled={loading}
        >
          Back to Section Select
        </button>
      )}
      <button
        type="button"
        onClick={() => setCurrentPage("vocablist")}
        style={{ marginBottom: "1em" }}
        disabled={loading}
      >
        Switch Vocabulary List
      </button>
      <button
        type="button"
        onClick={() => {
          if (selectedList) {
            localStorage.setItem(
              `tracking_${selectedList}`,
              JSON.stringify({
                listName: selectedList,
                sections: [],
                dailyWordCount: null,
                learnedWordIds: [],
                history: {},
              }),
            );
            setDailyWordCount(null);
            setLearnedWordIds([]);
            setHistory({});
            setInputValue("");
            setReviewIndex(0);
            setCurrentPage("dailycommitment");
          }
        }}
        style={{ marginBottom: "1em" }}
        disabled={loading}
      >
        Reset Daily Commitment & Progress
      </button>
      {todaysWords.length === 0 ? (
        learnedWordIds.length === selectedWords.length ? (
          <p>All words in this section learned! 🎉</p>
        ) : (
          <p>All today's words learned! 🎉</p>
        )
      ) : currentReviewWord ? (
        <div>
          <ul>
            <li key={currentReviewWord.wordId}>
              {currentReviewWord.character && (
                <span>
                  <strong>Character:</strong> {currentReviewWord.character}
                  <br />
                </span>
              )}
              {currentReviewWord.pinyin && (
                <span>
                  <strong>Pinyin:</strong> {currentReviewWord.pinyin}
                  <br />
                </span>
              )}
              {currentReviewWord.meaning && (
                <span>
                  <strong>Meaning:</strong> {currentReviewWord.meaning}
                  <br />
                </span>
              )}
              {currentReviewWord.sentence && (
                <span>
                  <em>{currentReviewWord.sentence}</em>
                  <br />
                </span>
              )}
              {currentReviewWord.sentencePinyin && (
                <span>
                  ({currentReviewWord.sentencePinyin})
                  <br />
                </span>
              )}
              {currentReviewWord.sentenceMeaning && (
                <span>
                  {currentReviewWord.sentenceMeaning}
                  <br />
                </span>
              )}
            </li>
          </ul>
          <button
            type="button"
            onClick={() => {
              handleMarkLearned(currentReviewWord.wordId); 
            }}
            disabled={loading}
          >
            Mark as Learned
          </button>
          <button
            type="button"
            onClick={() => setReviewIndex(Math.max(reviewIndex - 1, 0))}
            disabled={reviewIndex === 0 || loading}
            style={{ marginLeft: "1em" }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setReviewIndex(Math.min(reviewIndex + 1, todaysWords.length - 1))
            }
            disabled={reviewIndex >= todaysWords.length - 1 || loading}
            style={{ marginLeft: "1em" }}
          >
            Next
          </button>
          {/* Show history as list of learned characters */}
          <div style={{ marginTop: 16 }}>
            <h4>History</h4>
            {Object.entries(history).map(([date, ids]) => (
              <div key={date}>
                <strong>{date}:</strong>
                <ul style={{ display: "inline", marginLeft: 8 }}>
                  {ids.map((id: string) => {
                    const word = selectedWords.find(
                      (w) => String(w.wordId) === id
                    );
                    return word ? (
                      <li
                        key={id}
                        style={{ display: "inline", marginRight: 8 }}
                      >
                        {word.character}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <ReviewHistory history={history} /> 
    </div>
  );
}

export { ReviewFlow };

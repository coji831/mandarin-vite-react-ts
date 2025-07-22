 import {ReviewHistory} from "./ReviewHistory";

type ReviewFlowProps = {
  loading: boolean;
  error: string;
  learnedWordIds: any[];
  selectedWords: any[];
  selectedList: string | null;
  setCurrentPage: any;
  setDailyWordCount: any;
  setLearnedWordIds: any;
  setHistory: any;
  setInputValue: any;
  setReviewIndex: any;
  reviewIndex: number;
  handleMarkLearned: any;
  todaysWords: any[];
  currentReviewWord: any;
  history: any;
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
  } = props;
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h2>Today's Words to Learn</h2>
      <p>
        Progress: {learnedWordIds.length} / {selectedWords.length} words learned
      </p>
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
              })
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
        <p>All today's words learned! 🎉</p>
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
            onClick={() => handleMarkLearned(currentReviewWord.wordId)}
            disabled={loading}
          >
            Mark as Learned
          </button>
          <button
            type="button"
            onClick={() => setReviewIndex((prev: any) => Math.max(prev - 1, 0))}
            disabled={reviewIndex === 0 || loading}
            style={{ marginLeft: "1em" }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setReviewIndex((prev: any) => Math.min(prev + 1, todaysWords.length - 1))
            }
            disabled={reviewIndex >= todaysWords.length - 1 || loading}
            style={{ marginLeft: "1em" }}
          >
            Next
          </button>
        </div>
      ) : null}
      <ReviewHistory history={history} />
    </div>
  );
}

export { ReviewFlow };

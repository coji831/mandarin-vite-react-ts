/**
 * DailyCommitment component contract:
 *
 * - Allows user to set and save a daily word study goal for the selected list.
 * - Receives selectedList, selectedWords, inputValue, and handlers as props.
 * - Pure presentational; does not manage persistence or parent state.
 */
/**
 * DailyCommitment component contract:
 *
 * - Allows user to set and save a daily word study goal for the selected list.
 * - Receives selectedList, selectedWords, inputValue, and handlers as props.
 * - Pure presentational; does not manage persistence or parent state.
 */
type Props = {
  selectedList: string | null;
  selectedWords: any[];
  inputValue: string;
  setInputValue: any;
  dailyWordCount: number | null;
  handleCommitmentSave: any;
  loading: boolean;
  error: string;
};

export { DailyCommitment };

function DailyCommitment(props: Props) {
  const {
    selectedList,
    selectedWords,
    inputValue,
    setInputValue,
    dailyWordCount,
    handleCommitmentSave,
    loading,
    error,
  } = props;

  // Recommended range
  const recommendedMin = 5;
  const recommendedMax = 20;
  const maxAllowed = Math.min(50, selectedWords.length || 50);
  const wordCount = selectedWords.length || 0;
  const inputNum = Number(inputValue);
  const isInputValid =
    Number.isInteger(inputNum) && inputNum >= 1 && inputNum <= maxAllowed;
  const estimatedDays = inputNum > 0 ? Math.ceil(wordCount / inputNum) : 0;

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h2>Daily Word Commitment</h2>
      <p>Selected List: {selectedList}</p>
      <p>Words loaded: {wordCount}</p>
      <label htmlFor="dailyWordCount">
        How many words do you want to learn per day?
        <span style={{ marginLeft: 8, color: "#888" }}>
          (Recommended: {recommendedMin}–{recommendedMax} words/day)
        </span>
      </label>
      <input
        id="dailyWordCount"
        type="number"
        min={1}
        max={maxAllowed}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ margin: "0 1em" }}
        disabled={loading}
        placeholder={`1–${maxAllowed}`}
      />
      <button
        type="button"
        onClick={handleCommitmentSave}
        disabled={!isInputValid || loading}
        style={{ marginLeft: 8 }}
      >
        Confirm
      </button>
      <div style={{ marginTop: 8 }}>
        {inputNum > 0 && isInputValid && (
          <span>
            {wordCount} words at {inputNum} words/day = {estimatedDays} days
          </span>
        )}
        {!isInputValid && inputValue && (
          <span style={{ color: "red" }}>
            Please enter a number between 1 and {maxAllowed}
          </span>
        )}
      </div>
      {dailyWordCount && (
        <p style={{ marginTop: 8 }}>
          Daily goal set: {dailyWordCount} words/day
        </p>
      )}
    </div>
  );
}

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
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h2>Daily Word Commitment</h2>
      <p>Selected List: {selectedList}</p>
      <p>Words loaded: {selectedWords.length}</p>
      <label htmlFor="dailyWordCount">
        How many words do you want to learn per day?
      </label>
      <input
        id="dailyWordCount"
        type="number"
        min={1}
        max={selectedWords.length}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ margin: "0 1em" }}
        disabled={loading}
      />
      <button
        type="button"
        onClick={handleCommitmentSave}
        disabled={!inputValue || loading}
      >
        Save Commitment
      </button>
      {dailyWordCount && <p>Daily goal set: {dailyWordCount} words/day</p>}
    </div>
  );
}

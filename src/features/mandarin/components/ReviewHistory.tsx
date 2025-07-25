/**
 * ReviewHistory component
 *
 * - Receives a history object and displays a summary of review history.
 * - Pure presentational; does not manage persistence or parent state.
 * - Shows number of words learned per date.
 */
// ...existing code...
type ReviewHistoryProps = {
  history: any;
};

function ReviewHistory(props: ReviewHistoryProps) {
  const { history } = props;
  return (
    <div style={{ marginTop: "2em" }}>
      <h3>Review History</h3>
      <ul>
        {Object.entries(history).map(([date, ids]) => (
          <li key={date}>
            <strong>{date}:</strong> {(ids as any[]).length} words learned
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ReviewHistory };

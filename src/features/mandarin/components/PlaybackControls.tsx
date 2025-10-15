type PlaybackControlsProps = {
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string | null;
  className?: string;
};

function PlaybackControls({
  onPlay,
  onPause,
  isPlaying,
  isLoading,
  error,
  className = "",
}: PlaybackControlsProps) {
  return (
    <div className={`playback-controls ${className}`}>
      {error && (
        <div className="playback-controls__error">
          <p>Audio unavailable</p>
          <small>{error}</small>
        </div>
      )}
      <button
        className={`playback-controls__button ${isPlaying ? "playing" : ""}`}
        onClick={isPlaying ? onPause : onPlay}
        disabled={isLoading || !!error}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isLoading && <div className="spinner spinner--small" />}
        {!isLoading && (isPlaying ? "⏸️" : "▶️")}
        <span>{isPlaying ? "Pause" : "Play"}</span>
      </button>
      {isPlaying && (
        <div className="playback-controls__status">
          <div className="playback-indicator">
            <div className="playback-indicator__bar" />
          </div>
        </div>
      )}
    </div>
  );
}

export { PlaybackControls };

/**
 * PlayButton component
 *
 * - Receives a mandarinText string as prop.
 * - Handles TTS audio playback for the given text, including API call, caching, and error handling.
 * - Purely presentational except for internal audio state; does not persist data or manage parent state.
 */

import { useAudioPlayback } from "../hooks/useAudioPlayback";

export { PlayButton };

type Props = {
  mandarinText: string;
};

function PlayButton({ mandarinText }: Readonly<Props>) {
  const { playWordAudio, isLoading, error } = useAudioPlayback();

  const handlePlay = () => {
    if (!mandarinText.trim()) return;
    playWordAudio({ chinese: mandarinText });
  };

  return (
    <div>
      <button onClick={handlePlay} disabled={isLoading} aria-label="Play Mandarin audio">
        {isLoading ? "Generating..." : "Speak"}
      </button>
      {error && <p style={{ color: "red", fontSize: "0.9em", marginTop: "5px" }}>Error: {error}</p>}
    </div>
  );
}

import { useCallback, useRef, useState, useEffect } from "react";

export { PlayButton };

type Props = {
  mandarinText: string; // The Mandarin text to be converted to speech
};

function PlayButton({ mandarinText }: Props) {
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const audioRef = useRef<HTMLAudioElement | null>(null); // Reference to the HTML audio element

  // Effect to clear audioUrl and related state when mandarinText changes
  useEffect(() => {
    // Only clear if the text has actually changed from what generated the current audioUrl
    // We use a data attribute on the audio element to store the last text that generated audio.
    if (
      audioRef.current &&
      audioRef.current.dataset.lastText !== mandarinText
    ) {
      setAudioUrl(undefined);
      setError(undefined); // Clear any previous error for the old text
      // Revoke the object URL to free up memory if it's a blob URL
      if (audioRef.current?.src?.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = ""; // Clear the audio element's source
      delete audioRef.current.dataset.lastText; // Remove the stored text
    }
  }, [mandarinText]); // Depend only on mandarinText to trigger this effect

  // Function to handle speech synthesis and playback
  const synthesizeAndPlay = useCallback(async () => {
    // Input validation
    if (!mandarinText.trim()) {
      setError("Please enter some Mandarin text.");
      return;
    }

    // Reset error state for a new attempt
    setError(undefined);

    // If audioUrl is already defined for the current text, just play it.
    // The useEffect above ensures audioUrl is undefined if mandarinText has changed.
    if (
      audioUrl &&
      audioRef.current &&
      audioRef.current.dataset.lastText === mandarinText
    ) {
      console.log("Replaying cached audio for:", mandarinText);
      try {
        await audioRef.current.play();
      } catch (e) {
        console.error("Audio replay error:", e);
        setError(
          "Audio playback blocked by browser. Please click play manually.",
        );
      }
      return; // Exit, no API call needed
    }

    // If we reach here, audioUrl is undefined (or text changed), so we need to call the API.
    setIsLoading(true);

    try {
      console.log("Calling API for new audio:", mandarinText);
      const response = await fetch("/api/get-tts-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify({ text: mandarinText }), // Send the text as JSON
      });

      // Check if the response was successful
      if (!response.ok) {
        const errorText = await response.text(); // Get error message from backend
        throw new Error(
          `Failed to get audio: ${response.status} - ${errorText}`,
        );
      }

      // Get the audio data as a Blob (binary data type suitable for media)
      const audioBlob = await response.blob();
      // Create a temporary URL for the audio Blob. This URL can be used by the <audio> element.
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url); // Store the URL in state

      // Play the audio automatically once the URL is set
      if (audioRef.current) {
        audioRef.current.src = url; // Set the audio element's source
        audioRef.current.dataset.lastText = mandarinText; // Store the text that generated this URL
        audioRef.current.load(); // Reload the audio source to apply changes
        await audioRef.current.play(); // Use await here to catch play errors
      }
    } catch (err) {
      console.error("Error during TTS request or playback:", err);
      if (err instanceof Error) {
        // Check if it's an Error object
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false); // End loading state
    }
  }, [mandarinText, audioUrl]); // Depend on mandarinText and audioUrl

  return (
    <>
      <button onClick={synthesizeAndPlay} disabled={isLoading}>
        {isLoading ? "Generating..." : "Speak Mandarin"}
      </button>

      {/* Error text adjusted to be under the button */}
      {error && (
        <p style={{ color: "red", fontSize: "0.9em", marginTop: "5px" }}>
          Error: {error}
        </p>
      )}

      {/* Audio element is always present but hidden.
          Removed 'controls' attribute as per requirement.
          The 'track' element is already hidden. */}
      <audio ref={audioRef} hidden autoPlay>
        <source src={audioUrl ?? ""} type="audio/mpeg" />
        <track
          hidden
          kind="captions"
          srcLang="zh"
          label="Mandarin captions"
          default={false}
        />
        Your browser does not support the audio element.
      </audio>
    </>
  );
}

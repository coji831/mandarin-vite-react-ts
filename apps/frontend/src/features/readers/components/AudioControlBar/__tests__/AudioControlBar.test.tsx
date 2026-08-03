/**
 * @file AudioControlBar/__tests__/AudioControlBar.test.tsx
 * @description Tests for AudioControlBar component.
 * Phase D1: Reads the SHARED presentational audio store (`shared/store/audioStore.ts`).
 *   Tests set up store state via useAudioStore.setState.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AudioControlBar } from "../AudioControlBar";
import { useAudioStore } from "shared/store";

describe("AudioControlBar", () => {
  beforeEach(() => {
    useAudioStore.setState(useAudioStore.getInitialState());
  });

  it("renders play/pause button, stop button, progress, and speed controls", () => {
    useAudioStore.setState({ currentIndex: 0, status: "playing" });
    render(<AudioControlBar totalSentences={5} />);

    // Play button
    expect(screen.getByRole("button", { name: /pause audio/i })).toBeInTheDocument();

    // Stop button
    expect(screen.getByRole("button", { name: /stop audio/i })).toBeInTheDocument();

    // Progress label
    expect(screen.getByText("1 / 5")).toBeInTheDocument();

    // Speed buttons
    expect(screen.getByRole("button", { name: /playback speed 0\.75x/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /playback speed 1x/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /playback speed 1\.25x/i })).toBeInTheDocument();
  });

  it("shows pause icon when playing", () => {
    useAudioStore.setState({ status: "playing", currentIndex: 0 });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("button", { name: /pause audio/i })).toBeInTheDocument();
  });

  it("shows play icon when idle", () => {
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("button", { name: /play audio/i })).toBeInTheDocument();
  });

  it("shows current position in progress label", () => {
    useAudioStore.setState({ currentIndex: 2, status: "playing" });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByText("3 / 5")).toBeInTheDocument();
  });

  it("shows total count in progress when completed", () => {
    useAudioStore.setState({ status: "stopped", hasCompleted: true });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByText("5 / 5")).toBeInTheDocument();
  });

  it("exposes a tap-to-play affordance when autoplay is blocked", () => {
    useAudioStore.setState({ status: "blocked" });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("button", { name: /tap to play audio/i })).toBeInTheDocument();
    // The blocked play button is still clickable — tapping re-attempts playback.
    expect(screen.getByRole("button", { name: /tap to play audio/i })).not.toBeDisabled();
  });

  it("disables play button when loading", () => {
    useAudioStore.setState({ status: "loading" });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("button", { name: /play audio/i })).toBeDisabled();
  });

  it("disables play button when no sentences", () => {
    render(<AudioControlBar totalSentences={0} />);

    expect(screen.getByRole("button", { name: /play audio/i })).toBeDisabled();
  });

  it("disables stop button when not started", () => {
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("button", { name: /stop audio/i })).toBeDisabled();
  });

  it("shows error indicator when error is set", () => {
    useAudioStore.setState({ error: "Failed to load" });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("alert", { name: /audio error detected/i })).toBeInTheDocument();
  });

  it("marks active speed button with active variant", () => {
    useAudioStore.setState({ rate: 1.25 });
    render(<AudioControlBar totalSentences={5} />);

    const activeBtn = screen.getByRole("button", { name: /playback speed 1\.25x/i });
    expect(activeBtn.className).toContain("tag-active");
  });

  it("calls onTogglePlay, onStop, and onSpeedChange callbacks", () => {
    const onTogglePlay = vi.fn();
    const onStop = vi.fn();
    const onSpeedChange = vi.fn();
    useAudioStore.setState({ status: "playing", currentIndex: 0 });
    render(
      <AudioControlBar
        totalSentences={5}
        onTogglePlay={onTogglePlay}
        onStop={onStop}
        onSpeedChange={onSpeedChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pause audio/i }));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /stop audio/i }));
    expect(onStop).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /playback speed 1\.25x/i }));
    expect(onSpeedChange).toHaveBeenCalledWith(1.25);
  });
});

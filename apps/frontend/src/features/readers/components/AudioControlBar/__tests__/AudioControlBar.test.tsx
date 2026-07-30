/**
 * @file AudioControlBar/__tests__/AudioControlBar.test.tsx
 * @description Tests for AudioControlBar component.
 * Phase 2: Reads audio state from audioStore directly — no props.
 *   Tests set up store state via useAudioStore.setState.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AudioControlBar } from "../AudioControlBar";
import { useAudioStore } from "../../../stores";
import type { AudioStatus } from "../../../stores";

describe("AudioControlBar", () => {
  beforeEach(() => {
    useAudioStore.setState({
      currentIndex: null,
      pendingIndex: null,
      status: "idle" as AudioStatus,
      error: null,
      speed: 1,
      audioUrls: null,
    });
  });

  it("renders play/pause button, stop button, progress, and speed controls", () => {
    useAudioStore.setState({ currentIndex: 0, status: "playing" as AudioStatus });
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
    useAudioStore.setState({ status: "playing" as AudioStatus, currentIndex: 0 });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("button", { name: /pause audio/i })).toBeInTheDocument();
  });

  it("shows play icon when idle", () => {
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByRole("button", { name: /play audio/i })).toBeInTheDocument();
  });

  it("shows current position in progress label", () => {
    useAudioStore.setState({ currentIndex: 2, status: "playing" as AudioStatus });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByText("3 / 5")).toBeInTheDocument();
  });

  it("shows total count in progress when completed", () => {
    useAudioStore.setState({ status: "completed" as AudioStatus });
    render(<AudioControlBar totalSentences={5} />);

    expect(screen.getByText("5 / 5")).toBeInTheDocument();
  });

  it("disables play button when loading", () => {
    useAudioStore.setState({ status: "loading" as AudioStatus });
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
    useAudioStore.setState({ speed: 1.25 });
    render(<AudioControlBar totalSentences={5} />);

    const activeBtn = screen.getByRole("button", { name: /playback speed 1\.25x/i });
    expect(activeBtn.className).toContain("tag-active");
  });
});

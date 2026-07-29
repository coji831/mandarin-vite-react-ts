/**
 * @file AudioControlBar/__tests__/AudioControlBar.test.tsx
 * @description Tests for AudioControlBar component.
 * Story 21.6: Tests for audio playback control bar.
 *
 * Tests cover: rendering all controls, play/pause toggle, speed change,
 * progress display.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AudioControlBar } from "../AudioControlBar";

describe("AudioControlBar", () => {
  const defaultProps = {
    currentIndex: 0,
    isPlaying: false,
    isLoading: false,
    hasCompleted: false,
    totalSentences: 5,
    speed: 1,
    onTogglePlay: vi.fn(),
    onStop: vi.fn(),
    onSpeedChange: vi.fn(),
  };

  it("renders play/pause button, stop button, progress, and speed controls", () => {
    render(<AudioControlBar {...defaultProps} />);

    // Play button
    expect(screen.getByRole("button", { name: /play audio/i })).toBeInTheDocument();

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
    render(<AudioControlBar {...defaultProps} isPlaying={true} />);

    expect(screen.getByRole("button", { name: /pause audio/i })).toBeInTheDocument();
  });

  it("calls onTogglePlay when play/pause button is clicked", () => {
    const onTogglePlay = vi.fn();
    render(<AudioControlBar {...defaultProps} onTogglePlay={onTogglePlay} />);

    fireEvent.click(screen.getByRole("button", { name: /play audio/i }));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it("calls onStop when stop button is clicked", () => {
    const onStop = vi.fn();
    render(<AudioControlBar {...defaultProps} currentIndex={2} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: /stop audio/i }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("calls onSpeedChange when a speed button is clicked", () => {
    const onSpeedChange = vi.fn();
    render(<AudioControlBar {...defaultProps} onSpeedChange={onSpeedChange} />);

    fireEvent.click(screen.getByRole("button", { name: /playback speed 1\.25x/i }));
    expect(onSpeedChange).toHaveBeenCalledWith(1.25);
  });

  it("shows current position in progress label", () => {
    render(<AudioControlBar {...defaultProps} currentIndex={2} />);

    expect(screen.getByText("3 / 5")).toBeInTheDocument();
  });

  it("shows total count in progress when completed", () => {
    render(<AudioControlBar {...defaultProps} hasCompleted={true} currentIndex={null} />);

    expect(screen.getByText("5 / 5")).toBeInTheDocument();
  });

  it("disables play button when loading", () => {
    render(<AudioControlBar {...defaultProps} isLoading={true} />);

    expect(screen.getByRole("button", { name: /play audio/i })).toBeDisabled();
  });

  it("disables play button when no sentences", () => {
    render(<AudioControlBar {...defaultProps} totalSentences={0} />);

    expect(screen.getByRole("button", { name: /play audio/i })).toBeDisabled();
  });

  it("disables stop button when not started", () => {
    render(<AudioControlBar {...defaultProps} currentIndex={null} />);

    expect(screen.getByRole("button", { name: /stop audio/i })).toBeDisabled();
  });

  it("shows error indicator when hasError is true", () => {
    render(<AudioControlBar {...defaultProps} hasError={true} />);

    expect(screen.getByRole("alert", { name: /audio error detected/i })).toBeInTheDocument();
  });

  it("marks active speed button with active variant", () => {
    render(<AudioControlBar {...defaultProps} speed={1.25} />);

    // Active speed button receives the "tag-active" variant
    const activeBtn = screen.getByRole("button", { name: /playback speed 1\.25x/i });
    expect(activeBtn.className).toContain("tag-active");
  });
});

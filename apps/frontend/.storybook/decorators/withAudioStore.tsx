/**
 * withAudioStore — Storybook decorator for the SHARED presentational audio store
 * (`shared/store/audioStore.ts`). Phase D1: the readers feature audio store was
 * migrated to this shared snapshot store, so the decorator now sets snapshot
 * values only (status/currentIndex/rate/error/hasCompleted — no signal fields).
 */
import { useEffect } from "react";
import type { Decorator } from "@storybook/react-vite";
import { useAudioStore } from "../../src/shared/store";
import type { AudioStatus } from "../../src/shared/audio";

type AudioStoreOverrides = Partial<
  Pick<
    ReturnType<typeof useAudioStore.getState>,
    "currentIndex" | "status" | "rate" | "error" | "hasCompleted"
  >
>;

export function withAudioStore(overrides: AudioStoreOverrides = {}): Decorator {
  return (Story) => {
    useEffect(() => {
      useAudioStore.setState({
        currentIndex: null,
        status: "idle" as AudioStatus,
        rate: 1,
        error: null,
        hasCompleted: false,
        ...overrides,
      });
    }, []);

    return <Story />;
  };
}

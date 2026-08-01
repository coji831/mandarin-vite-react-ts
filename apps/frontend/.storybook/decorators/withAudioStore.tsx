import { useEffect } from "react";
import type { Decorator } from "@storybook/react-vite";
import { useAudioStore } from "../../src/features/readers/stores";
import type { AudioStatus } from "../../src/features/readers/stores";

type AudioStoreOverrides = Partial<
  Pick<
    ReturnType<typeof useAudioStore.getState>,
    "currentIndex" | "pendingIndex" | "pendingSingleIndex" | "status" | "speed" | "error"
  >
>;

export function withAudioStore(overrides: AudioStoreOverrides = {}): Decorator {
  return (Story) => {
    useEffect(() => {
      useAudioStore.setState({
        currentIndex: null,
        pendingIndex: null,
        pendingSingleIndex: null,
        status: "idle" as AudioStatus,
        speed: 1,
        error: null,
        ...overrides,
      });
    }, []);

    return <Story />;
  };
}

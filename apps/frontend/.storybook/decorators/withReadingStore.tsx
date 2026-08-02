import { useEffect } from "react";
import type { Decorator } from "@storybook/react-vite";
import { useReadingStore } from "../../src/features/readers/stores";
import type { ReadersMode } from "../../src/features/readers/stores";

type ReadingStoreOverrides = Partial<
  Pick<ReturnType<typeof useReadingStore.getState>, "currentPassageId" | "mode" | "popover">
>;

export function withReadingStore(overrides: ReadingStoreOverrides = {}): Decorator {
  return (Story) => {
    useEffect(() => {
      useReadingStore.setState({
        currentPassageId: null,
        mode: "library" as ReadersMode,
        popover: { glyph: null, position: null },
        ...overrides,
      });
    }, []);

    return <Story />;
  };
}

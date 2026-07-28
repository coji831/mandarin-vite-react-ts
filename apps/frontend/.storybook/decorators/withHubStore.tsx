import { useEffect } from "react";
import type { Decorator } from "@storybook/react-vite";
import { useHubStore } from "../../src/shared/store/hubStore";

type HubStoreOverrides = Partial<
  Pick<ReturnType<typeof useHubStore.getState>, "isOpen" | "currentEntity" | "navigationStack">
>;

export function withHubStore(overrides: HubStoreOverrides = {}): Decorator {
  return (Story) => {
    useEffect(() => {
      useHubStore.setState({
        isOpen: false,
        currentEntity: null,
        navigationStack: [],
        ...overrides,
      });
    }, []);

    return <Story />;
  };
}

/**
 * @file MnemonicError.tsx
 * @description Error + Timeout states for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import { Button } from "shared/components";

type MnemonicErrorProps = {
  character: string;
  message?: string;
  isTimeout?: boolean;
  onRetry: () => void;
};

export function MnemonicError({
  character,
  message,
  isTimeout = false,
  onRetry,
}: MnemonicErrorProps) {
  return (
    <div
      className="hub-mnemonic-section"
      aria-label={
        isTimeout
          ? `Timeout generating mnemonic for ${character}`
          : `Error loading mnemonic for ${character}`
      }
    >
      <div className="flex-col-center gap-sm">
        {isTimeout ? (
          <p className="text-warning font-sm text-center m-0">
            Story generation is taking longer than expected.
          </p>
        ) : (
          <p className="text-error font-sm text-center m-0">{message}</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          aria-label={isTimeout ? "Retry generating mnemonic" : "Retry loading mnemonic"}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

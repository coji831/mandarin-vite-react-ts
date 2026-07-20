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
      <h3 className="font-sm text-secondary text-uppercase tracking-wide">Mnemonic Story</h3>
      <div className="hub-mnemonic-section__error">
        {isTimeout ? (
          <p className="hub-mnemonic-section__timeout-text">
            Story generation is taking longer than expected.
          </p>
        ) : (
          <p className="hub-mnemonic-section__error-text">{message}</p>
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

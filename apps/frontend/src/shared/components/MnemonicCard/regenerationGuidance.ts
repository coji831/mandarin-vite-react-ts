/**
 * @file regenerationGuidance.ts
 * @description Regeneration tip text per classification type.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Pure function: returns tip text by classification string.
 * Used by MnemonicCard to show contextual guidance below the mnemonic.
 */

const REGENERATION_TIPS: Record<string, string> = {
  pictograph:
    "Ask for a story that emphasizes visual imagery and the object this character depicts.",
  phono_semantic: "Ask for a story that connects the sound clue to the meaning clue.",
  compound_ideograph:
    "Ask for a story that explains how the components combine to create the meaning.",
  simple_ideograph: "Ask for a story that makes the abstract concept concrete and memorable.",
  default: "Ask for a story that makes this character easier to remember.",
};

export function getRegenerationTip(classification: string): string {
  return REGENERATION_TIPS[classification] ?? REGENERATION_TIPS.default;
}

/**
 * @file layoutSelection.ts
 * @description Layout selection logic for MnemonicCard.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Pure function: determines which layout to render based on classification + radicalIds.
 */

export type EffectiveLayout =
  | "pictograph"
  | "phono_semantic"
  | "compound_ideograph"
  | "simple_ideograph"
  | "default";

/**
 * Resolve the effective layout for a mnemonic card based on classification and radical count.
 *
 * Heuristic: ideograph with 2+ radicals → compound_ideograph, otherwise → simple_ideograph.
 */
export function resolveEffectiveClassification(
  classification: string | null | undefined,
  radicalIds: string[]
): EffectiveLayout {
  if (classification === "pictograph") return "pictograph";
  if (classification === "phono_semantic") return "phono_semantic";
  if (classification === "ideograph" && radicalIds.length >= 2) {
    return "compound_ideograph";
  }
  if (classification === "ideograph") return "simple_ideograph";
  return "default";
}

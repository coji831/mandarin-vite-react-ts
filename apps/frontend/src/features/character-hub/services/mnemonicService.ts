/**
 * @file mnemonicService.ts
 * @description Service layer for Mnemonic story API calls
 * Story 20.2: Mnemonic Display UI
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";

/** Response shape from the mnemonics API */
export interface MnemonicResponse {
  id: string;
  characterGlyph: string;
  story: string;
  radicalIds: string[];
  isEdited: boolean;
  isPictograph: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mnemonicService = {
  /**
   * Fetch a mnemonic story for a character.
   * Returns null if no story exists (404).
   */
  async getMnemonic(character: string): Promise<MnemonicResponse | null> {
    try {
      const response = await apiClient.get(ROUTE_PATTERNS.mnemonicsByChar(character));
      return response.data as MnemonicResponse;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError?.response?.status === 404) return null;
      throw error;
    }
  },

  /**
   * Generate a new mnemonic story for a character via AI.
   */
  async generateMnemonic(character: string): Promise<MnemonicResponse> {
    const response = await apiClient.post(ROUTE_PATTERNS.mnemonicsByChar(character));
    return response.data as MnemonicResponse;
  },

  /**
   * Update an existing mnemonic story for a character.
   */
  async updateMnemonic(character: string, story: string): Promise<MnemonicResponse> {
    const response = await apiClient.put(ROUTE_PATTERNS.mnemonicsByChar(character), { story });
    return response.data as MnemonicResponse;
  },

  /**
   * Delete a mnemonic story for a character.
   */
  async deleteMnemonic(character: string): Promise<void> {
    await apiClient.delete(ROUTE_PATTERNS.mnemonicsByChar(character));
  },
};

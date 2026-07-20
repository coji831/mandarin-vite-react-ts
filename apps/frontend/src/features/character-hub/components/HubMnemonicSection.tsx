/**
 * @file HubMnemonicSection.tsx
 * @description Character Detail Hub — Mnemonic Story section (Phase 2+)
 * Story 20.2: Mnemonic Display UI
 *
 * Thin wrapper: phase gate + MnemonicSectionInner with the reducer and sub-components.
 * Displays, generates, and edits mnemonic stories for characters.
 * Phase-gated: visible only for Phase 2+ users.
 * Uses a discriminated union state machine with 9 states:
 * Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph.
 */

import { useEffect, useReducer, useRef, useCallback, useState } from "react";
import React from "react";
import { usePhaseGate } from "shared/hooks";
import { Modal, Button } from "shared/components";
import { mnemonicService, PICTOGRAPH_CHARS } from "../services";
import {
  MnemonicLoading,
  MnemonicDisplay,
  MnemonicEditing,
  MnemonicEmpty,
  MnemonicError,
  MnemonicPictograph,
  mnemonicReducer,
  GENERATE_TIMEOUT_MS,
} from "./mnemonic";
import "./HubMnemonicSection.css";

// ─── Component ───────────────────────────────────────────────────────

type HubMnemonicSectionProps = {
  character: string;
};

export function HubMnemonicSection({ character }: HubMnemonicSectionProps) {
  const { phaseGate } = usePhaseGate();

  // Phase gate: use dev default of 3 for Storybook/development
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;

  if (effectivePhase < 2) return null;

  return <MnemonicSectionInner character={character} />;
}

const MnemonicSectionInner = React.memo(function MnemonicSectionInner({
  character,
}: {
  character: string;
}) {
  const [state, dispatch] = useReducer(mnemonicReducer, { type: "Loading" });
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timedOutRef = useRef(false);
  const mountedRef = useRef(true);

  // ── Load mnemonic on mount / character change ──────

  useEffect(() => {
    mountedRef.current = true;

    // Check pictograph first
    if (PICTOGRAPH_CHARS.has(character)) {
      dispatch({ type: "IS_PICTOGRAPH", character });
      return;
    }

    dispatch({ type: "RESET" });

    async function load() {
      try {
        const result = await mnemonicService.getMnemonic(character);
        if (!mountedRef.current) return;

        if (result === null) {
          dispatch({ type: "NOT_FOUND" });
        } else if (result.isPictograph) {
          dispatch({ type: "IS_PICTOGRAPH", character: result.characterGlyph });
        } else if (result.isEdited) {
          dispatch({ type: "LOADED_EDITED", story: result.story });
        } else {
          dispatch({ type: "LOADED_CACHED", story: result.story });
        }
      } catch {
        if (mountedRef.current) {
          dispatch({ type: "LOAD_ERROR", message: "Failed to load mnemonic story." });
        }
      }
    }

    load();

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [character]);

  // ── Generate mnemonic ──────────────────────────────

  const handleGenerate = useCallback(async () => {
    dispatch({ type: "GENERATE_START" });

    // Reset timeout tracking
    timedOutRef.current = false;

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        timedOutRef.current = true;
        dispatch({ type: "GENERATE_TIMEOUT" });
      }
    }, GENERATE_TIMEOUT_MS);

    try {
      const result = await mnemonicService.generateMnemonic(character);
      if (!mountedRef.current) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Only dispatch success if we haven't already timed out
      if (!timedOutRef.current) {
        dispatch({ type: "GENERATE_SUCCESS", story: result.story, isEdited: result.isEdited });
      }
    } catch {
      if (!mountedRef.current) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Only dispatch error if we haven't already timed out
      if (!timedOutRef.current) {
        dispatch({ type: "GENERATE_ERROR", message: "Failed to generate mnemonic story." });
      }
    }
  }, [character]);

  // ── Save edited mnemonic ───────────────────────────

  const handleSave = useCallback(
    async (story: string) => {
      try {
        const result = await mnemonicService.updateMnemonic(character, story);
        if (!mountedRef.current) return;
        dispatch({ type: "SAVE_SUCCESS", story: result.story });
      } catch {
        if (mountedRef.current) {
          dispatch({ type: "GENERATE_ERROR", message: "Failed to save mnemonic story." });
        }
      }
    },
    [character],
  );

  // ── Edit button handler ────────────────────────────

  const handleStartEdit = useCallback(() => {
    dispatch({ type: "START_EDIT" });
  }, []);

  // ── Regenerate with confirm ────────────────────────

  const handleRegenerate = useCallback(() => {
    if (state.type === "Display" && state.isEdited) {
      setShowRegenerateConfirm(true);
    } else {
      handleGenerate();
    }
  }, [state, handleGenerate]);

  const handleConfirmRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false);
    handleGenerate();
  }, [handleGenerate]);

  const handleCancelRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false);
  }, []);

  // ── Retry (from Error or Timeout) ──────────────────

  const handleRetry = useCallback(() => {
    dispatch({ type: "RETRY" });
  }, []);

  // ── Cancel edit ────────────────────────────────────

  const handleCancelEdit = useCallback(() => {
    dispatch({ type: "CANCEL_EDIT" });
  }, []);

  // ── State Switch ───────────────────────────────────

  const renderContent = () => {
    switch (state.type) {
      case "Loading":
        return <MnemonicLoading character={character} />;
      case "Generating":
        return <MnemonicLoading character={character} isGenerating />;
      case "Empty":
        return <MnemonicEmpty character={character} onGenerate={handleGenerate} />;
      case "Display":
        return (
          <MnemonicDisplay
            character={character}
            story={state.story}
            isEdited={state.isEdited}
            onEdit={handleStartEdit}
            onRegenerate={handleRegenerate}
          />
        );
      case "Cached":
        return (
          <MnemonicDisplay
            character={character}
            story={state.story}
            isEdited={false}
            onEdit={handleStartEdit}
            onRegenerate={handleRegenerate}
          />
        );
      case "Editing":
        return (
          <MnemonicEditing
            character={character}
            story={state.story}
            dispatch={dispatch}
            onSave={handleSave}
            onCancelEdit={handleCancelEdit}
          />
        );
      case "Error":
        return (
          <MnemonicError character={character} message={state.message} onRetry={handleRetry} />
        );
      case "Timeout":
        return <MnemonicError character={character} isTimeout onRetry={handleRetry} />;
      case "Pictograph":
        return <MnemonicPictograph character={character} glyph={state.character} />;
      default:
        return null;
    }
  };

  return (
    <>
      {renderContent()}
      <Modal
        isOpen={showRegenerateConfirm}
        onClose={handleCancelRegenerate}
        title="Regenerate Story"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={handleCancelRegenerate}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmRegenerate}>
              Replace
            </Button>
          </>
        }
      >
        <p>This will replace your edited story. Are you sure?</p>
      </Modal>
    </>
  );
});

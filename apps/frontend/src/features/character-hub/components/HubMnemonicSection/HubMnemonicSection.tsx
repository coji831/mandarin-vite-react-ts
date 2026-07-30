/**
 * @file HubMnemonicSection.tsx
 * @description Character Detail Hub — Mnemonic Story section (Phase 2+)
 * Story 20.2: Mnemonic Display UI
 *
 * Thin wrapper: phase gate + MnemonicSectionInner with the reducer and sub-components.
 * Displays, generates, and edits mnemonic stories for characters.
 * Phase-gated: visible only for Phase 2+ users.
 * Uses a discriminated union state machine with 10 states:
 * Loading, Cached, Empty, Generating, Display, Editing, Saving, Error, Timeout, Pictograph.
 */

import { useEffect, useState, useCallback } from "react";
import { usePhaseGate } from "shared/hooks";
import { Modal, Button, MnemonicCard } from "shared/components";
import { useMnemonicStore } from "../../stores/mnemonicStore";
import {
  MnemonicEditing,
  MnemonicEmpty,
  MnemonicError,
} from "./index";
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

function MnemonicSectionInner({ character }: { character: string }) {
  const state = useMnemonicStore((s) => s.state);
  const loadMnemonic = useMnemonicStore((s) => s.loadMnemonic);
  const generateMnemonic = useMnemonicStore((s) => s.generateMnemonic);
  const saveMnemonic = useMnemonicStore((s) => s.saveMnemonic);
  const startEdit = useMnemonicStore((s) => s.startEdit);
  const cancelEdit = useMnemonicStore((s) => s.cancelEdit);
  const retry = useMnemonicStore((s) => s.retry);

  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // ── Load mnemonic on mount / character change ──────

  useEffect(() => {
    loadMnemonic(character);
  }, [character, loadMnemonic]);

  // ── Regenerate with confirm ────────────────────────

  const handleRegenerate = useCallback(() => {
    if (state.type === "Display" && state.isEdited) {
      setShowRegenerateConfirm(true);
    } else {
      generateMnemonic(character);
    }
  }, [state, character, generateMnemonic]);

  const handleConfirmRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false);
    generateMnemonic(character);
  }, [character, generateMnemonic]);

  const handleCancelRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false);
  }, []);

  // ── State Switch ───────────────────────────────────

  const renderContent = () => {
    switch (state.type) {
      case "Loading":
        return <MnemonicCard character={character} classification={null} radicalIds={[]} story="" isEdited={false} isLoading />;
      case "Generating":
        return <MnemonicCard character={character} classification={null} radicalIds={[]} story="" isEdited={false} isGenerating />;
      case "Empty":
        return (
          <MnemonicEmpty character={character} onGenerate={() => generateMnemonic(character)} />
        );
      case "Display":
        return (
          <MnemonicCard
            character={character}
            classification={state.classification}
            radicalIds={state.radicalIds}
            story={state.story}
            isEdited={state.isEdited}
            onEdit={startEdit}
            onRegenerate={handleRegenerate}
          />
        );
      case "Cached":
        return (
          <MnemonicCard
            character={character}
            classification={null}
            radicalIds={[]}
            story={state.story}
            isEdited={false}
            onEdit={startEdit}
            onRegenerate={handleRegenerate}
          />
        );
      case "Editing":
      case "Saving":
        return (
          <MnemonicEditing
            character={character}
            story={state.story}
            onSave={(story) => saveMnemonic(character, story)}
            onCancelEdit={cancelEdit}
            isSaving={state.type === "Saving"}
          />
        );
      case "Error":
        return <MnemonicError character={character} message={state.message} onRetry={retry} />;
      case "Timeout":
        return <MnemonicError character={character} isTimeout onRetry={retry} />;
      case "Pictograph":
        return (
          <MnemonicCard
            character={character}
            classification="pictograph"
            radicalIds={[]}
            story={state.story ?? ""}
            isEdited={false}
          />
        );
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
}

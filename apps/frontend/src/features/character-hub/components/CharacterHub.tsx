/**
 * @file CharacterHub.tsx
 * @description Main portal overlay for Character Detail Hub
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Renders as a React Portal into document.body when open.
 * Composes HubCharacterCard (character + stroke + controls),
 * HubInfoLine (pinyin + meaning), and HubActions.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useHubStore } from "shared/store";
import { LoadingScreen } from "shared/components";
import { HubCharacterCard } from "./HubCharacterCard";
import { HubInfoLine } from "./HubInfoLine";
import { HubActions } from "./HubActions";
import { HubRadicalSection } from "./HubRadicalSection";
import "./CharacterHub.css";
import "./HubRadicalSection.css";

export function CharacterHub() {
  const { isOpen, character, pinyin, close } = useHubStore();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  if (!character) {
    return createPortal(
      <div className="hub-backdrop" onClick={close}>
        <div className="hub-panel" onClick={(e) => e.stopPropagation()}>
          <button className="hub-close-btn" onClick={close} aria-label="Close">
            ✕
          </button>
          <LoadingScreen message="Loading character..." />
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="hub-backdrop" onClick={close}>
      <div className="hub-panel" onClick={(e) => e.stopPropagation()}>
        <button className="hub-close-btn" onClick={close} aria-label="Close">
          ✕
        </button>
        <div className="hub-grid">
          {/* Left column: Radicals */}
          <div className="hub-grid__left">
            <HubRadicalSection character={character} onClose={close} />
          </div>

          {/* Center column: Character card + info */}
          <div className="hub-grid__center">
            <HubCharacterCard character={character} pinyin={pinyin} />
            <HubInfoLine character={character} pinyin={pinyin} />
          </div>

          {/* Right column: Reserved for future example sentences */}
          <div className="hub-grid__right" />
        </div>

        {/* Actions span full width at bottom */}
        <HubActions character={character} />
      </div>
    </div>,
    document.body,
  );
}

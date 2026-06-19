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
import { HubCharacterCard } from "./HubCharacterCard";
import { HubInfoLine } from "./HubInfoLine";
import { HubActions } from "./HubActions";
import "./CharacterHub.css";

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

  if (!isOpen || !character) return null;

  return createPortal(
    <div className="hub-backdrop" onClick={close}>
      <div className="hub-panel" onClick={(e) => e.stopPropagation()}>
        <button className="hub-close-btn" onClick={close} aria-label="Close">
          ✕
        </button>
        <HubCharacterCard character={character} pinyin={pinyin} />
        <HubInfoLine character={character} pinyin={pinyin} />
        <HubActions character={character} />
      </div>
    </div>,
    document.body,
  );
}

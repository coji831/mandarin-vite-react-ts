/**
 * HintOverlay Component
 * Component Reorganization: Renamed from HintPopup
 * Story 15.10: Extracted hint overlay for reusability
 *
 * Full-screen modal overlay displaying context-sensitive hints for quiz questions.
 * - type_pinyin: Shows English meaning
 * - type_character: Shows pinyin and English meaning
 * - Dismissible via overlay click or close button
 */

import { QuestionMode } from "../../types";
import "./HintOverlay.css";

type HintOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: QuestionMode;
  pinyin?: string;
  english?: string;
};

export { HintOverlay };

function HintOverlay({ isOpen, onClose, mode, pinyin, english }: HintOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="hintOverlay overlay flex-center animate-fade-in" onClick={onClose}>
      <div className="hintPopup animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="hintPopupHeader">
          <span>💡 Hint</span>
          <button
            type="button"
            onClick={onClose}
            className="hintCloseButton btn-close"
            aria-label="Close hint"
            style={{ top: "0.5rem", right: "0.5rem" }}
          >
            ✕
          </button>
        </div>
        <div className="hintPopupContent flex-col">
          {mode === "type_pinyin" && english && (
            <p className="hintText">
              <strong>Meaning:</strong> {english}
            </p>
          )}
          {mode === "type_character" && (
            <>
              {pinyin && (
                <p className="hintText">
                  <strong>Pinyin:</strong> {pinyin}
                </p>
              )}
              {english && (
                <p className="hintText">
                  <strong>Meaning:</strong> {english}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

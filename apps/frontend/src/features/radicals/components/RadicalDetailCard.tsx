/**
 * @file components/RadicalDetailCard.tsx
 * @description Standalone modal wrapper for the radical detail body.
 * Story 19.2: Radical Detail Card
 * Story 21.x (visual wave): Body delegated to RadicalDetailContent; the
 * `radical` lexical hub reuses the same body without the Modal wrapper.
 */

import type { RadicalData } from "../types";
import { Modal } from "shared/components";
import { RadicalDetailContent } from "./RadicalDetailContent";

interface RadicalDetailCardProps {
  radical: RadicalData;
  onClose: () => void;
}

export function RadicalDetailCard({ radical, onClose }: RadicalDetailCardProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      title={`${radical.glyph} (${radical.meaning})`}
    >
      <RadicalDetailContent radical={radical} />
    </Modal>
  );
}

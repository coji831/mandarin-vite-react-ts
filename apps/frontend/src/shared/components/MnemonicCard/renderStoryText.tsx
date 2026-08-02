/**
 * @file renderStoryText.tsx
 * @description Lightweight inline markdown renderer for mnemonic story text.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Converts **bold** markdown into React elements.
 * Avoids dangerouslySetInnerHTML and avoids importing from feature modules.
 */

import type { ReactNode } from "react";

/**
 * Render a string containing simple markdown into React elements.
 * Currently supports: **bold text** and newlines as <br />.
 *
 * Simple **bold** markdown parser. Does not handle adjacent bold markers
 * (e.g., `**a****b**`) or nested asterisks. Sufficient for AI-generated
 * mnemonic text.
 */
export function renderStoryText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return <strong key={i}>{inner}</strong>;
    }
    return part.split(/\n/g).flatMap((line, j, lines) => {
      if (j === lines.length - 1) return line;
      return [line, <br key={`${i}-${j}`} />];
    });
  });
}

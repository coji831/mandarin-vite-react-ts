/**
 * @file renderMarkdown.ts
 * @description Lightweight markdown-to-JSX renderer for mnemonic story text.
 *
 * Converts basic inline markdown (bold via `**text**`) into React elements.
 * Avoids dangerouslySetInnerHTML — returns React elements directly.
 * Can be extended for italic, code, etc. as needed.
 */

import type { ReactNode } from "react";

/**
 * Render a string containing simple markdown into React elements.
 * Currently supports: **bold text**
 */
export function renderMarkdown(text: string): ReactNode[] {
  // Split on **...** patterns, capturing the content between markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return <strong key={i}>{inner}</strong>;
    }
    // Preserve newlines as line breaks
    return part.split(/\n/g).flatMap((line, j, lines) => {
      if (j === lines.length - 1) return line;
      return [line, <br key={`${i}-${j}`} />];
    });
  });
}

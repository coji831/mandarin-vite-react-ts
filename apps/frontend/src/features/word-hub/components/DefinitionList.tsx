/**
 * @file DefinitionList.tsx
 * @description Renders a numbered list of word definitions.
 * Extracted from WordHubContent for reuse.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */
import { Box } from "shared/components";

interface DefinitionListProps {
  definitions: string[];
}

export function DefinitionList({ definitions }: DefinitionListProps) {
  return (
    <Box variant="surface" padding="sm" className="flex-col gap-xs">
      <ol className="m-0 p-0 flex-col gap-xs">
        {definitions.map((def, i) => (
          <li key={i} className="word-hub__definition font-sm text-secondary">
            {def}
          </li>
        ))}
      </ol>
    </Box>
  );
}

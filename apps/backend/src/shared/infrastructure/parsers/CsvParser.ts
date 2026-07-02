import { parse } from "csv-parse/sync";
import type { Options } from "csv-parse";

/**
 * A row from a CSV file parsed with column headers as keys.
 */
export type CsvRow = Record<string, string>;

/**
 * parseCsvText
 * Lightweight server-side CSV parser used to convert vocabulary CSV files
 * into arrays of objects. Uses csv-parse's synchronous API for simplicity
 * in unit tests and small files.
 *
 * Options:
 *  - columns: true (treat first row as header)
 *  - skip_empty_lines: true
 *  - trim: true
 *
 * Keep this file minimal — move any validation or normalization into a
 * separate utility if complexity grows.
 */
export function parseCsvText(text: string, options: Partial<Options> = {}): CsvRow[] {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    ...options,
  });

  return records as unknown as CsvRow[];
}

export default { parseCsvText };

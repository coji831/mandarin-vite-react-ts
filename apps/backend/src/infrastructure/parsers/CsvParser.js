import { parse } from "csv-parse/sync";

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
export function parseCsvText(text, options = {}) {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    ...options,
  });

  return records;
}

export default { parseCsvText };

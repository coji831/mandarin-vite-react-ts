/* High-level design: load CSV vocab into VocabWord[]
   - Detect comma/tab separators and handle quoted fields
   - Lightweight validation; on error log and return []
   - Keep design notes concise and colocated with implementation
*/

export type VocabWord = {
  No: string;
  Chinese: string;
  Pinyin: string;
  English: string;
};

export async function loadCsvVocab(url: string): Promise<VocabWord[]> {
  try {
    console.log(`Fetching CSV from: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    console.log(`CSV content length: ${text.length} characters`);

    // Detect if CSV uses tabs or commas as separator
    const firstLine = text.split(/\r?\n/)[0];
    const separator = firstLine.includes("\t") ? "\t" : ",";
    console.log(`Using separator: "${separator === "\t" ? "tab" : "comma"}"`);

    // Split into lines, handling different line endings
    const lines = text.trim().split(/\r?\n/);
    console.log(`Found ${lines.length} lines in CSV`);

    if (lines.length <= 1) {
      console.warn("CSV file seems empty or only has headers");
      return [];
    }

    const [header, ...rows] = lines;
    console.log(`Header: ${header}`);

    return rows.map((row, idx) => {
      // Handle quoted cells with commas/semicolons/tabs
      const cells = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === separator || char === "\t") && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(current.trim());

      // Basic validation
      if (cells.length < 4) {
        console.warn(`Row ${idx + 1} has fewer than 4 cells: ${cells.join("|")}`);
        // Add empty cells if needed
        while (cells.length < 4) {
          cells.push("");
        }
      }

      const [No, Chinese, Pinyin, English] = cells;
      return { No, Chinese, Pinyin, English };
    });
  } catch (error) {
    console.error("Error loading CSV:", error);
    return [];
  }
}

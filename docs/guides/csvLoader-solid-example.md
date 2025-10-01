```tsx
// Example from the project: src/utils/csvLoader.ts
// This is an excellent example of the Single Responsibility Principle and Open/Closed Principle

export type VocabWord = {
  No: string;
  Chinese: string;
  Pinyin: string;
  English: string;
};

// This function has a single responsibility: loading CSV vocabulary data
export async function loadCsvVocab(url: string): Promise<VocabWord[]> {
  try {
    // Implementation details...
    // The function handles parsing CSV data from different formats
  } catch (error) {
    console.error("Error loading CSV:", error);
    return [];
  }
}

// Benefits of this approach:
// 1. SRP: Function does one thing - loading CSV data
// 2. OCP: We can extend with new formats without changing existing code
// 3. DIP: Components depend on the interface (VocabWord[]) not implementation details
// 4. LSP: Different vocabulary sources can be substituted as long as they return VocabWord[]
// 5. ISP: Clients only need to know about the minimal VocabWord interface
```

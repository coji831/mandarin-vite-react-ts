import { useRef, useState } from "react";

/**
 * Custom hook for importing user progress (user_progress.json) and handling navigation/state update.
 * @param onImportSuccess Callback to run after successful import (e.g., navigate to vocabulary list, update history, etc)
 * @returns { fileInputRef, importError, handleImport }
 */
/**
 * Custom hook for importing user progress (user_progress.json) and handling navigation/state update.
 * @param onImportSuccess Callback to run after successful import (e.g., navigate to vocabulary list, update history, etc)
 *        Receives the imported progress object.
 *        If you want to update history, do it in the callback.
 * @returns { fileInputRef, importError, handleImport }
 */
export function useProgressImport(onImportSuccess?: (imported: any) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string>("");

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && typeof imported === "object" && Array.isArray(imported.lists)) {
          localStorage.setItem("user_progress", JSON.stringify(imported));
          setImportError("");
          if (onImportSuccess) onImportSuccess(imported);
        } else if (Array.isArray(imported) && imported[0]?.character && imported[0]?.wordId) {
          localStorage.setItem("imported_vocabulary", JSON.stringify(imported));
          setImportError("Vocabulary imported. Please refresh or select a list to use it.");
        } else {
          setImportError("Invalid file format. Please select a valid progress or vocabulary file.");
        }
      } catch (err) {
        setImportError("Failed to import: " + (err as any)?.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return { fileInputRef, importError, handleImport };
}

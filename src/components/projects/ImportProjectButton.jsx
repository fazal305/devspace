import { useRef } from "react";
import { Button } from "../common/Button";
import { useProjectImport } from "../../hooks/useProjectImport";

export function ImportProjectButton({ variant = "secondary", label = "Import Project", onNavigateView }) {
  const inputRef = useRef(null);
  const { isImporting, importFromFile } = useProjectImport(onNavigateView);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file next time
    importFromFile(file);
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".zip" hidden onChange={handleFileChange} />
      <Button variant={variant} disabled={isImporting} onClick={() => inputRef.current?.click()}>
        {isImporting ? "Importing…" : label}
      </Button>
    </>
  );
}

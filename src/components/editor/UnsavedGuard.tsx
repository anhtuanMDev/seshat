import { Button } from "@mui/material";


interface UnsavedGuardProps {
  characterName: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveFirst: () => void;
}

export default function UnsavedGuard({
  characterName,
  onCancel,
  onDiscard,
  onSaveFirst,
}: UnsavedGuardProps) {


  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--bg-entry)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 24,
          width: "90%",
          maxWidth: 400,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>
          Unsaved Changes
        </h2>
        <p style={{ marginBottom: 24 }}>
          You have unsaved changes for <strong>{characterName}</strong>. 
          What would you like to do?
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onDiscard}
            style={{
              padding: "8px 16px",
            }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={onSaveFirst}
            style={{
              padding: "8px 16px",
            }}
          >
            Save First
          </Button>
        </div>
      </div>
    </div>
  );
}
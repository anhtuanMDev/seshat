import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)(() => ({
  fontFamily: "Georgia, serif",
  fontSize: 12,
  letterSpacing: 1,
  padding: "3px 12px",
  textTransform: "none",
  minWidth: 0,
  borderRadius: 2,
  "&:hover": { background: "none" },
}));

interface ToggleProps {
  label?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            marginBottom: 4,
          }}
        >
          {label}
        </label>
      )}
      <StyledButton
        variant="outlined"
        onClick={() => onChange(!value)}
        sx={{
          borderColor: value ? "var(--color-green)" : "var(--color-red)",
          color: value ? "var(--color-green)" : "var(--color-red)",
          "&:hover": {
            borderColor: value ? "var(--color-green)" : "var(--color-red)",
            background: "transparent",
          },
        }}
      >
        {value ? "Yes" : "No"}
      </StyledButton>
    </div>
  );
}

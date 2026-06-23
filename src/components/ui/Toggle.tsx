/* eslint-disable react-refresh/only-export-components */
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

import { withRHFControl } from "./withRHFControl";

const StyledButton = styled(Button)(() => ({
  fontSize: 12,
  letterSpacing: 1,
  padding: "3px 12px",
  textTransform: "none",
  minWidth: 0,
  borderRadius: 2,
  "&:hover": { background: "none" },
}));

export interface ToggleInnerProps {
  label?: string;
  value?: boolean;
  onChange?: (v: boolean) => void;
}

function ToggleInner({ label, value, onChange }: ToggleInnerProps) {
  return (
    <div style={styles.container}>
      {label && (
        <label style={styles.label}>
          {label}
        </label>
      )}
      <StyledButton
        variant="outlined"
        onClick={() => onChange?.(!value)}
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

export const Toggle = withRHFControl<boolean, ToggleInnerProps>(ToggleInner);
const styles = {
  container: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    marginBottom: 4,
  },
} satisfies Record<string, React.CSSProperties>;

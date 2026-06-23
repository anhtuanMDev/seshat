/* eslint-disable react-refresh/only-export-components */
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";

import { withRHFControl } from "./withRHFControl";

const StyledFormControl = styled(FormControl)(() => ({
  width: "100%",
  marginBottom: 16,
  "& .MuiFilledInput-root": {
    fontSize: 13,
    color: "var(--mui-text-color)",
    background: "var(--bg-active)",
    "&:before": { borderBottomColor: "var(--border)" },
    "&:hover:not(.Mui-disabled):before": {
      borderBottomColor: "var(--mui-input-before)",
    },
  },
  "& .MuiSelect-select": {
    color: "var(--mui-text-color)",
    background: "transparent",
  },
  "& .MuiSelect-icon": {
    color: "var(--text-secondary)",
  },
  "& .MuiInputLabel-root": {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--mui-label-color)",
    "&.Mui-focused": { color: "var(--mui-label-color)" },
  },
}));

export interface SelInnerProps {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  opts?: string[];
  options?: { label: string; value: string }[];
}

function SelInner({ label, value, onChange, opts = [], options }: SelInnerProps) {
  const finalOptions = options || opts.map((o) => ({ label: o, value: o }));
  return (
    <StyledFormControl variant="filled">
      {label && <InputLabel shrink={true}>{label}</InputLabel>}
      <Select
        displayEmpty
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value as string)}
        label={label}
        MenuProps={{
          slotProps: {
            paper: {
              sx: {
                background: "var(--bg-side)",
                border: "1px solid var(--border)",
                "& .MuiMenuItem-root": {
                  fontSize: 13,
                  color: "var(--text-primary)",
                  "&:hover": { background: "var(--bg-hover)" },
                  "&.Mui-selected": { background: "var(--bg-active)" },
                  "&.Mui-selected:hover": { background: "var(--bg-active)" },
                },
              } as React.CSSProperties,
            },
          },
        }}
      >
        <MenuItem
          value=""
          sx={{
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          —
        </MenuItem>
        {finalOptions.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
}

export const Sel = withRHFControl<string, SelInnerProps>(SelInner);

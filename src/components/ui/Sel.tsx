import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFormControl = styled(FormControl)(() => ({
  width: "100%",
  marginBottom: 16,
  "& .MuiInputBase-root": {
    fontFamily: "Georgia, serif",
    fontSize: 13,
    color: "var(--mui-text-color)",
    background: "transparent",
    "&:before": { borderBottomColor: "var(--mui-input-before)" },
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

interface SelProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  opts: string[];
}

export function Sel({ label, value, onChange, opts }: SelProps) {
  return (
    <StyledFormControl variant="standard">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        label={label}
        /* eslint-disable @typescript-eslint/no-explicit-any */
        MenuProps={{
          PaperProps: {
            sx: {
              background: "var(--bg-side)",
              border: "1px solid var(--border)",
              "& .MuiMenuItem-root": {
                fontFamily: "Georgia, serif",
                fontSize: 13,
                color: "var(--text-primary)",
                "&:hover": { background: "var(--bg-hover)" },
                "&.Mui-selected": { background: "var(--bg-active)" },
                "&.Mui-selected:hover": { background: "var(--bg-active)" },
              },
            },
          },
        } as any}
        /* eslint-enable @typescript-eslint/no-explicit-any */
      >
        <MenuItem
          value=""
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          —
        </MenuItem>
        {opts.map((o) => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
}
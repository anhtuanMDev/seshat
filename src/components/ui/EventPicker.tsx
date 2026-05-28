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

interface EventPickerProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  events: Array<{ id: string; time: number; title: string }>;
}

export function EventPicker({
  label,
  value,
  onChange,
  events,
}: EventPickerProps) {
  return (
    <StyledFormControl variant="standard">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        label={label}
        MenuProps={{
          slotProps: {
            paper: {
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
              } as React.CSSProperties,
            },
          },
        }}
      >
        <MenuItem
          value=""
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          — none —
        </MenuItem>
        {[...events]
          .sort((a, b) => a.time - b.time)
          .map((e) => (
            <MenuItem key={e.id} value={e.id}>
              T{e.time} · {e.title}
            </MenuItem>
          ))}
      </Select>
    </StyledFormControl>
  );
}
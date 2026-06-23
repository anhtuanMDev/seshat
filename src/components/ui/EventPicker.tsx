/* eslint-disable react-refresh/only-export-components */
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";

import { withRHFControl } from "./withRHFControl";

const StyledFormControl = styled(FormControl)(() => ({
  width: "100%",
  marginBottom: 16,
  "& .MuiInputBase-root": {
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

export interface EventPickerInnerProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  events: Array<{ id: string; time: number; title: string }>;
  sx?: import("@mui/material").SxProps<import("@mui/material").Theme>;
}

function EventPickerInner({ label, placeholder, value, onChange, events, sx }: EventPickerInnerProps) {
  return (
    <StyledFormControl variant="standard" sx={sx}>
      {label && <InputLabel shrink={true}>{label}</InputLabel>}
      <Select
        value={value ?? ""}
        displayEmpty
        onChange={(e) => onChange?.(e.target.value as string)}
        label={label}
        renderValue={(selected) => {
          if (!selected) {
            return <span style={styles.placeholderText}>{placeholder || "— none —"}</span>;
          }
          const event = events.find((e) => e.id === selected);
          return event ? `T${event.time} · ${event.title}` : (selected as string);
        }}
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
          {placeholder || "— none —"}
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

export const EventPicker = withRHFControl<string, EventPickerInnerProps>(EventPickerInner);
const styles = {
  placeholderText: {
    color: "var(--text-muted)",
  },
} satisfies Record<string, React.CSSProperties>;

import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useController } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";

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

interface SelProps<T extends FieldValues = FieldValues> {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  opts: string[];
  control?: Control<T>;
  name?: string;
}

function SelInner({ label, value, onChange, opts }: SelProps) {
  return (
    <StyledFormControl variant="standard">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
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

function ControlledSel<T extends FieldValues>({ control, name, ...props }: SelProps<T>) {
  const { field } = useController({ control: control!, name: name! });
  return <SelInner {...props} value={field.value ?? ""} onChange={(v: string) => field.onChange(v)} />;
}

export function Sel<T extends FieldValues = FieldValues>(props: SelProps<T>) {
  if (props.control && props.name) {
    return <ControlledSel<T> {...(props as SelProps<T>)} />;
  }
  return <SelInner {...props} />;
}

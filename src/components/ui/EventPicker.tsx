import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

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

interface EventPickerProps<T extends FieldValues = FieldValues> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  events: Array<{ id: string; time: number; title: string }>;
  control?: Control<T>;
  name?: Path<T>;
  sx?: any;
}

type EventPickerInnerProps = Omit<EventPickerProps<FieldValues>, "control" | "name">;

function EventPickerInner({ label, placeholder, value, onChange, events, sx }: EventPickerInnerProps) {
  return (
    <StyledFormControl variant="standard" sx={sx}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value ?? ""}
        displayEmpty
        onChange={(e) => onChange?.(e.target.value as string)}
        label={label}
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: "var(--text-muted)" }}>{placeholder || "— none —"}</span>;
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

function ControlledEventPicker<T extends FieldValues>({ control, name, ...rest }: EventPickerProps<T>) {
  const { field } = useController({ control: control!, name: name! });
  return <EventPickerInner {...rest} value={field.value ?? ""} onChange={(v: string) => field.onChange(v)} />;
}

export function EventPicker<T extends FieldValues = FieldValues>(props: EventPickerProps<T>) {
  if (props.control && props.name) {
    return <ControlledEventPicker<T> {...props} />;
  }
  const { control, name, ...rest } = props;
  void control;
  void name;
  return <EventPickerInner {...rest} />;
}

import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useController } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";

const StyledTextField = styled(TextField)(() => ({
  width: "100%",
  marginBottom: 16,
  "& .MuiInputBase-root": {
    fontFamily: "Georgia, serif",
    fontSize: 14,
    color: "var(--mui-text-color)",
    background: "transparent",
    "&:before": { borderBottomColor: "var(--mui-input-before)" },
    "&:after": { borderBottomColor: "var(--mui-input-before)" },
    "&:hover:not(.Mui-disabled):before": {
      borderBottomColor: "var(--mui-input-before)",
    },
  },
  "& .MuiInputBase-input": {
    color: "var(--mui-text-color)",
    "&::placeholder": { color: "var(--text-muted)", opacity: 1 },
  },
  "& .MuiInputLabel-root": {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--mui-label-color)",
    "&.Mui-focused": { color: "var(--mui-label-color)" },
  },
}));

interface FieldProps<T extends FieldValues = FieldValues> extends Omit<
  TextFieldProps,
  "onChange" | "multiline" | "rows" | "variant" | "value"
> {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  control?: Control<T>;
  name?: string;
  multi?: boolean;
  rows?: number;
}

function FieldInner({ label, value, onChange, multi, rows = 3, placeholder = "", ...props }: FieldProps) {
  return (
    <StyledTextField
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      multiline={multi}
      rows={multi ? rows : undefined}
      placeholder={placeholder}
      variant="standard"
      fullWidth
      {...props}
    />
  );
}

function ControlledField<T extends FieldValues>({ control, name, ...props }: FieldProps<T>) {
  const { field } = useController({ control: control!, name: name! });
  return <FieldInner {...props} value={field.value ?? ""} onChange={(v: string) => field.onChange(v)} />;
}

export function Field<T extends FieldValues = FieldValues>(props: FieldProps<T>) {
  if (props.control && props.name) {
    return <ControlledField<T> {...(props as FieldProps<T>)} />;
  }
  return <FieldInner {...props} />;
}

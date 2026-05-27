import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import { styled } from "@mui/material/styles";

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

interface FieldProps extends Omit<
  TextFieldProps,
  "onChange" | "multiline" | "rows" | "variant"
> {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
  rows?: number;
}

export function Field({
  label,
  value,
  onChange,
  multi,
  rows = 3,
  placeholder = "",
  ...props
}: FieldProps) {
  return (
    <StyledTextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      multiline={multi}
      rows={multi ? rows : undefined}
      placeholder={placeholder}
      variant="standard"
      fullWidth
      {...props}
    />
  );
}

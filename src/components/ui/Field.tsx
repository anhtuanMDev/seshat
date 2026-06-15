import { TextField } from "@mui/material";
import type { TextFieldProps, InputLabelProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

const StyledTextField = styled(TextField)(() => ({
  width: "100%",
  marginBottom: 16,
  "& .MuiFilledInput-root": {
    fontSize: 14,
    color: "var(--mui-text-color)",
    background: "var(--bg-active)",
    "&:before": { borderBottomColor: "var(--border)" },
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
  label?: React.ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  control?: Control<T>;
  name?: Path<T>;
  multi?: boolean;
  rows?: number;
  InputProps?: Partial<import("@mui/material").InputProps>;
  InputLabelProps?: Partial<import("@mui/material").InputLabelProps>;
}

type FieldInnerProps = Omit<FieldProps<FieldValues>, "control" | "name">;

function FieldInner({
  label,
  value,
  onChange,
  multi,
  rows = 3,
  placeholder = "",
  type,
  InputLabelProps,
  InputProps,
  slotProps,
  ...props
}: FieldInnerProps & { type?: string }) {
  const isDate = type === "date" || type === "datetime-local";
  const shrink = isDate || InputLabelProps?.shrink;

  const StyledField = StyledTextField as unknown as React.FC<
    Omit<import("@mui/material").TextFieldProps, "variant"> & {
      variant?: "filled";
    }
  >;

  return (
    <StyledField
      label={label}
      value={value ?? ""}
      onChange={(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => onChange?.(e.target.value)}
      multiline={multi}
      minRows={multi ? rows : undefined}
      placeholder={placeholder}
      variant="filled"
      fullWidth
      type={type}
      slotProps={{
        ...slotProps,
        input: {
          ...InputProps,
          ...slotProps?.input,
        },
        inputLabel: {
          ...InputLabelProps,
          shrink: shrink ? true : undefined,
          ...slotProps?.inputLabel,
        } as InputLabelProps,
      }}
      {...props}
    />
  );
}

function ControlledField<T extends FieldValues>({
  control,
  name,
  ...rest
}: FieldProps<T>) {
  const { field } = useController({ control: control!, name: name! });
  return (
    <FieldInner
      {...rest}
      value={field.value ?? ""}
      onChange={(v: string) => field.onChange(v)}
    />
  );
}

export function Field<T extends FieldValues = FieldValues>(
  props: FieldProps<T>,
) {
  if (props.control && props.name) {
    return <ControlledField<T> {...props} />;
  }
  const { control, name, ...rest } = props;
  void control;
  void name;
  return <FieldInner {...rest} />;
}

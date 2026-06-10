import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

const StyledButton = styled(Button)(() => ({
  fontSize: 12,
  letterSpacing: 1,
  padding: "3px 12px",
  textTransform: "none",
  minWidth: 0,
  borderRadius: 2,
  "&:hover": { background: "none" },
}));

interface ToggleProps<T extends FieldValues = FieldValues> {
  label?: string;
  value?: boolean;
  onChange?: (v: boolean) => void;
  control?: Control<T>;
  name?: Path<T>;
}

type ToggleInnerProps = Omit<ToggleProps<FieldValues>, "control" | "name">;

function ToggleInner({ label, value, onChange }: ToggleInnerProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            marginBottom: 4,
          }}
        >
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

function ControlledToggle<T extends FieldValues>({ control, name, ...rest }: ToggleProps<T>) {
  const { field } = useController({ control: control!, name: name! });
  return <ToggleInner {...rest} value={field.value ?? false} onChange={(v: boolean) => field.onChange(v)} />;
}

export function Toggle<T extends FieldValues = FieldValues>(props: ToggleProps<T>) {
  if (props.control && props.name) {
    return <ControlledToggle<T> {...props} />;
  }
  const { control, name, ...rest } = props;
  void control;
  void name;
  return <ToggleInner {...rest} />;
}

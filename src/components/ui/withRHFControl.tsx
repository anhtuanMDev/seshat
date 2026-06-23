import { useController } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

export interface RHFProps<T extends FieldValues = FieldValues, V = unknown> {
  control?: Control<T>;
  name?: Path<T>;
  value?: V;
  onChange?: (v: V) => void;
}

export function withRHFControl<
  V,
  P extends { value?: V; onChange?: (v: V) => void }
>(InnerComponent: React.ComponentType<P>) {
  function ControlledWrapper<T extends FieldValues>(props: P & RHFProps<T, V>) {
    const { control, name, onChange, ...rest } = props;
    const { field } = useController({ control: control!, name: name! });
    return (
      <InnerComponent
        {...(rest as unknown as P)}
        value={field.value ?? ""}
        onChange={(v: V) => {
          field.onChange(v);
          onChange?.(v);
        }}
      />
    );
  }

  return function OuterComponent<T extends FieldValues>(
    props: P & RHFProps<T, V>
  ) {
    if (props.control && props.name) {
      return <ControlledWrapper<T> {...props} />;
    }
    const rest = { ...props };
    delete rest.control;
    delete rest.name;
    return <InnerComponent {...(rest as unknown as P)} />;
  };
}

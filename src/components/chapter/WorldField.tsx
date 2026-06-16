import { memo } from "react";
import { S } from "../../lib/utils";

interface WorldFieldProps {
  label: string;
  value: string;
}

export const WorldField = memo(function WorldField({
  label,
  value,
}: WorldFieldProps) {
  if (!value) return null;
  return (
    <div style={styles.container}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value}</p>
    </div>
  );
});

const styles = {
  container: {
    marginBottom: 14,
  },
  label: {
    ...S.dim,
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 10,
  },
  value: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
} satisfies Record<string, React.CSSProperties>;

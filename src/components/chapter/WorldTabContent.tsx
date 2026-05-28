import { S } from "../../lib/utils";

interface WorldTabContentProps {
  synopsis: string;
  themes: string;
  setting: string;
  rules: string;
}

function WorldField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <p
        style={{
          ...S.dim,
          marginBottom: 4,
          letterSpacing: 1,
          textTransform: "uppercase",
          fontSize: 10,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        {value}
      </p>
    </div>
  );
}

export function WorldTabContent({
  synopsis,
  themes,
  setting,
  rules,
}: WorldTabContentProps) {
  const hasAny = synopsis || themes || setting || rules;

  if (!hasAny) {
    return (
      <p style={S.dim}>
        Fill in world details on the World page to see them here.
      </p>
    );
  }

  return (
    <div style={{ lineHeight: 1.65 }}>
      <WorldField label="Premise" value={synopsis} />
      <WorldField label="Themes" value={themes} />
      <WorldField label="Setting" value={setting} />
      <WorldField label="World rules" value={rules} />
    </div>
  );
}

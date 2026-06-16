import { memo } from "react";
import { S } from "../../lib/utils";
import { WorldField } from "./WorldField";

interface WorldTabContentProps {
  synopsis: string;
  themes: string;
  setting: string;
  rules: string;
}

export const WorldTabContent = memo(function WorldTabContent({
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
    <div style={styles.container}>
      <WorldField label="Premise" value={synopsis} />
      <WorldField label="Themes" value={themes} />
      <WorldField label="Setting" value={setting} />
      <WorldField label="World rules" value={rules} />
    </div>
  );
});

const styles = {
  container: {
    lineHeight: 1.65,
  },
} satisfies Record<string, React.CSSProperties>;

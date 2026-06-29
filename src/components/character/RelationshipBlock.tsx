import { useFieldArray } from "react-hook-form";
import { S, mkRelTimelineEntry } from "../../lib/utils";
import { Field, Sel } from "../ui";
import { AddIcon, DeleteIcon } from "../ui/icons";
import type { BlockProps } from "./types";
import type { Character } from "../../store/appStore";

interface RelationshipBlockProps extends Omit<BlockProps, "onDelete"> {
  characters: Character[];
  currentCharacterId: string;
}

export function RelationshipBlock({
  control,
  index,
  characters,
  currentCharacterId,
}: RelationshipBlockProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `relationships.${index}.timeline`,
  });

  const availableCharacters = characters
    .filter((c) => c.id !== currentCharacterId)
    .map((c) => ({ label: c.name, value: c.id }));

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.fieldWrap}>
          <Sel
            label="Target Character"
            name={`relationships.${index}.withId` as const}
            control={control}
            options={availableCharacters}
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="General Dynamic"
            name={`relationships.${index}.feel` as const}
            control={control}
            placeholder="e.g. Rivalry, Mentorship..."
          />
        </div>
      </div>

      <div style={styles.timelineSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Evolution Timeline</span>
          <button
            type="button"
            onClick={() => append(mkRelTimelineEntry())}
            style={styles.addBtnMinimal}
          >
            <AddIcon sx={{ fontSize: 14 }} /> Add Event
          </button>
        </div>

        <div style={styles.timelineList}>
          {fields.map((item, tIdx) => (
            <div key={item.id} style={styles.timelineNode}>
              <div style={styles.nodeGrid}>
                <div style={styles.timeCol}>
                  <Field
                    label="Time"
                    name={`relationships.${index}.timeline.${tIdx}.time` as const}
                    control={control}
                    type="number"
                  />
                </div>
                <div style={styles.dynamicCol}>
                  <Field
                    label="Evolved Dynamic"
                    name={`relationships.${index}.timeline.${tIdx}.dynamic` as const}
                    control={control}
                    placeholder="e.g. Betrayal"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(tIdx)}
                style={styles.deleteBtnMinimal}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <div style={styles.emptyWrap}>
              <span style={styles.emptyText}>No timeline events recorded.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "48px",
    padding: "8px 16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
  },
  timelineSection: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "8px",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  addBtnMinimal: {
    ...S.ghost,
    fontSize: "0.75rem",
    color: "var(--color-primary)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  timelineNode: {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
  },
  nodeGrid: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    gap: "32px",
  },
  timeCol: {
    display: "flex",
    flexDirection: "column",
  },
  dynamicCol: {
    display: "flex",
    flexDirection: "column",
  },
  deleteBtnMinimal: {
    ...S.ghost,
    padding: "8px",
    color: "var(--text-muted)",
    marginTop: "20px",
  },
  emptyWrap: {
    padding: "16px 0",
  },
  emptyText: {
    ...S.dim,
    fontSize: "0.875rem",
    fontStyle: "italic",
  },
} satisfies Record<string, React.CSSProperties>;

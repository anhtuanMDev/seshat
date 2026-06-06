import { useFieldArray, useWatch } from "react-hook-form";
import { S, mkRelTimelineEntry } from "../../lib/utils";
import { Field, Sel, EntryBlock } from "../ui";
import { AddIcon, DeleteIcon } from "../ui/icons";
import type { BlockProps } from "./types";
import type { Character } from "../../store/appStore";

interface RelationshipBlockProps extends BlockProps {
  characters: Character[];
  currentCharacterId: string;
}

export function RelationshipBlock({
  control,
  index,
  onDelete,
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
    <EntryBlock color="var(--color-purple)" onDelete={onDelete}>
      <div style={S.grid2} className="seshat-grid2">
        <Sel
          label="Other Character"
          name={`relationships.${index}.withId` as const}
          control={control}
          options={availableCharacters}
        />
        <Field
          label="General Feel (e.g. Love, Hate, Fear)"
          name={`relationships.${index}.feel` as const}
          control={control}
          placeholder="Romantic, Hostile, Protective..."
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ ...S.h2, margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            Evolution Timeline
          </p>
          <button
            type="button"
            onClick={() => append(mkRelTimelineEntry())}
            style={{ ...S.ghost, fontSize: 11, display: "flex", alignItems: "center", gap: 3, color: "var(--color-purple)" }}
          >
            <AddIcon sx={{ fontSize: 14 }} /> add timeline entry
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fields.map((item, tIdx) => (
            <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ width: 80 }}>
                <Field
                  label="Time (e.g. 1)"
                  name={`relationships.${index}.timeline.${tIdx}.time` as const}
                  control={control}
                  type="number"
                />
              </div>
              <div style={{ flex: 1 }}>
                <Field
                  label="Dynamic (e.g. Rivals, Allies)"
                  name={`relationships.${index}.timeline.${tIdx}.dynamic` as const}
                  control={control}
                  placeholder="Rivals..."
                />
              </div>
              <button
                type="button"
                onClick={() => remove(tIdx)}
                style={{ ...S.ghost, padding: "8px", color: "var(--text-muted)", marginBottom: 16 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-red)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <p style={{ ...S.dim, fontSize: 12, marginTop: 4 }}>No timeline entries. Add one to see the relationship evolve over time!</p>
          )}
        </div>
      </div>
    </EntryBlock>
  );
}

import { useFieldArray } from "react-hook-form";
import type { Control } from "react-hook-form";
import { S, mkSceneCard } from "../../lib/utils";
import { Field } from "../ui";
import {
  AddIcon,
  DeleteIcon,
  FlagIcon,
  PsychologyIcon,
  CenterFocusStrongIcon,
} from "../ui/icons";
import type { ChapterForm } from "../../pages/ChapterPage";

interface SceneOutlinePanelProps {
  control: Control<ChapterForm>;
}

export function SceneOutlinePanel({ control }: SceneOutlinePanelProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "scenes",
  });

  return (
    <div style={{ marginBottom: 32, paddingRight: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <p
          title="Beat Sheet & Scene Outline"
          style={{
            ...S.h2,
            margin: 0,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-secondary)",
          }}
        >
          <CenterFocusStrongIcon sx={{ fontSize: 14 }} />
          Scene Outline ({fields.length})
        </p>
        <button
          type="button"
          onClick={() => append(mkSceneCard())}
          style={{
            ...S.ghost,
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 3,
            color: "var(--text-secondary)",
          }}
        >
          <AddIcon sx={{ fontSize: 13 }} /> add scene card
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {fields.map((item, index) => (
          <div
            key={item.id}
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 16,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <div style={{ flex: 1, marginRight: 16 }}>
                <input
                  {...control.register(`scenes.${index}.title` as const)}
                  placeholder={`Scene ${index + 1} Name...`}
                  style={{
                    ...S.input,
                    fontSize: 16,
                    fontWeight: "bold",
                    border: "none",
                    padding: 0,
                    width: "100%",
                    background: "transparent",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-red)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <Field
                  label={
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <PsychologyIcon sx={{ fontSize: 12 }} /> POV Character
                    </span>
                  }
                  name={`scenes.${index}.pov` as const}
                  control={control}
                  placeholder="Who's head are we in?"
                />
              </div>
              <div>
                <Field
                  label={
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <FlagIcon sx={{ fontSize: 12 }} /> Scene Goal
                    </span>
                  }
                  name={`scenes.${index}.goal` as const}
                  control={control}
                  placeholder="What do they want right now?"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginTop: 8,
              }}
            >
              <Field
                label="Conflict / Obstacle"
                name={`scenes.${index}.conflict` as const}
                control={control}
                multi
                rows={2}
                placeholder="What stands in their way?"
              />
              <Field
                label="Outcome / Disaster"
                name={`scenes.${index}.outcome` as const}
                control={control}
                multi
                rows={2}
                placeholder="Do they get it? (Yes but / No and)"
              />
            </div>
          </div>
        ))}
      </div>

      {fields.length > 0 && (
        <hr
          style={{
            border: "none",
            borderTop: "1px dashed var(--border)",
            margin: "24px 0",
          }}
        />
      )}
    </div>
  );
}

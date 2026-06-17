import { S } from "../../lib/utils";
import { Field, Sel, EventPicker, EntryBlock } from "../ui";
import { EQUIP_SLOTS, EQUIP_ACCESS } from "../../lib/constants";
import type { BlockProps } from "./types";
import { useFieldArray } from "react-hook-form";
import { AddIcon, DeleteIcon } from "../ui/icons";

interface EquipmentBlockProps extends BlockProps {
  color: string;
  events: Array<{ id: string; time: number; title: string }>;
}

export function EquipmentBlock({
  control,
  index,
  color,
  onDelete,
  events,
}: EquipmentBlockProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `equipment.${index}.history`,
  });

  return (
    <EntryBlock color={color} onDelete={onDelete}>
      <div style={S.grid3} className="seshat-grid3">
        <Field
          label="Item name"
          name={`equipment.${index}.name` as const}
          control={control}
          placeholder="Excalibur, Ring of Power…"
        />
        <Sel
          label="Slot"
          name={`equipment.${index}.slot` as const}
          control={control}
          opts={EQUIP_SLOTS}
        />
        <Sel
          label="Rarity"
          name={`equipment.${index}.rarity` as const}
          control={control}
          options={[
            { value: "Common", label: "Common (Gray)" },
            { value: "Rare", label: "Rare (Blue)" },
            { value: "Epic", label: "Epic (Purple)" },
            { value: "Legendary", label: "Legendary (Gold)" },
          ]}
        />
      </div>

      <div style={S.grid2} className="seshat-grid2">
        <Sel
          label="Access state (Base)"
          name={`equipment.${index}.accessState` as const}
          control={control}
          opts={EQUIP_ACCESS}
        />
        <Field
          label="Uses / durability"
          name={`equipment.${index}.uses` as const}
          control={control}
          placeholder="3/3, ∞…"
        />
      </div>

      <div style={S.grid2} className="seshat-grid2">
        <EventPicker
          label="Acquired at event"
          name={`equipment.${index}.atEventId` as const}
          control={control}
          events={events}
        />
        <EventPicker
          label="Lost at event (optional)"
          name={`equipment.${index}.lostEventId` as const}
          control={control}
          events={events}
        />
      </div>

      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Stats / benefits"
          name={`equipment.${index}.stats` as const}
          control={control}
          placeholder="+5 Attack, fire protection…"
        />
        <Field
          label="Curses / downsides"
          name={`equipment.${index}.curses` as const}
          control={control}
          placeholder="Drains health, attracts monsters…"
        />
      </div>

      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Unbind condition"
          name={`equipment.${index}.unbindCondition` as const}
          control={control}
          placeholder="Must defeat the forge-master…"
        />
        <Field
          label="Creator / origin"
          name={`equipment.${index}.creator` as const}
          control={control}
          placeholder="Ancient elves, blacksmith Jack…"
        />
      </div>

      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Why it was created"
          name={`equipment.${index}.createdWhy` as const}
          control={control}
          placeholder="To defeat the shadow king…"
        />
        <div />
      </div>

      <Field
        label="Ingredients / components"
        name={`equipment.${index}.ingredients` as const}
        control={control}
        multi
        rows={2}
        placeholder="1x Mithril Bar, 1x Dragon Scale…"
      />

      <Field
        label="Lore / history"
        name={`equipment.${index}.lore` as const}
        control={control}
        multi
        rows={2}
        placeholder="Forged in the heart of a dying star…"
      />

      <Field
        label="Access note / current location"
        name={`equipment.${index}.accessNote` as const}
        control={control}
        multi
        rows={2}
        placeholder="Currently locked in the vault of Castle Ironfist…"
      />

      {/* ── Access State Timeline Overrides ── */}
      <div style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ ...S.h2, margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
            ⏳ Access State Timeline Overrides
          </p>
          <button
            type="button"
            onClick={() => append({ eventId: "", accessState: "Stored" })}
            style={{ ...S.ghost, fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", color: "var(--color-primary)" }}
          >
            <AddIcon sx={{ fontSize: 13 }} /> add state override
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {fields.map((item, hIdx) => (
            <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <EventPicker
                  label="At Event"
                  name={`equipment.${index}.history.${hIdx}.eventId` as const}
                  control={control}
                  events={events}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Sel
                  label="Override Access State"
                  name={`equipment.${index}.history.${hIdx}.accessState` as const}
                  control={control}
                  opts={EQUIP_ACCESS}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(hIdx)}
                style={{ ...S.ghost, padding: "8px", color: "var(--text-muted)", marginBottom: "4px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-red)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <p style={{ ...S.dim, fontSize: "11px", margin: 0, fontStyle: "italic" }}>
              No timeline overrides. Item state is determined by its base state.
            </p>
          )}
        </div>
      </div>
    </EntryBlock>
  );
}

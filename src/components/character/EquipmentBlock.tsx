import { S } from "../../lib/utils";
import { Field, Sel, EventPicker } from "../ui";
import { EQUIP_SLOTS, EQUIP_ACCESS } from "../../lib/constants";
import type { BlockProps } from "./types";
import { useFieldArray } from "react-hook-form";
import { AddIcon, DeleteIcon } from "../ui/icons";

interface EquipmentBlockProps extends Omit<BlockProps, "onDelete"> {
  events: Array<{ id: string; time: number; title: string }>;
}

export function EquipmentBlock({ control, index, events }: EquipmentBlockProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `equipment.${index}.history`,
  });

  return (
    <div style={styles.container}>
      <div style={styles.grid3}>
        <div style={styles.fieldWrap}>
          <Field
            label="Item name"
            name={`equipment.${index}.name` as const}
            control={control}
            placeholder="Excalibur, Ring of Power…"
          />
        </div>
        <div style={styles.fieldWrap}>
          <Sel
            label="Slot"
            name={`equipment.${index}.slot` as const}
            control={control}
            opts={EQUIP_SLOTS}
          />
        </div>
        <div style={styles.fieldWrap}>
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
      </div>

      <div style={styles.grid2}>
        <div style={styles.fieldWrap}>
          <Sel
            label="Access state (Base)"
            name={`equipment.${index}.accessState` as const}
            control={control}
            opts={EQUIP_ACCESS}
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="Uses / durability"
            name={`equipment.${index}.uses` as const}
            control={control}
            placeholder="3/3, ∞…"
          />
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.fieldWrap}>
          <EventPicker
            label="Acquired at event"
            name={`equipment.${index}.atEventId` as const}
            control={control}
            events={events}
          />
        </div>
        <div style={styles.fieldWrap}>
          <EventPicker
            label="Lost at event (optional)"
            name={`equipment.${index}.lostEventId` as const}
            control={control}
            events={events}
          />
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.fieldWrap}>
          <Field
            label="Stats / benefits"
            name={`equipment.${index}.stats` as const}
            control={control}
            placeholder="+5 Attack, fire protection…"
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="Curses / downsides"
            name={`equipment.${index}.curses` as const}
            control={control}
            placeholder="Drains health, attracts monsters…"
          />
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.fieldWrap}>
          <Field
            label="Unbind condition"
            name={`equipment.${index}.unbindCondition` as const}
            control={control}
            placeholder="Must defeat the forge-master…"
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="Creator / origin"
            name={`equipment.${index}.creator` as const}
            control={control}
            placeholder="Ancient elves, blacksmith Jack…"
          />
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.fieldWrap}>
          <Field
            label="Why it was created"
            name={`equipment.${index}.createdWhy` as const}
            control={control}
            placeholder="To defeat the shadow king…"
          />
        </div>
        <div style={styles.fieldWrap} />
      </div>

      <div style={styles.stack}>
        <div style={styles.fieldWrap}>
          <Field
            label="Ingredients / components"
            name={`equipment.${index}.ingredients` as const}
            control={control}
            multi
            rows={2}
            placeholder="1x Mithril Bar, 1x Dragon Scale…"
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="Lore / history"
            name={`equipment.${index}.lore` as const}
            control={control}
            multi
            rows={2}
            placeholder="Forged in the heart of a dying star…"
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="Access note / current location"
            name={`equipment.${index}.accessNote` as const}
            control={control}
            multi
            rows={2}
            placeholder="Currently locked in the vault of Castle Ironfist…"
          />
        </div>
      </div>

      <div style={styles.timelineSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Access State Timeline Overrides</span>
          <button
            type="button"
            onClick={() => append({ eventId: "", accessState: "Stored" })}
            style={styles.addBtnMinimal}
          >
            <AddIcon sx={{ fontSize: 14 }} /> Add State Override
          </button>
        </div>

        <div style={styles.timelineList}>
          {fields.map((item, hIdx) => (
            <div key={item.id} style={styles.timelineNode}>
              <div style={styles.nodeGrid}>
                <div style={styles.fieldWrap}>
                  <EventPicker
                    label="At Event"
                    name={`equipment.${index}.history.${hIdx}.eventId` as const}
                    control={control}
                    events={events}
                  />
                </div>
                <div style={styles.fieldWrap}>
                  <Sel
                    label="Override Access State"
                    name={`equipment.${index}.history.${hIdx}.accessState` as const}
                    control={control}
                    opts={EQUIP_ACCESS}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(hIdx)}
                style={styles.deleteBtnMinimal}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <div style={styles.emptyWrap}>
              <span style={styles.emptyText}>
                No timeline overrides. Item state is determined by its base state.
              </span>
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
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "32px",
    alignItems: "start",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    alignItems: "start",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
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
    gridTemplateColumns: "2fr 1fr",
    gap: "32px",
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

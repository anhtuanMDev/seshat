import { Field, EventPicker } from "../ui";
import type { BlockProps } from "./types";

interface AchievementBlockProps extends Omit<BlockProps, "onDelete"> {
  events: Array<{ id: string; time: number; title: string }>;
}

export function AchievementBlock({ control, index, events }: AchievementBlockProps) {
  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.fieldWrapTitle}>
          <Field
            label="Title"
            name={`achievements.${index}.title` as const}
            control={control}
            placeholder="e.g., Mastered the void step…"
          />
        </div>
        <div style={styles.fieldWrapTime}>
          <Field
            label="At time (T#)"
            name={`achievements.${index}.atTime` as const}
            control={control}
            placeholder="e.g., T4"
          />
        </div>
      </div>

      <div style={styles.stack}>
        <div style={styles.fieldWrap}>
          <EventPicker
            label="Associated Event (Optional)"
            name={`achievements.${index}.atEventId` as const}
            control={control}
            events={events}
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="What they gained"
            name={`achievements.${index}.gained` as const}
            control={control}
            placeholder="e.g., Respect of the guild, a new power, a scar…"
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="Detailed Description"
            name={`achievements.${index}.description` as const}
            control={control}
            multi
            rows={4}
            placeholder="What happened? Why does it matter to their journey?"
          />
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
    gridTemplateColumns: "1fr 100px",
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
  fieldWrapTitle: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  fieldWrapTime: {
    display: "flex",
    flexDirection: "column",
  },
} satisfies Record<string, React.CSSProperties>;

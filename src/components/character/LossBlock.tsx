import { Field, EventPicker } from "../ui";
import type { BlockProps } from "./types";

interface LossBlockProps extends Omit<BlockProps, "onDelete"> {
  events: Array<{ id: string; time: number; title: string }>;
}

export function LossBlock({ control, index, events }: LossBlockProps) {
  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.fieldWrapTitle}>
          <Field
            label="What was lost"
            name={`losses.${index}.title` as const}
            control={control}
            placeholder="e.g., Their mentor, their right eye, their innocence…"
          />
        </div>
        <div style={styles.fieldWrapTime}>
          <Field
            label="At time (T#)"
            name={`losses.${index}.atTime` as const}
            control={control}
            placeholder="e.g., T6"
          />
        </div>
      </div>

      <div style={styles.stack}>
        <div style={styles.fieldWrap}>
          <EventPicker
            label="Associated Event (Optional)"
            name={`losses.${index}.atEventId` as const}
            control={control}
            events={events}
          />
        </div>
        <div style={styles.fieldWrap}>
          <Field
            label="Detailed Description"
            name={`losses.${index}.description` as const}
            control={control}
            multi
            rows={4}
            placeholder="How did it happen? What was the emotional and physical cost? How does this permanently alter their trajectory?"
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

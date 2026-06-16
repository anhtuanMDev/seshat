import { memo } from "react";
import { S } from "../../lib/utils";
import { CameraAltIcon } from "../ui/icons";
import type { Event } from "../../lib/types";

interface SnapshotCardProps {
  color: string;
  event: Event | undefined;
  power: string | undefined;
}

export const SnapshotCard = memo(function SnapshotCard({ color, event, power }: SnapshotCardProps) {
  return (
    <div
      style={{
        ...styles.container,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p style={styles.header}>
        <CameraAltIcon sx={{ fontSize: 11 }} />Snapshot
      </p>
      <p style={styles.eventText}>
        {event
          ? `T${event.time} — ${event.title}`
          : "No timeline data"}
      </p>
      {power && (
        <p style={styles.powerText}>
          Power: {power}
        </p>
      )}
    </div>
  );
});

const styles = {
  container: {
    padding: "var(--space-2) var(--space-3)",
    background: "var(--bg-status)",
    borderRadius: "var(--space-1)",
  },
  header: {
    ...S.dim,
    marginBottom: "var(--space-1)",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
  },
  eventText: {
    fontSize: "var(--text-xs)",
    color: "var(--text-primary)",
  },
  powerText: {
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
} satisfies Record<string, React.CSSProperties>;

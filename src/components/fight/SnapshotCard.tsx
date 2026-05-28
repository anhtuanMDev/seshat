import { S } from "../../lib/utils";
import type { Event } from "../../lib/types";

interface SnapshotCardProps {
  color: string;
  event: Event | undefined;
  power: string | undefined;
}

export function SnapshotCard({ color, event, power }: SnapshotCardProps) {
  return (
    <div
      style={{
        padding: "8px 12px",
        background: "var(--bg-status)",
        borderRadius: 2,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p style={{ ...S.dim, marginBottom: 4 }}>Snapshot</p>
      <p style={{ fontSize: 12, color: "var(--text-primary)" }}>
        {event
          ? `T${event.time} — ${event.title}`
          : "No timeline data"}
      </p>
      {power && (
        <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          Power: {power}
        </p>
      )}
    </div>
  );
}

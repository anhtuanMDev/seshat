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
        padding: "var(--space-2) var(--space-3)",
        background: "var(--bg-status)",
        borderRadius: "var(--space-1)",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p style={{ ...S.dim, marginBottom: "var(--space-1)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
        <CameraAltIcon sx={{ fontSize: 11 }} />Snapshot</p>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
        {event
          ? `T${event.time} — ${event.title}`
          : "No timeline data"}
      </p>
      {power && (
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Power: {power}
        </p>
      )}
    </div>
  );
});

import type { StatusEntry, Event } from "../../lib/types";
import { POWER_TIERS, ARC_STAGES } from "../../lib/constants";
import { S } from "../../lib/utils";
import { EventPicker } from "./EventPicker";

interface CharStatusPanelProps {
  statusTimeline: StatusEntry[];
  color: string;
  events: Event[];
  onChange: (entries: StatusEntry[]) => void;
}

export function CharStatusPanel({
  statusTimeline,
  color,
  events,
  onChange,
}: CharStatusPanelProps) {
  const sorted = [...statusTimeline].sort((a, b) => {
    const evA = events.find((e) => e.id === a.eventId);
    const evB = events.find((e) => e.id === b.eventId);
    return (evA?.time ?? 0) - (evB?.time ?? 0) || a.id.localeCompare(b.id);
  });

  const patch = (i: number, f: keyof StatusEntry, v: StatusEntry[keyof StatusEntry]) => {
    const next = [...statusTimeline];
    next[i] = { ...next[i], [f]: v };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(statusTimeline.filter((_, idx) => idx !== i));
  };

  const cell = { marginBottom: 10 };
  const dateInputStyle = {
    ...S.input,
    fontSize: 12,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border)",
    paddingBottom: 2,
  };

  return (
    <div
      style={{
        background: "var(--bg-status)",
        padding: 16,
        borderRadius: 2,
        marginBottom: 24,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase",
          margin: "0 0 10px",
          fontWeight: 400,
          color,
        }}
      >
        Status Timeline
      </p>

      {sorted.map((entry, i) => {
        const ev = events.find((e) => e.id === entry.eventId);
        const evStart = ev?.startDate || "";
        const evEnd = ev?.endDate || "";

        return (
          <div
            key={entry.id}
            style={{
              ...cell,
              padding: 12,
              border: "1px solid var(--border)",
              borderRadius: 2,
              position: "relative",
            }}
          >
            {/* ── Event picker row ── */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 8,
                alignItems: "end",
              }}
            >
              <EventPicker
                label="Event"
                value={entry.eventId}
                onChange={(v) => patch(i, "eventId", v)}
                events={events}
              />
              {ev && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    paddingBottom: 4,
                  }}
                >
                  {[evStart && evStart.replace("T", " "), evEnd && `→ ${evEnd.replace("T", " ")}`]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              )}
              <button
                onClick={() => remove(i)}
                style={{
                  ...S.ghost,
                  fontSize: 11,
                  color: "var(--color-red)",
                  marginLeft: "auto",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* ── Status date range ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 12px",
                marginBottom: 8,
              }}
            >
              <div>
                <label style={S.label}>From</label>
                <input
                  type="datetime-local"
                  value={entry.startDate || ""}
                  min={evStart || undefined}
                  max={evEnd || undefined}
                  onChange={(e) => patch(i, "startDate", e.target.value)}
                  style={dateInputStyle}
                />
              </div>
              <div>
                <label style={S.label}>To</label>
                <input
                  type="datetime-local"
                  value={entry.endDate || ""}
                  min={evStart || undefined}
                  max={evEnd || undefined}
                  onChange={(e) => patch(i, "endDate", e.target.value)}
                  style={dateInputStyle}
                />
              </div>
            </div>

            {/* ── Power / Arc / Emotional / Physical ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 12px",
                marginBottom: 8,
              }}
            >
              <div>
                <label style={S.label}>Power tier</label>
                <select
                  value={entry.power}
                  onChange={(e) => patch(i, "power", e.target.value)}
                  style={S.select}
                >
                  <option value="">—</option>
                  {POWER_TIERS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Arc stage</label>
                <select
                  value={entry.arcStage}
                  onChange={(e) => patch(i, "arcStage", e.target.value)}
                  style={S.select}
                >
                  <option value="">—</option>
                  {ARC_STAGES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Emotional state</label>
                <input
                  value={entry.emotionalState}
                  onChange={(e) => patch(i, "emotionalState", e.target.value)}
                  placeholder="Grief, resolute…"
                  style={S.input}
                />
              </div>
              <div>
                <label style={S.label}>Physical state</label>
                <input
                  value={entry.physicalState}
                  onChange={(e) => patch(i, "physicalState", e.target.value)}
                  placeholder="Injured, peak…"
                  style={S.input}
                />
              </div>
            </div>

            <textarea
              value={entry.note}
              onChange={(e) => patch(i, "note", e.target.value)}
              placeholder="How are they doing in this period? What's driving them?"
              rows={2}
              style={{
                width: "100%",
                fontFamily: "Georgia, serif",
                fontSize: 12,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border)",
                outline: "none",
                resize: "none",
                lineHeight: 1.6,
                padding: "2px 0",
              }}
            />
          </div>
        );
      })}

      {!statusTimeline.length && (
        <p style={{ color: "var(--text-dim)", fontSize: 12, fontStyle: "italic" }}>
          No status entries yet. Add one to track this character's state across the timeline.
        </p>
      )}
    </div>
  );
}

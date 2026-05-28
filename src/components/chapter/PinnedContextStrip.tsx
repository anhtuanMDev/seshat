import type { Character, Event } from "../../lib/types";

interface PinnedContextStripProps {
  pinnedCharObjs: Character[];
  pinnedEventObjs: Event[];
}

export function PinnedContextStrip({
  pinnedCharObjs,
  pinnedEventObjs,
}: PinnedContextStripProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {pinnedCharObjs.map((c: Character) => (
        <span
          key={c.id}
          style={{
            fontSize: 11,
            padding: "2px 8px",
            border: `1px solid ${c.color}`,
            color: c.color,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: c.color,
              display: "inline-block",
            }}
          />
          {c.name}
        </span>
      ))}
      {pinnedEventObjs.map((e: Event) => (
        <span
          key={e.id}
          style={{
            fontSize: 11,
            padding: "2px 8px",
            border: "1px solid var(--border-field)",
            color: "var(--text-secondary)",
            borderRadius: 3,
          }}
        >
          T{e.time} · {e.title}
        </span>
      ))}
    </div>
  );
}

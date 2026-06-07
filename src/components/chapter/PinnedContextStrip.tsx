import type { Character, Event } from "../../lib/types";
import { CloseIcon } from "../ui/icons";

interface PinnedContextStripProps {
  pinnedCharObjs: Character[];
  pinnedEventObjs: Event[];
  onRemoveChar: (id: string) => void;
  onRemoveEvent: (id: string) => void;
}

export function PinnedContextStrip({
  pinnedCharObjs,
  pinnedEventObjs,
  onRemoveChar,
  onRemoveEvent,
}: PinnedContextStripProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 20,
        paddingBottom: 16,
        paddingRight: 12,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {pinnedCharObjs.map((c: Character) => (
        <button
          key={c.id}
          onClick={() => onRemoveChar(c.id)}
          style={{
            fontSize: 11,
            fontFamily: "inherit",
            padding: "2px 6px 2px 8px",
            border: `1px solid ${c.color}`,
            color: c.color,
            background: "transparent",
            cursor: "pointer",
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
          <CloseIcon sx={{ fontSize: 12, opacity: 0.6 }} />
        </button>
      ))}
      {pinnedEventObjs.map((e: Event) => (
        <button
          key={e.id}
          onClick={() => onRemoveEvent(e.id)}
          style={{
            fontSize: 11,
            fontFamily: "inherit",
            padding: "2px 6px 2px 8px",
            border: "1px solid var(--border-field)",
            color: "var(--text-secondary)",
            background: "transparent",
            cursor: "pointer",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          T{e.time} · {e.title}
          <CloseIcon sx={{ fontSize: 12, opacity: 0.6 }} />
        </button>
      ))}
    </div>
  );
}

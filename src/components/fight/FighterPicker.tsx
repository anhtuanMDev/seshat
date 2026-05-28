import { S } from "../../lib/utils";
import { EventPicker } from "../ui";
import type { Character, Event } from "../../lib/types";

interface FighterPickerProps {
  label: string;
  charId: string;
  onCharChange: (id: string) => void;
  eventId: string;
  onEventChange: (id: string) => void;
  characters: Character[];
  events: Event[];
  selectedChar: Character | undefined;
}

export function FighterPicker({ label, charId, onCharChange, eventId, onEventChange, characters, events, selectedChar }: FighterPickerProps) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <select
        value={charId}
        onChange={(e) => onCharChange(e.target.value)}
        style={{ ...S.select }}
      >
        <option value="">— select —</option>
        {characters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {selectedChar && (
        <div style={{ marginTop: 8 }}>
          <EventPicker
            label="At timeline point"
            value={eventId}
            onChange={onEventChange}
            events={events.filter((e) =>
              (e.characters || []).includes(selectedChar.id),
            )}
          />
        </div>
      )}
    </div>
  );
}

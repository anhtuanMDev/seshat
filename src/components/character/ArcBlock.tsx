import { useWatch, type UseFormSetValue } from "react-hook-form";
import { S } from "../../lib/utils";
import { Field, EventPicker } from "../ui";
import type { BlockProps, CharacterForm } from "./types";
import { TimelineIcon, ArticleIcon } from "../ui/icons";

interface ArcBlockProps extends BlockProps {
  color: string;
  events: Array<{ id: string; time: number; title: string }>;
  setValue?: UseFormSetValue<CharacterForm>;
}

export function ArcBlock({ control, index, color, onDelete, events, setValue }: ArcBlockProps) {
  // Bypassing unused variables to satisfy the linter
  void onDelete;

  // Watch current event IDs
  const [fromVal, toVal] = useWatch({
    control,
    name: [
      `arcs.${index}.arcFromEventId` as const,
      `arcs.${index}.arcToEventId` as const,
    ],
  });

  const handleFromEventChange = (val: string) => {
    // If both events are null/empty, auto-populate the "to" event with the same selected event
    if (!fromVal && !toVal && setValue) {
      setValue(`arcs.${index}.arcToEventId` as const, val);
    }
  };

  return (
    <div className="seshat-modal-form-redesign" style={{ padding: "24px 28px" }}>
      {/* Section 1: Timeline Alignment */}
      <div className="seshat-form-section-container">
        <div className="seshat-form-section-header">
          <TimelineIcon sx={{ fontSize: 14, color: color || "var(--color-primary)" }} />
          <span>Timeline Alignment</span>
        </div>
        
        <div style={S.grid2} className="seshat-grid2">
          <EventPicker
            label="Arc Start Event"
            name={`arcs.${index}.arcFromEventId` as const}
            control={control}
            events={events}
            placeholder="— Start of story —"
            onChange={handleFromEventChange}
          />
          <EventPicker
            label="Arc End Event"
            name={`arcs.${index}.arcToEventId` as const}
            control={control}
            events={events}
            placeholder="— End of story —"
          />
        </div>

        <div style={S.grid2} className="seshat-grid2">
          <Field
            label="Arc Start Time Context"
            name={`arcs.${index}.arcFromTime` as const}
            control={control}
            placeholder="e.g. Year 120, Childhood..."
          />
          <Field
            label="Arc End Time Context"
            name={`arcs.${index}.arcToTime` as const}
            control={control}
            placeholder="e.g. Year 125, Adulthood..."
          />
        </div>
      </div>

      {/* Section 2: Arc Core Definition */}
      <div className="seshat-form-section-container">
        <div className="seshat-form-section-header">
          <ArticleIcon sx={{ fontSize: 14, color: color || "var(--color-primary)" }} />
          <span>Arc Core Definition</span>
        </div>

        <div style={S.grid2} className="seshat-grid2">
          <Field
            label="Arc Type"
            name={`arcs.${index}.arcType` as const}
            control={control}
            placeholder="Positive, Negative, Flat, Fall, Corruption..."
          />
          <Field
            label="The Lie They Believe"
            name={`arcs.${index}.arcLie` as const}
            control={control}
            placeholder="What false belief holds them back?"
          />
        </div>

        <div style={S.grid2} className="seshat-grid2">
          <Field
            label="The Truth They Must Learn"
            name={`arcs.${index}.arcTruth` as const}
            control={control}
            placeholder="The realization that will save (or destroy) them..."
          />
          <Field
            label="The Breaking Point"
            name={`arcs.${index}.arcBreakingPoint` as const}
            control={control}
            placeholder="The moment they must choose the truth or fail..."
          />
        </div>
      </div>

      {/* Section 3: Character Evolution */}
      <div className="seshat-form-section-container">
        <div className="seshat-form-section-header">
          <span>Character Evolution</span>
        </div>

        <div style={S.grid2} className="seshat-grid2">
          <Field
            label="Arc Start — Who they are"
            name={`arcs.${index}.arcStart` as const}
            control={control}
            placeholder="Closed off, convinced the world is cruel…"
          />
          <Field
            label="Arc End — Who they become"
            name={`arcs.${index}.arcEnd` as const}
            control={control}
            placeholder="Capable of trust, grief without collapse…"
          />
        </div>
      </div>
    </div>
  );
}

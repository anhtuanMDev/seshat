import { useState } from "react";
import { S, uid } from "../../lib/utils";
import type { Foreshadow, Chapter } from "../../lib/types";
import { EntryBlock, Field, Sel } from "../ui";
import { AddIcon } from "../ui/icons";

interface Props {
  foreshadows: Foreshadow[];
  chapters: Chapter[];
  currentChapterId: string;
  onAddForeshadow: (f: Foreshadow) => void;
  onUpdateForeshadow: (f: Foreshadow) => void;
  onDeleteForeshadow: (id: string) => void;
}

function ForeshadowItem({ 
  f, 
  chapters, 
  onUpdateForeshadow, 
  onDeleteForeshadow 
}: { 
  f: Foreshadow, 
  chapters: Chapter[], 
  onUpdateForeshadow: (f: Foreshadow) => void, 
  onDeleteForeshadow: (id: string) => void 
}) {
  return (
    <EntryBlock onDelete={() => onDeleteForeshadow(f.id)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Field 
          label="Description" 
          value={f.description} 
          onChange={(val) => onUpdateForeshadow({ ...f, description: val })} 
          multi
          rows={2}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Sel 
              label="Plant Chapter" 
              value={f.plantChapterId} 
              onChange={(val) => onUpdateForeshadow({ ...f, plantChapterId: val })}
              options={[{ label: "None", value: "" }, ...chapters.map(c => ({ label: c.title || c.number, value: c.id }))]}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Sel 
              label="Payoff Chapter" 
              value={f.payoffChapterId} 
              onChange={(val) => onUpdateForeshadow({ ...f, payoffChapterId: val })}
              options={[{ label: "None", value: "" }, ...chapters.map(c => ({ label: c.title || c.number, value: c.id }))]}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Sel 
              label="Status" 
              value={f.status} 
              onChange={(val) => onUpdateForeshadow({ ...f, status: val as "Planted" | "Payoffed" | "Abandoned" })}
              options={[{ label: "Planted", value: "Planted" }, { label: "Payoffed", value: "Payoffed" }, { label: "Abandoned", value: "Abandoned" }]}
            />
          </div>
        </div>
      </div>
    </EntryBlock>
  );
}

export function ForeshadowPanel({ foreshadows, chapters, currentChapterId, onAddForeshadow, onUpdateForeshadow, onDeleteForeshadow }: Props) {
  const [showAll, setShowAll] = useState(false);
  
  const relevantForeshadows = foreshadows.filter(f => f.plantChapterId === currentChapterId || f.payoffChapterId === currentChapterId);
  const otherForeshadows = foreshadows.filter(f => f.plantChapterId !== currentChapterId && f.payoffChapterId !== currentChapterId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ ...S.dim, margin: 0 }}>Foreshadowing tracker</p>
        <button 
          onClick={() => onAddForeshadow({ id: uid(), plantChapterId: currentChapterId, payoffChapterId: "", description: "", status: "Planted" })} 
          style={{ ...S.ghost, fontSize: 13, padding: "4px 8px" }}
        >
          <AddIcon sx={{ fontSize: 14 }} /> Plant Idea
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {relevantForeshadows.length === 0 && !showAll && (
          <p style={{ ...S.dim, fontSize: 13, fontStyle: "italic", textAlign: "center" }}>No plants or payoffs in this chapter.</p>
        )}
        {relevantForeshadows.map(f => (
          <ForeshadowItem key={f.id} f={f} chapters={chapters} onUpdateForeshadow={onUpdateForeshadow} onDeleteForeshadow={onDeleteForeshadow} />
        ))}
      </div>

      {otherForeshadows.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <button onClick={() => setShowAll(!showAll)} style={{ ...S.ghost, width: "100%", justifyContent: "center" }}>
            {showAll ? "Hide Other Chapters" : `Show ${otherForeshadows.length} other foreshadows`}
          </button>
          
          {showAll && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {otherForeshadows.map(f => (
                <ForeshadowItem key={f.id} f={f} chapters={chapters} onUpdateForeshadow={onUpdateForeshadow} onDeleteForeshadow={onDeleteForeshadow} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

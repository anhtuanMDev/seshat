import type { Technique } from "../../store/appStore";
import { BuildIcon, ScheduleIcon, PeopleIcon } from "../ui/icons";

interface TechniqueCardProps {
  technique: Technique;
  onEdit: () => void;
}

export function TechniqueCard({ technique, onEdit }: TechniqueCardProps) {
  return (
    <div className="seshat-smart-card" onClick={onEdit}>
      <div className="seshat-smart-card-header">
        <div className="seshat-flex-align" style={{ gap: 8 }}>
          <BuildIcon sx={{ fontSize: 14, color: "var(--color-teal)" }} />
          <span className="seshat-smart-card-title">
            {technique.name || "Unnamed Technique"}
          </span>
        </div>
        {technique.type && (
          <span className="seshat-smart-card-badge" style={{ borderColor: "var(--color-teal)", color: "var(--color-teal)", background: "color-mix(in srgb, var(--color-teal) 10%, transparent)" }}>
            {technique.type}
          </span>
        )}
      </div>

      <div className="seshat-smart-card-meta">
        {technique.era && (
          <div className="seshat-smart-card-meta-item">
            <ScheduleIcon sx={{ fontSize: 12 }} />
            <span>Era: {technique.era}</span>
          </div>
        )}
        {technique.creator && (
          <div className="seshat-smart-card-meta-item">
            <PeopleIcon sx={{ fontSize: 12 }} />
            <span>Creator: {technique.creator}</span>
          </div>
        )}
      </div>

      {technique.description && (
        <p className="seshat-smart-card-excerpt">
          <strong>Description:</strong> {technique.description}
        </p>
      )}
    </div>
  );
}

import type { Monster } from "../../store/appStore";
import { BugReportIcon, LocationOnIcon, WarningIcon } from "../ui/icons";

interface MonsterCardProps {
  monster: Monster;
  onEdit: () => void;
}

export function MonsterCard({ monster, onEdit }: MonsterCardProps) {
  return (
    <div className="seshat-smart-card" onClick={onEdit}>
      <div className="seshat-smart-card-header">
        <div className="seshat-flex-align" style={{ gap: 8 }}>
          <BugReportIcon sx={{ fontSize: 14, color: "var(--color-red)" }} />
          <span className="seshat-smart-card-title">
            {monster.name || "Unnamed Monster"}
          </span>
        </div>
        {monster.tier && (
          <span className="seshat-smart-card-badge" style={{ borderColor: "var(--color-red)", color: "var(--color-red)", background: "color-mix(in srgb, var(--color-red) 10%, transparent)" }}>
            {monster.tier}
          </span>
        )}
      </div>

      <div className="seshat-smart-card-meta">
        {monster.habitat && (
          <div className="seshat-smart-card-meta-item">
            <LocationOnIcon sx={{ fontSize: 12 }} />
            <span>Habitat: {monster.habitat}</span>
          </div>
        )}
        {monster.firstSeen && (
          <div className="seshat-smart-card-meta-item">
            <WarningIcon sx={{ fontSize: 12 }} />
            <span>First Seen: {monster.firstSeen}</span>
          </div>
        )}
      </div>

      {monster.abilities && (
        <p className="seshat-smart-card-excerpt">
          <strong>Abilities:</strong> {monster.abilities}
        </p>
      )}
    </div>
  );
}

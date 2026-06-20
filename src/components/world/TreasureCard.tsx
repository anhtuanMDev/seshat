import type { Treasure } from "../../store/appStore";
import { DiamondIcon, LocationOnIcon, PeopleIcon } from "../ui/icons";

interface TreasureCardProps {
  treasure: Treasure;
  onEdit: () => void;
}

export function TreasureCard({ treasure, onEdit }: TreasureCardProps) {
  return (
    <div className="seshat-smart-card" onClick={onEdit}>
      <div className="seshat-smart-card-header">
        <div className="seshat-flex-align" style={{ gap: 8 }}>
          <DiamondIcon sx={{ fontSize: 14, color: "var(--color-orange)" }} />
          <span className="seshat-smart-card-title">
            {treasure.name || "Unnamed Treasure / Artifact"}
          </span>
        </div>
        {treasure.rarity && (
          <span className="seshat-smart-card-badge" style={{ borderColor: "var(--color-orange)", color: "var(--color-orange)", background: "color-mix(in srgb, var(--color-orange) 10%, transparent)" }}>
            {treasure.rarity}
          </span>
        )}
      </div>

      <div className="seshat-smart-card-meta">
        {treasure.location && (
          <div className="seshat-smart-card-meta-item">
            <LocationOnIcon sx={{ fontSize: 12 }} />
            <span>Location: {treasure.location}</span>
          </div>
        )}
        {treasure.creator && (
          <div className="seshat-smart-card-meta-item">
            <PeopleIcon sx={{ fontSize: 12 }} />
            <span>Creator: {treasure.creator}</span>
          </div>
        )}
      </div>

      {treasure.description && (
        <p className="seshat-smart-card-excerpt">
          <strong>Description:</strong> {treasure.description}
        </p>
      )}
    </div>
  );
}

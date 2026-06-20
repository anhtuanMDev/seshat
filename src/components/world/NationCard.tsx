import type { Nation } from "../../store/appStore";
import { FlagIcon, LocationOnIcon, PeopleIcon, TimelineIcon } from "../ui/icons";

interface NationCardProps {
  nation: Nation;
  onEdit: () => void;
}

export function NationCard({ nation, onEdit }: NationCardProps) {
  const connectionsCount = nation.connections?.length || 0;

  return (
    <div className="seshat-smart-card" onClick={onEdit}>
      <div className="seshat-smart-card-header">
        <div className="seshat-flex-align" style={{ gap: 8 }}>
          <FlagIcon sx={{ fontSize: 16, color: "var(--color-primary)" }} />
          <span className="seshat-smart-card-title">
            {nation.name || "Unnamed Nation / Faction"}
          </span>
        </div>
        {nation.type && (
          <span className="seshat-smart-card-badge">
            {nation.type}
          </span>
        )}
      </div>

      <div className="seshat-smart-card-meta">
        {nation.capital && (
          <div className="seshat-smart-card-meta-item">
            <LocationOnIcon sx={{ fontSize: 12 }} />
            <span>Capital: {nation.capital}</span>
          </div>
        )}
        {nation.ruler && (
          <div className="seshat-smart-card-meta-item">
            <PeopleIcon sx={{ fontSize: 12 }} />
            <span>Ruler: {nation.ruler}</span>
          </div>
        )}
        {nation.periodActive && (
          <div className="seshat-smart-card-meta-item">
            <TimelineIcon sx={{ fontSize: 12 }} />
            <span>Period: {nation.periodActive}</span>
          </div>
        )}
      </div>

      {nation.geography && (
        <p className="seshat-smart-card-excerpt">
          <strong>Geography:</strong> {nation.geography}
        </p>
      )}

      {connectionsCount > 0 && (
        <div className="seshat-smart-card-footer">
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {connectionsCount} Connection{connectionsCount > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

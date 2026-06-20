import type { Ingredient } from "../../store/appStore";
import { ScienceIcon, LocationOnIcon, InfoIcon } from "../ui/icons";

interface IngredientCardProps {
  ingredient: Ingredient;
  onEdit: () => void;
}

export function IngredientCard({ ingredient, onEdit }: IngredientCardProps) {
  return (
    <div className="seshat-smart-card" onClick={onEdit}>
      <div className="seshat-smart-card-header">
        <div className="seshat-flex-align" style={{ gap: 8 }}>
          <ScienceIcon sx={{ fontSize: 14, color: "var(--color-brown)" }} />
          <span className="seshat-smart-card-title">
            {ingredient.name || "Unnamed Ingredient"}
          </span>
        </div>
        {ingredient.rarity && (
          <span className="seshat-smart-card-badge" style={{ borderColor: "var(--color-brown)", color: "var(--color-brown)", background: "color-mix(in srgb, var(--color-brown) 10%, transparent)" }}>
            {ingredient.rarity}
          </span>
        )}
      </div>

      <div className="seshat-smart-card-meta">
        {ingredient.location && (
          <div className="seshat-smart-card-meta-item">
            <LocationOnIcon sx={{ fontSize: 12 }} />
            <span>Habitat: {ingredient.location}</span>
          </div>
        )}
        {ingredient.properties && (
          <div className="seshat-smart-card-meta-item">
            <InfoIcon sx={{ fontSize: 12 }} />
            <span>Properties: {ingredient.properties}</span>
          </div>
        )}
      </div>

      {ingredient.appearance && (
        <p className="seshat-smart-card-excerpt">
          <strong>Appearance:</strong> {ingredient.appearance}
        </p>
      )}
    </div>
  );
}

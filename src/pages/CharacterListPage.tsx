import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import { useCharacters, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, mkChar } from "../lib/utils";
import { PeopleIcon, AddIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { CHAR_COLORS } from "../lib/constants";
import type { Character } from "../lib/types";
import { useCallback } from "react";

export default function CharacterListPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const characters = useCharacters();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();

  const add = useCallback(() => {
    if (bookIdx < 0) return;
    const c = mkChar(
      `Character ${characters.length + 1}`,
      CHAR_COLORS[characters.length % CHAR_COLORS.length],
    );
    appStore.books[bookIdx].characters.push(c);
    navigate(`/book/${bookId}/characters/${c.id}`);
  }, [characters.length, bookIdx, bookId, navigate]);

  return (
    <div ref={ref} className="seshat-page-container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PeopleIcon sx={{ fontSize: 14, color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: 13,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--text-secondary)",
            }}
          >
            Characters ({characters.length})
          </span>
        </div>
        <button
          onClick={add}
          style={{
            ...S.ghost,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          <AddIcon sx={{ fontSize: 14 }} />
          add character
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {characters.map((c: Character) => (
          <CharacterCard
            key={c.id}
            character={c}
            onClick={() => navigate(`/book/${bookId}/characters/${c.id}`)}
          />
        ))}
      </div>

      {!characters.length && (
        <div
          style={{
            paddingTop: 60,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          No characters yet. Add one to begin.
        </div>
      )}
    </div>
  );
}

function CharacterCard({
  character: c,
  onClick,
}: {
  character: Character;
  onClick: () => void;
}) {
  const hasContent =
    c.role || c.archetype || c.coreWound || c.coreFear || c.coreDesire;
  const conditionCount = (c.conditions || []).filter(
    (cd) => cd.isActive,
  ).length;
  const skillCount = (c.skills || []).length;
  
  const charColor = c.color || "var(--border)";
  const initial = c.name ? c.name.charAt(0).toUpperCase() : "?";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 16,
        cursor: "pointer",
        position: "relative",
        marginBottom: 12,
      }}
      onMouseEnter={(e) => {
        const card = e.currentTarget.querySelector(".char-card-inner") as HTMLElement;
        const node = e.currentTarget.querySelector(".char-node") as HTMLElement;
        const arrow = e.currentTarget.querySelector(".hover-arrow") as HTMLElement;
        if (card) {
          card.style.background = "var(--bg-hover)";
          card.style.borderColor = "var(--border)";
          card.style.transform = "translateY(-1px)";
          card.style.boxShadow = "0 3px 8px rgba(0,0,0,0.1)";
        }
        if (node) {
          node.style.boxShadow = `0 0 10px ${charColor}88`;
          node.style.background = charColor;
          node.style.color = "#000";
        }
        if (arrow) {
          arrow.style.opacity = "1";
          arrow.style.transform = "translateY(-50%) translateX(2px)";
        }
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget.querySelector(".char-card-inner") as HTMLElement;
        const node = e.currentTarget.querySelector(".char-node") as HTMLElement;
        const arrow = e.currentTarget.querySelector(".hover-arrow") as HTMLElement;
        if (card) {
          card.style.background = "var(--bg-entry)";
          card.style.borderColor = "transparent";
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "none";
        }
        if (node) {
          node.style.boxShadow = "none";
          node.style.background = `var(--bg-app)`;
          node.style.color = charColor;
        }
        if (arrow) {
          arrow.style.opacity = "0";
          arrow.style.transform = "translateY(-50%)";
        }
      }}
    >
      {/* Avatar Node */}
      <div style={{ position: "relative", width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          className="char-node"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "var(--bg-app)",
            border: `2px solid ${charColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            zIndex: 1,
            transition: "all 0.2s ease",
            marginTop: 12,
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "inherit",
            }}
          >
            {initial}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div
        className="char-card-inner"
        style={{
          flex: 1,
          padding: "8px 12px",
          background: "var(--bg-entry)",
          borderRadius: "6px",
          border: "1px solid transparent",
          transition: "all 0.2s ease",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text-primary)",
              letterSpacing: 0.2,
            }}
          >
            {c.name || "Unnamed"}
          </span>
          {c.role && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              {c.role}
            </span>
          )}
          {c.archetype && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: charColor,
                background: `${charColor}15`,
                padding: "1px 6px",
                borderRadius: "10px",
                border: `1px solid ${charColor}33`,
                marginLeft: "auto",
              }}
            >
              {c.archetype}
            </span>
          )}
        </div>

        {/* Content Section */}
        {hasContent && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.coreWound && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {c.coreWound}
              </p>
            )}

            {(c.coreFear || c.coreDesire) && (
              <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                {c.coreFear && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--color-red)", fontSize: 9 }}>▲</span>
                    {c.coreFear}
                  </span>
                )}
                {c.coreDesire && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--color-green)", fontSize: 9 }}>◆</span>
                    {c.coreDesire}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stat pills */}
        {(conditionCount > 0 || skillCount > 0 || (c.traumas || []).length > 0) && (
          <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 4 }}>
            {skillCount > 0 && (
              <StatPill label={`${skillCount} skill${skillCount !== 1 ? "s" : ""}`} />
            )}
            {conditionCount > 0 && (
              <StatPill
                label={`${conditionCount} condition${conditionCount !== 1 ? "s" : ""}`}
                color="var(--color-orange)"
              />
            )}
            {(c.traumas || []).length > 0 && (
              <StatPill
                label={`${c.traumas.length} trauma${c.traumas.length !== 1 ? "s" : ""}`}
                color="var(--color-red)"
              />
            )}
          </div>
        )}

        {/* Hover arrow indicator */}
        <span
          className="hover-arrow"
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            color: "var(--text-muted)",
            opacity: 0,
            transition: "opacity 0.2s, transform 0.2s",
          }}
        >
          →
        </span>
      </div>
    </div>
  );
}

function StatPill({
  label,
  color = "var(--text-muted)",
}: {
  label: string;
  color?: string;
}) {
  return (
    <span
      style={{
        fontSize: 10,
        color,
        background: `${color}11`,
        border: `1px solid ${color}33`,
        padding: "1px 6px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        letterSpacing: 0.3,
      }}
    >
      {label}
    </span>
  );
}

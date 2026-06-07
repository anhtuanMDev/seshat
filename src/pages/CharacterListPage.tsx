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
    <div
      ref={ref}
      style={{
        padding: "36px 16px 0",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        height: "100%",
      }}
    >
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

  return (
    <div
      onClick={onClick}
      style={{
        padding: "20px 24px",
        borderLeft: `3px solid ${c.color || "var(--border)"}`,
        cursor: "pointer",
        background: "var(--bg-entry)",
        marginBottom: 10,
        borderRadius: "0 2px 2px 0",
        transition: "background 0.12s",
        position: "relative",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--bg-entry)")
      }
    >
      {/* Name + role row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: hasContent ? 12 : 0,
        }}
      >
        <span
          style={{
            fontSize: 17,
            color: "var(--text-primary)",
            fontWeight: 400,
            letterSpacing: 0.3,
          }}
        >
          {c.name || "Unnamed"}
        </span>
        {c.role && (
          <span
            style={{
              fontSize: 12,
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
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginLeft: "auto",
            }}
          >
            {c.archetype}
          </span>
        )}
      </div>

      {/* Core wound — the most important thing to reference */}
      {c.coreWound && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 10px",
            paddingLeft: 1,
          }}
        >
          {c.coreWound}
        </p>
      )}

      {/* Fear / Desire inline */}
      {(c.coreFear || c.coreDesire) && (
        <div style={{ display: "flex", gap: 24, marginBottom: 10 }}>
          {c.coreFear && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span
                style={{
                  color: "var(--color-red)",
                  marginRight: 4,
                  fontSize: 10,
                }}
              >
                ▲
              </span>
              {c.coreFear}
            </span>
          )}
          {c.coreDesire && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span
                style={{
                  color: "var(--color-green)",
                  marginRight: 4,
                  fontSize: 10,
                }}
              >
                ◆
              </span>
              {c.coreDesire}
            </span>
          )}
        </div>
      )}

      {/* Stat pills */}
      {(conditionCount > 0 ||
        skillCount > 0 ||
        (c.traumas || []).length > 0) && (
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {skillCount > 0 && (
            <StatPill
              label={`${skillCount} skill${skillCount !== 1 ? "s" : ""}`}
            />
          )}
          {conditionCount > 0 && (
            <StatPill
              label={`${conditionCount} active condition${conditionCount !== 1 ? "s" : ""}`}
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

      {/* Arrow hint */}
      <span
        style={{
          position: "absolute",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 11,
          color: "var(--text-muted)",
          opacity: 0.5,
        }}
      >
        →
      </span>
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
        fontSize: 11,
        color,
        border: `1px solid ${color}44`,
        padding: "1px 8px",
        borderRadius: 2,
        letterSpacing: 0.3,
      }}
    >
      {label}
    </span>
  );
}

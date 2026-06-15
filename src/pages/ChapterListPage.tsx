import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import { useChapters, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, uid } from "../lib/utils";
import { AutoStoriesIcon, AddIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Chapter } from "../store/appStore";
import { useCallback, useState } from "react";

export default function ChapterListPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const chapters = useChapters();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();

  const addChapter = useCallback(() => {
    if (bookIdx < 0) return;
    const order = (chapters?.length || 0) + 1;
    const ch: Chapter = {
      id: uid(),
      number: `Ch. ${order}`,
      title: "",
      timeRef: "",
      synopsis: "",
      body: "",
      notes: "",
      order,
    };
    appStore.books[bookIdx].chapters.push(ch);
    navigate(`/book/${bookId}/chapters/${ch.id}`);
  }, [chapters?.length, bookIdx, bookId, navigate]);

  const sortedChapters = [...(chapters || [])].sort(
    (a: Chapter, b: Chapter) => a.order - b.order,
  );

  const totalWords = (chapters || []).reduce((sum: number, ch: Chapter) => {
    const body = ch.body || "";
    return sum + (body.trim() === "" ? 0 : body.trim().split(/\s+/).length);
  }, 0);

  return (
    <div ref={ref} className="seshat-page-container">
      {/* Header */}
      <div
        className="seshat-flex-between"
        style={{
          marginBottom: "var(--space-8)",
        }}
      >
        <div className="seshat-flex-align" style={{ gap: "var(--space-2)" }}>
          <AutoStoriesIcon sx={{ fontSize: 14, color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--text-secondary)",
            }}
          >
            Chapters ({sortedChapters.length})
            {totalWords > 0 && (
              <span
                style={{
                  marginLeft: 12,
                  letterSpacing: 1,
                  color: "var(--text-muted)",
                }}
              >
                ·{" "}
                {totalWords >= 1000
                  ? `${(totalWords / 1000).toFixed(1)}k`
                  : totalWords}{" "}
                words
              </span>
            )}
          </span>
        </div>
        <button
          onClick={addChapter}
          className="seshat-flex-align"
          style={{
            ...S.ghost,
            gap: "var(--space-1)",
            fontSize: "var(--text-xs)",
            color: "var(--text-secondary)",
          }}
        >
          <AddIcon sx={{ fontSize: 14 }} />
          add chapter
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sortedChapters.map((c: Chapter) => (
          <ChapterCard
            key={c.id}
            chapter={c}
            onClick={() => navigate(`/book/${bookId}/chapters/${c.id}`)}
          />
        ))}
      </div>

      {!sortedChapters.length && (
        <div
          style={{
            paddingTop: 60,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          No chapters yet. Add one to begin.
        </div>
      )}
    </div>
  );
}

function ChapterCard({
  chapter: c,
  onClick,
}: {
  chapter: Chapter;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const wordCount = c.body?.trim() ? c.body.trim().split(/\s+/).length : 0;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "20px 24px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        borderBottom: "1px solid var(--border)",
        borderLeft: `3px solid var(--color-purple)`,
        borderLeftColor: hover ? "var(--color-purple)" : "color-mix(in srgb, var(--color-purple) 40%, transparent)",
        background: hover ? "var(--bg-hover)" : "transparent",
        display: "flex",
        alignItems: "center"
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Chapter Number Column */}
      <div style={{ width: 80, flexShrink: 0, alignSelf: "flex-start", paddingTop: 2 }}>
          {c.number ? (
            <span
              style={{
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--color-purple)",
                fontWeight: 600,
                opacity: 0.9,
              }}
            >
              {c.number}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
          )}
        </div>

        {/* Info Column (stretches, and shrinks on hover via flex) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="seshat-flex-align" style={{ width: "100%" }}>
            <span
              style={{
                fontSize: 14,
                color: c.title ? "var(--text-primary)" : "var(--text-muted)",
                fontStyle: c.title ? "normal" : "italic",
                letterSpacing: 0.3,
                fontFamily: c.title ? "serif" : "inherit",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {c.title || "Untitled chapter"}
            </span>

            {c.timeRef && (
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  background: "var(--bg-entry)",
                  border: "1px solid var(--border-field)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  marginLeft: 12,
                  letterSpacing: 0.5,
                  flexShrink: 0,
                }}
              >
                {c.timeRef}
              </span>
            )}

            <div
              className="toc-connector"
              style={{
                flex: 1,
                borderBottom: "1px dotted var(--text-muted)",
                margin: "0 16px",
                opacity: hover ? 0.8 : 0.3,
                transition: "opacity 0.2s ease",
              }}
            />

            {wordCount > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontVariantNumeric: "tabular-nums",
                  background: "var(--bg-active)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  flexShrink: 0,
                }}
              >
                {wordCount >= 1000 ? `${(wordCount / 1000).toFixed(1)}k` : wordCount}
              </span>
            )}
          </div>

          {c.synopsis && (
            <div style={{ marginTop: 8, paddingRight: 24 }}>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                {c.synopsis}
              </p>
            </div>
          )}
        </div>

        {/* Icon Column (shows on hover) */}
        <div style={{
           width: hover ? 24 : 0, 
           opacity: hover ? 1 : 0, 
           overflow: "hidden", 
           transition: "all 0.2s ease",
           display: "flex",
           alignItems: "center",
           justifyContent: "flex-end",
           flexShrink: 0,
           marginLeft: hover ? 16 : 0
        }}>
          <span
            style={{
              fontSize: 14,
              color: "var(--color-purple)",
              transform: hover ? "translateX(0)" : "translateX(-8px)",
              transition: "transform 0.2s ease",
            }}
          >
            →
          </span>
        </div>
    </div>
  );
}

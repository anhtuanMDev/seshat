import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import { useChapters, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, uid } from "../lib/utils";
import { AutoStoriesIcon, AddIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Chapter } from "../store/appStore";
import { useCallback } from "react";

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
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AutoStoriesIcon sx={{ fontSize: 14, color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: 13,
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
  const wordCount = c.body?.trim() ? c.body.trim().split(/\s+/).length : 0;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "18px 24px",
        borderLeft: "3px solid var(--color-purple)",
        cursor: "pointer",
        background: "var(--bg-entry)",
        marginBottom: 10,
        borderRadius: "0 2px 2px 0",
        position: "relative",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--bg-entry)")
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: c.synopsis ? 10 : 0,
        }}
      >
        {c.number && (
          <span
            style={{
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            {c.number}
          </span>
        )}
        <span
          style={{
            fontSize: 16,
            color: c.title ? "var(--text-primary)" : "var(--text-muted)",
            fontStyle: c.title ? "normal" : "italic",
          }}
        >
          {c.title || "Untitled chapter"}
        </span>
        {c.timeRef && (
          <span
            style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}
          >
            {c.timeRef}
          </span>
        )}
        {wordCount > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            {wordCount >= 1000
              ? `${(wordCount / 1000).toFixed(1)}k`
              : wordCount}
            w
          </span>
        )}
      </div>

      {c.synopsis && (
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
      )}

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

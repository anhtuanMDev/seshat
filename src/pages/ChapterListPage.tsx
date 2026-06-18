import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import { useChapters, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, uid } from "../lib/utils";
import { AutoStoriesIcon, AddIcon, FileDownloadIcon, CheckCircleIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Chapter } from "../store/appStore";
import { useCallback, useState } from "react";
import { ChapterCard } from "../components/chapter/ChapterCard";
import { saveAs } from "file-saver";

const htmlToText = (html: string) => {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent || el.innerText || "";
};

const buildExport = (chapters: Chapter[], bookTitle: string) => {
  const totalWords = chapters.reduce((sum: number, ch: Chapter) => {
    const body = htmlToText(ch.body || "");
    return sum + (body.trim() === "" ? 0 : body.trim().split(/\s+/).length);
  }, 0);

  let content = `BOOK EXPORT: ${bookTitle}\n`;
  content += `Total chapters: ${chapters.length}\n`;
  content += `Total words: ${totalWords}\n`;
  content += `================================================================================\n\n`;

  chapters.forEach((ch) => {
    content += `${ch.number}${ch.title ? ` - ${ch.title}` : ""}\n`;
    if (ch.timeRef) content += `Time: ${ch.timeRef}\n`;
    if (ch.synopsis) content += `Synopsis: ${ch.synopsis}\n`;
    content += `--------------------------------------------------------------------------------\n`;
    content += `${htmlToText(ch.body || "")}\n\n`;
    content += `================================================================================\n\n`;
  });

  return content;
};

const buildSingleChapterExport = (ch: Chapter) => {
  let content = `${ch.number}${ch.title ? ` - ${ch.title}` : ""}\n`;
  if (ch.timeRef) content += `Time: ${ch.timeRef}\n`;
  if (ch.synopsis) content += `Synopsis: ${ch.synopsis}\n`;
  content += `--------------------------------------------------------------------------------\n`;
  content += `${htmlToText(ch.body || "")}\n\n`;
  return content;
};

export default function ChapterListPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const chapters = useChapters();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addChapter = useCallback(() => {
    if (bookIdx < 0) return;
    const order = Math.max(0, ...(chapters || []).map((c) => c.order)) + 1;
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
  }, [chapters, bookIdx, bookId, navigate]);

  const sortedChapters = [...(chapters || [])].sort(
    (a: Chapter, b: Chapter) => a.order - b.order,
  );

  const totalWords = (chapters || []).reduce((sum: number, ch: Chapter) => {
    const body = htmlToText(ch.body || "");
    return sum + (body.trim() === "" ? 0 : body.trim().split(/\s+/).length);
  }, 0);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectedChapters = sortedChapters.filter((c) =>
    selectedIds.includes(c.id),
  );

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelectedIds([]);
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds([]);
  }, []);

  const exportAll = useCallback(() => {
    if (!sortedChapters.length) return;
    const bookTitle = bookIdx >= 0 ? appStore.books[bookIdx].title.get() : "Book";
    const content = buildExport(sortedChapters, bookTitle);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const safeTitle = (bookTitle || "book").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(blob, `${safeTitle}_chapters_export.txt`);
  }, [sortedChapters, bookIdx]);

  const exportSelected = useCallback(() => {
    if (!selectedChapters.length) return;
    selectedChapters.forEach((ch, i) => {
      setTimeout(() => {
        const content = buildSingleChapterExport(ch);
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const fileName = ch.number
          .replace(/[^a-z0-9]/gi, '_').toLowerCase();
        saveAs(blob, `${fileName}.txt`);
      }, i * 200);
    });
  }, [selectedChapters]);

  return (
    <div ref={ref} className="seshat-page-container">
      {/* Header */}
      <div className="seshat-flex-between" style={styles.header}>
        <div className="seshat-flex-align" style={styles.headerTitleRow}>
          <AutoStoriesIcon sx={styles.iconStyle} />
          <span style={styles.headerText}>
            Chapters ({sortedChapters.length})
            {totalWords > 0 && (
              <span style={styles.wordCountSpan}>
                ·{" "}
                {totalWords >= 1000
                  ? `${(totalWords / 1000).toFixed(1)}k`
                  : totalWords}{" "}
                words
              </span>
            )}
          </span>
        </div>
        <div className="seshat-flex-align" style={{ gap: 8 }}>
          {selectMode ? (
            <>
              <button onClick={exitSelectMode} className="seshat-flex-align" style={styles.addBtn}>
                cancel
              </button>
              <button
                onClick={exportSelected}
                className="seshat-flex-align"
                style={{
                  ...styles.addBtn,
                  opacity: selectedIds.length === 0 ? 0.4 : 1,
                  pointerEvents: selectedIds.length === 0 ? "none" as const : "auto",
                }}
              >
                <FileDownloadIcon sx={{ fontSize: 14 }} />
                export ({selectedIds.length})
              </button>
            </>
          ) : (
            <>
              <button onClick={enterSelectMode} className="seshat-flex-align" style={styles.addBtn}>
                <CheckCircleIcon sx={{ fontSize: 14 }} />
                select
              </button>
              <button onClick={exportAll} className="seshat-flex-align" style={styles.addBtn}>
                <FileDownloadIcon sx={{ fontSize: 14 }} />
                export all
              </button>
              <button onClick={addChapter} className="seshat-flex-align" style={styles.addBtn}>
                <AddIcon sx={{ fontSize: 14 }} />
                add chapter
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={styles.cardsContainer}>
        {sortedChapters.map((c: Chapter) => (
          <ChapterCard
            key={c.id}
            chapter={c}
            onClick={selectMode ? () => toggleSelection(c.id) : () => navigate(`/book/${bookId}/chapters/${c.id}`)}
            selected={selectedIds.includes(c.id)}
            onToggle={selectMode ? () => toggleSelection(c.id) : undefined}
          />
        ))}
      </div>

      {!sortedChapters.length && (
        <div style={styles.emptyContainer}>
          No chapters yet. Add one to begin.
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "var(--space-8)",
  },
  headerTitleRow: {
    gap: "var(--space-2)",
  },
  iconStyle: {
    fontSize: 14,
    color: "var(--text-muted)",
  },
  headerText: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  wordCountSpan: {
    marginLeft: 12,
    letterSpacing: 1,
    color: "var(--text-muted)",
  },
  addBtn: {
    ...S.ghost,
    gap: "var(--space-1)",
    fontSize: "var(--text-xs)",
    color: "var(--text-secondary)",
  },
  cardsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  emptyContainer: {
    paddingTop: 60,
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 13,
    fontStyle: "italic",
  },
} satisfies Record<string, React.CSSProperties>;

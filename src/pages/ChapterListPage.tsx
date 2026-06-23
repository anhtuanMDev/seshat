import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import { useChapters, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, uid } from "../lib/utils";
import { AutoStoriesIcon, AddIcon, FileDownloadIcon, CheckCircleIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Chapter } from "../store/appStore";
import type { Paragraph } from "docx";
import { useCallback, useState, useRef } from "react";
import { ChapterCard } from "../components/chapter/ChapterCard";
import { loadChaptersForExport, syncToGitHub } from "../lib/githubSync";
import { showToast } from "../store/toastStore";

const getToken = (): string | null =>
  localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");

const htmlToText = (html: string) => html.replace(/<[^>]*>/g, "").trim();



export default function ChapterListPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const chapters = useChapters();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reorderMode, setReorderMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncChanges = useCallback(async () => {
    const token = getToken();
    if (token) {
      try {
        setIsSyncing(true);
        showToast("Syncing chapter order to cloud...", "info");
        await syncToGitHub(token);
        showToast("Chapter order synced to cloud!", "success");
      } catch (err) {
        showToast("Failed to sync chapter order: " + (err as Error).message, "error");
      } finally {
        setIsSyncing(false);
      }
    }
  }, []);

  const moveChapter = useCallback((index: number, direction: "up" | "down") => {
    if (bookIdx < 0) return;
    const sorted = [...(chapters || [])].sort((a, b) => a.order - b.order);
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const currentChapter = sorted[index];
    const targetChapter = sorted[targetIdx];

    const currentOrder = currentChapter.order;
    const targetOrder = targetChapter.order;

    const currentStoreIdx = appStore.books[bookIdx].chapters.get().findIndex(c => c.id === currentChapter.id);
    const targetStoreIdx = appStore.books[bookIdx].chapters.get().findIndex(c => c.id === targetChapter.id);

    if (currentStoreIdx >= 0 && targetStoreIdx >= 0) {
      appStore.books[bookIdx].chapters[currentStoreIdx].order.set(targetOrder);
      appStore.books[bookIdx].chapters[targetStoreIdx].order.set(currentOrder);
    }
  }, [chapters, bookIdx]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const draggedIdxRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const containerRectRef = useRef<DOMRect | null>(null);

  const moveChapterToPosition = useCallback((fromIdx: number, toIdx: number) => {
    if (bookIdx < 0 || fromIdx === toIdx) return;
    const sorted = [...(chapters || [])].sort((a, b) => a.order - b.order);
    
    const [movedChapter] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, movedChapter);

    sorted.forEach((ch, idx) => {
      const storeIdx = appStore.books[bookIdx].chapters.get().findIndex(c => c.id === ch.id);
      if (storeIdx >= 0) {
        appStore.books[bookIdx].chapters[storeIdx].order.set(idx + 1);
      }
    });
  }, [chapters, bookIdx]);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", idx.toString());
    containerRectRef.current = containerRef.current?.getBoundingClientRect() || null;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== idx) {
      setDragOverIdx(idx);
    }

    const rect = containerRectRef.current || containerRef.current?.getBoundingClientRect();
    if (rect && containerRef.current) {
      const relativeY = e.clientY - rect.top;

      // Auto-scroll when dragging near top (within 80px)
      if (relativeY < 80) {
        containerRef.current.scrollTop -= 15;
      }
      // Auto-scroll when dragging near bottom (within 80px of visible area)
      else if (relativeY > rect.height - 80) {
        containerRef.current.scrollTop += 15;
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = draggedIdx;
    if (fromIdx !== null && fromIdx !== targetIdx) {
      moveChapterToPosition(fromIdx, targetIdx);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    if (!reorderMode) return;
    setDraggedIdx(idx);
    draggedIdxRef.current = idx;
    touchStartYRef.current = e.touches[0].clientY;
    containerRectRef.current = containerRef.current?.getBoundingClientRect() || null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!reorderMode || draggedIdxRef.current === null) return;
    
    // Prevent default body scrolling while dragging items
    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const rowEl = targetEl?.closest("[data-idx]");
    if (rowEl) {
      const targetIdx = parseInt(rowEl.getAttribute("data-idx") || "", 10);
      if (!isNaN(targetIdx) && targetIdx !== draggedIdxRef.current) {
        setDragOverIdx(targetIdx);
      }
    }

    // Auto-scroll on mobile boundary touch dragging
    const rect = containerRectRef.current || containerRef.current?.getBoundingClientRect();
    if (rect && containerRef.current) {
      const relativeY = touch.clientY - rect.top;
      if (relativeY < 80) {
        containerRef.current.scrollTop -= 12;
      } else if (relativeY > rect.height - 80) {
        containerRef.current.scrollTop += 12;
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggedIdxRef.current !== null && dragOverIdx !== null) {
      moveChapterToPosition(draggedIdxRef.current, dragOverIdx);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
    draggedIdxRef.current = null;
    touchStartYRef.current = null;
    containerRectRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    containerRectRef.current = null;
  };

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

  const doExport = useCallback(async (
    chapters: Chapter[],
    mode: "all" | "single",
    bookTitle: string,
  ) => {
    const token = getToken();
    if (!token) return;

    showToast("Generating export files...", "info");

    try {
      const [docxModule, fileSaverModule, jszipModule] = await Promise.all([
        import("docx"),
        import("file-saver"),
        import("jszip"),
      ]);

      const { Document, Packer, Paragraph, TextRun } = docxModule;
      const { saveAs } = fileSaverModule;
      const JSZip = jszipModule.default;

      const ids = chapters.map((c) => c.id);
      const fetched = await loadChaptersForExport(token, bookId!, ids);
      const safeTitle = (bookTitle || "book");

      if (mode === "all") {
        const docChildren: Paragraph[] = [];

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: bookTitle || "Book Export", bold: true, size: 48 }),
            ],
            spacing: { after: 400 },
          })
        );

        (fetched as unknown as Chapter[]).forEach((ch) => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${ch.number}${ch.title ? ` - ${ch.title}` : ""}`, bold: true, size: 36 }),
              ],
              spacing: { before: 400, after: 200 },
            })
          );
          
          const temp = document.createElement("div");
          temp.innerHTML = ch.body || "";
          const paragraphs = Array.from(temp.querySelectorAll("p")).map(
            (p) => p.textContent || "",
          );
          const lines = paragraphs.length > 0 ? paragraphs : temp.innerText.split("\n");
          
          lines.filter((line) => line.trim().length > 0).forEach((line) => {
            docChildren.push(
              new Paragraph({
                text: line,
                spacing: { after: 200 },
              })
            );
          });
        });

        const doc = new Document({
          sections: [{ properties: {}, children: docChildren }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${safeTitle} - Chapters Export.docx`);
        showToast("Export completed successfully", "success");
      } else {
        const zip = new JSZip();

        for (const ch of fetched as unknown as Chapter[]) {
          const docChildren: Paragraph[] = [];
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${ch.number}${ch.title ? ` - ${ch.title}` : ""}`, bold: true, size: 36 }),
              ],
              spacing: { before: 400, after: 200 },
            })
          );
          
          const temp = document.createElement("div");
          temp.innerHTML = ch.body || "";
          const paragraphs = Array.from(temp.querySelectorAll("p")).map(
            (p) => p.textContent || "",
          );
          const lines = paragraphs.length > 0 ? paragraphs : temp.innerText.split("\n");
          
          lines.filter((line) => line.trim().length > 0).forEach((line) => {
            docChildren.push(
              new Paragraph({
                text: line,
                spacing: { after: 200 },
              })
            );
          });

          const doc = new Document({
            sections: [{ properties: {}, children: docChildren }],
          });

          const blob = await Packer.toBlob(doc);
          const safeChapterTitle = `${ch.number}${ch.title ? ` - ${ch.title}` : ""}`;
          zip.file(`${safeChapterTitle}.docx`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `${safeTitle} - Selected Chapters.zip`);
        showToast("Export completed successfully", "success");
      }
    } catch (err) {
      console.error("[ChapterListPage] Export failed:", err);
      showToast("Failed to generate export", "error");
    }
  }, [bookId]);

  const exportAll = useCallback(() => {
    if (!sortedChapters.length) return;
    const bookTitle = bookIdx >= 0 ? appStore.books[bookIdx].title.get() : "Book";
    doExport(sortedChapters, "all", bookTitle);
  }, [sortedChapters, bookIdx, doExport]);

  const exportSelected = useCallback(() => {
    if (!selectedChapters.length) return;
    const bookTitle = bookIdx >= 0 ? appStore.books[bookIdx].title.get() : "Book";
    doExport(selectedChapters, "single", bookTitle);
  }, [selectedChapters, bookIdx, doExport]);

  return (
    <div
      ref={(el) => {
        ref.current = el;
        containerRef.current = el;
      }}
      className="seshat-page-container"
    >
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
          ) : reorderMode ? (
            <>
              <button
                disabled={isSyncing}
                onClick={async () => {
                  await syncChanges();
                  setReorderMode(false);
                }}
                className="seshat-flex-align"
                style={{
                  ...styles.addBtn,
                  opacity: isSyncing ? 0.6 : 1,
                  cursor: isSyncing ? "not-allowed" : "pointer",
                }}
              >
                {isSyncing ? "saving..." : "done"}
              </button>
            </>
          ) : (
            <>
              <button onClick={enterSelectMode} className="seshat-flex-align" style={styles.addBtn}>
                <CheckCircleIcon sx={{ fontSize: 14 }} />
                select
              </button>
              <button onClick={() => setReorderMode(true)} className="seshat-flex-align" style={styles.addBtn}>
                ⇅ reorder
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
        {sortedChapters.map((c: Chapter, idx: number) => {
          const isDragOver = dragOverIdx === idx;

          return (
            <div
              key={c.id}
              data-idx={idx}
              draggable={reorderMode}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, idx)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: 1,
                paddingTop: isDragOver ? 8 : 0,
                boxShadow: isDragOver ? "inset 0 2px 0 var(--color-purple)" : "none",
                transition: "padding-top 0.15s ease, box-shadow 0.15s ease",
                cursor: reorderMode ? "grab" : "default",
              }}
            >
              {reorderMode && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Drag Handle Indicator */}
                  <span style={{ color: "var(--text-muted)", fontSize: 13, userSelect: "none" }} title="Drag to reorder">
                    ☰
                  </span>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      disabled={idx === 0}
                      onClick={() => moveChapter(idx, "up")}
                      style={{
                        ...styles.reorderBtn,
                        opacity: idx === 0 ? 0.25 : 0.8,
                        cursor: idx === 0 ? "default" : "pointer",
                      }}
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === sortedChapters.length - 1}
                      onClick={() => moveChapter(idx, "down")}
                      style={{
                        ...styles.reorderBtn,
                        opacity: idx === sortedChapters.length - 1 ? 0.25 : 0.8,
                        cursor: idx === sortedChapters.length - 1 ? "default" : "pointer",
                      }}
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <ChapterCard
                  chapter={c}
                  onClick={
                    reorderMode
                      ? () => {}
                      : selectMode
                      ? () => toggleSelection(c.id)
                      : () => navigate(`/book/${bookId}/chapters/${c.id}`)
                  }
                  selected={selectedIds.includes(c.id)}
                  onToggle={selectMode ? () => toggleSelection(c.id) : undefined}
                />
              </div>
            </div>
          );
        })}
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
  reorderBtn: {
    background: "var(--bg-active)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--color-purple)",
    fontSize: "9px",
    width: "24px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 1,
    transition: "all 0.15s ease",
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

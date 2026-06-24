import { useParams } from "react-router-dom";
import { Skeleton } from "@mui/material";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";
import { updateFileOnGitHub } from "../lib/githubSync";
import {
  useEvents,
  useCharacters,
  useActiveBookIdx,
} from "../hooks/useWorldStore";
import { S } from "../lib/utils";

import { useAnimateIn } from "../hooks/useAnimateIn";
import {
  useState,
  useEffect,
} from "react";
import { useWatch } from "react-hook-form";
import { useChapterForm } from "../hooks/useChapterForm";
import type { Character, Event } from "../lib/types";
import RichEditor from "../components/editor/RichEditor";
import { ReferencePanel } from "../components/chapter/ReferencePanel";
import { PinnedContextStrip } from "../components/chapter/PinnedContextStrip";
import { ChapterToolbar } from "../components/chapter/ChapterToolbar";
import { SceneOutlinePanel } from "../components/chapter/SceneOutlinePanel";
import { DraftsPanel } from "../components/chapter/DraftsPanel";
import { ForeshadowPanel } from "../components/chapter/ForeshadowPanel";
import { EventPicker } from "../components/ui/EventPicker";
import { ContinuityTracker } from "../components/chapter/ContinuityTracker";
import type { Foreshadow } from "../lib/types";

export interface ChapterForm {
  number: string;
  title: string;
  timeRef: string;
  synopsis: string;
  body: string;
  notes: string;
  pinnedChars: string[];
  pinnedEventIds: string[];
  scenes: import("../lib/types").SceneCard[];
}

export default function ChapterPage() {
  const { id, bookId } = useParams();
  const events = useEvents();
  const characters = useCharacters();
  const bookIdx = useActiveBookIdx();

  const chapter = useSelector(() => {
    if (bookIdx < 0) return undefined;
    return appStore.books[bookIdx].chapters?.get()?.find((c) => c.id === id);
  });
  const chapterIdx = useSelector(() => {
    if (bookIdx < 0) return -1;
    return (
      appStore.books[bookIdx].chapters?.get()?.findIndex((c) => c.id === id) ??
      -1
    );
  });

  const [showPanel, setShowPanel] = useState(window.innerWidth > 1024);
  const [panelTab, setPanelTab] = useState<
    | "chars"
    | "events"
    | "world"
    | "notes"
    | "drafts"
    | "foreshadows"
    | "continuity"
  >("chars");
  const [isFloating, setIsFloating] = useState(false);

  const {
    register,
    control,
    formState,
    getValues,
    setValue,
    isSaving,
    activeDraftId,
    saveRef,
    handleDeleteDraft,
    handleUndeleteDraft,
    handleRenameDraft,
    handleSaveAsDraft,
    handleRestoreDraft,
    handleExport,
  } = useChapterForm(bookId, id, bookIdx, chapterIdx, chapter);

  const ref = useAnimateIn();

  useEffect(() => {
    const handleBodyClass = () => {
      if (showPanel && window.innerWidth <= 1024) {
        document.body.classList.add("panel-open-mobile");
      } else {
        document.body.classList.remove("panel-open-mobile");
      }
    };
    handleBodyClass();
    window.addEventListener("resize", handleBodyClass);
    return () => {
      window.removeEventListener("resize", handleBodyClass);
      document.body.classList.remove("panel-open-mobile");
    };
  }, [showPanel]);

  const body = useWatch({ control, name: "body" });
  const pinnedChars = useWatch({ control, name: "pinnedChars" }) || [];
  const pinnedEventIds = useWatch({ control, name: "pinnedEventIds" }) || [];

  const allChapters = useSelector(() =>
    bookIdx >= 0 ? appStore.books[bookIdx].chapters.get() : [],
  );
  const foreshadows = useSelector(() =>
    bookIdx >= 0 ? appStore.books[bookIdx].foreshadows.get() : [],
  );

  if (!chapter) {
    return (
      <div style={styles.notFound}>
        Chapter not found.
      </div>
    );
  }

  const isLoading = chapter.body === undefined;

  const pinnedCharObjs = characters.filter((c: Character) =>
    pinnedChars.includes(c.id),
  );
  const pinnedEventObjs = events
    .filter((e: Event) => pinnedEventIds.includes(e.id))
    .sort((a: Event, b: Event) => a.time - b.time);

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  const worldData = {
    synopsis: bookIdx >= 0 ? appStore.books[bookIdx].synopsis.get() : "",
    setting: bookIdx >= 0 ? appStore.books[bookIdx].setting.get() : "",
    themes: bookIdx >= 0 ? appStore.books[bookIdx].themes.get() : "",
    rules: bookIdx >= 0 ? appStore.books[bookIdx].rules.get() : "",
  };

  return (
    <div ref={ref} className="seshat-chapter-layout">
      {/* ── Prose column ── */}
      <div
        className={`seshat-chapter-prose ${showPanel ? "panel-open" : ""}`}
        onScroll={(e) => setIsFloating(e.currentTarget.scrollTop > 120)}
      >
        <div className="seshat-chapter-header">
          <div style={styles.headerFlex1}>
            {isLoading ? (
              <>
                <div style={styles.loaderHeaderRow}>
                  <Skeleton
                    animation="wave"
                    variant="rounded"
                    width={50}
                    height={16}
                    sx={{ bgcolor: "var(--bg-hover)" }}
                  />
                  <Skeleton
                    animation="wave"
                    variant="rounded"
                    width={180}
                    height={16}
                    sx={{ bgcolor: "var(--bg-hover)" }}
                  />
                </div>
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width="60%"
                  height={32}
                  sx={{ bgcolor: "var(--bg-hover)", marginBottom: 8 }}
                />
              </>
            ) : (
              <>
                <div style={styles.headerMetaRow}>
                  <input
                    {...register("number")}
                    placeholder="Ch. 1"
                    style={styles.numberInput}
                  />
                  <div style={styles.eventPickerWrapper}>
                    <EventPicker
                      control={control}
                      name="timeRef"
                      events={events}
                      placeholder="When did this chapter take place ?"
                      sx={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
                <input
                  {...register("title")}
                  placeholder="Chapter title…"
                  style={styles.titleInput}
                />
              </>
            )}
          </div>

          {isLoading ? (
            <div style={styles.loaderToolbar}>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={40}
                height={16}
                sx={{ bgcolor: "var(--bg-hover)" }}
              />
              <Skeleton
                animation="wave"
                variant="rounded"
                width={40}
                height={16}
                sx={{ bgcolor: "var(--bg-hover)" }}
              />
              <Skeleton
                animation="wave"
                variant="rounded"
                width={40}
                height={16}
                sx={{ bgcolor: "var(--bg-hover)" }}
              />
            </div>
          ) : (
            <ChapterToolbar
              showPanel={showPanel}
              onTogglePanel={() => setShowPanel((s) => !s)}
              onSave={() => saveRef.current()}
              onExport={handleExport}
              isSaving={isSaving}
              isDirty={formState.isDirty}
              isFloating={isFloating}
            />
          )}
        </div>

        {isLoading ? (
          <div style={styles.loaderSynopsis}>
            <Skeleton
              animation="wave"
              variant="rounded"
              width="100%"
              height={16}
              sx={{ bgcolor: "var(--bg-hover)", marginBottom: 6 }}
            />
            <Skeleton
              animation="wave"
              variant="rounded"
              width="40%"
              height={16}
              sx={{ bgcolor: "var(--bg-hover)" }}
            />
          </div>
        ) : (
          <textarea
            {...register("synopsis")}
            placeholder="Scene note or synopsis for this chapter (not part of the prose)…"
            rows={2}
            style={styles.synopsisTextarea}
          />
        )}

        {pinnedCharObjs.length + pinnedEventObjs.length > 0 && !isLoading && (
          <PinnedContextStrip
            pinnedCharObjs={pinnedCharObjs}
            pinnedEventObjs={pinnedEventObjs}
            onRemoveChar={(charId) => {
              const current = getValues("pinnedChars") || [];
              setValue(
                "pinnedChars",
                current.filter((x) => x !== charId),
                { shouldDirty: true },
              );
            }}
            onRemoveEvent={(eventId) => {
              const current = getValues("pinnedEventIds") || [];
              setValue(
                "pinnedEventIds",
                current.filter((x) => x !== eventId),
                { shouldDirty: true },
              );
            }}
          />
        )}

        {/* ── Scene Outline (Beat Sheet) ── */}
        {isLoading ? (
          <div style={styles.loaderOutlineWrapper}>
            <div style={styles.loaderOutlineHeader}>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={120}
                height={16}
                sx={{ bgcolor: "var(--bg-hover)" }}
              />
            </div>
            <div style={styles.loaderOutlineCard}>
              <Skeleton
                animation="wave"
                variant="rounded"
                width="30%"
                height={20}
                sx={{ bgcolor: "var(--bg-hover)", marginBottom: 12 }}
              />
              <div style={styles.loaderOutlineGrid}>
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  height={36}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  height={36}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
              </div>
            </div>
          </div>
        ) : (
          <SceneOutlinePanel control={control} />
        )}

        {/* ── Rich editor — all context props wired ── */}
        {isLoading ? (
          <div style={styles.loaderEditorWrapper}>
            {/* Toolbar skeleton */}
            <div style={styles.loaderEditorToolbar}>
              <div style={styles.loaderEditorToolbarLeft}>
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={16}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={16}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={16}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={16}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />

                <div style={styles.loaderDivider} />

                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={24}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={24}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={24}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />

                <div style={styles.loaderDivider} />

                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={16}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={16}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={16}
                  height={20}
                  sx={{ bgcolor: "var(--bg-hover)" }}
                />

                <div style={styles.loaderDivider} />

                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={90}
                  height={22}
                  sx={{ bgcolor: "var(--bg-hover)", borderRadius: 12, ml: 1 }}
                />
              </div>
              <Skeleton
                animation="wave"
                width={30}
                height={16}
                sx={{ bgcolor: "var(--bg-hover)" }}
              />
            </div>

            {/* Prose skeleton */}
            <div style={styles.loaderEditorBody}>
              {/* Paragraph 1 */}
              <div style={styles.loaderParagraph}>
                <Skeleton
                  animation="wave"
                  height={22}
                  width="95%"
                  sx={{
                    bgcolor: "var(--bg-hover)",
                    transform: "scale(1)",
                    mb: 1.2,
                  }}
                />
                <Skeleton
                  animation="wave"
                  height={22}
                  width="90%"
                  sx={{
                    bgcolor: "var(--bg-hover)",
                    transform: "scale(1)",
                    mb: 1.2,
                  }}
                />
                <Skeleton
                  animation="wave"
                  height={22}
                  width="75%"
                  sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }}
                />
              </div>

              {/* Paragraph 2 - short */}
              <div style={styles.loaderParagraph}>
                <Skeleton
                  animation="wave"
                  height={22}
                  width="45%"
                  sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }}
                />
              </div>

              {/* Paragraph 3 */}
              <div style={styles.loaderParagraph}>
                <Skeleton
                  animation="wave"
                  height={22}
                  width="100%"
                  sx={{
                    bgcolor: "var(--bg-hover)",
                    transform: "scale(1)",
                    mb: 1.2,
                  }}
                />
                <Skeleton
                  animation="wave"
                  height={22}
                  width="88%"
                  sx={{
                    bgcolor: "var(--bg-hover)",
                    transform: "scale(1)",
                    mb: 1.2,
                  }}
                />
                <Skeleton
                  animation="wave"
                  height={22}
                  width="92%"
                  sx={{
                    bgcolor: "var(--bg-hover)",
                    transform: "scale(1)",
                    mb: 1.2,
                  }}
                />
                <Skeleton
                  animation="wave"
                  height={22}
                  width="60%"
                  sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }}
                />
              </div>

              {/* Paragraph 4 - single line */}
              <div style={styles.loaderParagraph}>
                <Skeleton
                  animation="wave"
                  height={22}
                  width="80%"
                  sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }}
                />
              </div>

              {/* Paragraph 5 */}
              <div style={styles.loaderParagraph}>
                <Skeleton
                  animation="wave"
                  height={22}
                  width="94%"
                  sx={{
                    bgcolor: "var(--bg-hover)",
                    transform: "scale(1)",
                    mb: 1.2,
                  }}
                />
                <Skeleton
                  animation="wave"
                  height={22}
                  width="85%"
                  sx={{
                    bgcolor: "var(--bg-hover)",
                    transform: "scale(1)",
                    mb: 1.2,
                  }}
                />
                <Skeleton
                  animation="wave"
                  height={22}
                  width="30%"
                  sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }}
                />
              </div>
            </div>
          </div>
        ) : (
          <RichEditor
            control={control}
            name="body"
            placeholder="Begin writing the chapter here. The story lives in this space…"
            characters={characters}
            events={events}
            pinnedEvents={pinnedEventObjs}
            pinnedCharIds={pinnedChars}
            isDirty={formState.isDirty}
            onSave={() => saveRef.current()}
            bookId={bookId}
          />
        )}
      </div>

      {/* ── Reference panel ── */}
      <>
        <div
          className={`seshat-chapter-panel-overlay ${showPanel ? "open" : ""}`}
          onClick={() => setShowPanel(false)}
        />
        <ReferencePanel
          isOpen={showPanel}
          panelTab={panelTab}
          onTabChange={setPanelTab}
          characters={characters}
          sortedEvents={sortedEvents}
          pinnedCharIds={pinnedChars}
          pinnedEventIds={pinnedEventIds}
          onTogglePinChar={(charId) => {
            const current = getValues("pinnedChars") || [];
            const next = current.includes(charId)
              ? current.filter((x) => x !== charId)
              : [...current, charId];
            setValue("pinnedChars", next, { shouldDirty: true });
          }}
          onTogglePinEvent={(eventId) => {
            const current = getValues("pinnedEventIds") || [];
            const next = current.includes(eventId)
              ? current.filter((x) => x !== eventId)
              : [...current, eventId];
            setValue("pinnedEventIds", next, { shouldDirty: true });
          }}
          worldData={worldData}
          events={events}
          notesNode={
            <textarea
              {...register("notes")}
              placeholder="Write your notes here..."
              style={styles.notesTextarea}
            />
          }
          draftsNode={
            <DraftsPanel
              drafts={chapter?.drafts || []}
              currentBody={body}
              activeDraftId={activeDraftId}
              onSaveAsDraft={handleSaveAsDraft}
              onRestoreDraft={handleRestoreDraft}
              onDeleteDraft={handleDeleteDraft}
              onUndeleteDraft={handleUndeleteDraft}
              onRenameDraft={handleRenameDraft}
            />
          }
          foreshadowsNode={
            <ForeshadowPanel
              foreshadows={foreshadows || []}
              chapters={allChapters}
              currentChapterId={id || ""}
              onAddForeshadow={(f) => {
                if (bookIdx >= 0 && bookId) {
                  appStore.books[bookIdx].foreshadows.push(f);
                  const token =
                    localStorage.getItem("seshat-auth-token") ||
                    sessionStorage.getItem("seshat-auth-token");
                  if (token) {
                    updateFileOnGitHub(
                      token,
                      bookId,
                      "foreshadows.json",
                      JSON.stringify(
                        appStore.books[bookIdx].foreshadows.get(),
                        null,
                        2,
                      ),
                    ).catch(console.error);
                  }
                }
              }}
              onUpdateForeshadow={(f) => {
                if (bookIdx >= 0 && bookId) {
                  const idx = appStore.books[bookIdx].foreshadows
                    .get()
                    .findIndex((x) => x.id === f.id);
                  if (idx >= 0) {
                    appStore.books[bookIdx].foreshadows[idx].set(f);
                    const token =
                      localStorage.getItem("seshat-auth-token") ||
                      sessionStorage.getItem("seshat-auth-token");
                    if (token) {
                      updateFileOnGitHub(
                        token,
                        bookId,
                        "foreshadows.json",
                        JSON.stringify(
                          appStore.books[bookIdx].foreshadows.get(),
                          null,
                          2,
                        ),
                      ).catch(console.error);
                    }
                  }
                }
              }}
              onDeleteForeshadow={(fid) => {
                if (bookIdx >= 0 && bookId) {
                  appStore.books[bookIdx].foreshadows.set(
                    (prev: Foreshadow[]) => prev.filter((x) => x.id !== fid),
                  );
                  const token =
                    localStorage.getItem("seshat-auth-token") ||
                    sessionStorage.getItem("seshat-auth-token");
                  if (token) {
                    updateFileOnGitHub(
                      token,
                      bookId,
                      "foreshadows.json",
                      JSON.stringify(
                        appStore.books[bookIdx].foreshadows.get(),
                        null,
                        2,
                      ),
                    ).catch(console.error);
                  }
                }
              }}
            />
          }
          continuityNode={
            <ContinuityTracker
              text={body || ""}
              characters={characters}
              pinnedCharIds={pinnedChars}
            />
          }
        />
      </>
    </div>
  );
}

const styles = {
  notFound: {
    padding: "40px",
    color: "var(--text-secondary)",
  },
  headerFlex1: {
    flex: 1,
    minWidth: 0,
  },
  loaderHeaderRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 12,
    marginTop: 6,
  },
  headerMetaRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 8,
  },
  numberInput: {
    ...S.input,
    width: 64,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    border: "none",
    borderBottom: "1px solid var(--border)",
    padding: "2px 0",
  },
  eventPickerWrapper: {
    width: 240,
  },
  titleInput: {
    ...S.input,
    fontSize: 28,
    fontFamily: "var(--font-serif)",
    fontWeight: 400,
    border: "none",
    padding: 0,
    color: "var(--text-primary)",
    letterSpacing: 0.5,
  },
  loaderToolbar: {
    display: "flex",
    gap: 12,
  },
  loaderSynopsis: {
    marginBottom: 28,
    marginTop: 8,
  },
  synopsisTextarea: {
    width: "100%",
    fontSize: 12,
    color: "var(--text-muted)",
    fontStyle: "italic",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--border)",
    outline: "none",
    resize: "none",
    lineHeight: 1.6,
    marginBottom: 28,
    paddingRight: "24px",
    padding: "4px 0",
  },
  loaderOutlineWrapper: {
    marginBottom: 32,
    paddingRight: 12,
  },
  loaderOutlineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  loaderOutlineCard: {
    background: "var(--bg-panel)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: 16,
  },
  loaderOutlineGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  loaderEditorWrapper: {
    marginTop: 24,
  },
  loaderEditorToolbar: {
    display: "flex",
    gap: 4,
    padding: "6px 0",
    borderBottom: "1px solid var(--border)",
    marginBottom: "var(--space-3)",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loaderEditorToolbarLeft: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  loaderDivider: {
    width: 1,
    height: 16,
    background: "var(--border)",
    margin: "0 4px",
  },
  loaderEditorBody: {
    padding: "0 0 12px 0",
  },
  loaderParagraph: {
    marginBottom: 28,
  },
  notesTextarea: {
    width: "100%",
    flex: 1,
    fontSize: 13,
    color: "var(--text-secondary)",
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    lineHeight: 1.7,
    padding: "4px 0",
  },
} satisfies Record<string, React.CSSProperties>;

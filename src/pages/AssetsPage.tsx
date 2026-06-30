import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AttachFileIcon,
  AudiotrackIcon,
  CloseIcon,
  DeleteIcon,
  DescriptionIcon,
  DownloadIcon,
  FolderOpenIcon,
  ImageIcon,
  InsertDriveFileIcon,
  UploadFileIcon,
  VideoFileIcon,
} from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import {
  listAssetsFromGitHub,
  uploadAssetsToGitHub,
  type AssetEntry,
} from "../lib/githubSync";
import * as mammoth from "mammoth/mammoth.browser.js";
import { showToast } from "../store/toastStore";
import { Modal } from "../components/ui/Modal";
import "./assets-page.css";

// ─── helpers ─────────────────────────────────────────────────────────────────

const MAX_PREVIEW_SIZE = 70 * 1024 * 1024; // 70 MB — matches server limit

const getToken = (): string | null =>
  localStorage.getItem("seshat-auth-token") ||
  sessionStorage.getItem("seshat-auth-token");

type FileCategory = "all" | "image" | "document" | "audio" | "video" | "other";

function categorize(mimeType: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    mimeType.includes("document") ||
    mimeType === "application/pdf"
  )
    return "document";
  return "other";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const CAT_COLORS: Record<FileCategory, string> = {
  all: "var(--text-muted)",
  image: "var(--asset-c-image)",
  audio: "var(--asset-c-audio)",
  video: "var(--asset-c-video)",
  document: "var(--asset-c-doc)",
  other: "var(--text-muted)",
};

function FileTypeIcon({
  mimeType,
  size = 18,
}: {
  mimeType: string;
  size?: number;
}) {
  const cat = categorize(mimeType);
  const sx = { fontSize: size };
  const style = {
    color: CAT_COLORS[cat],
    flexShrink: 0,
  } as React.CSSProperties;
  if (cat === "image") return <ImageIcon sx={sx} style={style} />;
  if (cat === "audio") return <AudiotrackIcon sx={sx} style={style} />;
  if (cat === "video") return <VideoFileIcon sx={sx} style={style} />;
  if (cat === "document") return <DescriptionIcon sx={sx} style={style} />;
  return <InsertDriveFileIcon sx={sx} style={style} />;
}

// ─── Stage (preview) ─────────────────────────────────────────────────────────

function Stage({
  asset,
  bookId,
  onClose,
  onDelete,
}: {
  asset: AssetEntry;
  bookId: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  const token = getToken();
  const [state, setState] = useState<{
    objectUrl: string | null;
    textContent: string | null;
    isLoading: boolean;
    loadErr: string | null;
  }>({ objectUrl: null, textContent: null, isLoading: true, loadErr: null });

  const { objectUrl, textContent, isLoading, loadErr } = state;
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const performDelete = async () => {
    setIsConfirmingDelete(false);
    setIsDeleting(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await fetch("/api/github/deleteFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          bookId,
          path: `assets/${asset.filename}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      onDelete();
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cat = categorize(asset.mimeType);
  const isStreamable = cat === "video" || cat === "audio";
  const apiUrl = useMemo(() => {
    if (!token) return "";
    return `/api/github/loadFile?token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(bookId)}&path=${encodeURIComponent(`assets/${asset.filename}`)}`;
  }, [token, bookId, asset.filename]);

  useEffect(() => {
    if (!token) return;

    if (asset.size > MAX_PREVIEW_SIZE) {
      setTimeout(
        () =>
          setState({
            objectUrl: null,
            textContent: null,
            isLoading: false,
            loadErr: "The file too big",
          }),
        0,
      );
      return;
    }

    // Streamable media (video/audio) uses the API URL directly — no blob loading
    if (isStreamable) {
      setTimeout(
        () =>
          setState({
            objectUrl: null,
            textContent: null,
            isLoading: false,
            loadErr: null,
          }),
        0,
      );
      return;
    }

    const fetchUrl = `${apiUrl}&t=${Date.now()}`;

    setTimeout(
      () =>
        setState({
          objectUrl: null,
          textContent: null,
          isLoading: true,
          loadErr: null,
        }),
      0,
    );

    if (cat === "document" || cat === "other") {
      if (asset.filename.endsWith(".docx")) {
        fetch(fetchUrl, { cache: "no-store" })
          .then((r) => r.blob())
          .then(async (blob) => {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer });
              setState((p) => ({
                ...p,
                textContent: result.value,
                isLoading: false,
              }));
            } catch (err) {
              console.error("Failed to render document:", err);
              setState((p) => ({
                ...p,
                loadErr: "Failed to render document.",
                isLoading: false,
              }));
            }
          })
          .catch(() =>
            setState((p) => ({
              ...p,
              loadErr: "Preview unavailable.",
              isLoading: false,
            })),
          );
      } else {
        fetch(fetchUrl, { cache: "no-store" })
          .then((r) => r.text())
          .then((t) =>
            setState((p) => ({ ...p, textContent: t, isLoading: false })),
          )
          .catch(() =>
            setState((p) => ({
              ...p,
              loadErr: "Preview unavailable.",
              isLoading: false,
            })),
          );
      }
    } else {
      fetch(fetchUrl, { cache: "no-store" })
        .then((r) => r.blob())
        .then((blob) => {
          setState((p) => ({
            ...p,
            objectUrl: URL.createObjectURL(blob),
            isLoading: false,
          }));
        })
        .catch(() =>
          setState((p) => ({
            ...p,
            loadErr: "Preview unavailable.",
            isLoading: false,
          })),
        );
    }

    return () => {
      setState((p) => {
        if (p.objectUrl) URL.revokeObjectURL(p.objectUrl);
        return p;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.filename]);

  // Slide-in animation
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateX(12px)";
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.24s ease, transform 0.24s ease";
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
  }, [asset.filename]);

  return (
    <div className="ap-stage" ref={stageRef}>
      {/* Stage topbar */}
      <div className="ap-stage-bar">
        <div className="ap-stage-bar-info">
          <FileTypeIcon mimeType={asset.mimeType} size={14} />
          <span className="ap-stage-bar-name">{asset.filename}</span>
          <span className="ap-stage-bar-meta">{formatBytes(asset.size)}</span>
        </div>
        <div className="ap-stage-bar-actions">
          <button
            className="ap-stage-icon-btn"
            onClick={() => setIsConfirmingDelete(true)}
            title="Delete"
            disabled={isDeleting}
            style={{
              color: isDeleting ? "var(--text-muted)" : "var(--color-red)",
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            <DeleteIcon sx={{ fontSize: 15 }} />
          </button>
          {apiUrl && (
            <a
              className="ap-stage-icon-btn"
              href={apiUrl}
              download={asset.filename}
              title="Download"
            >
              <DownloadIcon sx={{ fontSize: 15 }} />
            </a>
          )}
          <button
            className="ap-stage-icon-btn ap-stage-close"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </button>
        </div>
      </div>

      {/* Stage canvas */}
      <div className="ap-stage-canvas">
        {isLoading && (
          <div className="ap-stage-center">
            <div className="ap-spinner" />
            <span className="ap-stage-hint">Loading…</span>
          </div>
        )}
        {!isLoading && loadErr && (
          <div className="ap-stage-center ap-stage-err">{loadErr}</div>
        )}
        {!isLoading && !loadErr && cat === "image" && objectUrl && (
          <div className="ap-img-wrap">
            <img
              src={objectUrl}
              alt={asset.filename}
              className="ap-img"
              draggable={false}
            />
          </div>
        )}
        {!isLoading && !loadErr && cat === "audio" && (
          <div className="ap-audio-wrap">
            <div className="ap-audio-icon">
              <AudiotrackIcon sx={{ fontSize: 72 }} />
            </div>
            <audio controls src={apiUrl} className="ap-audio" />
            <span className="ap-stage-hint">{asset.filename}</span>
          </div>
        )}
        {!isLoading && !loadErr && cat === "video" && (
          <video controls src={apiUrl} className="ap-video" />
        )}
        {!isLoading &&
          !loadErr &&
          asset.mimeType === "application/pdf" &&
          objectUrl && (
            <iframe src={objectUrl} title={asset.filename} className="ap-pdf" />
          )}
        {!isLoading &&
          !loadErr &&
          (cat === "document" || cat === "other") &&
          textContent !== null &&
          (asset.filename.endsWith(".docx") ? (
            <div
              className="ap-text ap-docx"
              dangerouslySetInnerHTML={{ __html: textContent }}
            />
          ) : (
            <pre className="ap-text">{textContent}</pre>
          ))}
      </div>

      {isConfirmingDelete && (
        <Modal
          title="Delete File"
          onClose={() => setIsConfirmingDelete(false)}
          footer={
            <>
              <button
                className="seshat-button seshat-button-ghost"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="seshat-button seshat-button-danger"
                onClick={performDelete}
                disabled={isDeleting}
              >
                Yes, delete
              </button>
            </>
          }
        >
          <div className="seshat-modal-body" style={{ padding: "16px 28px" }}>
            Are you sure you want to delete <strong>{asset.filename}</strong>? This action cannot be undone.
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Filmstrip row ────────────────────────────────────────────────────────────

function FilmRow({
  asset,
  isActive,
  isChecked,
  onCheck,
  onClick,
}: {
  asset: AssetEntry;
  isActive: boolean;
  isChecked: boolean;
  onCheck: (sha: string, checked: boolean) => void;
  onClick: () => void;
}) {
  const cat = categorize(asset.mimeType);
  return (
    <div
      className={`ap-film-row ${isActive ? "active" : ""} ${isChecked ? "ap-film-row--checked" : ""} ap-film-row--${cat}`}
      title={asset.filename}
    >
      <input
        type="checkbox"
        className="ap-film-check"
        checked={isChecked}
        onChange={(e) => onCheck(asset.sha, e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select ${asset.filename}`}
      />
      <button className="ap-film-row-btn" onClick={onClick}>
        <div className="ap-film-icon">
          <FileTypeIcon mimeType={asset.mimeType} size={16} />
        </div>
        <div className="ap-film-info">
          <span className="ap-film-name">{asset.filename}</span>
          <span className="ap-film-meta">
            {cat} · {formatBytes(asset.size)}
          </span>
        </div>
        {isActive && <div className="ap-film-dot" />}
      </button>
    </div>
  );
}

// ─── Upload bar ───────────────────────────────────────────────────────────────

function UploadBar({
  onFiles,
  isUploading,
  isDragOver,
}: {
  onFiles: (files: File[]) => void;
  isUploading: boolean;
  isDragOver: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`ap-upload-bar ${isDragOver ? "drag-over" : ""} ${isUploading ? "busy" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      {isUploading ? (
        <>
          <div className="ap-spinner ap-spinner--sm" />
          <span className="ap-upload-label">Uploading…</span>
        </>
      ) : (
        <>
          <UploadFileIcon sx={{ fontSize: 15 }} className="ap-upload-icon" />
          <span className="ap-upload-label">
            {isDragOver ? "Drop to upload" : "Upload files"}
          </span>
          <button
            className="ap-upload-btn"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            Browse
          </button>
        </>
      )}
    </div>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const TABS: { id: FileCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "document", label: "Docs" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
  { id: "other", label: "Other" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const pageRef = useAnimateIn();

  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [selected, setSelected] = useState<AssetEntry | null>(null);
  const [checkedShas, setCheckedShas] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FileCategory>("all");
  const [search, setSearch] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const isInternalDragRef = useRef(false);

  const loadAssets = useCallback(async () => {
    const token = getToken();
    if (!token || !bookId) return;
    setTimeout(() => setIsLoading(true), 0);
    try {
      const list = await listAssetsFromGitHub(token, bookId);
      setAssets(list);
    } catch (err) {
      showToast("Failed to load assets: " + (err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    setTimeout(() => {
      void loadAssets();
    }, 0);
  }, [loadAssets]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      const token = getToken();
      if (!token || !bookId) return;
      setIsUploading(true);
      try {
        showToast(`Uploading ${files.length} file(s)…`, "info");
        await uploadAssetsToGitHub(token, bookId, files);
        showToast(`Uploaded ${files.length} file(s)`, "success");
        await loadAssets();
      } catch (err) {
        showToast(`Upload Failed: ` + (err as Error).message, "error");
      } finally {
        setIsUploading(false);
      }
    },
    [bookId, loadAssets],
  );

  const handleCheck = useCallback((sha: string, checked: boolean) => {
    setCheckedShas((prev) => {
      const next = new Set(prev);
      if (checked) next.add(sha);
      else next.delete(sha);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const toDelete = assets.filter((a) => checkedShas.has(a.sha));
    if (!toDelete.length) return;
    const token = getToken();
    if (!token || !bookId) return;
    setIsDeleting(true);
    setConfirmingDelete(false);
    try {
      const res = await fetch("/api/github/deleteFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          bookId,
          paths: toDelete.map((a) => `assets/${a.filename}`),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error || "Failed to delete");
      }
      const deletedShas = new Set(toDelete.map((a) => a.sha));
      setAssets((prev) => prev.filter((a) => !deletedShas.has(a.sha)));
      setCheckedShas(new Set());
      if (selected && deletedShas.has(selected.sha)) setSelected(null);
      showToast(`Deleted ${toDelete.length} file(s)`, "success");
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setIsDeleting(false);
    }
  }, [assets, checkedShas, bookId, selected]);

  // Clear confirm state whenever selection changes
  useEffect(() => {
    setTimeout(() => {
      setConfirmingDelete(false);
    }, 200);
  }, [checkedShas.size]);

  // Track drags that start within the page (e.g. native image drag)
  const handleDragStart = () => {
    isInternalDragRef.current = true;
  };
  const handleDragEnd = () => {
    isInternalDragRef.current = false;
  };

  // Page-level drag-and-drop (external file upload only)
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (isInternalDragRef.current) {
      isInternalDragRef.current = false;
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleUpload(files);
  };

  const filtered = assets.filter((a) => {
    const catOk = filter === "all" || categorize(a.mimeType) === filter;
    const q = search.toLowerCase();
    const nameOk = !q || a.filename.toLowerCase().includes(q);
    return catOk && nameOk;
  });

  const counts: Record<FileCategory, number> = {
    all: assets.length,
    image: assets.filter((a) => categorize(a.mimeType) === "image").length,
    document: assets.filter((a) => categorize(a.mimeType) === "document")
      .length,
    audio: assets.filter((a) => categorize(a.mimeType) === "audio").length,
    video: assets.filter((a) => categorize(a.mimeType) === "video").length,
    other: assets.filter((a) => categorize(a.mimeType) === "other").length,
  };

  const hasFiles = filtered.length > 0;

  const handleCheckAll = useCallback(
    (check: boolean) => {
      setCheckedShas(check ? new Set(filtered.map((a) => a.sha)) : new Set());
    },
    [filtered],
  );

  return (
    <div
      className={`ap-page ${isDragOver ? "ap-page--drag" : ""}`}
      ref={pageRef}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Global drag overlay */}
      {isDragOver && (
        <div className="ap-drag-overlay">
          <UploadFileIcon sx={{ fontSize: 48 }} />
          <span>Drop files to upload</span>
        </div>
      )}

      {/* ── Top command bar ── */}
      <div className="ap-topbar">
        <UploadBar
          onFiles={handleUpload}
          isUploading={isUploading}
          isDragOver={isDragOver}
        />
      </div>

      {/* ── Body: filmstrip + stage ── */}
      <div className={`ap-body ${selected ? "ap-body--split" : ""}`}>
        {/* Left: filmstrip panel */}
        <div className="ap-panel">
          {/* Search + filter */}
          <div className="ap-controls">
            <input
              type="search"
              className="ap-search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="ap-tabs" role="tablist">
              {TABS.filter((t) => t.id === "all" || counts[t.id] > 0).map(
                (t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={filter === t.id}
                    className={`ap-tab ${filter === t.id ? "active" : ""}`}
                    onClick={() => setFilter(t.id)}
                  >
                    {t.label}
                    {counts[t.id] > 0 && (
                      <span className="ap-tab-count">{counts[t.id]}</span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Bulk-action bar — visible when at least one item is checked */}
          {checkedShas.size > 0 && (
            <div
              className={`ap-bulk-bar ${confirmingDelete ? "ap-bulk-bar--confirm" : ""}`}
            >
              {confirmingDelete ? (
                /* ── Confirm mode ── */
                <>
                  <span className="ap-bulk-confirm-label">
                    Delete {checkedShas.size} file
                    {checkedShas.size > 1 ? "s" : ""}? This cannot be undone.
                  </span>
                  <button
                    className="ap-bulk-delete-btn"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="ap-spinner ap-spinner--sm" />
                    ) : (
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    )}
                    {isDeleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    className="ap-bulk-clear-btn"
                    onClick={() => setConfirmingDelete(false)}
                    title="Cancel"
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </button>
                </>
              ) : (
                /* ── Normal mode ── */
                <>
                  <input
                    type="checkbox"
                    className="ap-film-check"
                    checked={
                      checkedShas.size === filtered.length &&
                      filtered.length > 0
                    }
                    onChange={(e) => handleCheckAll(e.target.checked)}
                    aria-label="Select all"
                  />
                  <span className="ap-bulk-count">
                    {checkedShas.size} selected
                  </span>
                  <button
                    className="ap-bulk-delete-btn"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={isDeleting}
                    title="Delete selected"
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                    Delete
                  </button>
                  <button
                    className="ap-bulk-clear-btn"
                    onClick={() => setCheckedShas(new Set())}
                    title="Clear selection"
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* File list */}
          <div className="ap-film">
            {isLoading && (
              <div className="ap-empty">
                <div className="ap-spinner" />
                <span>Loading…</span>
              </div>
            )}

            {!isLoading && !hasFiles && (
              <div className="ap-empty">
                {search || filter !== "all" ? (
                  <>
                    <AttachFileIcon
                      sx={{ fontSize: 32 }}
                      style={{ opacity: 0.15 }}
                    />
                    <span>No matches</span>
                  </>
                ) : (
                  <>
                    <FolderOpenIcon
                      sx={{ fontSize: 52 }}
                      style={{ opacity: 0.08 }}
                    />
                    <span className="ap-empty-title">No assets yet</span>
                    <span className="ap-empty-sub">
                      Drop any file onto this page or use "Browse" above to
                      upload.
                    </span>
                  </>
                )}
              </div>
            )}

            {!isLoading &&
              filtered.map((asset) => (
                <FilmRow
                  key={asset.sha}
                  asset={asset}
                  isActive={selected?.sha === asset.sha}
                  isChecked={checkedShas.has(asset.sha)}
                  onCheck={handleCheck}
                  onClick={() =>
                    setSelected((p) => (p?.sha === asset.sha ? null : asset))
                  }
                />
              ))}
          </div>
        </div>

        {/* Right: stage panel */}
        {selected && (
          <Stage
            asset={selected}
            bookId={bookId!}
            onClose={() => setSelected(null)}
            onDelete={() => {
              setAssets((prev) => prev.filter((a) => a.sha !== selected.sha));
              setSelected(null);
            }}
          />
        )}

        {/* No-selection placeholder when panel is in split mode */}
        {!selected && hasFiles && (
          <div className="ap-stage-placeholder">
            <div className="ap-placeholder-inner">
              <div className="ap-placeholder-icon">
                <FolderOpenIcon sx={{ fontSize: 40 }} />
              </div>
              <span className="ap-placeholder-text">
                Select a file to preview
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

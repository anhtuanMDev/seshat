import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appStore, mkBook } from "../store/appStore";
import { S } from "../lib/utils";
import { AutoStoriesIcon, AddIcon, LightModeIcon, DarkModeIcon, CloseIcon } from "../components/ui/icons";
import { Modal } from "../components/ui/Modal";
import { useTheme } from "../hooks/useThemeHook";
import { useBooks, useActiveBookId } from "../hooks/useWorldStore";
import { syncToGitHub } from "../lib/githubSync";
import { showToast } from "../store/toastStore";
import { CircularProgress } from "@mui/material";

export default function BookListPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const books = useBooks();
  const activeBookId = useActiveBookId();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const confirmCreateBook = async () => {
    if (!newBookTitle.trim()) return;
    try {
      setIsCreating(true);
      const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
      if (!token) {
        showToast("Please log in to create a book.", "error");
        navigate("/auth");
        return;
      }
      const book = mkBook(newBookTitle.trim());
      appStore.books.push(book);
      
      // Initialize the book directory in GitHub instantly
      await syncToGitHub(token);
      showToast("Book initialized securely in the cloud!", "success");
      
      setShowCreateModal(false);
      setNewBookTitle("");
      navigate(`/book/${book.id}/world`);
    } catch (error) {
      showToast("Failed to initialize book in cloud: " + (error as Error).message, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteBook = (bookId: string) => {
    if (bookId === activeBookId) {
      appStore.activeBookId.set(null);
    }
    appStore.books.set((prev) => prev.filter((b) => b.id !== bookId));
    setConfirmDelete(null);
  };

  const startRename = (book: { id: string; title: string }) => {
    setEditingId(book.id);
    setEditValue(book.title);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      const idx = books.findIndex((b) => b.id === editingId);
      if (idx >= 0) {
        appStore.books[idx].title.set(editValue.trim());
      }
    }
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-app)",
      color: "var(--text-primary)",
      fontFamily: "'Georgia',serif",
      padding: 40,
    }}>
      <div style={{ position: "absolute", top: 20, right: 24 }}>
        <button
          onClick={toggle}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          style={{ ...S.ghost, fontSize: 15, opacity: 0.7 }}
        >
          {theme === "light" ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
        </button>
      </div>

      <AutoStoriesIcon sx={{ fontSize: 40, marginBottom: 8, color: "var(--text-logo)" }} />
      <h1 style={{ fontSize: 18, letterSpacing: 6, textTransform: "uppercase", color: "var(--text-logo)", margin: "0 0 4px", fontWeight: 400 }}>Seshat</h1>
      <p style={{ ...S.dim, marginBottom: 32 }}>World-building for writers and game designers</p>

      {books.length === 0 ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ ...S.dim, fontStyle: "italic", marginBottom: 20 }}>No books yet. Create one to get started.</p>
          <button onClick={() => setShowCreateModal(true)} style={{ ...S.pill, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 20px" }}>
            <AddIcon sx={{ fontSize: 16 }} />
            New book
          </button>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ ...S.h2, margin: 0 }}>My books</p>
            <button onClick={() => setShowCreateModal(true)} style={{ ...S.ghost, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <AddIcon sx={{ fontSize: 14 }} />
              New book
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {books.map((book: { id: string; title: string }) => (
              <div key={book.id}>
                <div
                  onClick={() => {
                    if (editingId !== book.id) {
                      navigate(`/book/${book.id}/world`);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "var(--bg-main)",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--text-secondary)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  {editingId === book.id ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        ...S.input,
                        flex: 1,
                        fontSize: 15,
                        padding: "4px 8px",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        background: "var(--bg-main)",
                        color: "var(--text-primary)",
                      }}
                    />
                  ) : (
                    <span
                      style={{ fontSize: 15, color: "var(--text-primary)", cursor: "text" }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRename(book);
                      }}
                      title="Double-click to rename"
                    >
                      {book.title}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(book.id);
                    }}
                    style={{ ...S.ghost, fontSize: 18, lineHeight: 1, opacity: 0.4, padding: "0 4px", display: "flex" }}
                    title="Delete book"
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </button>
                </div>
                {confirmDelete === book.id && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}>
                    <span>Delete "{book.title}"? This cannot be undone.</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }}
                      style={{ ...S.pill, fontSize: 12, padding: "4px 12px", background: "#d32f2f", color: "#fff", border: "none" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                      style={{ ...S.ghost, fontSize: 12 }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <Modal title="Create New Book" onClose={() => !isCreating && setShowCreateModal(false)}>
          <div style={{ padding: "0 24px 24px" }}>
            <p style={{ ...S.dim, marginBottom: 16 }}>
              Enter a name for your new world. This will initialize a dedicated folder in your cloud backup.
            </p>
            <input
              autoFocus
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) confirmCreateBook();
              }}
              placeholder="e.g. The Lord of the Rings"
              disabled={isCreating}
              style={{ ...S.input, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 4, marginBottom: 24 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button 
                onClick={() => setShowCreateModal(false)} 
                disabled={isCreating}
                style={{ ...S.ghost, padding: "6px 16px" }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmCreateBook}
                disabled={!newBookTitle.trim() || isCreating}
                style={{ ...S.pill, padding: "6px 20px", display: "flex", alignItems: "center", gap: 8 }}
              >
                {isCreating ? <CircularProgress size={14} color="inherit" /> : null}
                {isCreating ? "Initializing..." : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

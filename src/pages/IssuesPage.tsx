import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchIssues, createIssue } from "../lib/githubIssues";
import { S } from "../lib/utils";
import { Modal } from "../components/ui/Modal";
import {
  BugReportIcon,
  DarkModeIcon,
  LightModeIcon,
} from "../components/ui/icons";
import { CircularProgress } from "@mui/material";
import { showToast } from "../store/toastStore";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useTheme } from "../hooks/useTheme";
import { appStore } from "../store/appStore";

type FilterType = "all" | "bug" | "recommendation" | "discussion";

export default function IssuesPage() {
  const navigate = useNavigate();
  const animRef = useAnimateIn();
  const { theme, toggle: toggleTheme } = useTheme();

  const activeBookId = appStore.activeBookId.get();
  const token =
    localStorage.getItem("seshat-auth-token") ||
    sessionStorage.getItem("seshat-auth-token");

  // State
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const queryClient = useQueryClient();

  // Filters
  const [filter, setFilter] = useState<FilterType>("all");

  // Modal form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<
    "bug" | "recommendation" | "discussion"
  >("discussion");
  const [newBody, setNewBody] = useState("");

  // 1. Fetch issue list with React Query caching
  const {
    data: issues = [],
    isLoading: isLoadingList,
    error,
  } = useQuery({
    queryKey: ["issues", token],
    queryFn: () => fetchIssues(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (error) {
      showToast("Failed to load issues: " + (error as Error).message, "error");
    }
  }, [error]);

  // 3. Handle Submit Issue
  const handleSubmitIssue = async () => {
    if (!token) return;
    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title || !body) return;

    setIsCreatingIssue(true);
    try {
      const newIssue = await createIssue(token, title, body, newType);
      showToast("Issue successfully published!", "success");
      setShowCreateModal(false);
      setNewTitle("");
      setNewBody("");
      setNewType("discussion");

      // Invalidate queries to trigger background reload and redirect
      queryClient.invalidateQueries({ queryKey: ["issues", token] });
      navigate(`/issues/${newIssue.number}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to publish issue: " + (err as Error).message, "error");
    } finally {
      setIsCreatingIssue(false);
    }
  };

  const getBadgeColors = (type: "bug" | "recommendation" | "discussion") => {
    switch (type) {
      case "bug":
        return { bg: "rgba(211, 47, 47, 0.15)", text: "#d32f2f" };
      case "recommendation":
        return { bg: "rgba(2, 136, 209, 0.15)", text: "#0288d1" };
      default:
        return { bg: "rgba(0, 150, 136, 0.15)", text: "#009688" };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const filteredIssues = issues.filter((iss) => {
    if (filter === "all") return true;
    return iss.type === filter;
  });

  const getTypeAccent = (type: "bug" | "recommendation" | "discussion") => {
    switch (type) {
      case "bug":
        return "#d32f2f";
      case "recommendation":
        return "#0288d1";
      default:
        return "#009688";
    }
  };

  const getFilterStyle = (active: boolean) => ({
    background: active ? "var(--color-primary)" : "var(--bg-surface)",
    color: active ? "var(--bg-app)" : "var(--text-secondary)",
    border: "none",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
    transition: "all 0.15s ease",
  });

  return (
    <div style={styles.container}>
      {/* ── Global Header ── */}
      <div className="seshat-forum-header" style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo} onClick={() => navigate("/")}>
            Seshat
          </span>
          <span style={styles.headerDivider}>/</span>
          <span style={styles.headerTitle}>Forum</span>
        </div>
        <div style={styles.headerRight}>
          {activeBookId && (
            <button
              className="seshat-forum-back-btn"
              onClick={() => navigate(`/book/${activeBookId}/world`)}
              style={styles.backToBookBtn}
            >
              ← Book
            </button>
          )}
          <button
            className="seshat-forum-my-books-btn"
            onClick={() => navigate("/")}
            style={styles.myBooksBtn}
          >
            My Books
          </button>
          <button
            onClick={toggleTheme}
            style={styles.themeToggleBtn}
            title={theme === "light" ? "Dark Mode" : "Light Mode"}
          >
            {theme === "light" ? (
              <DarkModeIcon sx={styles.themeIcon} />
            ) : (
              <LightModeIcon sx={styles.themeIcon} />
            )}
          </button>
        </div>
      </div>

      {/* ── Main List Container ── */}
      <div
        ref={animRef}
        className="seshat-forum-main"
        style={styles.mainContainer}
      >
        <div style={styles.contentWrapper}>
          {/* Dashboard Header Section */}
          <div
            className="seshat-forum-dashboard-header"
            style={styles.dashboardHeader}
          >
            <div>
              <h1 className="seshat-forum-title" style={styles.dashboardTitle}>
                Community Forum
              </h1>
              <p
                className="seshat-forum-subtitle"
                style={styles.dashboardSubtitle}
              >
                Ask questions, report bugs, and suggest features.
              </p>
            </div>
            <button
              className="seshat-forum-new-btn"
              onClick={() => setShowCreateModal(true)}
              style={styles.newDiscussionBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              + New
            </button>
          </div>

          {/* Type filters — outer div owns the border/margin, inner div handles horizontal scroll */}
          <div style={styles.filtersRow}>
            <div className="seshat-forum-filters" style={styles.filtersScroll}>
              {(
                ["all", "bug", "recommendation", "discussion"] as FilterType[]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={getFilterStyle(filter === t)}
                >
                  {t === "all"
                    ? "All"
                    : t === "bug"
                      ? "🐛 Bugs"
                      : t === "recommendation"
                        ? "💡 Ideas"
                        : "💬 Discussion"}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          {isLoadingList ? (
            <div style={styles.issuesList}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={styles.skeletonCard}>
                  <div
                    style={{
                      ...styles.skeletonLine,
                      width: "15%",
                      height: 14,
                      marginBottom: 12,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                  <div
                    style={{
                      ...styles.skeletonLine,
                      width: "75%",
                      height: 17,
                      marginBottom: 8,
                      animationDelay: `${i * 0.15 + 0.05}s`,
                    }}
                  />
                  <div
                    style={{
                      ...styles.skeletonLine,
                      width: "90%",
                      height: 12,
                      marginBottom: 4,
                      animationDelay: `${i * 0.15 + 0.1}s`,
                    }}
                  />
                  <div
                    style={{
                      ...styles.skeletonLine,
                      width: "60%",
                      height: 12,
                      marginBottom: 14,
                      animationDelay: `${i * 0.15 + 0.15}s`,
                    }}
                  />
                  <div
                    style={{
                      ...styles.skeletonLine,
                      width: "28%",
                      height: 11,
                      animationDelay: `${i * 0.15 + 0.2}s`,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : filteredIssues.length === 0 ? (
            <div style={styles.emptyContainer}>
              <BugReportIcon sx={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>No discussions yet</h3>
              <p style={styles.emptyText}>
                Be the first to ask a question or file a report!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={styles.startDiscussionBtn}
              >
                Start a Discussion
              </button>
            </div>
          ) : (
            <div style={styles.issuesList}>
              {filteredIssues.map((iss) => {
                const badge = getBadgeColors(iss.type);
                // Create a brief preview from body
                const bodyPreview =
                  iss.body.length > 180
                    ? iss.body.slice(0, 180) + "..."
                    : iss.body;

                return (
                  <div
                    key={iss.number}
                    className="seshat-forum-card"
                    onClick={() => navigate(`/issues/${iss.number}`)}
                    style={{
                      ...styles.issueCard,
                      borderLeft: `3px solid ${getTypeAccent(iss.type)}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow =
                        "0 1px 4px rgba(0,0,0,0.04)";
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <span
                        style={{
                          ...styles.badgeBase,
                          background: badge.bg,
                          color: badge.text,
                        }}
                      >
                        {iss.type}
                      </span>
                      <span style={styles.issueDate}>
                        {formatDate(iss.createdAt)}
                      </span>
                    </div>

                    <h3
                      className="seshat-forum-card-title"
                      style={styles.issueTitle}
                    >
                      {iss.title}
                    </h3>
                    <p style={styles.issueBodyPreview}>{bodyPreview}</p>

                    <div style={styles.cardFooter}>
                      <span style={styles.issueNumber}>
                        by {iss.author} · #{iss.number}
                      </span>
                      <span style={styles.commentsCountSpan}>
                        💬 {iss.commentsCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <Modal
          title="New Discussion"
          onClose={() => !isCreatingIssue && setShowCreateModal(false)}
        >
          <div className="seshat-modal-body">
            {/* Type selector — segmented toggle tabs */}
            <div>
              <p className="seshat-modal-section-title">WHAT IS THIS ABOUT?</p>
              <div className="seshat-modal-type-selector">
                {(
                  [
                    { value: "discussion", icon: "💬", label: "Discussion" },
                    { value: "bug",        icon: "🐛", label: "Bug Report" },
                    { value: "recommendation", icon: "💡", label: "Feature" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    disabled={isCreatingIssue}
                    onClick={() => setNewType(opt.value)}
                    className={`seshat-modal-type-btn ${newType === opt.value ? "active" : ""}`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="seshat-modal-field-group">
              <label className="seshat-modal-field-label">Title</label>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Briefly describe your topic…"
                disabled={isCreatingIssue}
                className="seshat-modal-input-field"
              />
            </div>

            {/* Description */}
            <div className="seshat-modal-field-group">
              <div className="seshat-modal-label-row">
                <label className="seshat-modal-field-label">Details</label>
                <span className="seshat-modal-char-count">{newBody.length} chars</span>
              </div>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Describe the issue or idea in as much detail as you can…"
                disabled={isCreatingIssue}
                className="seshat-modal-textarea-field"
              />
            </div>

            {/* Footer */}
            <div className="seshat-modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingIssue}
                className="seshat-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIssue}
                disabled={!newTitle.trim() || !newBody.trim() || isCreatingIssue}
                className="seshat-modal-btn-submit"
              >
                {isCreatingIssue && (
                  <CircularProgress size={13} color="inherit" />
                )}
                {isCreatingIssue ? "Publishing…" : "Publish →"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile FAB — replaces the top "+ New" button on small screens */}
      <button
        className="seshat-forum-fab"
        onClick={() => setShowCreateModal(true)}
        aria-label="New discussion"
      >
        +
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    width: "100dvw",
    overflow: "hidden",
    background: "var(--bg-app)",
    color: "var(--text-primary)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    height: 48,
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-top)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  headerLogo: {
    ...S.logo,
    cursor: "pointer",
  },
  headerDivider: {
    color: "var(--text-muted)",
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary)",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  backToBookBtn: {
    ...S.ghost,
    fontSize: 13,
    color: "var(--color-primary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "4px 12px",
    background: "transparent",
    cursor: "pointer",
  },
  myBooksBtn: {
    ...S.ghost,
    fontSize: 13,
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  themeToggleBtn: {
    ...S.ghost,
    padding: 8,
    display: "flex",
    alignItems: "center",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  themeIcon: {
    fontSize: 16,
  },
  mainContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "40px 24px",
    display: "flex",
    justifyContent: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 960,
    display: "flex",
    flexDirection: "column",
  },
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
    color: "var(--text-primary)",
    fontFamily: "var(--font-serif)",
  },
  dashboardSubtitle: {
    margin: "4px 0 0",
    color: "var(--text-secondary)",
    fontSize: 14,
  },
  newDiscussionBtn: {
    background: "var(--color-primary)",
    color: "var(--bg-app)",
    border: "none",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.3,
    padding: "7px 18px",
    cursor: "pointer",
    transition: "opacity 0.15s",
    flexShrink: 0,
  },
  filtersRow: {
    paddingBottom: 12,
    borderBottom: "1px solid var(--border)",
  },
  filtersScroll: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  loadingWrapper: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingProgress: {
    color: "var(--text-secondary)",
  },
  skeletonCard: {
    padding: "16px 20px",
    borderRadius: 8,
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--border)",
  },
  skeletonLine: {
    background: "var(--border)",
    borderRadius: 4,
    animation: "seshat-shimmer 1.4s ease-in-out infinite",
  },
  emptyContainer: {
    textAlign: "center",
    padding: "80px 40px",
    background: "var(--bg-main)",
    border: "1px dashed var(--border)",
    borderRadius: 12,
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 48,
    color: "var(--text-muted)",
    marginBottom: 16,
  },
  emptyTitle: {
    margin: "0 0 8px",
    fontSize: 16,
    color: "var(--text-primary)",
  },
  emptyText: {
    ...S.dim,
    margin: "0 0 24px",
    fontSize: 14,
  },
  startDiscussionBtn: {
    background: "var(--color-primary)",
    color: "var(--bg-app)",
    border: "none",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 20px",
    cursor: "pointer",
  },
  issuesList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  issueCard: {
    padding: "16px 20px",
    borderRadius: 8,
    cursor: "pointer",
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--border)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  issueNumber: {
    fontSize: 12,
    color: "var(--text-muted)",
  },
  issueDate: {
    fontSize: 12,
    color: "var(--text-muted)",
  },
  issueTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: "0 0 8px",
    lineHeight: 1.3,
  },
  issueBodyPreview: {
    fontSize: 14,
    color: "var(--text-secondary)",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "var(--text-secondary)",
    borderTop: "1px solid var(--border)",
    paddingTop: 12,
  },
  commentsCountSpan: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  modalBody: {
    padding: "24px 28px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  typeSection: {
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "1px",
    color: "var(--text-muted)",
    margin: "0 0 10px 0",
  },
  typePillRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  typePill: {
    padding: "16px 12px",
    borderRadius: 12,
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "center",
    outline: "none",
  },
  typePillActive: {
    background: "color-mix(in srgb, var(--color-primary) 8%, var(--bg-main))",
    borderColor: "var(--color-primary)",
    boxShadow: "0 0 0 1px var(--color-primary)",
  },
  typePillIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  typePillLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: 4,
  },
  typePillDesc: {
    fontSize: 10,
    color: "var(--text-muted)",
    lineHeight: 1.3,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  modalInput: {
    ...S.input,
    padding: "10px 14px",
    border: "1px solid var(--border-field)",
    borderRadius: 8,
    fontSize: 14,
    background: "var(--bg-main)",
    color: "var(--text-primary)",
  },
  charCount: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
  modalTextarea: {
    ...S.textarea,
    padding: "12px 14px",
    border: "1px solid var(--border-field)",
    borderRadius: 8,
    fontSize: 14,
    background: "var(--bg-main)",
    color: "var(--text-primary)",
    resize: "vertical",
    minHeight: 120,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    borderTop: "1px solid var(--border)",
    paddingTop: 24,
    marginTop: 8,
  },
  modalCancelBtn: {
    ...S.ghost,
    padding: "8px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  badgeBase: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    padding: "2px 6px",
    borderRadius: 4,
  },
} satisfies Record<string, React.CSSProperties>;

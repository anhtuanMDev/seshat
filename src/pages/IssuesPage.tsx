import { CircularProgress } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import {
  AutoFixHighIcon,
  BugReportIcon,
  ChatIcon,
  DarkModeIcon,
  LightModeIcon,
} from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useTheme } from "../hooks/useTheme";
import { createIssue, fetchIssues, type SeshatIssue } from "../lib/githubIssues";
import { S } from "../lib/utils";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";

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

  // Filters & Pagination
  const [filter, setFilter] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [prevFilter, setPrevFilter] = useState(filter);
  if (filter !== prevFilter) {
    setPrevFilter(filter);
    setCurrentPage(1);
  }
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
      
      // Optimistically update the cache so the list instantly shows the new issue
      queryClient.setQueryData(["issues", token], (oldData: SeshatIssue[] | undefined) => {
        if (!oldData) return [newIssue];
        // Ensure we don't add a duplicate if the background fetch already ran
        const exists = oldData.find((i: SeshatIssue) => i.number === newIssue.number);
        if (exists) return oldData;
        return [newIssue, ...oldData];
      });

      // Also invalidate to fetch fresh state in the background
      queryClient.invalidateQueries({ queryKey: ["issues", token] });
      navigate(`/issues/${newIssue.number}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to publish issue: " + (err as Error).message, "error");
    } finally {
      setIsCreatingIssue(false);
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

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage));
  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
                  {t === "all" ? (
                    "All"
                  ) : t === "bug" ? (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <BugReportIcon sx={{ fontSize: 14 }} /> Bugs
                    </span>
                  ) : t === "recommendation" ? (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <AutoFixHighIcon sx={{ fontSize: 14 }} /> Ideas
                    </span>
                  ) : (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <ChatIcon sx={{ fontSize: 14 }} /> Discussion
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={styles.paginationControls}>
                <button
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? "default" : "pointer",
                  }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span style={styles.pageInfo}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? "default" : "pointer",
                  }}
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Next
                </button>
              </div>
            )}
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
              {paginatedIssues.map((iss, index) => {
                const getIconForType = (type: string) => {
                  switch (type) {
                    case "bug":
                      return (
                        <BugReportIcon
                          sx={{ color: "#d32f2f", fontSize: 18 }}
                        />
                      );
                    case "recommendation":
                      return (
                        <AutoFixHighIcon
                          sx={{ color: "#0288d1", fontSize: 18 }}
                        />
                      );
                    default:
                      return (
                        <ChatIcon sx={{ color: "#009688", fontSize: 18 }} />
                      );
                  }
                };
                const isLast = index === paginatedIssues.length - 1;

                return (
                  <div
                    key={iss.number}
                    className="seshat-forum-item"
                    onClick={() => navigate(`/issues/${iss.number}`)}
                    style={{
                      ...styles.issueItem,
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-side)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={styles.issueItemIconWrapper}>
                      {getIconForType(iss.type)}
                    </div>

                    <div style={styles.issueItemMain}>
                      <div style={styles.issueItemTitleRow}>
                        <h3 style={styles.issueItemTitle}>{iss.title}</h3>
                      </div>
                      <div style={styles.issueItemMetaRow}>
                        <span style={styles.issueItemMetaText}>
                          #{iss.number} opened on {formatDate(iss.createdAt)} by{" "}
                          {iss.author}
                        </span>
                      </div>
                    </div>

                    <div style={styles.issueItemRight}>
                      {iss.commentsCount > 0 && (
                        <div style={styles.commentsCountBadge}>
                          <ChatIcon sx={{ fontSize: 14 }} />
                          <span>{iss.commentsCount}</span>
                        </div>
                      )}
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
                    {
                      value: "discussion",
                      icon: <ChatIcon sx={{ fontSize: 16 }} />,
                      label: "Discussion",
                    },
                    {
                      value: "bug",
                      icon: <BugReportIcon sx={{ fontSize: 16 }} />,
                      label: "Bug Report",
                    },
                    {
                      value: "recommendation",
                      icon: <AutoFixHighIcon sx={{ fontSize: 16 }} />,
                      label: "Feature",
                    },
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
                <span className="seshat-modal-char-count">
                  {newBody.length} chars
                </span>
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
                disabled={
                  !newTitle.trim() || !newBody.trim() || isCreatingIssue
                }
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  filtersScroll: {
    display: "flex",
    gap: 6,
    overflowX: "auto" as const,
    scrollbarWidth: "none" as const,
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  pageBtn: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: 6,
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.15s ease",
  },
  pageInfo: {
    fontSize: 13,
    color: "var(--text-secondary)",
    fontWeight: 500,
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
    border: "1px solid var(--border)",
    borderRadius: 8,
    background: "var(--bg-main)",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  issueItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: "16px 20px",
    cursor: "pointer",
    background: "transparent",
    transition: "background 0.15s ease",
  },
  issueItemIconWrapper: {
    marginTop: 2,
    marginRight: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  issueItemMain: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  issueItemTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  issueItemTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  issueItemMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  issueItemMetaText: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  issueItemRight: {
    display: "flex",
    alignItems: "center",
    marginLeft: 16,
    height: "100%",
  },
  commentsCountBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 500,
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

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  fetchIssues,
  createIssue,
} from "../lib/githubIssues";
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
  const [newType, setNewType] = useState<"bug" | "recommendation" | "discussion">(
    "discussion",
  );
  const [newBody, setNewBody] = useState("");

  // 1. Fetch issue list with React Query caching
  const { data: issues = [], isLoading: isLoadingList, error } = useQuery({
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

  const getFilterStyle = (active: boolean) => ({
    background: active ? "var(--bg-active)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    border: active ? "1px solid var(--border-field)" : "1px solid transparent",
    borderRadius: 20,
    padding: "6px 16px",
    fontSize: 13,
    cursor: "pointer",
    textTransform: "capitalize" as const,
    transition: "all 0.15s ease",
  });

  const submitBtnStyle = (disabled: boolean) => ({
    background: "var(--color-primary)",
    color: "var(--bg-app)",
    border: "none",
    borderRadius: 4,
    padding: "6px 20px",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: disabled ? "default" : "pointer" as const,
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <div style={styles.container}>
      {/* ── Global Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo} onClick={() => navigate("/")}>
            Seshat
          </span>
          <span style={styles.headerDivider}>/</span>
          <span style={styles.headerTitle}>Forum & Feedback</span>
        </div>
        <div style={styles.headerRight}>
          {activeBookId && (
            <button
              onClick={() => navigate(`/book/${activeBookId}/world`)}
              style={styles.backToBookBtn}
            >
              ← Back to Book
            </button>
          )}
          <button onClick={() => navigate("/")} style={styles.myBooksBtn}>
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
      <div ref={animRef} style={styles.mainContainer}>
        <div style={styles.contentWrapper}>
          {/* Dashboard Header Section */}
          <div style={styles.dashboardHeader}>
            <div>
              <h1 style={styles.dashboardTitle}>
                Community Forum & Bug Reports
              </h1>
              <p style={styles.dashboardSubtitle}>
                Ask questions, report issues, and discuss new feature ideas for
                Seshat.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={styles.newDiscussionBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              + New Discussion
            </button>
          </div>

          {/* Type filters */}
          <div style={styles.filtersRow}>
            {(["all", "bug", "recommendation", "discussion"] as FilterType[]).map(
              (t) => {
                const active = filter === t;
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    style={getFilterStyle(active)}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {t === "all"
                      ? "All Topics"
                      : t === "bug"
                      ? "Bugs"
                      : t === "recommendation"
                      ? "Recommendations"
                      : "Discussions"}
                  </button>
                );
              },
            )}
          </div>

          {/* List Content */}
          {isLoadingList ? (
            <div style={styles.loadingWrapper}>
              <CircularProgress size={28} sx={styles.loadingProgress} />
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

                const badgeStyle = {
                  ...styles.badgeBase,
                  background: badge.bg,
                  color: badge.text,
                };

                return (
                  <div
                    key={iss.number}
                    onClick={() => navigate(`/issues/${iss.number}`)}
                    style={styles.issueCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--text-secondary)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.cardHeaderLeft}>
                        <span style={badgeStyle}>{iss.type}</span>
                        <span style={styles.issueNumber}>#{iss.number}</span>
                      </div>
                      <span style={styles.issueDate}>
                        {formatDate(iss.createdAt)}
                      </span>
                    </div>

                    <h3 style={styles.issueTitle}>{iss.title}</h3>

                    <p style={styles.issueBodyPreview}>{bodyPreview}</p>

                    <div style={styles.cardFooter}>
                      <span>
                        Started by <b>{iss.author}</b>
                      </span>
                      <span style={styles.commentsCountSpan}>
                        💬 {iss.commentsCount} comment
                        {iss.commentsCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Issue Modal ── */}
      {showCreateModal && (
        <Modal
          title="Create New Discussion Thread"
          onClose={() => !isCreatingIssue && setShowCreateModal(false)}
        >
          <div style={styles.modalBody}>
            <div style={styles.fieldWrapper}>
              <label style={S.label}>Title</label>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Chapter 4 layout jumps on refresh"
                disabled={isCreatingIssue}
                style={styles.modalInput}
              />
            </div>

            <div style={styles.fieldWrapper}>
              <label style={S.label}>Type</label>
              <select
                value={newType}
                onChange={(e) =>
                  setNewType(
                    e.target.value as "bug" | "recommendation" | "discussion",
                  )
                }
                disabled={isCreatingIssue}
                style={styles.modalSelect}
              >
                <option value="discussion">Discussion / Recommendation</option>
                <option value="bug">Bug Report</option>
                <option value="recommendation">Feature Recommendation</option>
              </select>
            </div>

            <div style={styles.textareaWrapper}>
              <label style={S.label}>Details / Description</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Please describe the request or issue in detail..."
                rows={6}
                disabled={isCreatingIssue}
                style={{ ...S.textarea }}
              />
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingIssue}
                style={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIssue}
                disabled={
                  !newTitle.trim() || !newBody.trim() || isCreatingIssue
                }
                style={submitBtnStyle(
                  !newTitle.trim() || !newBody.trim() || isCreatingIssue,
                )}
              >
                {isCreatingIssue && (
                  <CircularProgress size={14} color="inherit" />
                )}
                {isCreatingIssue ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
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
    letterSpacing: 0.5,
    padding: "8px 20px",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  filtersRow: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    borderBottom: "1px solid var(--border)",
    paddingBottom: 16,
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
    padding: "20px 24px",
    borderRadius: 10,
    cursor: "pointer",
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    transition: "all 0.15s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
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
    padding: "0 24px 24px",
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  modalInput: {
    ...S.input,
    padding: "8px 12px",
    border: "1px solid var(--border-field)",
    borderRadius: 4,
    fontSize: 14,
  },
  modalSelect: {
    ...S.select,
    padding: "8px 12px",
    border: "1px solid var(--border-field)",
    borderRadius: 4,
    fontSize: 14,
    background: "var(--bg-main)",
  },
  textareaWrapper: {
    marginBottom: 24,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancelBtn: {
    ...S.ghost,
    padding: "6px 16px",
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

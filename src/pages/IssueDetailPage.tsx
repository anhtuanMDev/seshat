import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchIssueDetail,
  createComment,
  type SeshatIssue,
  type SeshatComment,
} from "../lib/githubIssues";
import { S } from "../lib/utils";
import { DarkModeIcon, LightModeIcon } from "../components/ui/icons";
import { CircularProgress } from "@mui/material";
import { showToast } from "../store/toastStore";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useTheme } from "../hooks/useTheme";
import { appStore } from "../store/appStore";

export default function IssueDetailPage() {
  const { number } = useParams();
  const navigate = useNavigate();
  const animRef = useAnimateIn();
  const { theme, toggle: toggleTheme } = useTheme();

  const activeBookId = appStore.activeBookId.get();
  const token =
    localStorage.getItem("seshat-auth-token") ||
    sessionStorage.getItem("seshat-auth-token");

  // State
  const [activeIssue, setActiveIssue] = useState<SeshatIssue | null>(null);
  const [comments, setComments] = useState<SeshatComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Fetch issue details & comments
  useEffect(() => {
    let isMounted = true;
    const loadIssueDetail = async () => {
      if (!token || !number) {
        navigate("/issues");
        return;
      }
      if (isMounted) setIsLoading(true);
      try {
        const data = await fetchIssueDetail(token, parseInt(number, 10));
        if (isMounted) {
          setActiveIssue(data.issue);
          setComments(data.comments);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          showToast(
            "Failed to load discussion: " + (err as Error).message,
            "error",
          );
          navigate("/issues");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadIssueDetail();
    return () => {
      isMounted = false;
    };
  }, [token, number, navigate]);

  // Handle Submit Comment
  const handleSubmitComment = async () => {
    if (!token || !number || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await createComment(
        token,
        parseInt(number, 10),
        commentText.trim(),
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      showToast("Comment added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add comment: " + (err as Error).message, "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
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

  const postBtnStyle = (disabled: boolean) => ({
    background: "var(--color-primary)",
    color: "var(--bg-app)",
    border: "none",
    borderRadius: 6,
    padding: "10px 24px",
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "default" : "pointer" as const,
    opacity: disabled ? 0.6 : 1,
    transition: "opacity 0.2s",
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
          <span style={styles.headerForumLink} onClick={() => navigate("/issues")}>
            Forum & Feedback
          </span>
          <span style={styles.headerDivider}>/</span>
          <span style={styles.headerIssueNumber}>Discussion #{number}</span>
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
          <button onClick={() => navigate("/issues")} style={styles.myDiscussionsBtn}>
            All Discussions
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

      {/* ── Main Details Container ── */}
      <div ref={animRef} style={styles.mainContainer}>
        <div style={styles.contentWrapper}>
          {isLoading ? (
            <div style={styles.loadingWrapper}>
              <CircularProgress size={32} sx={styles.loadingProgress} />
            </div>
          ) : activeIssue ? (
            <div style={styles.detailsCol}>
              {/* Header card info */}
              <div style={styles.infoCard}>
                <div style={styles.infoCardHeader}>
                  <span
                    style={{
                      ...styles.badgeBase,
                      background: getBadgeColors(activeIssue.type).bg,
                      color: getBadgeColors(activeIssue.type).text,
                    }}
                  >
                    {activeIssue.type}
                  </span>
                  <span style={styles.infoCardIssueNum}>
                    Issue #{activeIssue.number}
                  </span>
                  <a
                    href={activeIssue.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.viewOnGitHubLink}
                  >
                    View on GitHub
                  </a>
                </div>

                <h1 style={styles.infoCardTitle}>{activeIssue.title}</h1>

                <div style={styles.infoCardAuthorRow}>
                  Opened by{" "}
                  <span style={styles.infoCardAuthorName}>
                    {activeIssue.author}
                  </span>{" "}
                  on {formatDate(activeIssue.createdAt)}
                </div>
              </div>

              {/* Issue Description */}
              <div style={styles.issueBodyContainer}>{activeIssue.body}</div>

              {/* Discussion Thread */}
              <h3 style={styles.discussionHeader}>
                Discussion ({comments.length})
              </h3>

              <div style={styles.commentsList}>
                {comments.map((comment) => (
                  <div key={comment.id} style={styles.commentCard}>
                    <div style={styles.commentHeader}>
                      <span>
                        Posted by{" "}
                        <span style={styles.commentAuthorName}>
                          {comment.author}
                        </span>
                      </span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <div style={styles.commentBody}>{comment.body}</div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div style={styles.emptyCommentsContainer}>
                    <p style={styles.emptyCommentsText}>
                      No comments yet. Start the conversation below!
                    </p>
                  </div>
                )}
              </div>

              {/* Comment Editor */}
              <div style={styles.commentEditorWrapper}>
                <h4 style={styles.addCommentHeader}>Add a comment</h4>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your feedback, ideas, or questions with the community..."
                  rows={5}
                  disabled={isSubmittingComment}
                  style={styles.commentTextarea}
                />
                <div style={styles.commentFooterRow}>
                  <button
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                    style={postBtnStyle(isSubmittingComment || !commentText.trim())}
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.notFoundWrapper}>
              <p style={styles.notFoundText}>Issue not found.</p>
            </div>
          )}
        </div>
      </div>
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
  headerForumLink: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  headerIssueNumber: {
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
  myDiscussionsBtn: {
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
  loadingWrapper: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  loadingProgress: {
    color: "var(--text-secondary)",
  },
  detailsCol: {
    display: "flex",
    flexDirection: "column",
  },
  infoCard: {
    padding: "24px 32px",
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },
  infoCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  infoCardIssueNum: {
    fontSize: 13,
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  viewOnGitHubLink: {
    marginLeft: "auto",
    fontSize: 12,
    color: "var(--color-blue)",
    textDecoration: "underline",
    fontWeight: 500,
  },
  infoCardTitle: {
    fontSize: 24,
    fontWeight: 600,
    margin: "6px 0 0",
    color: "var(--text-primary)",
    lineHeight: 1.3,
    fontFamily: "var(--font-serif)",
  },
  infoCardAuthorRow: {
    fontSize: 13,
    color: "var(--text-secondary)",
    borderTop: "1px solid var(--border)",
    paddingTop: 12,
    marginTop: 4,
  },
  infoCardAuthorName: {
    color: "var(--text-primary)",
    fontWeight: 600,
  },
  issueBodyContainer: {
    padding: "24px 32px",
    background: "var(--bg-side)",
    borderRadius: 12,
    border: "1px solid var(--border)",
    marginBottom: 40,
    whiteSpace: "pre-wrap",
    fontSize: 16,
    lineHeight: 1.6,
    color: "var(--text-primary)",
  },
  discussionHeader: {
    ...S.h2,
    borderBottom: "1px solid var(--border)",
    paddingBottom: 12,
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 600,
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 40,
  },
  commentCard: {
    padding: "20px 24px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  commentAuthorName: {
    color: "var(--text-primary)",
    fontWeight: 600,
  },
  commentBody: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "var(--text-primary)",
    whiteSpace: "pre-wrap",
  },
  emptyCommentsContainer: {
    textAlign: "center",
    padding: "48px 24px",
    border: "1px dashed var(--border)",
    borderRadius: 12,
    background: "var(--bg-side)",
  },
  emptyCommentsText: {
    ...S.dim,
    fontStyle: "italic",
    margin: 0,
  },
  commentEditorWrapper: {
    borderTop: "1px solid var(--border)",
    paddingTop: 32,
    marginBottom: 40,
  },
  addCommentHeader: {
    ...S.h2,
    marginBottom: 16,
    fontSize: 16,
  },
  commentTextarea: {
    ...S.textarea,
    marginBottom: 16,
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 14,
  },
  commentFooterRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  notFoundWrapper: {
    textAlign: "center",
    padding: 40,
  },
  notFoundText: {
    color: "var(--text-secondary)",
  },
  badgeBase: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    padding: "3px 8px",
    borderRadius: 4,
  },
} satisfies Record<string, React.CSSProperties>;

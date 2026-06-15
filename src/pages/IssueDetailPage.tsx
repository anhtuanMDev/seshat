import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  fetchIssueDetail, 
  createComment, 
  type SeshatIssue, 
  type SeshatComment 
} from "../lib/githubIssues";
import { S } from "../lib/utils";
import { 
  DarkModeIcon, 
  LightModeIcon 
} from "../components/ui/icons";
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
  const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");

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
          showToast("Failed to load discussion: " + (err as Error).message, "error");
          navigate("/issues");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadIssueDetail();
    return () => { isMounted = false; };
  }, [token, number, navigate]);

  // Handle Submit Comment
  const handleSubmitComment = async () => {
    if (!token || !number || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await createComment(token, parseInt(number, 10), commentText.trim());
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-app)", color: "var(--text-primary)" }}>
      {/* ── Global Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        height: 48,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-top)",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span 
            style={{ ...S.logo, cursor: "pointer" }} 
            onClick={() => navigate("/")}
          >
            Seshat
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>/</span>
          <span 
            style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}
            onClick={() => navigate("/issues")}
          >
            Forum & Feedback
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            Discussion #{number}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {activeBookId && (
            <button
              onClick={() => navigate(`/book/${activeBookId}/world`)}
              style={{
                ...S.ghost,
                fontSize: 13,
                color: "var(--color-primary)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "4px 12px",
                background: "transparent",
                cursor: "pointer"
              }}
            >
              ← Back to Book
            </button>
          )}
          <button
            onClick={() => navigate("/issues")}
            style={{
              ...S.ghost,
              fontSize: 13,
              color: "var(--text-secondary)",
              cursor: "pointer"
            }}
          >
            All Discussions
          </button>
          <button
            onClick={toggleTheme}
            style={{ ...S.ghost, padding: 8, display: "flex", alignItems: "center", color: "var(--text-secondary)", cursor: "pointer" }}
            title={theme === "light" ? "Dark Mode" : "Light Mode"}
          >
            {theme === "light" ? <DarkModeIcon sx={{ fontSize: 16 }} /> : <LightModeIcon sx={{ fontSize: 16 }} />}
          </button>
        </div>
      </div>

      {/* ── Main Details Container ── */}
      <div 
        ref={animRef} 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "40px 24px",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div style={{ width: "100%", maxWidth: 960, display: "flex", flexDirection: "column" }}>
          {isLoading ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <CircularProgress size={32} sx={{ color: "var(--text-secondary)" }} />
            </div>
          ) : activeIssue ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Header card info */}
              <div 
                style={{ 
                  padding: "24px 32px", 
                  background: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 24,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span 
                    style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: getBadgeColors(activeIssue.type).bg,
                      color: getBadgeColors(activeIssue.type).text
                    }}
                  >
                    {activeIssue.type}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                    Issue #{activeIssue.number}
                  </span>
                  <a 
                    href={activeIssue.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-blue)", textDecoration: "underline", fontWeight: 500 }}
                  >
                    View on GitHub
                  </a>
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 600, margin: "6px 0 0", color: "var(--text-primary)", lineHeight: 1.3, fontFamily: "var(--font-serif)" }}>
                  {activeIssue.title}
                </h1>

                <div style={{ fontSize: 13, color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
                  Opened by <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{activeIssue.author}</span> on {formatDate(activeIssue.createdAt)}
                </div>
              </div>

              {/* Issue Description */}
              <div 
                style={{ 
                  padding: "24px 32px", 
                  background: "var(--bg-side)", 
                  borderRadius: 12, 
                  border: "1px solid var(--border)",
                  marginBottom: 40,
                  whiteSpace: "pre-wrap",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "var(--text-primary)"
                }}
              >
                {activeIssue.body}
              </div>

              {/* Discussion Thread */}
              <h3 style={{ ...S.h2, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
                Discussion ({comments.length})
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                {comments.map((comment) => (
                  <div 
                    key={comment.id}
                    style={{
                      padding: "20px 24px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 12, color: "var(--text-secondary)" }}>
                      <span>
                        Posted by <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{comment.author}</span>
                      </span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.5, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                      {comment.body}
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "48px 24px", 
                    border: "1px dashed var(--border)",
                    borderRadius: 12,
                    background: "var(--bg-side)"
                  }}>
                    <p style={{ ...S.dim, fontStyle: "italic", margin: 0 }}>
                      No comments yet. Start the conversation below!
                    </p>
                  </div>
                )}
              </div>

              {/* Comment Editor */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32, marginBottom: 40 }}>
                <h4 style={{ ...S.h2, marginBottom: 16, fontSize: 16 }}>Add a comment</h4>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your feedback, ideas, or questions with the community..."
                  rows={5}
                  disabled={isSubmittingComment}
                  style={{ ...S.textarea, marginBottom: 16, padding: "12px 16px", borderRadius: 8, fontSize: 14 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--bg-app)",
                      border: "none",
                      borderRadius: 6,
                      padding: "10px 24px",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: (isSubmittingComment || !commentText.trim()) ? "default" : "pointer",
                      opacity: (isSubmittingComment || !commentText.trim()) ? 0.6 : 1,
                      transition: "opacity 0.2s"
                    }}
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "var(--text-secondary)" }}>Issue not found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

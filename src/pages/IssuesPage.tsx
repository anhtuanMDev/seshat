import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  fetchIssues, 
  createIssue, 
  type SeshatIssue 
} from "../lib/githubIssues";
import { S } from "../lib/utils";
import { Modal } from "../components/ui/Modal";
import { 
  BugReportIcon,
  DarkModeIcon,
  LightModeIcon
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
  const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");

  // State
  const [issues, setIssues] = useState<SeshatIssue[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);

  // Filters
  const [filter, setFilter] = useState<FilterType>("all");

  // Modal form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"bug" | "recommendation" | "discussion">("discussion");
  const [newBody, setNewBody] = useState("");

  // 1. Fetch issue list
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token) return;
      if (isMounted) setIsLoadingList(true);
      try {
        const data = await fetchIssues(token);
        if (isMounted) setIssues(data);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          showToast("Failed to load issues: " + (err as Error).message, "error");
        }
      } finally {
        if (isMounted) setIsLoadingList(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [token]);

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
      
      // Reload list and go to new issue
      const data = await fetchIssues(token);
      setIssues(data);
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
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            Forum & Feedback
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
            onClick={() => navigate("/")}
            style={{
              ...S.ghost,
              fontSize: 13,
              color: "var(--text-secondary)",
              cursor: "pointer"
            }}
          >
            My Books
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

      {/* ── Main List Container ── */}
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
          
          {/* Dashboard Header Section */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                Community Forum & Bug Reports
              </h1>
              <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
                Ask questions, report issues, and discuss new feature ideas for Seshat.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: "var(--color-primary)",
                color: "var(--bg-app)",
                border: "none",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.5,
                padding: "8px 20px",
                cursor: "pointer",
                transition: "opacity 0.15s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              + New Discussion
            </button>
          </div>

          {/* Type filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
            {(["all", "bug", "recommendation", "discussion"] as FilterType[]).map((t) => {
              const active = filter === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={{
                    background: active ? "var(--bg-active)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    border: active ? "1px solid var(--border-field)" : "1px solid transparent",
                    borderRadius: 20,
                    padding: "6px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {t === "all" ? "All Topics" : t === "bug" ? "Bugs" : t === "recommendation" ? "Recommendations" : "Discussions"}
                </button>
              );
            })}
          </div>

          {/* List Content */}
          {isLoadingList ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: 200 }}>
              <CircularProgress size={28} sx={{ color: "var(--text-secondary)" }} />
            </div>
          ) : filteredIssues.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "80px 40px", 
              background: "var(--bg-main)", 
              border: "1px dashed var(--border)", 
              borderRadius: 12,
              marginTop: 8
            }}>
              <BugReportIcon sx={{ fontSize: 48, color: "var(--text-muted)", marginBottom: 16 }} />
              <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "var(--text-primary)" }}>No discussions yet</h3>
              <p style={{ ...S.dim, margin: "0 0 24px", fontSize: 14 }}>
                Be the first to ask a question or file a report!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: "var(--color-primary)",
                  color: "var(--bg-app)",
                  border: "none",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 20px",
                  cursor: "pointer",
                }}
              >
                Start a Discussion
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredIssues.map((iss) => {
                const badge = getBadgeColors(iss.type);
                // Create a brief preview from body
                const bodyPreview = iss.body.length > 180 ? iss.body.slice(0, 180) + "..." : iss.body;

                return (
                  <div
                    key={iss.number}
                    onClick={() => navigate(`/issues/${iss.number}`)}
                    style={{
                      padding: "20px 24px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      transition: "all 0.15s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--text-secondary)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span 
                          style={{ 
                            fontSize: 10, 
                            fontWeight: 600, 
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: badge.bg,
                            color: badge.text
                          }}
                        >
                          {iss.type}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          #{iss.number}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {formatDate(iss.createdAt)}
                      </span>
                    </div>
                    
                    <h3 
                      style={{ 
                        fontSize: 17, 
                        fontWeight: 600, 
                        color: "var(--text-primary)", 
                        margin: "0 0 8px", 
                        lineHeight: 1.3
                      }}
                    >
                      {iss.title}
                    </h3>
                    
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.5 }}>
                      {bodyPreview}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <span>Started by <b>{iss.author}</b></span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        💬 {iss.commentsCount} comment{iss.commentsCount !== 1 ? "s" : ""}
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
        <Modal title="Create New Discussion Thread" onClose={() => !isCreatingIssue && setShowCreateModal(false)}>
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Title</label>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Chapter 4 layout jumps on refresh"
                disabled={isCreatingIssue}
                style={{ 
                  ...S.input, 
                  padding: "8px 12px", 
                  border: "1px solid var(--border-field)", 
                  borderRadius: 4,
                  fontSize: 14 
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "bug" | "recommendation" | "discussion")}
                disabled={isCreatingIssue}
                style={{ 
                  ...S.select, 
                  padding: "8px 12px", 
                  border: "1px solid var(--border-field)", 
                  borderRadius: 4,
                  fontSize: 14,
                  background: "var(--bg-main)"
                }}
              >
                <option value="discussion">Discussion / Recommendation</option>
                <option value="bug">Bug Report</option>
                <option value="recommendation">Feature Recommendation</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button 
                onClick={() => setShowCreateModal(false)} 
                disabled={isCreatingIssue}
                style={{ ...S.ghost, padding: "6px 16px" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitIssue}
                disabled={!newTitle.trim() || !newBody.trim() || isCreatingIssue}
                style={{ 
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
                  cursor: (!newTitle.trim() || !newBody.trim() || isCreatingIssue) ? "default" : "pointer",
                  opacity: (!newTitle.trim() || !newBody.trim() || isCreatingIssue) ? 0.6 : 1
                }}
              >
                {isCreatingIssue && <CircularProgress size={14} color="inherit" />}
                {isCreatingIssue ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

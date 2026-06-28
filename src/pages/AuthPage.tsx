import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "../lib/utils";
import { GhostButton } from "../components/ui";
import { showToast } from "../store/toastStore";
import { checkTokenValidity } from "../lib/auth";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function AuthPage() {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    // 1. Check if we just returned from GitHub OAuth Callback
    const searchParams = new URLSearchParams(window.location.search);
    const oauthToken = searchParams.get("token");
    const user = searchParams.get("user") || "";
    
    if (oauthToken) {
      // Pick storage based on user's previous selection or default (true)
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("seshat-auth-token", oauthToken);
      
      // Clean up the URL so the token doesn't leak in the browser history
      window.history.replaceState({}, document.title, "/auth");
      
      showToast(user ? `Welcome, ${user}!` : `Welcome back!`, "success");
      navigate("/");
      return;
    }

    // 2. Otherwise check if already logged in
    if (checkTokenValidity()) {
      navigate("/");
    }
  }, [navigate, rememberMe]);

  const handleGitHubLogin = () => {
    // Redirect to our secure Cloudflare Worker proxy which handles the OAuth flow
    window.location.href = "/api/github/oauth/login";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerWrapper}>
          <h1 style={styles.title}>Welcome to Seshat</h1>
          <p style={styles.subtitle}>
            Authenticate with GitHub to access your worlds.
          </p>
        </div>

        <div style={styles.form}>
          <button 
            onClick={handleGitHubLogin}
            style={styles.githubBtn}
          >
            <GitHubIcon style={{ marginRight: 8 }} />
            Login with GitHub
          </button>
          
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)} 
              style={styles.checkboxInput}
            />
            Keep me logged in
          </label>
        </div>

        <div style={styles.actionsWrapper}>
          <GhostButton onClick={() => window.open("https://github.com", "_blank")} style={{ width: "100%", padding: 12 }}>
            Don't have a GitHub account?
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    ...S.app,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    gap: 32,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  headerWrapper: {
    textAlign: "center",
  },
  title: {
    ...S.h2,
    fontSize: 24,
    marginBottom: 8,
    color: "var(--text-primary)",
  },
  subtitle: {
    ...S.dim,
    fontSize: 14,
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  githubBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px",
    background: "#24292e", // Standard GitHub Dark
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    color: "var(--text-secondary)",
    fontSize: 14,
    marginTop: 8,
  },
  checkboxInput: {
    accentColor: "var(--color-blue)",
    width: 16,
    height: 16,
  },
  actionsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
} satisfies Record<string, React.CSSProperties>;

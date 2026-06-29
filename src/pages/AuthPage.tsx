import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "../lib/utils";
import { Field, GhostButton } from "../components/ui";
import { showToast } from "../store/toastStore";
import { checkTokenValidity } from "../lib/auth";
import GitHubIcon from "@mui/icons-material/GitHub";
import { VisibilityIcon, VisibilityOffIcon } from "../components/ui/icons";
import { InputAdornment, IconButton } from "@mui/material";
import { registerToGitHub, loginToGitHub } from "../lib/githubSync";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginUser, setLoginUser] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // 1. Check if we just returned from GitHub OAuth Callback
    const searchParams = new URLSearchParams(window.location.search);
    const oauthToken = searchParams.get("token");
    const user = searchParams.get("user") || "";
    
    if (oauthToken) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("seshat-auth-token", oauthToken);
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

  const submitAuth = async () => {
    setIsLoading(true);
    try {
      if (isRegisterMode) {
        if (!loginEmail.trim()) {
          showToast("Please provide an email address for password recovery.", "error");
          setIsLoading(false);
          return;
        }
        await registerToGitHub(loginUser, loginEmail, loginCode);
        const token = await loginToGitHub(loginUser, loginCode);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("seshat-auth-token", token);
        showToast(`Registration successful! Welcome to Seshat, ${loginUser}.`, "success");
        navigate("/");
      } else {
        const token = await loginToGitHub(loginUser, loginCode);
        const storage = rememberMe ? localStorage : sessionStorage;
        if (!rememberMe) {
          localStorage.removeItem("seshat-auth-token");
        } else {
          sessionStorage.removeItem("seshat-auth-token");
        }
        storage.setItem("seshat-auth-token", token);
        showToast(`Welcome back, ${loginUser}!`, "success");
        navigate("/");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`Authentication failed: ${message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = "/api/github/oauth/login";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerWrapper}>
          <h1 style={styles.title}>{isRegisterMode ? "Create Account" : "Welcome to Seshat"}</h1>
          <p style={styles.subtitle}>
            {isRegisterMode 
              ? "Sign up to start building your worlds." 
              : "Login to access your worlds."}
          </p>
        </div>

        <div style={styles.form}>
          <Field
            label="Username"
            value={loginUser}
            onChange={setLoginUser}
            placeholder="e.g. alex"
          />
          {isRegisterMode && (
            <Field
              label="Email"
              value={loginEmail}
              onChange={setLoginEmail}
              placeholder="For password recovery"
              type="email"
            />
          )}
          <Field
            label="Access Code"
            value={loginCode}
            onChange={(v) => setLoginCode(v)}
            placeholder="Enter secret code"
            type={showPassword ? "text" : "password"}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => setShowPassword(!showPassword)} 
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end" 
                      size="small" 
                      style={styles.passwordToggleBtn}
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)} 
              style={styles.checkboxInput}
            />
            Remember me
          </label>
        </div>

        <div style={styles.actionsWrapper}>
          <button 
            onClick={submitAuth}
            disabled={isLoading || !loginUser.trim() || !loginCode.trim()}
            style={{
              ...styles.submitBtn,
              cursor: (isLoading || !loginUser.trim() || !loginCode.trim()) ? "default" : "pointer",
              opacity: (isLoading || !loginUser.trim() || !loginCode.trim()) ? 0.6 : 1,
            }}
          >
            {isLoading ? "Please wait..." : (isRegisterMode ? "Register" : "Login")}
          </button>
          
          <GhostButton onClick={() => setIsRegisterMode(!isRegisterMode)} style={{ width: "100%", padding: 12 }}>
            {isRegisterMode ? "Already have an account? Login" : "Need an account? Register"}
          </GhostButton>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>

          <button 
            onClick={handleGitHubLogin}
            style={styles.githubBtn}
          >
            <GitHubIcon style={{ marginRight: 8 }} />
            Login with GitHub
          </button>
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
  },
  passwordToggleBtn: {
    color: "var(--text-secondary)",
    marginRight: -8,
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
  submitBtn: {
    padding: "12px",
    background: "var(--color-blue)",
    color: "var(--bg-app)",
    border: "none",
    borderRadius: 4,
    fontSize: 16,
    fontWeight: 600,
    transition: "opacity 0.2s",
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
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    margin: "8px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--border)",
  },
  dividerText: {
    color: "var(--text-muted)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
} satisfies Record<string, React.CSSProperties>;

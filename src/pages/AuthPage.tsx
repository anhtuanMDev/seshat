import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "../lib/utils";
import { Field, GhostButton } from "../components/ui";
import { VisibilityIcon, VisibilityOffIcon } from "../components/ui/icons";
import { InputAdornment, IconButton } from "@mui/material";
import { registerToGitHub, loginToGitHub } from "../lib/githubSync";
import { showToast } from "../store/toastStore";
import { checkTokenValidity } from "../lib/auth";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (checkTokenValidity()) {
      navigate("/");
    }
  }, [navigate]);

  const submitAuth = async () => {
    const u = loginUser.trim();
    const c = loginCode.trim();
    if (!u || !c) return;

    try {
      setIsLoading(true);
      if (isRegisterMode) {
        if (!loginEmail.trim()) {
          showToast("Please provide an email address for password recovery.", "error");
          setIsLoading(false);
          return;
        }
        await registerToGitHub(u, loginEmail.trim(), c);
        showToast(`Registration successful! Welcome to Seshat, ${u}.`, "success");
      }
      
      const token = await loginToGitHub(u, c);

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("seshat-auth-token", token);
      
      // If remember me is unchecked, clean up local storage just in case
      if (!rememberMe) {
        localStorage.removeItem("seshat-auth-token");
      }

      if (!isRegisterMode) {
        showToast(`Welcome back, ${u}!`, "success");
      }

      navigate("/");
    } catch (err) {
      showToast("Authentication failed: " + (err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerWrapper}>
          <h1 style={styles.title}>
            {isRegisterMode ? "Create Account" : "Welcome to Seshat"}
          </h1>
          <p style={styles.subtitle}>
            {isRegisterMode 
              ? "Choose a unique username and a secure password."
              : "Enter your username and access code to continue."}
          </p>
        </div>

        <div style={styles.form}>
          <Field
            label="Username (Branch Name)"
            value={loginUser}
            onChange={setLoginUser}
            placeholder="e.g. alex"
          />
          {isRegisterMode && (
            <Field
              label="Email Address"
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
            InputProps={{
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
    padding: "32px",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    gap: 24,
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
} satisfies Record<string, React.CSSProperties>;

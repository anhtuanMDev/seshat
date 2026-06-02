import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { S } from "../lib/utils";
import { Field, GhostButton } from "../components/ui";
import { registerToGitHub } from "../lib/githubSync";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("seshat-github-user") || sessionStorage.getItem("seshat-github-user");
    const savedCode = localStorage.getItem("seshat-github-code") || sessionStorage.getItem("seshat-github-code");
    
    if (savedUser && savedCode) {
      // Already authenticated
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
        await registerToGitHub(u, c);
        alert(`Registered successfully! Welcome ${u}.`);
      } else {
        // Validate login by attempting a sync or just checking if they have valid code
        // For now, since there isn't a dedicated login check endpoint without syncing,
        // we will assume valid and sync later, or do a dry run if needed.
        // The instructions said "store their token".
      }

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("seshat-github-user", u);
      storage.setItem("seshat-github-code", c);
      
      // If remember me is unchecked, clean up local storage just in case
      if (!rememberMe) {
        localStorage.removeItem("seshat-github-user");
        localStorage.removeItem("seshat-github-code");
      }

      navigate("/");
    } catch (err) {
      alert("Authentication failed: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{
        background: "var(--bg-main)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "32px",
        width: "100%",
        maxWidth: 400,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ ...S.h2, fontSize: 24, marginBottom: 8, color: "var(--text-primary)" }}>
            {isRegisterMode ? "Create Account" : "Welcome to Seshat"}
          </h1>
          <p style={{ ...S.dim, fontSize: 14 }}>
            {isRegisterMode 
              ? "Choose a unique username and a secure password."
              : "Enter your username and access code to continue."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field
            label="Username (Branch Name)"
            value={loginUser}
            onChange={setLoginUser}
            placeholder="e.g. alex"
          />
          <Field
            label="Access Code"
            value={loginCode}
            onChange={setLoginCode}
            placeholder="Enter secret code"
            type="password"
          />
          
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-secondary)", fontSize: 14 }}>
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)} 
              style={{ accentColor: "var(--color-blue)", width: 16, height: 16 }}
            />
            Remember me
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          <button 
            onClick={submitAuth}
            disabled={isLoading || !loginUser.trim() || !loginCode.trim()}
            style={{
              padding: "12px",
              background: "var(--color-blue)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 16,
              fontWeight: 600,
              cursor: (isLoading || !loginUser.trim() || !loginCode.trim()) ? "default" : "pointer",
              opacity: (isLoading || !loginUser.trim() || !loginCode.trim()) ? 0.6 : 1,
              transition: "opacity 0.2s"
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

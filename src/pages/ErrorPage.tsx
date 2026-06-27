import { Button } from "@mui/material";
import { useLayoutEffect } from "react";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { useAnimateIn } from "../hooks/useAnimateIn";

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const animRef = useAnimateIn();

  let errorMessage = "Unknown anomaly encountered in the deep weave.";
  let errorTrace = "ERR_UNKNOWN:";

  if (isRouteErrorResponse(error)) {
    errorTrace = `ERR_HTTP_${error.status}:`;
    errorMessage = error.statusText || error.data?.message || error.data;
  } else if (error instanceof Error) {
    errorTrace = `ERR_${error.name.toUpperCase()}:`;
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String((error as Record<string, unknown>).message);
  }

  useLayoutEffect(() => {
    const msg = errorMessage.toLowerCase();
    if (
      msg.includes("failed to fetch dynamically imported module") ||
      msg.includes("importing a module script failed")
    ) {
      const lastReload = sessionStorage.getItem("app-update-reload");
      const now = Date.now();
      // If we haven't reloaded in the last 10 seconds, force a reload to get new chunks
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("app-update-reload", now.toString());
        window.location.reload();
      }
    }
  }, [errorMessage]);

  return (
    <>
      <style>
        {`
          @keyframes pulseOrb {
            0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
            50% { transform: scale(1.1) translate(2vw, -2vw); opacity: 0.8; }
            100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          }
          
          @media (max-width: 900px) {
            .error-grid {
              grid-template-columns: 1fr !important;
              text-align: center;
              gap: 40px !important;
              padding-top: 10vh !important;
            }
            .error-left {
              align-items: center;
            }
            .error-left p {
              max-width: 100% !important;
            }
            .error-right {
              justify-content: center;
            }
          }
        `}
      </style>

      <div style={styles.wrapper}>
        {/* Abstract background element */}
        <div style={styles.glowOrb} />

        <div ref={animRef} className="error-grid" style={styles.grid}>
          {/* Left: Artistic/Thematic Error Display */}
          <div className="error-left" style={styles.leftPanel}>
            <div style={styles.eyebrow}>CRITICAL EXCEPTION</div>
            <h1 style={styles.headline}>
              The Timeline
              <br />
              Fractured.
            </h1>
            <p style={styles.subhead}>
              An unexpected rift disrupted the fabric of the application. The
              architects have been notified.
            </p>
          </div>

          {/* Right: Technical Details & Actions */}
          <div className="error-right" style={styles.rightPanel}>
            <div style={styles.glassCard}>
              <div style={styles.cardHeader}>
                <span style={styles.dotRed} />
                <span style={styles.dotYellow} />
                <span style={styles.dotGreen} />
                <span style={styles.terminalTitle}>System Output</span>
              </div>
              <div style={styles.terminalBody}>
                <span style={styles.errorLabel}>{errorTrace}</span>
                <br />
                <br />
                {errorMessage}
              </div>
              <div style={styles.actionRow}>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  sx={customButtonPrimary}
                >
                  Reinitialize
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate("/")}
                  sx={customButtonSecondary}
                >
                  Return to Nexus
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    width: "100dvw",
    height: "100dvh",
    backgroundColor: "#080a0f",
    color: "#fff",
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  glowOrb: {
    position: "absolute",
    top: "20%",
    left: "10%",
    width: "45vw",
    height: "45vw",
    background:
      "radial-gradient(circle, rgba(255, 42, 95, 0.12) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 0,
    animation: "pulseOrb 12s ease-in-out infinite",
  },
  grid: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    width: "100%",
    maxWidth: 1400,
    padding: "0 5vw",
    gap: "6vw",
    alignItems: "center",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  eyebrow: {
    color: "#ff2a5f",
    textTransform: "uppercase",
    letterSpacing: "4px",
    fontSize: "0.85rem",
    fontWeight: 700,
  },
  headline: {
    fontSize: "clamp(3rem, 5.5vw, 6rem)",
    lineHeight: 1.05,
    margin: 0,
    fontWeight: 900,
    letterSpacing: "-2px",
    background: "linear-gradient(135deg, #ffffff 0%, #a0a5b1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subhead: {
    fontSize: "clamp(1rem, 1.2vw, 1.25rem)",
    lineHeight: 1.6,
    color: "#8a919e",
    maxWidth: "80%",
    margin: 0,
    fontWeight: 400,
  },
  rightPanel: {
    display: "flex",
    justifyContent: "center",
  },
  glassCard: {
    width: "100%",
    maxWidth: 500,
    background: "rgba(20, 24, 32, 0.6)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow:
      "0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "16px 20px",
    background: "rgba(0, 0, 0, 0.3)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  dotRed: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#ff5f56",
    boxShadow: "0 0 10px rgba(255,95,86,0.5)",
  },
  dotYellow: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#ffbd2e",
    boxShadow: "0 0 10px rgba(255,189,46,0.5)",
  },
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#27c93f",
    boxShadow: "0 0 10px rgba(39,201,63,0.5)",
  },
  terminalTitle: {
    marginLeft: "12px",
    fontSize: "0.75rem",
    color: "#8a919e",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  terminalBody: {
    padding: "32px 24px",
    fontFamily: "'Fira Code', 'Courier New', monospace",
    fontSize: "0.9rem",
    color: "#e5e7eb",
    lineHeight: 1.6,
    wordBreak: "break-all",
    minHeight: 140,
    maxHeight: "50vh",
    overflowY: "auto",
  },
  errorLabel: {
    color: "#ff2a5f",
    fontWeight: 700,
    letterSpacing: "1px",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    padding: "0 24px 32px 24px",
  },
} as const;

// Inline MUI style overrides
const customButtonPrimary = {
  borderColor: "rgba(255, 42, 95, 0.5)",
  color: "#ff2a5f",
  padding: "10px 24px",
  letterSpacing: "1px",
  borderRadius: "8px",
  fontWeight: 600,
  textTransform: "uppercase",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: "#ff2a5f",
    background: "rgba(255, 42, 95, 0.1)",
    boxShadow: "0 0 20px rgba(255, 42, 95, 0.2)",
  },
};

const customButtonSecondary = {
  color: "#8a919e",
  padding: "10px 24px",
  letterSpacing: "1px",
  fontWeight: 600,
  textTransform: "uppercase",
  borderRadius: "8px",
  "&:hover": {
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.05)",
  },
};

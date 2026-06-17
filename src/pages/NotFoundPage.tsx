import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAnimateIn } from "../hooks/useAnimateIn";
import {
  WarningIcon,
  PublicIcon,
  TimelineIcon,
  AutoStoriesIcon,
  HistoryIcon,
} from "../components/ui/icons";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookId } = useParams();

  const ref = useAnimateIn();

  return (
    <div
      ref={ref}
      className="seshat-page-container seshat-not-found"
      style={styles.pageContainer}
      data-testid="not-found-container"
    >
      <style dangerouslySetInnerHTML={{ __html: localCss }} />

      <div className="fracture-layout">
        {/* Left Side: Details & Actions */}
        <div className="fracture-details">
          <div className="anomaly-badge">
            <WarningIcon sx={{ fontSize: 14 }} />
            SYSTEM ANOMALY DETECTED
          </div>

          <h1 className="fracture-code" data-testid="error-code">404</h1>
          <h2 className="fracture-title">Timeline Disruption</h2>
          
          <p className="fracture-desc">
            The chronicle or page you are seeking does not exist in this universe.
            It may have been deleted, moved to another branch, or never written.
          </p>

          {/* Diagnostic Console */}
          <div className="fracture-terminal">
            <div className="terminal-row">
              <span className="terminal-label">BRANCH:</span>
              <span className="terminal-value terminal-error">UNRESOLVED</span>
            </div>
            <div className="terminal-row">
              <span className="terminal-label">VECTOR:</span>
              <span className="terminal-value">{location.pathname}</span>
            </div>
            <div className="terminal-row">
              <span className="terminal-label">ARCHIVE:</span>
              <span className="terminal-value">{bookId ? `BOOK_${bookId}` : "GLOBAL"}</span>
            </div>
          </div>

          {/* Context-Aware Action Grid */}
          <div className="fracture-actions">
            {bookId ? (
              <>
                <button
                  onClick={() => navigate(`/book/${bookId}/world`)}
                  className="fracture-btn fracture-btn-primary"
                  data-testid="restore-btn"
                >
                  <PublicIcon sx={{ fontSize: 16 }} />
                  Restore Timeline
                </button>

                <button
                  onClick={() => navigate(`/book/${bookId}/lore-web`)}
                  className="fracture-btn fracture-btn-secondary"
                >
                  <TimelineIcon sx={{ fontSize: 16 }} />
                  Inspect Lore Web
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="fracture-btn fracture-btn-tertiary"
                >
                  <AutoStoriesIcon sx={{ fontSize: 16 }} />
                  Return to Library
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/")}
                  className="fracture-btn fracture-btn-primary"
                  data-testid="restore-btn"
                >
                  <AutoStoriesIcon sx={{ fontSize: 16 }} />
                  Return to Library
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="fracture-btn fracture-btn-secondary"
                >
                  <HistoryIcon sx={{ fontSize: 16 }} />
                  Go Back
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Visual Chrono-Fracture Illustration */}
        <div className="fracture-illustration">
          <div className="fracture-timeline-line" />
          
          {/* Timeline Nodes */}
          <div className="fracture-node fracture-node-1" />
          <div className="fracture-node fracture-node-2" />
          
          {/* Lost Node drifting off-timeline */}
          <div className="fracture-node fracture-node-lost">
            <div className="lost-node-pulse" />
          </div>
          
          <div className="fracture-node fracture-node-3" />
          <div className="fracture-node fracture-node-4" />
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "75dvh",
    fontFamily: "var(--font-sans)",
    backgroundColor: "var(--bg-main)",
  },
} satisfies Record<string, React.CSSProperties>;

const localCss = `
@keyframes drift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(12px, -8px); }
}

@keyframes node-glow {
  0%, 100% { box-shadow: 0 0 4px var(--color-red); }
  50% { box-shadow: 0 0 16px var(--color-red); }
}

.fracture-layout {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  max-width: 900px;
  width: 100%;
}

.fracture-details {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.anomaly-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--color-orange);
  background: var(--bg-side);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 4px;
  margin-bottom: var(--space-4);
}

.fracture-code {
  font-size: 5rem;
  font-weight: 900;
  margin: 0;
  line-height: 1;
  color: var(--color-primary);
  letter-spacing: -2px;
}

.fracture-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: var(--space-2) 0 var(--space-3);
  letter-spacing: -0.5px;
}

.fracture-desc {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
  margin: 0 0 var(--space-6);
  max-width: 460px;
}

.fracture-terminal {
  background: var(--bg-side);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: var(--space-4);
  width: 100%;
  font-family: monospace;
  font-size: var(--text-xs);
  margin-bottom: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.terminal-row {
  display: flex;
  justify-content: space-between;
}

.terminal-label {
  color: var(--text-muted);
}

.terminal-value {
  color: var(--text-primary);
  font-weight: 600;
}

.terminal-error {
  color: var(--color-red);
}

.fracture-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  width: 100%;
}

.fracture-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 10px 18px;
  border-radius: 4px;
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-snappy);
  outline: none;
  font-family: var(--font-sans);
}

.fracture-btn-primary {
  background: var(--color-primary);
  color: var(--bg-app);
  border: none;
}

.fracture-btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.fracture-btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.fracture-btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-field);
}

.fracture-btn-tertiary {
  background: transparent;
  color: var(--text-secondary);
  border: none;
}

.fracture-btn-tertiary:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* Right Column: Visual Chrono-Fracture Illustration */
.fracture-illustration {
  flex: 0.8;
  position: relative;
  height: 320px;
  min-width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fracture-timeline-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--border) 0%,
    var(--border) 35%,
    transparent 35%,
    transparent 65%,
    var(--border) 65%,
    var(--border) 100%
  );
}

.fracture-node {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-side);
  border: 2px solid var(--border);
}

.fracture-node::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-blue);
}

.fracture-node-1 { top: 12%; }
.fracture-node-2 { top: 28%; }
.fracture-node-3 { top: 70%; }
.fracture-node-4 { top: 86%; }

.fracture-node-lost {
  top: 45%;
  left: calc(50% + 24px);
  width: 20px;
  height: 20px;
  border-color: var(--color-red);
  background: var(--bg-app);
  animation: drift 5s ease-in-out infinite, node-glow 2.5s ease-in-out infinite;
}

.fracture-node-lost::after {
  background: var(--color-red);
  width: 8px;
  height: 8px;
}

@media (max-width: 768px) {
  .fracture-layout {
    flex-direction: column-reverse;
    gap: var(--space-8);
  }

  .fracture-details {
    align-items: center;
    text-align: center;
  }

  .fracture-actions {
    justify-content: center;
  }

  .fracture-illustration {
    height: 120px;
    width: 100%;
  }

  .fracture-timeline-line {
    top: 50%;
    left: 0;
    right: 0;
    width: auto;
    height: 2px;
    background: linear-gradient(
      to right,
      var(--border) 0%,
      var(--border) 35%,
      transparent 35%,
      transparent 65%,
      var(--border) 65%,
      var(--border) 100%
    );
    transform: translateY(-50%);
  }

  .fracture-node {
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .fracture-node-1 { left: 15%; top: 50%; }
  .fracture-node-2 { left: 30%; top: 50%; }
  .fracture-node-3 { left: 70%; top: 50%; }
  .fracture-node-4 { left: 85%; top: 50%; }

  .fracture-node-lost {
    top: calc(50% - 24px);
    left: 50%;
    transform: translate(-50%, -50%);
    animation: drift 5s ease-in-out infinite, node-glow 2.5s ease-in-out infinite;
  }
}
`;

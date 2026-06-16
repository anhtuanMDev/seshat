import { useState } from "react";
import { S, uid } from "../../lib/utils";
import type { Foreshadow, Chapter } from "../../lib/types";
import { AddIcon } from "../ui/icons";
import { ForeshadowItem } from "./ForeshadowItem";
import { Modal } from "../ui/Modal";

interface Props {
  foreshadows: Foreshadow[];
  chapters: Chapter[];
  currentChapterId: string;
  onAddForeshadow: (f: Foreshadow) => void;
  onUpdateForeshadow: (f: Foreshadow) => void;
  onDeleteForeshadow: (id: string) => void;
}

export function ForeshadowPanel({
  foreshadows,
  chapters,
  currentChapterId,
  onAddForeshadow,
  onUpdateForeshadow,
  onDeleteForeshadow,
}: Props) {
  const [modalData, setModalData] = useState<Foreshadow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  // Focus states for custom inputs
  const [descFocused, setDescFocused] = useState(false);
  const [plantFocused, setPlantFocused] = useState(false);
  const [payoffFocused, setPayoffFocused] = useState(false);

  const options = chapters.map((c) => ({
    label: c.title || c.number,
    value: c.id,
  }));

  const chapterOptions = [{ label: "None", value: "" }, ...options];

  const handleOpenAdd = () => {
    setModalData({
      id: uid(),
      plantChapterId: currentChapterId,
      payoffChapterId: "",
      description: "",
      status: "Planted",
    });
    setIsEditing(false);
  };

  const handleOpenEdit = (f: Foreshadow) => {
    setModalData({ ...f });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!modalData) return;
    if (isEditing) {
      onUpdateForeshadow(modalData);
    } else {
      onAddForeshadow(modalData);
    }
    setModalData(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={styles.title}>Foreshadowing tracker</p>
        <button onClick={handleOpenAdd} style={styles.addButton}>
          <AddIcon sx={{ fontSize: 14 }} /> Plant Idea
        </button>
      </div>

      <div style={styles.list}>
        {foreshadows.length === 0 ? (
          <div style={styles.emptyStateContainer}>
            <div style={styles.emptyStateIconWrapper}>
              <svg
                style={styles.emptyStateIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 22V12M12 12c-2.5 0-6-1.5-6-5s3.5-3 6 0c2.5-3 6-3.5 6 0s-3.5 5-6 5z" />
              </svg>
            </div>
            <p style={styles.emptyStateTitle}>No plants or payoffs here</p>
            <p style={styles.emptyStateSub}>
              Plot setups or resolutions haven't been planted in this book yet.
            </p>
            <button onClick={handleOpenAdd} style={styles.emptyStateBtn}>
              <AddIcon sx={{ fontSize: 13 }} /> Plant Idea
            </button>
          </div>
        ) : (
          foreshadows.map((f) => (
            <ForeshadowItem
              key={f.id}
              f={f}
              chapters={chapters}
              onEdit={() => handleOpenEdit(f)}
              onDelete={() => onDeleteForeshadow(f.id)}
            />
          ))
        )}
      </div>

      {/* Modal for adding/updating foreshadow details */}
      {modalData && (
        <Modal
          title={isEditing ? "Edit Foreshadowing" : "Plant New Idea"}
          onClose={() => setModalData(null)}
          footer={
            <>
              <button
                onClick={() => setModalData(null)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button onClick={handleSave} style={styles.saveButton}>
                {isEditing ? "Save Changes" : "Plant Idea"}
              </button>
            </>
          }
        >
          <div style={styles.modalBody}>
            <div style={styles.modalGrid}>
              
              {/* Left Column: Description & Chapter dropdowns */}
              <div style={styles.modalLeftCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Description</label>
                  <textarea
                    style={{
                      ...styles.textarea,
                      borderColor: descFocused
                        ? "var(--color-primary)"
                        : "var(--border)",
                      boxShadow: descFocused
                        ? "0 0 0 1px var(--color-primary)"
                        : "none",
                    }}
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    value={modalData.description}
                    onChange={(e) =>
                      setModalData({ ...modalData, description: e.target.value })
                    }
                    placeholder="What is the clue, plant, or setup? E.g., 'Arthur notices a strange ring on Merlin's desk.'"
                  />
                </div>

                <div style={styles.row}>
                  <div style={styles.col}>
                    <label style={styles.inputLabel}>Plant Chapter</label>
                    <select
                      style={{
                        ...styles.select,
                        borderColor: plantFocused
                          ? "var(--color-primary)"
                          : "var(--border)",
                        boxShadow: plantFocused
                          ? "0 0 0 1px var(--color-primary)"
                          : "none",
                      }}
                      onFocus={() => setPlantFocused(true)}
                      onBlur={() => setPlantFocused(false)}
                      value={modalData.plantChapterId}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          plantChapterId: e.target.value,
                        })
                      }
                    >
                      {chapterOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          style={styles.selectOption}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.col}>
                    <label style={styles.inputLabel}>Payoff Chapter</label>
                    <select
                      style={{
                        ...styles.select,
                        borderColor: payoffFocused
                          ? "var(--color-primary)"
                          : "var(--border)",
                        boxShadow: payoffFocused
                          ? "0 0 0 1px var(--color-primary)"
                          : "none",
                      }}
                      onFocus={() => setPayoffFocused(true)}
                      onBlur={() => setPayoffFocused(false)}
                      value={modalData.payoffChapterId}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          payoffChapterId: e.target.value,
                        })
                      }
                    >
                      {chapterOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          style={styles.selectOption}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Status Card list (Vertical selection) */}
              <div style={styles.modalRightCol}>
                <div style={styles.segmentedContainer}>
                  <label style={styles.inputLabel}>Status</label>
                  <div style={styles.statusCardsCol}>
                    {[
                      {
                        value: "Planted",
                        label: "Planted",
                        desc: "Clue setup",
                        color: "#3b82f6",
                        icon: (
                          <svg
                            style={{ width: 14, height: 14 }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M12 22V12M12 12c-2.5 0-6-1.5-6-5s3.5-3 6 0c2.5-3 6-3.5 6 0s-3.5 5-6 5z" />
                          </svg>
                        ),
                      },
                      {
                        value: "Payoffed",
                        label: "Payoffed",
                        desc: "Setup resolved",
                        color: "#10b981",
                        icon: (
                          <svg
                            style={{ width: 14, height: 14 }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        ),
                      },
                      {
                        value: "Abandoned",
                        label: "Abandoned",
                        desc: "Defunct thread",
                        color: "#71717a",
                        icon: (
                          <svg
                            style={{ width: 14, height: 14 }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m4.93 4.93 14.14 14.14" />
                          </svg>
                        ),
                      },
                    ].map((opt) => {
                      const isSelected = modalData.status === opt.value;
                      const isHovered = hoveredStatus === opt.value;

                      let borderCol = "var(--border)";
                      let bgCol = "transparent";
                      let txtCol = "var(--text-secondary)";

                      if (isSelected) {
                        borderCol = opt.color;
                        bgCol = `${opt.color}15`;
                        txtCol = opt.color;
                      } else if (isHovered) {
                        borderCol = "var(--border-field)";
                        bgCol = "var(--bg-hover)";
                        txtCol = "var(--text-primary)";
                      }

                      return (
                        <div
                          key={opt.value}
                          onClick={() =>
                            setModalData({
                              ...modalData,
                              status: opt.value as
                                | "Planted"
                                | "Payoffed"
                                | "Abandoned",
                            })
                          }
                          onMouseEnter={() => setHoveredStatus(opt.value)}
                          onMouseLeave={() => setHoveredStatus(null)}
                          style={{
                            ...styles.statusCard,
                            borderColor: borderCol,
                            background: bgCol,
                            color: txtCol,
                          }}
                        >
                          <div style={styles.statusCardHeader}>
                            <div style={styles.statusCardLabelWrapper}>
                              {opt.icon}
                              <span style={styles.statusCardLabel}>{opt.label}</span>
                            </div>
                            {isSelected && (
                              <span
                                style={{
                                  ...styles.activeIndicator,
                                  background: opt.color,
                                  boxShadow: `0 0 4px ${opt.color}`,
                                }}
                              />
                            )}
                          </div>
                          <span style={styles.statusCardDesc}>{opt.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

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
    gap: 16,
    paddingRight: 8,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...S.dim,
    margin: 0,
  },
  addButton: {
    ...S.ghost,
    fontSize: 13,
    padding: "4px 8px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  modalBody: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    width: "100%",
  },
  modalGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    width: "100%",
  },
  modalLeftCol: {
    flex: "1.2 1 280px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  modalRightCol: {
    flex: "0.8 1 180px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    background: "rgba(255, 255, 255, 0.01)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "var(--text-primary)",
    fontSize: 13,
    lineHeight: 1.55,
    outline: "none",
    resize: "none",
    fontFamily: "var(--font-sans)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  select: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.01)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238c867d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    paddingRight: "36px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  selectOption: {
    background: "var(--bg-side)",
    color: "var(--text-primary)",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  col: {
    flex: "1 1 130px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cancelButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    padding: "8px 18px",
    borderRadius: "6px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  saveButton: {
    background: "var(--color-primary)",
    color: "var(--bg-app)",
    border: "none",
    padding: "8px 20px",
    borderRadius: "6px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  emptyStateContainer: {
    padding: "32px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    background: "rgba(255, 255, 255, 0.01)",
    border: "1px dashed var(--border)",
    borderRadius: "8px",
  },
  emptyStateIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.02)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    color: "var(--text-muted)",
  },
  emptyStateIcon: {
    width: 20,
    height: 20,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary)",
    margin: "0 0 6px 0",
  },
  emptyStateSub: {
    fontSize: 12,
    color: "var(--text-muted)",
    margin: "0 0 16px 0",
    maxWidth: 240,
    lineHeight: 1.5,
  },
  emptyStateBtn: {
    fontSize: 12,
    padding: "6px 14px",
    border: "1px solid var(--border)",
    background: "var(--bg-active)",
    color: "var(--text-primary)",
    borderRadius: 4,
    cursor: "pointer",
    transition: "background var(--duration-fast) var(--ease-smooth)",
  },
  segmentedContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statusCardsCol: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  statusCard: {
    cursor: "pointer",
    border: "1px solid",
    borderRadius: "8px",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
  },
  statusCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    justifyContent: "space-between",
  },
  statusCardLabelWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  statusCardLabel: {
    fontSize: 12,
    fontWeight: 600,
  },
  statusCardDesc: {
    fontSize: 10,
    color: "var(--text-muted)",
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },
} satisfies Record<string, React.CSSProperties>;

import { useState, useEffect, useRef } from "react";
import type { Path } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { AchievementBlock } from "../components/character/AchievementBlock";
import { ConditionBlock } from "../components/character/ConditionBlock";
import { LossBlock } from "../components/character/LossBlock";
import { TraumaBlock } from "../components/character/TraumaBlock";
import { RelationshipBlock } from "../components/character/RelationshipBlock";
import type { CharacterForm } from "../components/character/types";
import { Field, Section } from "../components/ui";
import { StatusBlock } from "../components/character/StatusBlock";
import { Modal } from "../components/ui/Modal";
import {
  BadgeIcon,
  CrisisAlertIcon,
  DeleteIcon,
  EmojiEventsIcon,
  HeartBrokenIcon,
  MedicalInformationIcon,
  PsychologyIcon,
  RouteIcon,
  SaveIcon,
  TimelineIcon,
  PeopleIcon,
  ArticleIcon,
  ShieldIcon,
  InfoIcon,
  SmartToyIcon,
} from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type {
  Condition,
  Loss,
  Trauma,
  Relationship,
  Equipment,
  EquipSlot,
  Achievement,
} from "../lib/types";
import { S } from "../lib/utils";
import { ArcBlock } from "../components/character/ArcBlock";
import { GhostAddButton } from "../components/character/GhostAddButton";
import { ArrayItemCard } from "../components/character/ArrayItemCard";
import { EquipmentBlock } from "../components/character/EquipmentBlock";
import { RARITY_COLORS, getSlotIcon } from "../components/character/equipmentUtils";
import { useCharacterForm } from "../hooks/useCharacterForm";
import { scoreFighter } from "../lib/scoreFighter";

export default function CharacterPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    control,
    register,
    setValue,
    isDirty,
    isSaving,
    onSubmit,
    modal,
    setModal,
    char,
    events,
    sortedChapters,
    allCharacters,
    statusTimeline,
    activeStatusIdx,
    isBase,
    arcs,
    traumas,
    conditions,
    equipment,
    activeEquipment,
    achievements,
    losses,
    relationships,
    baseGender,
    baseDob,
    baseAppearance,
    openAddEquipmentForSlot,
    autoEquip,
    unequipAll,
    handleCopyEquipmentStateFrom,
    toggleItemAccessState,
    viewStats,
    openAdd,
    openEdit,
    delItem,
    handleCancelModal,
    handleSaveModal,
    showExport,
    setShowExport,
    exportText,
    copied,
    setCopied,
    selectedTimeContext,
    setSelectedTimeContext,
    selectedEquipContext,
    setSelectedEquipContext,
    currentEquipEventId,
    showStatsModal,
    setShowStatsModal,
    statsText,
  } = useCharacterForm(id);

  const [isFloating, setIsFloating] = useState(false);
  const dockedButtonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    if (dockedButtonsRef.current) {
      observer.observe(dockedButtonsRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const ref = useAnimateIn();

  if (!char) {
    return <div style={styles.notFound}>Character not found.</div>;
  }

  const colorDotStyle = {
    ...styles.colorDot,
    background: char.color,
  };

  const activeSaveStyle = {
    ...styles.saveBtnActive,
    cursor: isSaving ? "default" : "pointer",
    opacity: isSaving ? 0.7 : 1,
  };

  const genderName = (
    isBase ? "gender" : `statusTimeline.${activeStatusIdx}.gender`
  ) as Path<CharacterForm>;
  const dobName = (
    isBase ? "dob" : `statusTimeline.${activeStatusIdx}.dob`
  ) as Path<CharacterForm>;
  const appearanceName = (
    isBase ? "appearance" : `statusTimeline.${activeStatusIdx}.appearance`
  ) as Path<CharacterForm>;

  const placeholderGender = isBase
    ? "Female, Non-binary, he/him…"
    : `Inherit: "${baseGender || "none"}"`;
  const placeholderDob = isBase
    ? "Born 201 ERA, age 24…"
    : `Inherit: "${baseDob || "none"}"`;
  const placeholderAppearance = isBase
    ? "Tall with scarred hands, wearing silver chainmail…"
    : `Inherit: "${baseAppearance || "none"}"`;

  return (
    <>
      <div
        ref={ref}
        className="seshat-page-container"
        data-testid="character-page-container"
      >
        {showStatsModal && (
          <Modal title="Combat Status Breakdown" onClose={() => setShowStatsModal(false)}>
            <div style={{ padding: "0 var(--space-5) var(--space-5)", whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
              {statsText}
              <div className="seshat-flex-end" style={{ marginTop: 24 }}>
                <button
                  onClick={() => setShowStatsModal(false)}
                  style={{
                    padding: "6px 16px",
                    background: "var(--color-primary)",
                    color: "var(--bg-app)",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
        {/* ── Header ── */}
        <div className="seshat-flex-between" style={styles.header}>
          <div style={styles.nameContainer}>
            <span style={colorDotStyle} />
            <input
              {...register("name")}
              data-testid="character-name-input"
              style={styles.nameInput}
            />
          </div>
          <div ref={dockedButtonsRef} style={styles.buttonsContainer}>
            <button
              onClick={() => navigate(`/ai?focusType=character&focusId=${char.id}`)}
              style={styles.exportBtn}
            >
              <SmartToyIcon sx={{ fontSize: 12 }} />
              ask ai
            </button>
            <button
              onClick={() => setShowExport(true)}
              data-testid="character-export-btn"
              style={styles.exportBtn}
            >
              <ArticleIcon sx={{ fontSize: 12 }} />
              export
            </button>
            <button
              onClick={onSubmit}
              disabled={!isDirty || isSaving}
              data-testid="character-save-btn"
              style={isDirty ? activeSaveStyle : styles.saveBtnInactive}
            >
              <SaveIcon sx={{ fontSize: 14 }} />
              {isSaving ? "saving..." : "save"}
            </button>
          </div>
        </div>

        {/* ── Biography & Appearance ── */}
        <div data-testid="biography-section">
          <Section
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <InfoIcon sx={{ fontSize: 12, marginRight: 4 }} />
                  Biography & Appearance
                </span>
                <select
                  value={isBase ? "base" : selectedTimeContext}
                  onChange={(e) => setSelectedTimeContext(e.target.value)}
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    outline: "none",
                    cursor: "pointer",
                    marginLeft: 16,
                    fontWeight: "normal",
                  }}
                >
                  <option value="base">Base (Default)</option>
                  {statusTimeline.map((s) => {
                    const ev = events.find((e) => e.id === s.eventId);
                    const label = ev
                      ? `T${ev.time} — ${ev.title}`
                      : s.startDate
                        ? `Period: ${s.startDate.replace("T", " ")}`
                        : `Timeline Entry (${s.id.slice(0, 4)})`;
                    return (
                      <option key={s.id} value={s.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            }
          >
            <p style={styles.sectionSub}>
              {isBase
                ? "Physical traits, gender details, date of birth, and visual features."
                : (() => {
                    const s = statusTimeline[activeStatusIdx];
                    const ev = events.find((e) => e.id === s?.eventId);
                    return `Editing overrides for timeline entry: ${
                      ev
                        ? `T${ev.time} — ${ev.title}`
                        : s?.startDate
                          ? s.startDate.replace("T", " ")
                          : `Entry (${s?.id.slice(0, 4)})`
                    }`;
                  })()}
            </p>
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Gender / pronouns"
                name={genderName}
                control={control}
                placeholder={placeholderGender}
              />
              <Field
                label="Date of birth / age"
                name={dobName}
                control={control}
                placeholder={placeholderDob}
              />
            </div>
            <Field
              label="Appearance / physical details"
              name={appearanceName}
              control={control}
              multi
              rows={3}
              placeholder={placeholderAppearance}
            />
          </Section>
        </div>

        {/* ── Status Timeline ── */}
        <Section
          title={
            <>
              <TimelineIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Status Timeline ({statusTimeline.length})
            </>
          }
          action={<GhostAddButton onClick={() => openAdd("status")} />}
        >
          <p style={styles.sectionSub}>
            Track how their physical state, emotions, and roles shift over time
            and events.
          </p>

          <div style={styles.listContainer}>
            {statusTimeline
              .map((s, i) => ({ s, i }))
              .sort((a, b) => {
                const evA = events.find((e) => e.id === a.s.eventId);
                const evB = events.find((e) => e.id === b.s.eventId);
                return (
                  (evA?.time ?? 0) - (evB?.time ?? 0) ||
                  a.s.id.localeCompare(b.s.id)
                );
              })
              .map(({ s, i }) => {
                const ev = events.find((e) => e.id === s.eventId);
                const dateTag = [
                  s.startDate && s.startDate.replace("T", " "),
                  s.endDate && `→ ${s.endDate.replace("T", " ")}`,
                ]
                  .filter(Boolean)
                  .join(" ");
                const label = ev
                  ? `T${ev.time} — ${ev.title}`
                  : "Unknown Event";

                const title = `${label}${dateTag ? ` (${dateTag})` : ""}`;
                const tags = [
                  s.power && `Power: ${s.power}`,
                  s.arcStage && `Arc: ${s.arcStage}`,
                  s.role && `Role: ${s.role}`,
                  s.archetype && `Archetype: ${s.archetype}`,
                  s.gender && `Gender: ${s.gender}`,
                  s.dob && `DOB: ${s.dob}`,
                  s.appearance &&
                    `Looks: ${s.appearance.length > 30 ? s.appearance.slice(0, 27) + "..." : s.appearance}`,
                  s.emotionalState && `Emotion: ${s.emotionalState}`,
                  s.physicalState && `Physical: ${s.physicalState}`,
                ].filter(Boolean) as string[];

                return (
                  <ArrayItemCard
                    key={s.id}
                    color={char.color}
                    title={title}
                    body={s.note}
                    tags={tags}
                    onEdit={() => openEdit("status", i)}
                    onDelete={() => delItem("status", i)}
                  />
                );
              })}
          </div>
          {!statusTimeline.length && (
            <p style={styles.sectionSubItalic}>No status entries recorded.</p>
          )}
        </Section>

        {/* ── Primary Identity ── */}
        <div data-testid="primary-identity-section">
          <Section
            title={
              <>
                <BadgeIcon sx={{ fontSize: 12, marginRight: 4 }} />
                Primary Identity
              </>
            }
          >
            <p style={styles.sectionSub}>
              Core defining roles. These can be overridden for specific events
              in the timeline above as the character evolves.
            </p>
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Primary role in story"
                name="role"
                control={control}
                placeholder="Protagonist, mentor…"
              />
              <Field
                label="Primary archetype"
                name="archetype"
                control={control}
                placeholder="The trickster…"
              />
            </div>
          </Section>
        </div>

        {/* ── Psychological core ── */}
        <div data-testid="psychological-core-section">
          <Section
            title={
              <>
                <PsychologyIcon sx={{ fontSize: 12, marginRight: 4 }} />
                Psychological core
              </>
            }
          >
            <Field
              label="Core wound"
              name="coreWound"
              control={control}
              multi
              rows={2}
              placeholder="The formative trauma that shaped everything."
            />
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Core fear"
                name="coreFear"
                control={control}
                placeholder="What they most dread."
              />
              <Field
                label="Core desire"
                name="coreDesire"
                control={control}
                placeholder="What they most want."
              />
            </div>
            <Field
              label="Philosophy / belief system"
              name="philosophy"
              control={control}
              multi
              rows={2}
              placeholder="How they see the world."
            />
            <Field
              label="Secrets (always carried)"
              name="secrets"
              control={control}
              multi
              rows={2}
              placeholder="What they hide. How it shapes every word they say."
            />

            <hr style={S.rule} />

            {/* Traumas */}
            <div className="seshat-flex-between" style={styles.sectionTitleRow}>
              <p style={styles.titleTextWithIcon}>
                <CrisisAlertIcon sx={{ fontSize: 12 }} />
                Traumas ({traumas.length})
              </p>
              <GhostAddButton onClick={() => openAdd("trauma")} />
            </div>

            <div style={styles.listContainer}>
              {traumas.map((t: Trauma, i: number) => (
                <ArrayItemCard
                  key={t.id}
                  color={char.color}
                  title={t.title || "Untitled trauma"}
                  subtitle={t.when ? `@ ${t.when}` : undefined}
                  body={t.description}
                  tags={
                    [
                      t.trigger && `trigger: ${t.trigger}`,
                      t.manifestation && `manifests: ${t.manifestation}`,
                    ].filter(Boolean) as string[]
                  }
                  onEdit={() => openEdit("trauma", i)}
                  onDelete={() => delItem("trauma", i)}
                />
              ))}
            </div>
            {!traumas.length && (
              <p style={styles.sectionSubItalic}>No traumas recorded.</p>
            )}
          </Section>
        </div>

        {/* ── Character arc ── */}
        <Section
          title={
            <>
              <RouteIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Character arc
            </>
          }
          action={
            <GhostAddButton
              onClick={(e) => {
                e.stopPropagation();
                openAdd("arc");
              }}
            />
          }
        >
          <p style={styles.sectionSub}>
            Where they begin and where they end. The transformation the story
            puts them through.
          </p>
          <div style={S.grid3} className="seshat-grid3">
            {arcs.map((a, i) => {
              const ev1 = events.find((e) => e.id === a.arcFromEventId);
              const ev2 = events.find((e) => e.id === a.arcToEventId);
              const fromStr = ev1 ? `T${ev1.time}` : a.arcFromTime;
              const toStr = ev2 ? `T${ev2.time}` : a.arcToTime;
              const label = [
                fromStr && `From ${fromStr}`,
                toStr && `To ${toStr}`,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <ArrayItemCard
                  key={a.id}
                  color={char.color}
                  title={a.arcType || `Arc ${i + 1}`}
                  subtitle={label || undefined}
                  body={
                    a.arcStart
                      ? `${a.arcStart} → ${a.arcEnd || "?"}`
                      : undefined
                  }
                  onEdit={() => openEdit("arc", i)}
                  onDelete={() => {
                    delItem("arc", i);
                  }}
                />
              );
            })}
          </div>
          {!arcs.length && (
            <p style={styles.sectionSubItalic}>No arcs recorded.</p>
          )}
        </Section>

        {/* ── Conditions ── */}
        <Section
          title={
            <>
              <MedicalInformationIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Conditions ({conditions.length})
            </>
          }
          action={<GhostAddButton onClick={() => openAdd("condition")} />}
        >
          <p style={styles.sectionSub}>
            Current physical, mental, social, or spiritual states.
          </p>
          <div style={styles.listContainer}>
            {conditions.map((cd: Condition, i: number) => (
              <ArrayItemCard
                key={cd.id}
                color={cd.isActive ? "var(--color-orange)" : "var(--border)"}
                title={cd.name || "Untitled condition"}
                subtitle={`[${cd.type}]${!cd.isActive ? " · resolved" : " · active"}`}
                body={cd.description}
                tags={
                  [cd.effects && `effects: ${cd.effects}`].filter(
                    Boolean,
                  ) as string[]
                }
                onEdit={() => openEdit("condition", i)}
                onDelete={() => delItem("condition", i)}
              />
            ))}
          </div>
          {!conditions.length && <p style={S.dim}>No conditions yet.</p>}
        </Section>

        {/* ── Equipment ── */}
        <Section
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                <ShieldIcon sx={{ fontSize: 12, marginRight: 4 }} />
                Equipment ({activeEquipment.length})
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  TIMELINE VIEW:
                </span>
                <select
                  value={selectedEquipContext}
                  onChange={(e) => setSelectedEquipContext(e.target.value)}
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    outline: "none",
                    cursor: "pointer",
                    fontWeight: "normal",
                  }}
                >
                  <option value="base">Base (Default State)</option>
                  {sortedChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.number} — {ch.title || "Untitled"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        >
          <p style={styles.sectionSubMb20}>
            Manage the gear, relics, and items equipped by your character.
          </p>

          {char && (
            <div>
              <div className="seshat-gear-sheet-layout">
                {/* Left Column slots */}
                <div style={styles.gearColumn}>
                  {(
                    ["Helmet", "Armor", "Gloves", "Boots", "Mount"] as const
                  ).map((slotName) => (
                    <EquipmentSlotView
                      key={slotName}
                      slotName={slotName}
                      activeEquipment={activeEquipment}
                      equipment={equipment}
                      openEdit={openEdit}
                      toggleItemAccessState={toggleItemAccessState}
                      delItem={delItem}
                      openAddEquipmentForSlot={openAddEquipmentForSlot}
                    />
                  ))}
                </div>

                {/* Center Column: Character details and combat score */}
                <div
                  className="seshat-gear-center-column"
                  style={styles.gearCenterColumn}
                >
                  <div
                    style={{
                      ...styles.gearAvatarCircle,
                      borderColor: char.color || "var(--border)",
                      boxShadow: `0 0 24px ${char.color || "var(--border)"}33`,
                    }}
                  >
                    <span style={styles.gearAvatarInitial}>
                      {char.name ? char.name.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                  <div style={styles.gearCharName}>{char.name}</div>
                  <div style={styles.gearCharRole}>
                    {char.role || "No Role"}{" "}
                    {char.archetype && `· ${char.archetype}`}
                  </div>
                  <div style={styles.gearPowerBadge}>
                    <span style={styles.gearPowerLabel}>combat score</span>
                    <span style={styles.gearPowerValue}>
                      {scoreFighter(
                        char,
                        events,
                        currentEquipEventId,
                      ).score.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Right Column slots */}
                <div style={styles.gearColumn}>
                  {(
                    [
                      "Weapon",
                      "Offhand",
                      "Accessory",
                      "Relic",
                      "Other",
                    ] as const
                  ).map((slotName) => (
                    <EquipmentSlotView
                      key={slotName}
                      slotName={slotName}
                      activeEquipment={activeEquipment}
                      equipment={equipment}
                      openEdit={openEdit}
                      toggleItemAccessState={toggleItemAccessState}
                      delItem={delItem}
                      openAddEquipmentForSlot={openAddEquipmentForSlot}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Actions Row */}
              <div style={styles.quickActionsContainer}>
                <button onClick={autoEquip} style={styles.quickActionBtn}>
                  ⚡ Auto Equip
                </button>
                <button onClick={unequipAll} style={styles.quickActionBtn}>
                  🚫 Unequip All
                </button>
                <button onClick={viewStats} style={styles.quickActionBtn}>
                  📊 View Stats
                </button>
                {!isBase && (
                  <div style={{ display: "inline-flex", alignItems: "center" }}>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleCopyEquipmentStateFrom(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      style={{
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        padding: "5px 12px",
                        fontSize: "11px",
                        cursor: "pointer",
                        height: "28px",
                        outline: "none",
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        📋 Clone Gear State...
                      </option>
                      <option value="base">Default / Base State</option>
                      {sortedChapters
                        .filter((ch) => ch.id !== selectedEquipContext)
                        .map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.number} - {ch.title || "Untitled"}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Rarity Guide Legend */}
              <div style={styles.rarityGuideRow}>
                <span style={styles.rarityGuideLabel}>RARITY GUIDE:</span>
                {(["Common", "Rare", "Epic", "Legendary"] as const).map(
                  (rarKey) => {
                    const rar = RARITY_COLORS[rarKey];
                    return (
                      <div key={rarKey} style={styles.rarityGuideItem}>
                        <span
                          style={{ ...styles.rarityDot, background: rar.color }}
                        />
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: 11,
                          }}
                        >
                          {rar.text}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Stash / Inventory */}
          <div style={styles.stashSection}>
            <div style={styles.stashHeader}>
              <span style={styles.stashTitle}>Stash / Inventory</span>
              <GhostAddButton onClick={() => openAdd("equipment")} />
            </div>
            <div style={styles.stashGrid}>
              {activeEquipment
                .filter((eq: Equipment) => eq.accessState !== "Equipped")
                .map((eq: Equipment) => {
                  const itemIndex = equipment.findIndex(
                    (item) => item.id === eq.id,
                  );
                  const isStored = eq.accessState === "Stored";
                  const itemRarity = eq.rarity || "Common";
                  const rar = RARITY_COLORS[itemRarity];
                  return (
                    <div
                      key={eq.id}
                      onClick={() => openEdit("equipment", itemIndex)}
                      className="seshat-filled-slot"
                      style={{
                        ...styles.filledSlotCard,
                        borderColor: rar.border,
                        background: rar.bg,
                        borderLeft: `3px solid ${rar.color}`,
                      }}
                    >
                      <div style={styles.slotIconBox}>
                        {getSlotIcon(eq.slot, rar.color)}
                      </div>
                      <div style={styles.slotDetails}>
                        <div style={styles.slotLabel}>{eq.slot}</div>
                        <div style={styles.slotItemName}>{eq.name}</div>
                        <div style={styles.slotRarityRow}>
                          <span
                            style={{
                              ...styles.rarityDot,
                              background: rar.color,
                            }}
                          />
                          <span
                            style={{ color: "var(--text-muted)", fontSize: 10 }}
                          >
                            {isStored ? "Stored" : "No Access"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemAccessState(itemIndex);
                        }}
                        style={styles.slotActionBtn}
                        title="Equip Item"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--color-primary)";
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.opacity = "0.7";
                        }}
                      >
                        📤
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          delItem("equipment", itemIndex);
                        }}
                        style={styles.slotDeleteBtn}
                        title="Delete item completely"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              {!activeEquipment.filter((eq) => eq.accessState !== "Equipped")
                .length && (
                <p
                  style={{
                    ...S.dim,
                    gridColumn: "1 / -1",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  No items in stash.
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Achievements & Losses ── */}
        <Section
          title={
            <>
              <EmojiEventsIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Achievements & losses ({achievements.length + losses.length})
            </>
          }
        >
          <p style={styles.sectionSubMb5}>
            What they've gained and lost over the course of the story.
          </p>

          <div
            className="seshat-flex-between"
            style={styles.sectionTitleRowMb3}
          >
            <p style={styles.titleTextWithIcon}>
              <EmojiEventsIcon sx={{ fontSize: 12 }} />
              Achievements ({achievements.length})
            </p>
            <GhostAddButton onClick={() => openAdd("achievement")} />
          </div>
          <div style={styles.listContainerMb6}>
            {achievements.map((a: Achievement, i: number) => (
              <ArrayItemCard
                key={a.id}
                color="var(--color-green)"
                title={a.title || "Untitled achievement"}
                subtitle={a.atTime ? `T${a.atTime}` : undefined}
                body={a.description}
                tags={
                  [a.gained && `gained: ${a.gained}`].filter(
                    Boolean,
                  ) as string[]
                }
                onEdit={() => openEdit("achievement", i)}
                onDelete={() => delItem("achievement", i)}
              />
            ))}
          </div>
          {!achievements.length && (
            <p style={styles.sectionSubMb20}>No achievements yet.</p>
          )}

          <hr style={S.rule} />

          <div
            className="seshat-flex-between"
            style={styles.sectionTitleRowMb3}
          >
            <p style={styles.titleTextWithIcon}>
              <HeartBrokenIcon sx={{ fontSize: 12 }} />
              Losses ({losses.length})
            </p>
            <GhostAddButton onClick={() => openAdd("loss")} />
          </div>
          <div style={styles.listContainer}>
            {losses.map((ls: Loss, i: number) => (
              <ArrayItemCard
                key={ls.id}
                color="var(--color-red)"
                title={ls.title || "Untitled loss"}
                subtitle={ls.atTime ? `T${ls.atTime}` : undefined}
                body={ls.description}
                onEdit={() => openEdit("loss", i)}
                onDelete={() => delItem("loss", i)}
              />
            ))}
          </div>
          {!losses.length && <p style={S.dim}>No losses yet.</p>}
        </Section>

        {/* ── Relationships ── */}
        <Section
          title={
            <>
              <PeopleIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Relationships ({relationships.length})
            </>
          }
          action={<GhostAddButton onClick={() => openAdd("relationship")} />}
        >
          <p style={styles.sectionSub}>
            How this character relates to others over time.
          </p>
          <div style={styles.listContainer}>
            {relationships.map((rel: Relationship, i: number) => {
              const otherChar = allCharacters.find((c) => c.id === rel.withId);
              const title = otherChar ? otherChar.name : "Unknown Character";
              return (
                <ArrayItemCard
                  key={rel.id}
                  color="var(--color-primary)"
                  title={title}
                  subtitle={rel.feel ? `[${rel.feel}]` : undefined}
                  body={
                    rel.timeline?.length > 0
                      ? `Timeline: ${rel.timeline.map((t) => `T${t.time} (${t.dynamic})`).join(" → ")}`
                      : undefined
                  }
                  onEdit={() => openEdit("relationship", i)}
                  onDelete={() => delItem("relationship", i)}
                />
              );
            })}
          </div>
          {!relationships.length && (
            <p style={S.dim}>No relationships defined.</p>
          )}
        </Section>

        {/* ── Modals ── */}
        {modal?.type === "trauma" && modal.idx !== null && (
          <Modal
            title={modal.isNew ? "Add New Trauma" : "Edit Trauma Details"}
            onClose={handleCancelModal}
            footer={
              <div className="seshat-flex-between" style={{ width: "100%" }}>
                <div>
                  {!modal.isNew && (
                    <button
                      onClick={() => delItem("trauma", modal.idx!)}
                      className="seshat-modal-btn-delete"
                      title="Delete this trauma entry"
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                      Delete
                    </button>
                  )}
                </div>
                <div className="seshat-flex-align" style={{ gap: 12 }}>
                  <button
                    onClick={handleCancelModal}
                    className="seshat-modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveModal}
                    className="seshat-modal-btn-submit"
                  >
                    <SaveIcon sx={{ fontSize: 16 }} />
                    Save
                  </button>
                </div>
              </div>
            }
          >
            <TraumaBlock
              control={control}
              index={modal.idx}
              color={char.color}
              onDelete={() => delItem("trauma", modal.idx!)}
              chapters={sortedChapters}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "condition" && modal.idx !== null && (
          <Modal
            title={modal.isNew ? "Add Condition" : "Edit Condition Details"}
            onClose={handleCancelModal}
            variant="wide"
            footer={
              <div className="seshat-flex-between" style={{ width: "100%" }}>
                <div>
                  {!modal.isNew && (
                    <button
                      onClick={() => {
                        delItem("condition", modal.idx!);
                        setModal(null);
                      }}
                      className="seshat-modal-btn-delete"
                      title="Delete this condition"
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                      Delete
                    </button>
                  )}
                </div>
                <div className="seshat-flex-align" style={{ gap: 12 }}>
                  <button
                    onClick={handleCancelModal}
                    className="seshat-modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveModal}
                    className="seshat-modal-btn-submit"
                  >
                    <SaveIcon sx={{ fontSize: 16 }} />
                    Save
                  </button>
                </div>
              </div>
            }
          >
            <ConditionBlock
              control={control}
              index={modal.idx}
              color="var(--color-orange)"
              onDelete={() => {}}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "equipment" && modal.idx !== null && (
          <Modal
            title="Equipment"
            onClose={handleCancelModal}
            footer={
              <button onClick={handleSaveModal} style={styles.doneBtn}>
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <EquipmentBlock
              control={control}
              index={modal.idx}
              color="var(--color-primary)"
              onDelete={() => delItem("equipment", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "achievement" && modal.idx !== null && (
          <Modal
            title="Achievement"
            onClose={handleCancelModal}
            footer={
              <button onClick={handleSaveModal} style={styles.doneBtn}>
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <AchievementBlock
              control={control}
              index={modal.idx}
              onDelete={() => delItem("achievement", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "loss" && modal.idx !== null && (
          <Modal
            title="Loss"
            onClose={handleCancelModal}
            footer={
              <button onClick={handleSaveModal} style={styles.doneBtn}>
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <LossBlock
              control={control}
              index={modal.idx}
              onDelete={() => delItem("loss", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "relationship" && modal.idx !== null && (
          <Modal
            title="Relationship"
            onClose={handleCancelModal}
            footer={
              <button onClick={handleSaveModal} style={styles.doneBtn}>
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <RelationshipBlock
              control={control}
              index={modal.idx}
              onDelete={() => delItem("relationship", modal.idx!)}
              characters={allCharacters}
              currentCharacterId={char.id}
            />
          </Modal>
        )}

        {modal?.type === "status" && modal.idx !== null && (
          <Modal
            title="Status Entry"
            onClose={handleCancelModal}
            variant="wide"
            footer={
              <button onClick={handleSaveModal} style={styles.doneBtn}>
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <StatusBlock
              control={control}
              index={modal.idx}
              color={char.color}
              onDelete={() => delItem("status", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "arc" && modal.idx !== null && (
          <Modal
            title={modal.isNew ? "Add Character Arc" : "Edit Character Arc Details"}
            onClose={handleCancelModal}
            variant="wide"
            footer={
              <div className="seshat-flex-between" style={{ width: "100%" }}>
                <div>
                  {!modal.isNew && (
                    <button
                      onClick={() => delItem("arc", modal.idx!)}
                      className="seshat-modal-btn-delete"
                      title="Delete this character arc"
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                      Delete
                    </button>
                  )}
                </div>
                <div className="seshat-flex-align" style={{ gap: 12 }}>
                  <button
                    onClick={handleCancelModal}
                    className="seshat-modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveModal}
                    className="seshat-modal-btn-submit"
                  >
                    <SaveIcon sx={{ fontSize: 16 }} />
                    Save
                  </button>
                </div>
              </div>
            }
          >
            <ArcBlock
              control={control}
              setValue={setValue}
              index={modal.idx}
              color={char.color}
              onDelete={() => delItem("arc", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {/* Export Modal */}
        {showExport && (
          <Modal
            title={`Export ${char.name || "Character"}`}
            onClose={() => setShowExport(false)}
            footer={
              <div style={styles.exportModalFooter}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    ...S.ghost,
                    color: copied
                      ? "var(--color-green)"
                      : "var(--color-primary)",
                  }}
                >
                  {copied ? "Copied!" : "Copy text"}
                </button>
                <button onClick={() => setShowExport(false)} style={S.ghost}>
                  Close
                </button>
              </div>
            }
          >
            <div style={styles.exportModalBody}>
              <p style={styles.sectionSubMb16}>
                Paste into your AI's system prompt. Includes full psychological
                profile, history, state, and relationships for this character.
                Includes any unsaved changes you just made!
              </p>
              <textarea
                readOnly
                value={exportText}
                style={styles.exportTextarea}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </Modal>
        )}
      </div>

      {isFloating && (
        <div className="seshat-chapter-toolbar floating">
          <button
            onClick={() => setShowExport(true)}
            data-testid="character-export-btn-floating"
            style={styles.exportBtn}
          >
            <ArticleIcon sx={{ fontSize: 12 }} />
            export
          </button>
          <button
            disabled={!isDirty || isSaving}
            onClick={onSubmit}
            title="Save changes"
            style={isDirty ? activeSaveStyle : styles.saveBtnInactive}
          >
            <SaveIcon sx={{ fontSize: 14 }} />
            {isSaving ? "saving..." : "save"}
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  notFound: {
    padding: "40px",
    color: "var(--text-secondary)",
  },
  header: {
    marginBottom: "var(--space-6)",
    gap: "var(--space-4)",
  },
  nameContainer: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  nameInput: {
    ...S.input,
    fontSize: "var(--text-3xl)",
    fontFamily: "var(--font-serif)",
    border: "none",
    padding: 0,
    flex: 1,
    color: "var(--text-primary)",
    letterSpacing: 0.3,
  },
  buttonsContainer: {
    display: "flex",
    gap: "var(--space-3)",
  },
  exportBtn: {
    ...S.ghost,
    fontSize: "var(--text-xs)",
    letterSpacing: 1,
    color: "var(--color-primary)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 3,
    padding: "6px 14px",
    borderRadius: 4,
    border: "1px solid transparent",
  },
  saveBtnActive: {
    background: "var(--color-green)",
    color: "var(--bg-app)",
    border: "1px solid var(--color-green)",
    borderRadius: 4,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    display: "flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  saveBtnInactive: {
    ...S.ghost,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    color: "var(--color-green)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 4,
    border: "1px solid transparent",
    opacity: 0.5,
    cursor: "default",
  },
  sectionSub: {
    ...S.dim,
    marginBottom: "var(--space-3)",
  },
  sectionSubMb5: {
    ...S.dim,
    marginBottom: "var(--space-5)",
  },
  sectionSubMb16: {
    ...S.dim,
    marginBottom: 16,
  },
  sectionSubMb20: {
    ...S.dim,
    marginBottom: 20,
  },
  sectionSubItalic: {
    ...S.dim,
    fontStyle: "italic",
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  listContainerMb6: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
    marginBottom: "var(--space-6)",
  },
  sectionTitleRow: {
    marginBottom: "var(--space-4)",
  },
  sectionTitleRowMb3: {
    marginBottom: "var(--space-3)",
  },
  titleTextWithIcon: {
    ...S.h2,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
  },
  doneBtn: {
    ...S.ghost,
    fontSize: 12,
    letterSpacing: 1,
    color: "var(--color-green)",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  exportModalFooter: {
    display: "flex",
    gap: 12,
  },
  exportModalBody: {
    padding: 12,
  },
  exportTextarea: {
    ...S.textarea,
    border: "none",
    background: "var(--bg-export-ta)",
    padding: 16,
    borderRadius: 4,
    height: 360,
    width: 500,
    resize: "none",
    fontFamily: "monospace",
    fontSize: 13,
    outline: "none",
  },
  gearColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  filledSlotCard: {
    background: "var(--bg-entry)",
    border: "1px solid var(--border-field)",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
    minHeight: "64px",
    position: "relative",
    boxSizing: "border-box",
  },
  emptySlotCard: {
    background: "rgba(255, 255, 255, 0.01)",
    border: "1px dashed var(--border)",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
    minHeight: "64px",
    opacity: 0.5,
    boxSizing: "border-box",
  },
  slotIconBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "4px",
    flexShrink: 0,
  },
  emptySlotIconBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px dashed var(--border)",
    borderRadius: "4px",
    flexShrink: 0,
  },
  slotDetails: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  emptySlotDetails: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
  },
  slotHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  slotLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    lineHeight: 1.1,
  },
  slotDeleteBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0 2px",
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
    opacity: 0.6,
  },
  slotActionBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
    opacity: 0.7,
  },
  slotItemName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.2,
    marginTop: "2px",
  },
  slotRarityRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "2px",
  },
  rarityDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    display: "inline-block",
  },
  rarityText: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  slotStats: {
    fontSize: "11px",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emptySlotLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    lineHeight: 1.1,
  },
  emptySlotAction: {
    fontSize: "11px",
    color: "var(--color-primary)",
    fontWeight: 600,
    marginTop: "2px",
  },
  gearCenterColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    background:
      "radial-gradient(circle, rgba(25,25,30,0.4) 0%, rgba(15,15,18,0.7) 100%)",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    gap: "16px",
    minHeight: "360px",
  },
  gearAvatarCircle: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    border: "3px double var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-app)",
    position: "relative",
  },
  gearAvatarInitial: {
    fontSize: "44px",
    fontWeight: 700,
    fontFamily: "var(--font-serif)",
    color: "var(--text-primary)",
  },
  gearCharName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
    textAlign: "center",
  },
  gearCharRole: {
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textAlign: "center",
  },
  gearPowerBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "6px",
    padding: "6px 16px",
    width: "130px",
  },
  gearPowerLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#3b82f6",
    letterSpacing: "0.5px",
  },
  gearPowerValue: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#3b82f6",
    fontFamily: "monospace",
    textShadow: "0 0 6px rgba(59, 130, 246, 0.4)",
    marginTop: "2px",
  },
  quickActionsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "20px",
    width: "100%",
  },
  quickActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    padding: "6px 14px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
  },
  rarityGuideRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "20px",
    flexWrap: "wrap",
    padding: "8px 16px",
    background: "rgba(0, 0, 0, 0.15)",
    borderRadius: "6px",
    border: "1px solid var(--border)",
  },
  rarityGuideLabel: {
    fontSize: "9px",
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
  },
  rarityGuideItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  stashSection: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid var(--border)",
  },
  stashHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  stashTitle: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    letterSpacing: "1px",
  },
  stashGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  stashItemSub: {
    fontSize: "11px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
} satisfies Record<string, React.CSSProperties>;

function EquipmentSlotView({
  slotName,
  activeEquipment,
  equipment,
  openEdit,
  toggleItemAccessState,
  delItem,
  openAddEquipmentForSlot,
}: {
  slotName: EquipSlot;
  activeEquipment: Equipment[];
  equipment: Equipment[];
  openEdit: (type: "equipment", idx: number) => void;
  toggleItemAccessState: (idx: number) => void;
  delItem: (type: "equipment", idx: number) => void;
  openAddEquipmentForSlot: (slot: EquipSlot) => void;
}) {
  const eq = activeEquipment.find(
    (item) => item.slot === slotName && item.accessState === "Equipped",
  );
  if (eq) {
    const itemIndex = equipment.findIndex((item) => item.id === eq.id);
    const itemRarity = eq.rarity || "Common";
    const rar = RARITY_COLORS[itemRarity as keyof typeof RARITY_COLORS];
    return (
      <div
        key={slotName}
        onClick={() => openEdit("equipment", itemIndex)}
        className="seshat-filled-slot"
        style={{
          ...styles.filledSlotCard,
          borderColor: rar.border,
          background: rar.bg,
          borderLeft: `3px solid ${rar.color}`,
        }}
      >
        <div style={styles.slotIconBox}>{getSlotIcon(slotName, rar.color)}</div>
        <div style={styles.slotDetails}>
          <div style={styles.slotLabel}>{slotName}</div>
          <div style={styles.slotItemName}>{eq.name}</div>
          <div style={styles.slotRarityRow}>
            <span style={{ ...styles.rarityDot, background: rar.color }} />
            <span style={{ ...styles.rarityText, color: rar.color }}>
              {rar.text}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleItemAccessState(itemIndex);
          }}
          style={styles.slotActionBtn}
          title="Move to Stash"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-primary)";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          📥
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            delItem("equipment", itemIndex);
          }}
          style={styles.slotDeleteBtn}
          title="Delete item completely"
        >
          ×
        </button>
      </div>
    );
  }
  return (
    <div
      key={slotName}
      onClick={() => openAddEquipmentForSlot(slotName)}
      className="seshat-empty-slot"
      style={styles.emptySlotCard}
    >
      <div style={styles.emptySlotIconBox}>
        {getSlotIcon(slotName, "var(--text-muted)")}
      </div>
      <div style={styles.emptySlotDetails}>
        <div style={styles.emptySlotLabel}>{slotName}</div>
        <div style={styles.emptySlotAction}>+ equip</div>
      </div>
    </div>
  );
}

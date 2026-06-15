import { useSelector } from "@legendapp/state/react";
import { useEffect, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
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
  AddIcon,
  BadgeIcon,
  CloseIcon,
  CrisisAlertIcon,
  EmojiEventsIcon,
  HeartBrokenIcon,
  MedicalInformationIcon,
  PsychologyIcon,
  RouteIcon,
  SaveIcon,
  TimelineIcon,
  PeopleIcon,
  ArticleIcon,
} from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { buildExport } from "../lib/export";
import {
  useActiveBookIdx,
  useEvents,
  useCharacters,
} from "../hooks/useWorldStore";
import type {
  Achievement,
  Condition,
  Loss,
  Trauma,
  Relationship,
} from "../lib/types";
import {
  S,
  mkAchieve,
  mkCond,
  mkLoss,
  mkStatusEntry,
  mkTrauma,
  mkRel,
  mkArc,
} from "../lib/utils";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { updateFileOnGitHub } from "../lib/githubSync";

import { ArcBlock } from "../components/character/ArcBlock";

// ── Modal state type ──────────────────────────────────────────────────────
type ModalKind =
  | { type: "trauma"; idx: number | null; isNew?: boolean }
  | { type: "condition"; idx: number | null; isNew?: boolean }
  | { type: "achievement"; idx: number | null; isNew?: boolean }
  | { type: "loss"; idx: number | null; isNew?: boolean }
  | { type: "relationship"; idx: number | null; isNew?: boolean }
  | { type: "status"; idx: number | null; isNew?: boolean }
  | { type: "arc"; idx: number | null; isNew?: boolean }
  | null;

function GhostAddButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.ghost,
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-1)",
        color: "var(--text-secondary)",
      }}
    >
      <AddIcon sx={{ fontSize: 13 }} />
      add
    </button>
  );
}

export default function CharacterPage() {
  const { id } = useParams();
  const events = useEvents();
  const bookIdx = useActiveBookIdx();
  const [modal, setModal] = useState<ModalKind>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const char = useSelector(() => {
    if (bookIdx < 0) return undefined;
    return appStore.books[bookIdx].characters.get().find((c) => c.id === id);
  });
  const idx = useSelector(() => {
    if (bookIdx < 0) return -1;
    return appStore.books[bookIdx].characters
      .get()
      .findIndex((c) => c.id === id);
  });

  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<CharacterForm>({
    defaultValues: {
      name: "",
      role: "",
      archetype: "",
      coreWound: "",
      coreFear: "",
      coreDesire: "",
      philosophy: "",
      secrets: "",
      arcs: [],
      statusTimeline: [],
      traumas: [],
      conditions: [],
      achievements: [],
      losses: [],
      relationships: [],
    },
  });

  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (e.target === document || e.target === document.documentElement || e.target === document.body) {
        const st = document.scrollingElement?.scrollTop || document.documentElement?.scrollTop || 0;
        setIsFloating(st > 80);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    if (char) {
      reset({
        name: char.name || "",
        role: char.role || "",
        archetype: char.archetype || "",
        coreWound: char.coreWound || "",
        coreFear: char.coreFear || "",
        coreDesire: char.coreDesire || "",
        philosophy: char.philosophy || "",
        secrets: char.secrets || "",
        arcs: char.arcs || [],
        statusTimeline: char.statusTimeline || [],
        traumas: char.traumas || [],
        conditions: char.conditions || [],
        achievements: char.achievements || [],
        losses: char.losses || [],
        relationships: char.relationships || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char?.id, reset]);

  const ref = useAnimateIn();

  const statusTimeline = useWatch({ control, name: "statusTimeline" }) || [];
  const arcs = useWatch({ control, name: "arcs" }) || [];
  const traumas = useWatch({ control, name: "traumas" }) || [];
  const conditions = useWatch({ control, name: "conditions" }) || [];
  const achievements = useWatch({ control, name: "achievements" }) || [];
  const losses = useWatch({ control, name: "losses" }) || [];
  const relationships = useWatch({ control, name: "relationships" }) || [];
  const allCharacters = useCharacters() || [];

  const exportText = useMemo(() => {
    if (!showExport || !char) return "";
    return buildExport({
      title: "",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: events,
      characters: [{ ...char, ...getValues() } as unknown as import("../lib/types").Character], // Merge current unsaved changes
    });
  }, [showExport, char, events, getValues]);

  if (!char) {
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Character not found.
      </div>
    );
  }

  const onSubmit = async () => {
    const data = getValues();
    if (bookIdx < 0 || idx < 0) return;
    const c = appStore.books[bookIdx].characters[idx];
    c.name.set(data.name);
    c.role.set(data.role);
    c.archetype.set(data.archetype);
    c.coreWound.set(data.coreWound);
    c.coreFear.set(data.coreFear);
    c.coreDesire.set(data.coreDesire);
    c.philosophy.set(data.philosophy);
    c.secrets.set(data.secrets);
    c.statusTimeline.set(data.statusTimeline || []);
    c.arcs.set(data.arcs || []);
    c.traumas.set(data.traumas || []);
    c.conditions.set(data.conditions);
    c.achievements.set(data.achievements);
    c.losses.set(data.losses);
    c.relationships.set(data.relationships);

    // API delta sync
    const token =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");
    const bookId = appStore.activeBookId.get();
    if (token && id && bookId) {
      try {
        setIsSaving(true);
        const payload = {
          id: id,
          color: char.color,
          name: data.name,
          role: data.role,
          archetype: data.archetype,
          coreWound: data.coreWound,
          coreFear: data.coreFear,
          coreDesire: data.coreDesire,
          philosophy: data.philosophy,
          secrets: data.secrets,
          arcs: data.arcs,
          statusTimeline: data.statusTimeline,
          traumas: data.traumas,
          conditions: data.conditions,
          achievements: data.achievements,
          losses: data.losses,
          relationships: data.relationships,
        };
        await updateFileOnGitHub(
          token,
          bookId,
          `characters/char_${id}.json`,
          JSON.stringify(payload, null, 2),
        );
        showToast("Character synced to cloud", "success");
        reset(data);
      } catch {
        showToast("Failed to sync character to cloud", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // ── Array helpers ─────────────────────────────────────────────────────
  const openAdd = (
    type: "trauma" | "condition" | "achievement" | "loss" | "relationship" | "status" | "arc",
  ) => {
    const fieldMap = {
      trauma: "traumas" as const,
      condition: "conditions" as const,
      achievement: "achievements" as const,
      loss: "losses" as const,
      relationship: "relationships" as const,
      status: "statusTimeline" as const,
      arc: "arcs" as const,
    };
    const mkMap = {
      trauma: mkTrauma,
      condition: mkCond,
      achievement: mkAchieve,
      loss: mkLoss,
      relationship: mkRel,
      status: mkStatusEntry,
      arc: mkArc,
    };
    const current = getValues(fieldMap[type]);
    setValue(fieldMap[type], [...current, mkMap[type]()] as never);
    setModal({ type, idx: current.length, isNew: true });
  };

  const openEdit = (
    type: "trauma" | "condition" | "achievement" | "loss" | "relationship" | "status" | "arc",
    idx: number,
  ) => {
    setModal({ type, idx });
  };

  const delItem = (
    type: "trauma" | "condition" | "achievement" | "loss" | "relationship" | "status" | "arc",
    itemIdx: number,
  ) => {
    const fieldMap = {
      trauma: "traumas" as const,
      condition: "conditions" as const,
      achievement: "achievements" as const,
      loss: "losses" as const,
      relationship: "relationships" as const,
      status: "statusTimeline" as const,
      arc: "arcs" as const,
    };
    const current = getValues(fieldMap[type]);
    setValue(
      fieldMap[type],
      current.filter((_: unknown, i: number) => i !== itemIdx) as never,
    );
    setModal(null);
  };

  const handleCancelModal = () => {
    if (modal?.isNew && modal.idx !== null) {
      delItem(modal.type, modal.idx);
    } else {
      setModal(null);
    }
  };

  const handleSaveModal = () => {
    setModal(null);
    onSubmit();
  };

  return (
    <>
      <div 
        ref={ref} 
        className="seshat-page-container" 
        data-testid="character-page-container"
      >
      {/* ── Header ── */}
      <div
        className="seshat-flex-between"
        style={{
          marginBottom: "var(--space-6)",
          gap: "var(--space-4)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flex: 1 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: char.color,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <input
            {...register("name")}
            data-testid="character-name-input"
            style={{
              ...S.input,
              fontSize: "var(--text-3xl)",
              fontFamily: "var(--font-serif)",
              border: "none",
              padding: 0,
              flex: 1,
              color: "var(--text-primary)",
              letterSpacing: 0.3,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            onClick={() => setShowExport(true)}
            data-testid="character-export-btn"
            style={{
              ...S.ghost,
              fontSize: "var(--text-xs)",
              letterSpacing: 1,
              color: "var(--color-purple)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <ArticleIcon sx={{ fontSize: 12 }} />
            export
          </button>
          <button
            onClick={onSubmit}
            disabled={!isDirty || isSaving}
            data-testid="character-save-btn"
            style={
              isDirty
                ? {
                    background: "var(--color-green)",
                    color: "var(--bg-app)",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: isSaving ? "default" : "pointer",
                    opacity: isSaving ? 0.7 : 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }
                : {
                    ...S.ghost,
                    fontSize: 12,
                    letterSpacing: 1,
                    color: "var(--color-green)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    opacity: 0.5,
                    cursor: "default",
                  }
            }
          >
            <SaveIcon sx={{ fontSize: 14 }} />
            {isSaving ? "saving..." : "save"}
          </button>
        </div>
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
        <p style={{ ...S.dim, marginBottom: "var(--space-3)" }}>
          Track how their physical state, emotions, and roles shift over time and events.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {statusTimeline
            .map((s, i) => ({ s, i }))
            .sort((a, b) => {
              const evA = events.find((e) => e.id === a.s.eventId);
              const evB = events.find((e) => e.id === b.s.eventId);
              return (evA?.time ?? 0) - (evB?.time ?? 0) || a.s.id.localeCompare(b.s.id);
            })
            .map(({ s, i }) => {
              const ev = events.find((e) => e.id === s.eventId);
              const dateTag = [s.startDate && s.startDate.replace("T", " "), s.endDate && `→ ${s.endDate.replace("T", " ")}`].filter(Boolean).join(" ");
              const label = ev ? `T${ev.time} — ${ev.title}` : "Unknown Event";
              
              const title = `${label}${dateTag ? ` (${dateTag})` : ""}`;
              const tags = [
                s.power && `Power: ${s.power}`,
                s.arcStage && `Arc: ${s.arcStage}`,
                s.role && `Role: ${s.role}`,
                s.archetype && `Archetype: ${s.archetype}`,
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
          <p style={{ ...S.dim, fontStyle: "italic" }}>No status entries recorded.</p>
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
          <p style={{ ...S.dim, marginBottom: "var(--space-3)" }}>
          Core defining roles. These can be overridden for specific events in the timeline above as the character evolves.
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
        <div
          className="seshat-flex-between"
          style={{
            marginBottom: "var(--space-4)",
          }}
        >
          <p
            style={{
              ...S.h2,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
            }}
          >
            <CrisisAlertIcon sx={{ fontSize: 12 }} />
            Traumas ({traumas.length})
          </p>
          <GhostAddButton onClick={() => openAdd("trauma")} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
            <p style={{ ...S.dim, fontStyle: "italic" }}>No traumas recorded.</p>
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
          <GhostAddButton onClick={(e) => { e.stopPropagation(); openAdd("arc"); }} />
        }
      >
        <p style={{ ...S.dim, marginBottom: "var(--space-3)" }}>
          Where they begin and where they end. The transformation the story puts
          them through.
        </p>
        <div style={S.grid3} className="seshat-grid3">
          {arcs.map((a, i) => {
            const ev1 = events.find((e) => e.id === a.arcFromEventId);
            const ev2 = events.find((e) => e.id === a.arcToEventId);
            const fromStr = ev1 ? `T${ev1.time}` : a.arcFromTime;
            const toStr = ev2 ? `T${ev2.time}` : a.arcToTime;
            const label = [fromStr && `From ${fromStr}`, toStr && `To ${toStr}`].filter(Boolean).join(" ");
            return (
              <ArrayItemCard
                key={a.id}
                color={char.color}
                title={a.arcType || `Arc ${i + 1}`}
                subtitle={label || undefined}
                body={a.arcStart ? `${a.arcStart} → ${a.arcEnd || "?"}` : undefined}
                onEdit={() => openEdit("arc", i)}
                onDelete={() => {
                  delItem("arc", i);
                }}
              />
            );
          })}
        </div>
        {!arcs.length && (
          <p style={{ ...S.dim, fontStyle: "italic" }}>No arcs recorded.</p>
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
        <p style={{ ...S.dim, marginBottom: "var(--space-3)" }}>
          Current physical, mental, social, or spiritual states.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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

      {/* ── Achievements & Losses ── */}
      <Section
        title={
          <>
            <EmojiEventsIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Achievements & losses ({achievements.length + losses.length})
          </>
        }
      >
        <p style={{ ...S.dim, marginBottom: "var(--space-5)" }}>
          What they've gained and lost over the course of the story.
        </p>

        <div
          className="seshat-flex-between"
          style={{
            marginBottom: "var(--space-3)",
          }}
        >
          <p
            style={{
              ...S.h2,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 12 }} />
            Achievements ({achievements.length})
          </p>
          <GhostAddButton onClick={() => openAdd("achievement")} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            marginBottom: "var(--space-6)",
          }}
        >
          {achievements.map((a: Achievement, i: number) => (
            <ArrayItemCard
              key={a.id}
              color="var(--color-green)"
              title={a.title || "Untitled achievement"}
              subtitle={a.atTime ? `T${a.atTime}` : undefined}
              body={a.description}
              tags={
                [a.gained && `gained: ${a.gained}`].filter(Boolean) as string[]
              }
              onEdit={() => openEdit("achievement", i)}
              onDelete={() => delItem("achievement", i)}
            />
          ))}
        </div>
        {!achievements.length && (
          <p style={{ ...S.dim, marginBottom: 20 }}>No achievements yet.</p>
        )}

        <hr style={S.rule} />

        <div
          className="seshat-flex-between"
          style={{
            marginBottom: "var(--space-3)",
          }}
        >
          <p
            style={{
              ...S.h2,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
            }}
          >
            <HeartBrokenIcon sx={{ fontSize: 12 }} />
            Losses ({losses.length})
          </p>
          <GhostAddButton onClick={() => openAdd("loss")} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
        <p style={{ ...S.dim, marginBottom: "var(--space-3)" }}>
          How this character relates to others over time.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {relationships.map((rel: Relationship, i: number) => {
            const otherChar = allCharacters.find((c) => c.id === rel.withId);
            const title = otherChar ? otherChar.name : "Unknown Character";
            return (
              <ArrayItemCard
                key={rel.id}
                color="var(--color-purple)"
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
          title="Trauma"
          onClose={handleCancelModal}
          footer={
            <button
              onClick={handleSaveModal}
              style={{
                ...S.ghost,
                fontSize: 12,
                letterSpacing: 1,
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <SaveIcon sx={{ fontSize: 12 }} />
              done
            </button>
          }
        >
          <TraumaBlock
            control={control}
            index={modal.idx}
            color={char.color}
            onDelete={() => delItem("trauma", modal.idx!)}
          />
        </Modal>
      )}

      {modal?.type === "condition" && modal.idx !== null && (
        <Modal
          title="Condition"
          onClose={handleCancelModal}
          footer={
            <button
              onClick={handleSaveModal}
              style={{
                ...S.ghost,
                fontSize: 12,
                letterSpacing: 1,
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <SaveIcon sx={{ fontSize: 12 }} />
              done
            </button>
          }
        >
          <ConditionBlock
            control={control}
            index={modal.idx}
            color="var(--color-orange)"
            onDelete={() => delItem("condition", modal.idx!)}
            events={events}
          />
        </Modal>
      )}

      {modal?.type === "achievement" && modal.idx !== null && (
        <Modal
          title="Achievement"
          onClose={handleCancelModal}
          footer={
            <button
              onClick={handleSaveModal}
              style={{
                ...S.ghost,
                fontSize: 12,
                letterSpacing: 1,
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
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
            <button
              onClick={handleSaveModal}
              style={{
                ...S.ghost,
                fontSize: 12,
                letterSpacing: 1,
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
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
            <button
              onClick={handleSaveModal}
              style={{
                ...S.ghost,
                fontSize: 12,
                letterSpacing: 1,
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
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
          footer={
            <button
              onClick={handleSaveModal}
              style={{
                ...S.ghost,
                fontSize: 12,
                letterSpacing: 1,
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
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
          title="Character Arc"
          onClose={handleCancelModal}
          footer={
            <button
              onClick={handleSaveModal}
              style={{
                ...S.ghost,
                fontSize: 12,
                letterSpacing: 1,
                color: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <SaveIcon sx={{ fontSize: 12 }} />
              done
            </button>
          }
        >
          <ArcBlock
            control={control}
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
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  ...S.ghost,
                  color: copied ? "var(--color-green)" : "var(--color-purple)",
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
          <div style={{ padding: 12 }}>
            <p style={{ ...S.dim, marginBottom: 16 }}>
              Paste into your AI's system prompt. Includes full psychological profile, history, state, and relationships for this character. Includes any unsaved changes you just made!
            </p>
            <textarea
              readOnly
              value={exportText}
              style={{
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
              }}
              onFocus={(e) => e.target.select()}
            />
          </div>
        </Modal>
      )}
      </div>

      {isFloating && (
        <div className="seshat-chapter-toolbar floating">
          <button
            disabled={!isDirty || isSaving}
            onClick={onSubmit}
            title="Save changes"
            style={
              isDirty
                ? {
                    background: "var(--color-green)",
                    color: "var(--bg-app)",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: isSaving ? "default" : "pointer",
                    opacity: isSaving ? 0.7 : 1,
                  }
                : {
                    ...S.ghost,
                    fontSize: 12,
                    letterSpacing: 1,
                    color: "var(--color-green)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    opacity: 0.5,
                    cursor: "default",
                  }
            }
          >
            <SaveIcon sx={{ fontSize: 14 }} />
            {isSaving ? "saving..." : "save"}
          </button>
        </div>
      )}
    </>
  );
}

// ── Read-only array item card ─────────────────────────────────────────────
interface ArrayItemCardProps {
  color: string;
  title: string;
  subtitle?: string;
  body?: string;
  tags?: string[];
  onEdit: () => void;
  onDelete: () => void;
}

function ArrayItemCard({
  color,
  title,
  subtitle,
  body,
  tags,
  onEdit,
  onDelete,
}: ArrayItemCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        border: `1px solid ${hover ? "var(--border-field)" : "var(--border)"}`,
        borderLeft: `3px solid ${color}`,
        background: hover ? "var(--bg-hover)" : "var(--bg-entry)",
        boxShadow: hover ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
        transition: "background 0.1s, border 0.1s, box-shadow 0.1s",
        cursor: "pointer",
        borderRadius: "4px",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onEdit}
    >
      <div style={{ flex: 1, padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginBottom: body || (tags && tags.length) ? 6 : 0,
          }}
        >
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: 0.5,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
        {body && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: "0 0 4px",
              lineHeight: 1.55,
            }}
          >
            {body.length > 120 ? body.slice(0, 117) + "…" : body}
          </p>
        )}
        {tags && tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons — shown on hover */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "0 12px",
          opacity: hover ? 1 : 0,
          transition: "opacity 0.15s",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "var(--text-muted)",
            display: "flex",
          }}
          title="Delete item"
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-red)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  );
}

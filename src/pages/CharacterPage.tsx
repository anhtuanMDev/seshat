import { useSelector } from "@legendapp/state/react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { AchievementBlock } from "../components/character/AchievementBlock";
import { ConditionBlock } from "../components/character/ConditionBlock";
import { LossBlock } from "../components/character/LossBlock";
import { TraumaBlock } from "../components/character/TraumaBlock";
import type { CharacterForm } from "../components/character/types";
import { Field, Section } from "../components/ui";
import { CharStatusPanel } from "../components/ui/CharStatusPanel";
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
} from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useActiveBookIdx, useEvents } from "../hooks/useWorldStore";
import type { Achievement, Condition, Loss, Trauma } from "../lib/types";
import {
  S,
  mkAchieve,
  mkCond,
  mkLoss,
  mkStatusEntry,
  mkTrauma,
} from "../lib/utils";
import { appStore } from "../store/appStore";

// ── Modal state type ──────────────────────────────────────────────────────
type ModalKind =
  | { type: "trauma"; idx: number | null }
  | { type: "condition"; idx: number | null }
  | { type: "achievement"; idx: number | null }
  | { type: "loss"; idx: number | null }
  | null;

export default function CharacterPage() {
  const { id } = useParams();
  const events = useEvents();
  const bookIdx = useActiveBookIdx();
  const [modal, setModal] = useState<ModalKind>(null);

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

  const { register, handleSubmit, control, reset, setValue, getValues } =
    useForm<CharacterForm>({
      defaultValues: {
        name: "",
        role: "",
        archetype: "",
        coreWound: "",
        coreFear: "",
        coreDesire: "",
        philosophy: "",
        secrets: "",
        arcStart: "",
        arcEnd: "",
        statusTimeline: [],
        traumas: [],
        conditions: [],
        achievements: [],
        losses: [],
      },
    });

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
        arcStart: char.arcStart || "",
        arcEnd: char.arcEnd || "",
        statusTimeline: char.statusTimeline || [],
        traumas: char.traumas || [],
        conditions: char.conditions || [],
        achievements: char.achievements || [],
        losses: char.losses || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char?.id, reset]);

  const ref = useAnimateIn();

  const statusTimeline = useWatch({ control, name: "statusTimeline" }) || [];
  const traumas = useWatch({ control, name: "traumas" }) || [];
  const conditions = useWatch({ control, name: "conditions" }) || [];
  const achievements = useWatch({ control, name: "achievements" }) || [];
  const losses = useWatch({ control, name: "losses" }) || [];

  if (!char) {
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Character not found.
      </div>
    );
  }

  const onSubmit = (data: CharacterForm) => {
    if (bookIdx < 0) return;
    const c = appStore.books[bookIdx].characters[idx];
    c.name.set(data.name);
    c.role.set(data.role);
    c.archetype.set(data.archetype);
    c.coreWound.set(data.coreWound);
    c.coreFear.set(data.coreFear);
    c.coreDesire.set(data.coreDesire);
    c.philosophy.set(data.philosophy);
    c.secrets.set(data.secrets);
    c.arcStart.set(data.arcStart);
    c.arcEnd.set(data.arcEnd);
    c.statusTimeline.set(data.statusTimeline);
    c.traumas.set(data.traumas);
    c.conditions.set(data.conditions);
    c.achievements.set(data.achievements);
    c.losses.set(data.losses);
  };

  // ── Array helpers ─────────────────────────────────────────────────────
  const openAdd = (type: "trauma" | "condition" | "achievement" | "loss") => {
    const fieldMap = {
      trauma: "traumas" as const,
      condition: "conditions" as const,
      achievement: "achievements" as const,
      loss: "losses" as const,
    };
    const mkMap = {
      trauma: mkTrauma,
      condition: mkCond,
      achievement: mkAchieve,
      loss: mkLoss,
    };
    const current = getValues(fieldMap[type]);
    setValue(fieldMap[type], [...current, mkMap[type]()] as never);
    setModal({ type, idx: current.length });
  };

  const openEdit = (
    type: "trauma" | "condition" | "achievement" | "loss",
    idx: number,
  ) => {
    setModal({ type, idx });
  };

  const delItem = (
    type: "trauma" | "condition" | "achievement" | "loss",
    itemIdx: number,
  ) => {
    const fieldMap = {
      trauma: "traumas" as const,
      condition: "conditions" as const,
      achievement: "achievements" as const,
      loss: "losses" as const,
    };
    const current = getValues(fieldMap[type]);
    setValue(
      fieldMap[type],
      current.filter((_: unknown, i: number) => i !== itemIdx) as never,
    );
    setModal(null);
  };

  const closeModal = () => {
    setModal(null);
    handleSubmit(onSubmit)();
  };

  return (
    <div ref={ref}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}
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
            style={{
              ...S.input,
              fontSize: 24,
              border: "none",
              padding: 0,
              flex: 1,
              color: "var(--text-primary)",
              letterSpacing: 0.3,
            }}
          />
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          style={{
            ...S.ghost,
            fontSize: 11,
            letterSpacing: 1,
            color: "var(--color-green)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <SaveIcon sx={{ fontSize: 12 }} />
          save
        </button>
      </div>

      {/* ── Status Timeline ── */}
      <Section
        title={
          <>
            <TimelineIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Status Timeline
          </>
        }
      >
        <CharStatusPanel
          statusTimeline={statusTimeline}
          color={char.color}
          events={events}
          onChange={(entries) => setValue("statusTimeline", entries)}
        />
        <button
          onClick={() =>
            setValue("statusTimeline", [
              ...getValues("statusTimeline"),
              mkStatusEntry(),
            ])
          }
          style={{
            ...S.ghost,
            fontSize: 12,
            letterSpacing: 1,
            color: "var(--text-secondary)",
          }}
        >
          + add status entry
        </button>
      </Section>

      {/* ── Identity ── */}
      <Section
        title={
          <>
            <BadgeIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Identity
          </>
        }
      >
        <div style={S.grid2} className="seshat-grid2">
          <Field
            label="Role in story"
            name="role"
            control={control}
            placeholder="Protagonist, mentor…"
          />
          <Field
            label="Archetype"
            name="archetype"
            control={control}
            placeholder="The trickster…"
          />
        </div>
      </Section>

      {/* ── Psychological core ── */}
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              ...S.h2,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CrisisAlertIcon sx={{ fontSize: 12 }} />
            Traumas ({traumas.length})
          </p>
          <button
            onClick={() => openAdd("trauma")}
            style={{
              ...S.ghost,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 3,
              color: "var(--text-secondary)",
            }}
          >
            <AddIcon sx={{ fontSize: 13 }} />
            add
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

      {/* ── Character arc ── */}
      <Section
        title={
          <>
            <RouteIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Character arc
          </>
        }
      >
        <p style={{ ...S.dim, marginBottom: 12 }}>
          Where they begin and where they end. The transformation the story puts
          them through.
        </p>
        <div style={S.grid2} className="seshat-grid2">
          <Field
            label="Arc start — who they are"
            name="arcStart"
            control={control}
            placeholder="Closed off, convinced the world is cruel…"
          />
          <Field
            label="Arc end — who they become"
            name="arcEnd"
            control={control}
            placeholder="Capable of trust, grief without collapse…"
          />
        </div>
      </Section>

      {/* ── Conditions ── */}
      <Section
        title={
          <>
            <MedicalInformationIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Conditions ({conditions.length})
          </>
        }
        action={
          <button
            onClick={() => openAdd("condition")}
            style={{
              ...S.ghost,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <AddIcon sx={{ fontSize: 13 }} />
            add
          </button>
        }
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Current physical, mental, social, or spiritual states.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
        <p style={{ ...S.dim, marginBottom: 20 }}>
          What they've gained and lost over the course of the story.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              ...S.h2,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 12 }} />
            Achievements ({achievements.length})
          </p>
          <button
            onClick={() => openAdd("achievement")}
            style={{
              ...S.ghost,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <AddIcon sx={{ fontSize: 13 }} />
            add
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 24,
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              ...S.h2,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <HeartBrokenIcon sx={{ fontSize: 12 }} />
            Losses ({losses.length})
          </p>
          <button
            onClick={() => openAdd("loss")}
            style={{
              ...S.ghost,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <AddIcon sx={{ fontSize: 13 }} />
            add
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

      {/* ── Modals ── */}
      {modal?.type === "trauma" && modal.idx !== null && (
        <Modal
          title="Trauma"
          onClose={closeModal}
          footer={
            <button
              onClick={closeModal}
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
          onClose={closeModal}
          footer={
            <button
              onClick={closeModal}
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
          onClose={closeModal}
          footer={
            <button
              onClick={closeModal}
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
          onClose={closeModal}
          footer={
            <button
              onClick={closeModal}
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
    </div>
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
        borderLeft: `2px solid ${color}`,
        background: hover ? "var(--bg-hover)" : "var(--bg-entry)",
        transition: "background 0.1s",
        cursor: "pointer",
        borderRadius: "0 2px 2px 0",
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
          transition: "opacity 0.1s",
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

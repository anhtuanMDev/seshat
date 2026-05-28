import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { worldStore } from "../store/worldStore";
import { useEvents } from "../hooks/useWorldStore";
import {
  S,
  mkTrauma,
  mkCond,
  mkAchieve,
  mkLoss,
  mkStatusEntry,
} from "../lib/utils";
import {
  Field,
  Sel,
  Toggle,
  Section,
  EntryBlock,
  EventPicker,
} from "../components/ui";
import { CharStatusPanel } from "../components/ui/CharStatusPanel";
import { COND_TYPES } from "../lib/constants";
import { Button, styled } from "@mui/material";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Control, UseFormSetValue } from "react-hook-form";

import type {
  Trauma,
  Condition,
  Achievement,
  Loss,
  StatusEntry,
  CondType,
} from "../lib/types";

interface CharacterForm {
  name: string;
  role: string;
  archetype: string;
  coreWound: string;
  coreFear: string;
  coreDesire: string;
  philosophy: string;
  secrets: string;
  arcStart: string;
  arcEnd: string;
  statusTimeline: StatusEntry[];
  traumas: Trauma[];
  conditions: Condition[];
  achievements: Achievement[];
  losses: Loss[];
}

const GhostButton = styled(Button)(() => ({
  fontFamily: "Georgia, serif",
  fontSize: 12,
  color: "var(--text-secondary)",
  letterSpacing: 1,
  padding: "4px 0",
  textTransform: "none",
  background: "none",
  minWidth: 0,
  "&:hover": { background: "none", color: "var(--text-primary)" },
}));

interface BlockProps {
  control: Control<CharacterForm>;
  index: number;
  setValue: UseFormSetValue<CharacterForm>;
  onDelete: () => void;
}

function TraumaBlock({
  control,
  index,
  color,
  onDelete,
  setValue,
}: BlockProps & { color: string }) {
  const title = useWatch({ control, name: `traumas.${index}.title` as const });
  const when = useWatch({ control, name: `traumas.${index}.when` as const });
  const description = useWatch({
    control,
    name: `traumas.${index}.description` as const,
  });
  const trigger = useWatch({
    control,
    name: `traumas.${index}.trigger` as const,
  });
  const manifestation = useWatch({
    control,
    name: `traumas.${index}.manifestation` as const,
  });

  return (
    <EntryBlock color={color} onDelete={onDelete}>
      <div style={S.grid2}>
        <Field
          label="Trauma name"
          value={title}
          onChange={(v) => setValue(`traumas.${index}.title`, v)}
          placeholder="The abandonment…"
        />
        <Field
          label="When it happened"
          value={when}
          onChange={(v) => setValue(`traumas.${index}.when`, v)}
          placeholder="T2, age 12…"
        />
      </div>
      <Field
        label="What happened"
        value={description}
        onChange={(v) => setValue(`traumas.${index}.description`, v)}
        multi
        rows={2}
      />
      <div style={S.grid2}>
        <Field
          label="Triggered by"
          value={trigger}
          onChange={(v) => setValue(`traumas.${index}.trigger`, v)}
          placeholder="Loud voices, being abandoned…"
        />
        <Field
          label="Manifests as"
          value={manifestation}
          onChange={(v) => setValue(`traumas.${index}.manifestation`, v)}
          placeholder="Freezes, lashes out…"
        />
      </div>
    </EntryBlock>
  );
}

function ConditionBlock({
  control,
  index,
  color,
  onDelete,
  setValue,
  events,
}: BlockProps & {
  color: string;
  events: Array<{ id: string; time: number; title: string }>;
}) {
  const type = useWatch({ control, name: `conditions.${index}.type` as const });
  const name = useWatch({ control, name: `conditions.${index}.name` as const });
  const isActive = useWatch({
    control,
    name: `conditions.${index}.isActive` as const,
  });
  const atTime = useWatch({
    control,
    name: `conditions.${index}.atTime` as const,
  });
  const atEventId = useWatch({
    control,
    name: `conditions.${index}.atEventId` as const,
  });
  const why = useWatch({ control, name: `conditions.${index}.why` as const });
  const description = useWatch({
    control,
    name: `conditions.${index}.description` as const,
  });
  const effects = useWatch({
    control,
    name: `conditions.${index}.effects` as const,
  });

  return (
    <EntryBlock color={color} onDelete={onDelete}>
      <div style={S.grid3}>
        <Sel
          label="Type"
          value={type}
          onChange={(v) => setValue(`conditions.${index}.type`, v as CondType)}
          opts={COND_TYPES}
        />
        <Field
          label="Name"
          value={name}
          onChange={(v) => setValue(`conditions.${index}.name`, v)}
          placeholder="Cursed sight, broken ribs…"
        />
        <Toggle
          label="Currently active?"
          value={isActive}
          onChange={(v) => setValue(`conditions.${index}.isActive`, v)}
        />
      </div>
      <div style={S.grid2}>
        <Field
          label="At time (T#)"
          value={atTime}
          onChange={(v) => setValue(`conditions.${index}.atTime`, v)}
          placeholder="T3"
        />
        <EventPicker
          label="At event"
          value={atEventId}
          onChange={(v) => setValue(`conditions.${index}.atEventId`, v)}
          events={events}
        />
      </div>
      <Field
        label="Why / how they got it"
        value={why}
        onChange={(v) => setValue(`conditions.${index}.why`, v)}
        multi
        rows={2}
        placeholder="What caused this condition?"
      />
      <Field
        label="Description"
        value={description}
        onChange={(v) => setValue(`conditions.${index}.description`, v)}
        multi
        rows={2}
        placeholder="What does it feel like, look like?"
      />
      <Field
        label="Effects on the character"
        value={effects}
        onChange={(v) => setValue(`conditions.${index}.effects`, v)}
        multi
        rows={2}
      />
    </EntryBlock>
  );
}

function AchievementBlock({
  control,
  index,
  onDelete,
  setValue,
  events,
}: BlockProps & {
  events: Array<{ id: string; time: number; title: string }>;
}) {
  const title = useWatch({
    control,
    name: `achievements.${index}.title` as const,
  });
  const atTime = useWatch({
    control,
    name: `achievements.${index}.atTime` as const,
  });
  const atEventId = useWatch({
    control,
    name: `achievements.${index}.atEventId` as const,
  });
  const description = useWatch({
    control,
    name: `achievements.${index}.description` as const,
  });
  const gained = useWatch({
    control,
    name: `achievements.${index}.gained` as const,
  });

  return (
    <EntryBlock color="var(--color-green)" onDelete={onDelete}>
      <div style={S.grid2}>
        <Field
          label="Title"
          value={title}
          onChange={(v) => setValue(`achievements.${index}.title`, v)}
          placeholder="Mastered the void step…"
        />
        <Field
          label="At time (T#)"
          value={atTime}
          onChange={(v) => setValue(`achievements.${index}.atTime`, v)}
          placeholder="T4"
        />
      </div>
      <EventPicker
        label="At event"
        value={atEventId}
        onChange={(v) => setValue(`achievements.${index}.atEventId`, v)}
        events={events}
      />
      <Field
        label="Description"
        value={description}
        onChange={(v) => setValue(`achievements.${index}.description`, v)}
        multi
        rows={2}
        placeholder="What happened. Why it matters."
      />
      <Field
        label="What they gained"
        value={gained}
        onChange={(v) => setValue(`achievements.${index}.gained`, v)}
        placeholder="Respect of the guild, a new power, a scar…"
      />
    </EntryBlock>
  );
}

function LossBlock({
  control,
  index,
  onDelete,
  setValue,
  events,
}: BlockProps & {
  events: Array<{ id: string; time: number; title: string }>;
}) {
  const title = useWatch({ control, name: `losses.${index}.title` as const });
  const atTime = useWatch({
    control,
    name: `losses.${index}.atTime` as const,
  });
  const atEventId = useWatch({
    control,
    name: `losses.${index}.atEventId` as const,
  });
  const description = useWatch({
    control,
    name: `losses.${index}.description` as const,
  });

  return (
    <EntryBlock color="var(--color-red)" onDelete={onDelete}>
      <div style={S.grid2}>
        <Field
          label="What was lost"
          value={title}
          onChange={(v) => setValue(`losses.${index}.title`, v)}
          placeholder="Their mentor, their right eye…"
        />
        <Field
          label="At time (T#)"
          value={atTime}
          onChange={(v) => setValue(`losses.${index}.atTime`, v)}
          placeholder="T6"
        />
      </div>
      <EventPicker
        label="At event"
        value={atEventId}
        onChange={(v) => setValue(`losses.${index}.atEventId`, v)}
        events={events}
      />
      <Field
        label="Description"
        value={description}
        onChange={(v) => setValue(`losses.${index}.description`, v)}
        multi
        rows={2}
        placeholder="How it happened. What it cost them emotionally."
      />
    </EntryBlock>
  );
}

export default function CharacterPage() {
  const { id } = useParams();
  const events = useEvents();

  const char = useSelector(() =>
    worldStore.characters.get().find((c) => c.id === id),
  );
  const idx = useSelector(() =>
    worldStore.characters.get().findIndex((c) => c.id === id),
  );

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

  const role = useWatch({ control, name: "role" });
  const archetype = useWatch({ control, name: "archetype" });
  const coreWound = useWatch({ control, name: "coreWound" });
  const coreFear = useWatch({ control, name: "coreFear" });
  const coreDesire = useWatch({ control, name: "coreDesire" });
  const philosophy = useWatch({ control, name: "philosophy" });
  const secrets = useWatch({ control, name: "secrets" });
  const arcStart = useWatch({ control, name: "arcStart" });
  const arcEnd = useWatch({ control, name: "arcEnd" });
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
    const c = worldStore.characters[idx];
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

  const addTrauma = () =>
    setValue("traumas", [...getValues("traumas"), mkTrauma()]);
  const addCond = () =>
    setValue("conditions", [...getValues("conditions"), mkCond()]);
  const addAchieve = () =>
    setValue("achievements", [...getValues("achievements"), mkAchieve()]);
  const addLoss = () => setValue("losses", [...getValues("losses"), mkLoss()]);

  const delItem = (id: string) => {
    const traumas = getValues("traumas");
    const conditions = getValues("conditions");
    const achievements = getValues("achievements");
    const losses = getValues("losses");
    if (traumas.some((t) => t.id === id))
      setValue(
        "traumas",
        traumas.filter((t) => t.id !== id),
      );
    else if (conditions.some((c) => c.id === id))
      setValue(
        "conditions",
        conditions.filter((c) => c.id !== id),
      );
    else if (achievements.some((a) => a.id === id))
      setValue(
        "achievements",
        achievements.filter((a) => a.id !== id),
      );
    else if (losses.some((l) => l.id === id))
      setValue(
        "losses",
        losses.filter((l) => l.id !== id),
      );
  };

  return (
    <div ref={ref}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
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
              fontSize: 22,
              border: "none",
              padding: 0,
              flex: 1,
              color: "var(--text-primary)",
            }}
          />
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          title="Save changes"
          style={{
            ...S.ghost,
            fontSize: 11,
            letterSpacing: 1,
            color: "var(--color-green)",
            flexShrink: 0,
          }}
        >
          save
        </button>
      </div>

      {/* ── Status Timeline ── */}
      <Section title="Status Timeline">
        <CharStatusPanel
          statusTimeline={statusTimeline}
          color={char.color}
          events={events}
          onChange={(entries) => setValue("statusTimeline", entries)}
        />
        <button
          onClick={() => {
            setValue("statusTimeline", [
              ...getValues("statusTimeline"),
              mkStatusEntry(),
            ]);
          }}
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
      <Section title="Identity">
        <div style={S.grid2}>
          <Field
            label="Role in story"
            value={role}
            onChange={(v) => setValue("role", v)}
            placeholder="Protagonist, mentor…"
          />
          <Field
            label="Archetype"
            value={archetype}
            onChange={(v) => setValue("archetype", v)}
            placeholder="The trickster…"
          />
        </div>
      </Section>

      {/* ── Psychological core ── */}
      <Section title="Psychological core">
        <Field
          label="Core wound"
          value={coreWound}
          onChange={(v) => setValue("coreWound", v)}
          multi
          rows={2}
          placeholder="The formative trauma that shaped everything."
        />
        <div style={S.grid2}>
          <Field
            label="Core fear"
            value={coreFear}
            onChange={(v) => setValue("coreFear", v)}
            placeholder="What they most dread."
          />
          <Field
            label="Core desire"
            value={coreDesire}
            onChange={(v) => setValue("coreDesire", v)}
            placeholder="What they most want."
          />
        </div>
        <Field
          label="Philosophy / belief system"
          value={philosophy}
          onChange={(v) => setValue("philosophy", v)}
          multi
          rows={2}
          placeholder="How they see the world."
        />
        <Field
          label="Secrets (always carried)"
          value={secrets}
          onChange={(v) => setValue("secrets", v)}
          multi
          rows={2}
          placeholder="What they hide. How it shapes every word they say."
        />

        <hr style={S.rule} />
        <p style={{ ...S.h2, marginBottom: 8 }}>Traumas</p>
        {traumas.map((t: Trauma, i: number) => (
          <TraumaBlock
            key={t.id}
            control={control}
            index={i}
            color={char.color}
            onDelete={() => delItem(t.id)}
            setValue={setValue}
          />
        ))}
        <GhostButton onClick={addTrauma}>+ add trauma</GhostButton>
      </Section>

      {/* ── Character arc ── */}
      <Section title="Character arc">
        <p style={{ ...S.dim, marginBottom: 12 }}>
          Where they begin and where they end. The transformation the story puts
          them through.
        </p>
        <div style={S.grid2}>
          <Field
            label="Arc start — who they are"
            value={arcStart}
            onChange={(v) => setValue("arcStart", v)}
            placeholder="Closed off, convinced the world is cruel…"
          />
          <Field
            label="Arc end — who they become"
            value={arcEnd}
            onChange={(v) => setValue("arcEnd", v)}
            placeholder="Capable of trust, grief without collapse…"
          />
        </div>
      </Section>

      {/* ── Conditions ── */}
      <Section
        title={`Conditions (${conditions.length})`}
        action={<GhostButton onClick={addCond}>+ add</GhostButton>}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Current physical, mental, social, or spiritual states — wounds,
          curses, blessings, enhancements.
        </p>
        {conditions.map((cd: Condition, i: number) => (
          <ConditionBlock
            key={cd.id}
            control={control}
            index={i}
            color={cd.isActive ? "var(--color-orange)" : "var(--border)"}
            onDelete={() => delItem(cd.id)}
            setValue={setValue}
            events={events}
          />
        ))}
        {!conditions.length && (
          <p style={S.dim}>No conditions yet.</p>
        )}
      </Section>

      {/* ── Achievements & Losses ── */}
      <Section
        title={`Achievements & losses (${achievements.length + losses.length})`}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          What they've gained and lost over the course of the story.
        </p>

        <p style={{ ...S.h2, marginBottom: 8 }}>Achievements</p>
        {achievements.map((a: Achievement, i: number) => (
          <AchievementBlock
            key={a.id}
            control={control}
            index={i}
            onDelete={() => delItem(a.id)}
            setValue={setValue}
            events={events}
          />
        ))}
        <GhostButton sx={{ marginBottom: 20 }} onClick={addAchieve}>
          + add achievement
        </GhostButton>

        <hr style={S.rule} />
        <p style={{ ...S.h2, marginBottom: 8 }}>Losses</p>
        {losses.map((ls: Loss, i: number) => (
          <LossBlock
            key={ls.id}
            control={control}
            index={i}
            onDelete={() => delItem(ls.id)}
            setValue={setValue}
            events={events}
          />
        ))}
        <GhostButton onClick={addLoss}>+ add loss</GhostButton>
      </Section>
    </div>
  );
}

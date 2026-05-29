import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { worldStore } from "../store/worldStore";
import { useEvents } from "../hooks/useWorldStore";
import { S, mkTrauma, mkCond, mkAchieve, mkLoss, mkStatusEntry } from "../lib/utils";
import { Field, Section, GhostButton } from "../components/ui";
import { CharStatusPanel } from "../components/ui/CharStatusPanel";
import { TimelineIcon, BadgeIcon, PsychologyIcon, RouteIcon, CrisisAlertIcon, MedicalInformationIcon, EmojiEventsIcon, HeartBrokenIcon, SaveIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { TraumaBlock } from "../components/character/TraumaBlock";
import { ConditionBlock } from "../components/character/ConditionBlock";
import { AchievementBlock } from "../components/character/AchievementBlock";
import { LossBlock } from "../components/character/LossBlock";
import type { CharacterForm } from "../components/character/types";
import type { Trauma, Condition, Achievement, Loss } from "../lib/types";

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
        name: "", role: "", archetype: "", coreWound: "", coreFear: "",
        coreDesire: "", philosophy: "", secrets: "", arcStart: "", arcEnd: "",
        statusTimeline: [], traumas: [], conditions: [], achievements: [], losses: [],
      },
    });

  useEffect(() => {
    if (char) {
      reset({
        name: char.name || "", role: char.role || "", archetype: char.archetype || "",
        coreWound: char.coreWound || "", coreFear: char.coreFear || "",
        coreDesire: char.coreDesire || "", philosophy: char.philosophy || "",
        secrets: char.secrets || "", arcStart: char.arcStart || "",
        arcEnd: char.arcEnd || "", statusTimeline: char.statusTimeline || [],
        traumas: char.traumas || [], conditions: char.conditions || [],
        achievements: char.achievements || [], losses: char.losses || [],
      });
    }
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

  const addTrauma = () => setValue("traumas", [...getValues("traumas"), mkTrauma()]);
  const addCond = () => setValue("conditions", [...getValues("conditions"), mkCond()]);
  const addAchieve = () => setValue("achievements", [...getValues("achievements"), mkAchieve()]);
  const addLoss = () => setValue("losses", [...getValues("losses"), mkLoss()]);

  const delItem = (id: string) => {
    const t = getValues("traumas");
    const c = getValues("conditions");
    const a = getValues("achievements");
    const l = getValues("losses");
    if (t.some((x) => x.id === id))
      setValue("traumas", t.filter((x) => x.id !== id));
    else if (c.some((x) => x.id === id))
      setValue("conditions", c.filter((x) => x.id !== id));
    else if (a.some((x) => x.id === id))
      setValue("achievements", a.filter((x) => x.id !== id));
    else if (l.some((x) => x.id === id))
      setValue("losses", l.filter((x) => x.id !== id));
  };

  return (
    <div ref={ref}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20, gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: char.color, display: "inline-block", flexShrink: 0,
            }}
          />
          <input
            {...register("name")}
            style={{
              ...S.input, fontSize: 22, border: "none", padding: 0, flex: 1,
              color: "var(--text-primary)",
            }}
          />
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          title="Save changes"
          style={{ ...S.ghost, fontSize: 11, letterSpacing: 1, color: "var(--color-green)", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}
        >
          <SaveIcon sx={{ fontSize: 12 }} />save
        </button>
      </div>

      <Section title={<><TimelineIcon sx={{ fontSize: 12, marginRight: 4 }} />Status Timeline</>}>
        <CharStatusPanel
          statusTimeline={statusTimeline}
          color={char.color}
          events={events}
          onChange={(entries) => setValue("statusTimeline", entries)}
        />
        <button
          onClick={() => setValue("statusTimeline", [...getValues("statusTimeline"), mkStatusEntry()])}
          style={{ ...S.ghost, fontSize: 12, letterSpacing: 1, color: "var(--text-secondary)" }}
        >
          + add status entry
        </button>
      </Section>

      <Section title={<><BadgeIcon sx={{ fontSize: 12, marginRight: 4 }} />Identity</>}>
        <div style={S.grid2}>
          <Field label="Role in story" name="role" control={control} placeholder="Protagonist, mentor…" />
          <Field label="Archetype" name="archetype" control={control} placeholder="The trickster…" />
        </div>
      </Section>

      <Section title={<><PsychologyIcon sx={{ fontSize: 12, marginRight: 4 }} />Psychological core</>}>
        <Field label="Core wound" name="coreWound" control={control} multi rows={2} placeholder="The formative trauma that shaped everything." />
        <div style={S.grid2}>
          <Field label="Core fear" name="coreFear" control={control} placeholder="What they most dread." />
          <Field label="Core desire" name="coreDesire" control={control} placeholder="What they most want." />
        </div>
        <Field label="Philosophy / belief system" name="philosophy" control={control} multi rows={2} placeholder="How they see the world." />
        <Field label="Secrets (always carried)" name="secrets" control={control} multi rows={2} placeholder="What they hide. How it shapes every word they say." />
        <hr style={S.rule} />
        <p style={{ ...S.h2, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><CrisisAlertIcon sx={{ fontSize: 12 }} />Traumas</p>
        {traumas.map((t: Trauma, i: number) => (
          <TraumaBlock key={t.id} control={control} index={i} color={char.color} onDelete={() => delItem(t.id)} />
        ))}
        <GhostButton onClick={addTrauma}>+ add trauma</GhostButton>
      </Section>

      <Section title={<><RouteIcon sx={{ fontSize: 12, marginRight: 4 }} />Character arc</>}>
        <p style={{ ...S.dim, marginBottom: 12 }}>
          Where they begin and where they end. The transformation the story puts them through.
        </p>
        <div style={S.grid2}>
          <Field label="Arc start — who they are" name="arcStart" control={control} placeholder="Closed off, convinced the world is cruel…" />
          <Field label="Arc end — who they become" name="arcEnd" control={control} placeholder="Capable of trust, grief without collapse…" />
        </div>
      </Section>

      <Section
        title={<><MedicalInformationIcon sx={{ fontSize: 12, marginRight: 4 }} />Conditions ({conditions.length})</>}
        action={<GhostButton onClick={addCond}>+ add</GhostButton>}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Current physical, mental, social, or spiritual states — wounds, curses, blessings, enhancements.
        </p>
        {conditions.map((cd: Condition, i: number) => (
          <ConditionBlock
            key={cd.id} control={control} index={i}
            color={cd.isActive ? "var(--color-orange)" : "var(--border)"}
            onDelete={() => delItem(cd.id)} events={events}
          />
        ))}
        {!conditions.length && <p style={S.dim}>No conditions yet.</p>}
      </Section>

      <Section title={<><EmojiEventsIcon sx={{ fontSize: 12, marginRight: 4 }} />Achievements & losses ({achievements.length + losses.length})</>}>
        <p style={{ ...S.dim, marginBottom: 14 }}>What they've gained and lost over the course of the story.</p>
        <p style={{ ...S.h2, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><EmojiEventsIcon sx={{ fontSize: 12 }} />Achievements</p>
        {achievements.map((a: Achievement, i: number) => (
          <AchievementBlock key={a.id} control={control} index={i} onDelete={() => delItem(a.id)} events={events} />
        ))}
        <GhostButton sx={{ marginBottom: 20 }} onClick={addAchieve}>+ add achievement</GhostButton>
        <hr style={S.rule} />
        <p style={{ ...S.h2, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><HeartBrokenIcon sx={{ fontSize: 12 }} />Losses</p>
        {losses.map((ls: Loss, i: number) => (
          <LossBlock key={ls.id} control={control} index={i} onDelete={() => delItem(ls.id)} events={events} />
        ))}
        <GhostButton onClick={addLoss}>+ add loss</GhostButton>
      </Section>
    </div>
  );
}

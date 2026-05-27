import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { worldStore } from "../store/worldStore";
import { useEvents } from "../hooks/useWorldStore";
import { S, mkTrauma, mkCond, mkAchieve, mkLoss } from "../lib/utils";
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

import type { Trauma, Condition, Achievement, Loss } from "../lib/types";

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

export default function CharacterPage() {
  const { id } = useParams();
  const events = useEvents();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const char = useSelector(() =>
    (worldStore.characters.get() as any[]).find((c) => c.id === id)?.get(),
  );
  const idx = useSelector(() =>
    worldStore.characters.get().findIndex((c) => c.id === id),
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const up = (f: string, v: any) =>
    (worldStore.characters[idx] as any)[f].set(v);
  const add = (field: string, mk: () => any) =>
    (worldStore.characters[idx] as any)[field].push(mk());
  const del = (field: string, delId: string) =>
    (worldStore.characters[idx] as any)[field].set((prev: any[]) =>
      prev.filter((x: any) => x.id !== delId),
    );
  const upIt = (field: string, delId: string, f: string, v: any) => {
    const arr = (worldStore.characters[idx] as any)[field].get();
    const i = arr.findIndex((x: any) => x.id === delId);
    if (i >= 0) (worldStore.characters[idx] as any)[field][i][f].set(v);
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const ref = useAnimateIn();

  return (
    <div ref={ref}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
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
          value={char.name}
          onChange={(e) => up("name", e.target.value)}
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

      {/* ── Status ── */}
      <Section title="Status">
        <CharStatusPanel char={char} events={events} />
        <p style={{ ...S.dim, marginTop: 4 }}>
          Derived from latest event appearance, active conditions, and equipped
          items.
        </p>
      </Section>

      {/* ── Identity ── */}
      <Section title="Identity">
        <div style={S.grid2}>
          <Field
            label="Role in story"
            value={char.role || ""}
            onChange={(v) => up("role", v)}
            placeholder="Protagonist, mentor…"
          />
          <Field
            label="Archetype"
            value={char.archetype || ""}
            onChange={(v) => up("archetype", v)}
            placeholder="The trickster…"
          />
        </div>
      </Section>

      {/* ── Psychological core ── */}
      <Section title="Psychological core">
        <Field
          label="Core wound"
          value={char.coreWound || ""}
          onChange={(v) => up("coreWound", v)}
          multi
          rows={2}
          placeholder="The formative trauma that shaped everything."
        />
        <div style={S.grid2}>
          <Field
            label="Core fear"
            value={char.coreFear || ""}
            onChange={(v) => up("coreFear", v)}
            placeholder="What they most dread."
          />
          <Field
            label="Core desire"
            value={char.coreDesire || ""}
            onChange={(v) => up("coreDesire", v)}
            placeholder="What they most want."
          />
        </div>
        <Field
          label="Philosophy / belief system"
          value={char.philosophy || ""}
          onChange={(v) => up("philosophy", v)}
          multi
          rows={2}
          placeholder="How they see the world."
        />
        <Field
          label="Secrets (always carried)"
          value={char.secrets || ""}
          onChange={(v) => up("secrets", v)}
          multi
          rows={2}
          placeholder="What they hide. How it shapes every word they say."
        />

        <hr style={S.rule} />
        <p style={{ ...S.h2, marginBottom: 8 }}>Traumas</p>
        {(char.traumas || []).map((t: Trauma) => (
          <EntryBlock
            key={t.id}
            color={char.color}
            onDelete={() => del("traumas", t.id)}
          >
            <div style={S.grid2}>
              <Field
                label="Trauma name"
                value={t.title || ""}
                onChange={(v) => upIt("traumas", t.id, "title", v)}
                placeholder="The abandonment…"
              />
              <Field
                label="When it happened"
                value={t.when || ""}
                onChange={(v) => upIt("traumas", t.id, "when", v)}
                placeholder="T2, age 12…"
              />
            </div>
            <Field
              label="What happened"
              value={t.description || ""}
              onChange={(v) => upIt("traumas", t.id, "description", v)}
              multi
              rows={2}
            />
            <div style={S.grid2}>
              <Field
                label="Triggered by"
                value={t.trigger || ""}
                onChange={(v) => upIt("traumas", t.id, "trigger", v)}
                placeholder="Loud voices, being abandoned…"
              />
              <Field
                label="Manifests as"
                value={t.manifestation || ""}
                onChange={(v) => upIt("traumas", t.id, "manifestation", v)}
                placeholder="Freezes, lashes out…"
              />
            </div>
          </EntryBlock>
        ))}
        <GhostButton onClick={() => add("traumas", mkTrauma)}>
          + add trauma
        </GhostButton>
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
            value={char.arcStart || ""}
            onChange={(v) => up("arcStart", v)}
            placeholder="Closed off, convinced the world is cruel…"
          />
          <Field
            label="Arc end — who they become"
            value={char.arcEnd || ""}
            onChange={(v) => up("arcEnd", v)}
            placeholder="Capable of trust, grief without collapse…"
          />
        </div>
      </Section>

      {/* ── Conditions ── */}
      <Section
        title={`Conditions (${(char.conditions || []).length})`}
        action={
          <GhostButton onClick={() => add("conditions", mkCond)}>
            + add
          </GhostButton>
        }
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Current physical, mental, social, or spiritual states — wounds,
          curses, blessings, enhancements.
        </p>
        {(char.conditions || []).map((cd: Condition) => (
          <EntryBlock
            key={cd.id}
            color={cd.isActive ? "var(--color-orange)" : "var(--border)"}
            onDelete={() => del("conditions", cd.id)}
          >
            <div style={S.grid3}>
              <Sel
                label="Type"
                value={cd.type || ""}
                onChange={(v) => upIt("conditions", cd.id, "type", v)}
                opts={COND_TYPES}
              />
              <Field
                label="Name"
                value={cd.name || ""}
                onChange={(v) => upIt("conditions", cd.id, "name", v)}
                placeholder="Cursed sight, broken ribs…"
              />
              <Toggle
                label="Currently active?"
                value={cd.isActive}
                onChange={(v) => upIt("conditions", cd.id, "isActive", v)}
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="At time (T#)"
                value={cd.atTime || ""}
                onChange={(v) => upIt("conditions", cd.id, "atTime", v)}
                placeholder="T3"
              />
              <EventPicker
                label="At event"
                value={cd.atEventId || ""}
                onChange={(v) => upIt("conditions", cd.id, "atEventId", v)}
                events={events}
              />
            </div>
            <Field
              label="Why / how they got it"
              value={cd.why || ""}
              onChange={(v) => upIt("conditions", cd.id, "why", v)}
              multi
              rows={2}
              placeholder="What caused this condition?"
            />
            <Field
              label="Description"
              value={cd.description || ""}
              onChange={(v) => upIt("conditions", cd.id, "description", v)}
              multi
              rows={2}
              placeholder="What does it feel like, look like?"
            />
            <Field
              label="Effects on the character"
              value={cd.effects || ""}
              onChange={(v) => upIt("conditions", cd.id, "effects", v)}
              multi
              rows={2}
              placeholder="What can they no longer do?"
            />
          </EntryBlock>
        ))}
        {!(char.conditions || []).length && (
          <p style={S.dim}>No conditions yet.</p>
        )}
      </Section>

      {/* ── Achievements & Losses ── */}
      <Section
        title={`Achievements & losses (${(char.achievements || []).length + (char.losses || []).length})`}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          What they've gained and lost over the course of the story.
        </p>

        <p style={{ ...S.h2, marginBottom: 8 }}>Achievements</p>
        {(char.achievements || []).map((a: Achievement) => (
          <EntryBlock
            key={a.id}
            color="var(--color-green)"
            onDelete={() => del("achievements", a.id)}
          >
            <div style={S.grid2}>
              <Field
                label="Title"
                value={a.title || ""}
                onChange={(v) => upIt("achievements", a.id, "title", v)}
                placeholder="Mastered the void step…"
              />
              <Field
                label="At time (T#)"
                value={a.atTime || ""}
                onChange={(v) => upIt("achievements", a.id, "atTime", v)}
                placeholder="T4"
              />
            </div>
            <EventPicker
              label="At event"
              value={a.atEventId || ""}
              onChange={(v) => upIt("achievements", a.id, "atEventId", v)}
              events={events}
            />
            <Field
              label="Description"
              value={a.description || ""}
              onChange={(v) => upIt("achievements", a.id, "description", v)}
              multi
              rows={2}
              placeholder="What happened. Why it matters."
            />
            <Field
              label="What they gained"
              value={a.gained || ""}
              onChange={(v) => upIt("achievements", a.id, "gained", v)}
              placeholder="Respect of the guild, a new power, a scar…"
            />
          </EntryBlock>
        ))}
        <GhostButton
          sx={{ marginBottom: 20 }}
          onClick={() => add("achievements", mkAchieve)}
        >
          + add achievement
        </GhostButton>

        <hr style={S.rule} />
        <p style={{ ...S.h2, marginBottom: 8 }}>Losses</p>
        {(char.losses || []).map((ls: Loss) => (
          <EntryBlock
            key={ls.id}
            color="var(--color-red)"
            onDelete={() => del("losses", ls.id)}
          >
            <div style={S.grid2}>
              <Field
                label="What was lost"
                value={ls.title || ""}
                onChange={(v) => upIt("losses", ls.id, "title", v)}
                placeholder="Their mentor, their right eye…"
              />
              <Field
                label="At time (T#)"
                value={ls.atTime || ""}
                onChange={(v) => upIt("losses", ls.id, "atTime", v)}
                placeholder="T6"
              />
            </div>
            <EventPicker
              label="At event"
              value={ls.atEventId || ""}
              onChange={(v) => upIt("losses", ls.id, "atEventId", v)}
              events={events}
            />
            <Field
              label="Description"
              value={ls.description || ""}
              onChange={(v) => upIt("losses", ls.id, "description", v)}
              multi
              rows={2}
              placeholder="How it happened. What it cost them emotionally."
            />
          </EntryBlock>
        ))}
        <GhostButton onClick={() => add("losses", mkLoss)}>
          + add loss
        </GhostButton>
      </Section>
    </div>
  );
}

import type { Character, Event } from "./types";
import type { Nation, Technique, Ingredient, Monster, Treasure } from "../store/appStore";

interface ExportState {
  title: string;
  synopsis: string;
  setting: string;
  themes: string;
  rules: string;
  nations: Nation[];
  techniques: Technique[];
  ingredients: Ingredient[];
  monsters: Monster[];
  treasures: Treasure[];
  events: Event[];
  characters: Character[];
}

export function buildExport(state: ExportState): string {
  const L: string[] = [];
  const ev = (id: string) => state.events.find((e) => e.id === id);
  const evLabel = (id: string) => {
    const e = ev(id);
    return e ? `[T${e.time}] ${e.title}` : "";
  };

  L.push(`WORLD: ${state.title}`);
  if (state.synopsis) L.push(`Synopsis: ${state.synopsis}`);
  if (state.setting) L.push(`Setting: ${state.setting}`);
  if (state.themes) L.push(`Themes: ${state.themes}`);
  if (state.rules) L.push(`Rules: ${state.rules}`);

  if ((state.nations || []).length) {
    L.push(`\n${"─".repeat(60)}\nNATIONS\n${"─".repeat(60)}`);
    for (const n of state.nations) {
      L.push(`\n${n.name.toUpperCase()}${n.type ? ` [${n.type}]` : ""}`);
      if (n.capital) L.push(`  Capital: ${n.capital}`);
      if (n.ruler) L.push(`  Ruler: ${n.ruler}`);
      if (n.population) L.push(`  Population: ${n.population}`);
      if (n.geography) L.push(`  Geography: ${n.geography}`);
      if (n.culture) L.push(`  Culture: ${n.culture}`);
      if (n.military) L.push(`  Military: ${n.military}`);
      if (n.economy) L.push(`  Economy: ${n.economy}`);
      if (n.connections?.length) {
        L.push(`  Connections:`);
        for (const conn of n.connections) {
           const other = state.nations.find((x) => x.id === conn.withNation);
           L.push(`    - ${other?.name || conn.withNation}: ${conn.relation}${conn.since ? ` (since ${conn.since})` : ""}${conn.notes ? ` — ${conn.notes}` : ""}`);
        }
      }
      if (n.allianceLogic) L.push(`  Diplomacy logic: ${n.allianceLogic}`);
      if (n.secrets) L.push(`  Secrets: ${n.secrets}`);
      if (n.lore) L.push(`  Lore: ${n.lore}`);
    }
  }

  if ((state.techniques || []).length) {
    L.push(`\n${"─".repeat(60)}\nTECHNIQUES\n${"─".repeat(60)}`);
    for (const t of state.techniques) {
      L.push(`\n${t.name.toUpperCase()}${t.type ? ` [${t.type}]` : ""}`);
      if (t.origin) L.push(`  Origin: ${t.origin}`);
      if (t.creator) L.push(`  Creator: ${t.creator}`);
      if (t.era) L.push(`  Era: ${t.era}`);
      if (t.description) L.push(`  Description: ${t.description}`);
      if (t.effect) L.push(`  Effect: ${t.effect}`);
      if (t.requirement) L.push(`  Requirement: ${t.requirement}`);
      if (t.cost) L.push(`  Cost: ${t.cost}`);
      if (t.secret) L.push(`  Secrets: ${t.secret}`);
      if (t.lore) L.push(`  Lore: ${t.lore}`);
    }
  }

  if ((state.ingredients || []).length) {
    L.push(`\n${"─".repeat(60)}\nINGREDIENTS & RESOURCES\n${"─".repeat(60)}`);
    for (const i of state.ingredients) {
      L.push(`\n${i.name.toUpperCase()}${i.rarity ? ` [${i.rarity}]` : ""}`);
      if (i.location) L.push(`  Found at: ${i.location}`);
      if (i.appearance) L.push(`  Appearance: ${i.appearance}`);
      if (i.properties) L.push(`  Properties: ${i.properties}`);
      if (i.uses) L.push(`  Uses: ${i.uses}`);
      if (i.danger) L.push(`  Danger: ${i.danger}`);
      if (i.lore) L.push(`  Lore: ${i.lore}`);
    }
  }

  if ((state.monsters || []).length) {
    L.push(`\n${"─".repeat(60)}\nMONSTERS\n${"─".repeat(60)}`);
    for (const m of state.monsters) {
      L.push(`\n${m.name.toUpperCase()}${m.tier ? ` [${m.tier}]` : ""}`);
      if (m.habitat) L.push(`  Habitat: ${m.habitat}`);
      if (m.appearance) L.push(`  Appearance: ${m.appearance}`);
      if (m.behavior) L.push(`  Behavior: ${m.behavior}`);
      if (m.abilities) L.push(`  Abilities: ${m.abilities}`);
      if (m.weaknesses) L.push(`  Weaknesses: ${m.weaknesses}`);
      if (m.drops) L.push(`  Drops: ${m.drops}`);
      if (m.firstSeen) L.push(`  First seen: ${m.firstSeen}`);
      if (m.lore) L.push(`  Lore: ${m.lore}`);
    }
  }

  if ((state.treasures || []).length) {
    L.push(`\n${"─".repeat(60)}\nTREASURES & ARTIFACTS\n${"─".repeat(60)}`);
    for (const tr of state.treasures) {
      L.push(`\n${tr.name.toUpperCase()}${tr.rarity ? ` [${tr.rarity}]` : ""}`);
      if (tr.location) L.push(`  Location: ${tr.location}`);
      if (tr.description) L.push(`  Description: ${tr.description}`);
      if (tr.stats) L.push(`  Stats: ${tr.stats}`);
      if (tr.curses) L.push(`  Curses: ${tr.curses}`);
      if (tr.unbindCondition) L.push(`  Unbind: ${tr.unbindCondition}`);
      if (tr.creator) L.push(`  Creator: ${tr.creator}`);
      if (tr.history) L.push(`  History: ${tr.history}`);
      if (tr.ingredients) L.push(`  Made from: ${tr.ingredients}`);
    }
  }

  L.push(`\n${"─".repeat(60)}\nCHARACTERS\n${"─".repeat(60)}`);
  for (const c of state.characters) {
    L.push(
      `\n${c.name.toUpperCase()}${c.role ? ` — ${c.role}` : ""}${c.archetype ? ` [${c.archetype}]` : ""}`,
    );
    if (c.coreWound) L.push(`  Wound:   ${c.coreWound}`);
    if (c.coreFear) L.push(`  Fear:    ${c.coreFear}`);
    if (c.coreDesire) L.push(`  Desire:  ${c.coreDesire}`);
    if (c.philosophy) L.push(`  Belief:  ${c.philosophy}`);
    if (c.secrets) L.push(`  Secrets: ${c.secrets}`);
    const arcTimeStr = [
      c.arcFromEventId ? `From: ${state.events.find((e) => e.id === c.arcFromEventId)?.title || "Unknown"}` : "",
      c.arcToEventId ? `To: ${state.events.find((e) => e.id === c.arcToEventId)?.title || "Unknown"}` : ""
    ].filter(Boolean).join(" | ");

    if (arcTimeStr) L.push(`  Arc Timeframe: ${arcTimeStr}`);
    if (c.arcType) L.push(`  Arc Type: ${c.arcType}`);
    if (c.arcLie) L.push(`  The Lie: ${c.arcLie}`);
    if (c.arcTruth) L.push(`  The Truth: ${c.arcTruth}`);
    if (c.arcBreakingPoint) L.push(`  Breaking Pt: ${c.arcBreakingPoint}`);
    if (c.arcStart || c.arcEnd) L.push(`  Arc Path: ${c.arcStart} → ${c.arcEnd}`);

    const timeline = (c.statusTimeline || []).sort(
      (a, b) => {
        const evA = state.events.find((e) => e.id === a.eventId);
        const evB = state.events.find((e) => e.id === b.eventId);
        return (evA?.time ?? 0) - (evB?.time ?? 0) || a.id.localeCompare(b.id);
      },
    );
    if (timeline.length) {
      L.push(`  ── Status Timeline ──`);
      for (const s of timeline) {
        const ev = state.events.find((e) => e.id === s.eventId);
        const dateTag = [s.startDate && s.startDate.replace("T", " "), s.endDate && `→ ${s.endDate.replace("T", " ")}`].filter(Boolean).join(" ");
        const label = ev ? `T${ev.time} — ${ev.title}` : "(no event)";
        L.push(`    ${label}${dateTag ? `  (${dateTag})` : ""}`);
        if (s.power) L.push(`      Power tier: ${s.power}`);
        if (s.arcStage) L.push(`      Arc stage: ${s.arcStage}`);
        if (s.role) L.push(`      Role: ${s.role}`);
        if (s.archetype) L.push(`      Archetype: ${s.archetype}`);
        if (s.emotionalState) L.push(`      Emotional state: ${s.emotionalState}`);
        if (s.physicalState) L.push(`      Physical state: ${s.physicalState}`);
        if (s.note) L.push(`      Note: ${s.note}`);
      }
    }

    if (c.traumas?.length) {
      L.push(`  Traumas:`);
      for (const t of c.traumas) {
        L.push(`    • ${t.title}${t.when ? ` (${t.when})` : ""}`);
        if (t.description) L.push(`      What: ${t.description}`);
        if (t.trigger) L.push(`      Trigger: ${t.trigger}`);
        if (t.manifestation) L.push(`      Manifests: ${t.manifestation}`);
      }
    }

    if (c.conditions?.length) {
      L.push(`  Conditions:`);
      for (const cd of c.conditions) {
        const eRef = evLabel(cd.atEventId);
        L.push(
          `    • [${cd.type}] ${cd.name}${cd.isActive ? " (active)" : " (resolved)"}${cd.atTime ? ` — T${cd.atTime}` : ""}${eRef ? ` ${eRef}` : ""}`,
        );
        if (cd.why) L.push(`      Why: ${cd.why}`);
        if (cd.description) L.push(`      Description: ${cd.description}`);
        if (cd.effects) L.push(`      Effects: ${cd.effects}`);
      }
    }

    if (c.achievements?.length) {
      L.push(`  Achievements:`);
      for (const a of c.achievements) {
        const eRef = evLabel(a.atEventId);
        L.push(
          `    ✓ ${a.title}${a.atTime ? ` — T${a.atTime}` : ""}${eRef ? ` ${eRef}` : ""}`,
        );
        if (a.description) L.push(`      ${a.description}`);
        if (a.gained) L.push(`      Gained: ${a.gained}`);
      }
    }

    if (c.losses?.length) {
      L.push(`  Losses:`);
      for (const ls of c.losses) {
        const eRef = evLabel(ls.atEventId);
        L.push(
          `    ✗ ${ls.title}${ls.atTime ? ` — T${ls.atTime}` : ""}${eRef ? ` ${eRef}` : ""}`,
        );
        if (ls.description) L.push(`      ${ls.description}`);
      }
    }

    if (c.skills?.length) {
      L.push(`  Skills:`);
      for (const sk of c.skills) {
        const eRef = evLabel(sk.atEventId);
        L.push(
          `    ◆ ${sk.name}${sk.atTime ? ` — acquired T${sk.atTime}` : ""}${eRef ? ` ${eRef}` : ""}`,
        );
        if (sk.howGained) L.push(`      How gained: ${sk.howGained}`);
        if (sk.source) L.push(`      Source: ${sk.source}`);
        if (sk.stats) L.push(`      Stats: ${sk.stats}`);
        if (sk.cost)
          L.push(
            `      Cost: ${sk.cost}${sk.costDescription ? ` — ${sk.costDescription}` : ""}`,
          );
        if (sk.uses)
          L.push(
            `      Uses: ${sk.uses}${sk.cooldown ? ` | Cooldown: ${sk.cooldown}` : ""}`,
          );
        if (sk.upside) L.push(`      Upside: ${sk.upside}`);
        if (sk.downside) L.push(`      Downside: ${sk.downside}`);
        if (sk.requirement) L.push(`      Requirement: ${sk.requirement}`);
        if (sk.appearance) L.push(`      Appearance change: ${sk.appearance}`);
        if (sk.attitude) L.push(`      Attitude change: ${sk.attitude}`);
        if (sk.notes) L.push(`      Notes: ${sk.notes}`);
      }
    }

    if (c.equipment?.length) {
      L.push(`  Equipment:`);
      for (const eq of c.equipment) {
        const eRef = evLabel(eq.atEventId);
        const acc = eq.accessState || "Equipped";
        L.push(
          `    ▣ [${eq.slot}] ${eq.name} (${acc.toLowerCase()})${eq.atTime ? ` — obtained T${eq.atTime}` : ""}${eRef ? ` ${eRef}` : ""}`,
        );
        if (eq.accessNote && acc !== "Equipped")
          L.push(`      Access note: ${eq.accessNote}`);
        if (eq.stats) L.push(`      Stats: ${eq.stats}`);
        if (eq.curses) L.push(`      Curses: ${eq.curses}`);
        if (eq.unbindCondition)
          L.push(`      Unbind condition: ${eq.unbindCondition}`);
        if (eq.uses) L.push(`      Uses: ${eq.uses}`);
        if (eq.creator) L.push(`      Creator: ${eq.creator}`);
        if (eq.createdWhy) L.push(`      Created for: ${eq.createdWhy}`);
        if (eq.ingredients) L.push(`      Ingredients: ${eq.ingredients}`);
        if (eq.lore) L.push(`      Lore: ${eq.lore}`);
      }
    }

    if (c.relationships?.length) {
      L.push(`  Relationships:`);
      for (const r of c.relationships) {
        const other = state.characters.find((x) => x.id === r.withId);
        if (!other) continue;
        L.push(
          `    → ${other.name}:${r.feel ? ` [${r.feel}]` : ""}`,
        );
        for (const t of r.timeline || []) {
          L.push(`      [T${t.time}] ${t.dynamic}`);
        }
      }
    }

    if (c.branch?.length) {
      L.push(`  Pre-story:`);
      for (const bev of [...c.branch].sort((a, b) => a.time - b.time)) {
        L.push(`    [T${bev.time}] ${bev.title} — ${bev.type}`);
        if (bev.description) L.push(`      ${bev.description}`);
        if (bev.impact) L.push(`      Impact: ${bev.impact}`);
        for (const cr of bev.crossings || []) {
          const other = state.characters.find((x) => x.id === cr.withId);
          if (other) L.push(`      ↔ Crosses ${other.name}: ${cr.note}`);
        }
      }
    }
  }

  L.push(`\n${"─".repeat(60)}\nMAIN TIMELINE\n${"─".repeat(60)}`);
  for (const ev of [...state.events].sort((a, b) => a.time - b.time)) {
    const dateTag = [ev.startDate && ev.startDate.replace("T", " "), ev.endDate && `→ ${ev.endDate.replace("T", " ")}`].filter(Boolean).join(" ");
    const chTag = (ev.chapters || []).length ? `Ch. ${ev.chapters.join(", ")}` : "";
    const tag = [chTag, dateTag]
      .filter(Boolean)
      .join(" · ");
    L.push(`\n[T${ev.time}${tag ? ` · ${tag}` : ""}] ${ev.title} — ${ev.type}`);
    if (ev.setting) L.push(`  Setting: ${ev.setting}`);
    if (ev.description) L.push(`  ${ev.description}`);
    if (ev.consequence) L.push(`  → ${ev.consequence}`);
    for (const cid of ev.characters || []) {
      const c = state.characters.find((x) => x.id === cid);
      if (!c) continue;
      const a = c.attributes?.[ev.id] || {};
      const parts: string[] = [];
      if (a.power) parts.push(`power: ${a.power}`);
      if (a.difficulty) parts.push(`vs: ${a.difficulty}`);
      if (a.arcStage) parts.push(`arc: ${a.arcStage}`);
      if (a.emotionalState) parts.push(`emotion: ${a.emotionalState}`);
      if (a.physicalState) parts.push(`physical: ${a.physicalState}`);
      if (parts.length) L.push(`  ${c.name} — ${parts.join(" · ")}`);
      if (a.sceneMotive) L.push(`    wants: ${a.sceneMotive}`);
      if (a.knowledge) L.push(`    knows: ${a.knowledge}`);
      if (a.beliefs) L.push(`    holds: ${a.beliefs}`);
      if (a.secret) L.push(`    hiding: ${a.secret}`);
      if (a.arcBefore) L.push(`    entering: ${a.arcBefore}`);
      if (a.arcAfter) L.push(`    leaving: ${a.arcAfter}`);
      if (a.traumaActive) L.push(`    trauma: ${a.traumaActive}`);
      if (a.notes) L.push(`    [AI] ${a.notes}`);
    }
  }

  L.push(`\n${"─".repeat(60)}\nAI GUIDANCE\n${"─".repeat(60)}`);
  L.push(
    `Honor: accumulated trauma · scene motive vs long-term desire · secrets that shape dialogue · relationship subtext · arc stage limits what they can do · conditions that distort perception · skill costs and when they'd pay them · equipment curses and how they manifest · world techniques and how they are rare or known · nation politics bleeding into character motivation`,
  );
  return L.join("\n");
}

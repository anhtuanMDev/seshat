import type { Character, Event, Equipment, Condition, EventAttributes } from "./types";
import { resolveEquipmentAt } from "./resolveEquipment";

export interface Note {
  label: string;
  value: string | undefined;
  pts: number;
  positive: boolean;
  neutral?: boolean;
}

export const SCORING_WEIGHTS = {
  POWER_MULTIPLIER: 3.0,
  SKILL_VALUE: 1.2,
  EQUIPMENT_VALUE: 1.0,
  CURSE_PENALTY: 0.6,
  ACHIEVEMENT_VALUE: 0.3,
  LOSS_PENALTY: 0.15,
  EMOTION: {
    NEGATIVE_SEVERE: -1.0,
    POSITIVE_CALM: 0.5,
    POSITIVE_AGGRESSIVE: 0.3,
  },
};

export const POWER_SCORE: Record<string, number> = {
  Latent: 1, Awakening: 2, Capable: 3, Skilled: 4,
  Elite: 5, Peak: 6, Transcendent: 7,
};
export const COND_PENALTY: Record<string, number> = {
  Physical: -1, Wounded: -1.5, Mental: -0.5, Cursed: -0.5,
  Spiritual: 0, Social: 0, Blessed: 1, Enhanced: 1,
};
export const ARC_MOD: Record<string, number> = {
  Unaware: 0, Questioning: 0.2, Resisting: 0.5,
  Breaking: 1, Transforming: 1.5, Integrated: 2,
};

export interface ScoreResult {
  score: number;
  notes: Note[];
  attr: EventAttributes;
  resolveEvent: Event | undefined;
}

export function scoreFighter(char: Character, events: Event[], atEventId?: string): ScoreResult {
  let score = 0;
  const notes: Note[] = [];

  const resolveEvent = atEventId
    ? events.find((e) => e.id === atEventId)
    : [...events]
        .sort((a, b) => b.time !== a.time ? b.time - a.time : a.id.localeCompare(b.id))
        .find((e) => (e.characters || []).includes(char.id));
  const attr = resolveEvent ? char.attributes?.[resolveEvent.id] || {} : {};

  const powerTier = attr.power || "";
  const powerBase = POWER_SCORE[powerTier] || 0;
  const powerPts = powerBase * SCORING_WEIGHTS.POWER_MULTIPLIER;
  if (powerPts) {
    score += powerPts;
    notes.push({ label: "Power tier", value: powerTier, pts: powerPts, positive: true });
  }

  const skills = char.skills || [];
  const skillPts = skills.length * SCORING_WEIGHTS.SKILL_VALUE;
  if (skillPts) {
    score += skillPts;
    notes.push({ label: "Skills", value: `${skills.length} known`, pts: Math.round(skillPts * 10) / 10, positive: true });
  }

  const activeStatusEntry = resolveEvent
    ? (char.statusTimeline || []).find((s) => s.eventId === resolveEvent.id)
    : undefined;
  const resolvedEquipment = resolveEquipmentAt(
    char.equipment || [],
    events,
    char.statusTimeline || [],
    activeStatusEntry?.id,
  );

  const equippedItems = resolvedEquipment.filter(
    (eq: Equipment) => (eq.accessState || "Equipped") === "Equipped",
  );
  const storedItems = resolvedEquipment.filter(
    (eq: Equipment) => (eq.accessState || "Equipped") === "Stored",
  );
  const noAccessItems = resolvedEquipment.filter(
    (eq: Equipment) => (eq.accessState || "Equipped") === "No Access",
  );
  const cursedEquipped = equippedItems.filter(
    (eq: Equipment) => eq.curses && eq.curses.trim(),
  );
  const equipPts = equippedItems.length * SCORING_WEIGHTS.EQUIPMENT_VALUE - cursedEquipped.length * SCORING_WEIGHTS.CURSE_PENALTY;
  if (equippedItems.length) {
    score += equipPts;
    notes.push({
      label: "Equipped items",
      value: `${equippedItems.length} on body${cursedEquipped.length ? `, ${cursedEquipped.length} cursed` : ""}`,
      pts: Math.round(equipPts * 10) / 10,
      positive: equipPts >= 0,
    });
  }
  if (noAccessItems.length)
    notes.push({ label: "No access items", value: `${noAccessItems.length} unavailable`, pts: 0, positive: false, neutral: true });
  if (storedItems.length)
    notes.push({ label: "Stored items", value: `${storedItems.length} not worn`, pts: 0, positive: false, neutral: true });

  const activeConditions = (char.conditions || []).filter(
    (cd: Condition) => cd.isActive,
  );
  for (const cd of activeConditions) {
    const pen = COND_PENALTY[cd.type] ?? 0;
    if (pen !== 0) {
      score += pen;
      notes.push({ label: `Condition: ${cd.name}`, value: `[${cd.type}]`, pts: pen, positive: pen > 0 });
    }
  }

  const achievePts = (char.achievements || []).length * SCORING_WEIGHTS.ACHIEVEMENT_VALUE;
  const lossPts = (char.losses || []).length * -SCORING_WEIGHTS.LOSS_PENALTY;
  if (achievePts) {
    score += achievePts;
    notes.push({ label: "Achievements", value: `${char.achievements!.length}`, pts: Math.round(achievePts * 10) / 10, positive: true });
  }
  if (lossPts) {
    score += lossPts;
    notes.push({ label: "Losses", value: `${char.losses!.length}`, pts: Math.round(lossPts * 10) / 10, positive: false });
  }

  const arcMod = (attr.arcStage ? ARC_MOD[attr.arcStage] : undefined) ?? 0;
  if (arcMod) {
    score += arcMod;
    notes.push({ label: "Arc stage", value: attr.arcStage, pts: arcMod, positive: true });
  }

  let emoScore = 0;
  const emo = (attr.emotionalState || "").toLowerCase();
  if (emo.includes("grief") || emo.includes("broken") || emo.includes("despair")) {
    emoScore += SCORING_WEIGHTS.EMOTION.NEGATIVE_SEVERE;
  } else if (emo.includes("resolute") || emo.includes("focused") || emo.includes("calm")) {
    emoScore += SCORING_WEIGHTS.EMOTION.POSITIVE_CALM;
  } else if (emo.includes("rage") || emo.includes("fury")) {
    emoScore += SCORING_WEIGHTS.EMOTION.POSITIVE_AGGRESSIVE;
  }

  if (emoScore !== 0) {
    score += emoScore;
    notes.push({ label: "Emotional state", value: attr.emotionalState, pts: Math.round(emoScore * 10) / 10, positive: emoScore > 0 });
  }

  return { score: Math.max(0.1, score), notes, attr, resolveEvent };
}

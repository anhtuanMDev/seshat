export type Theme = "light" | "dark";

export type CondType =
  | "Physical"
  | "Mental"
  | "Social"
  | "Spiritual"
  | "Cursed"
  | "Blessed"
  | "Wounded"
  | "Enhanced";
export type EquipSlot =
  | "Weapon"
  | "Offhand"
  | "Armor"
  | "Helmet"
  | "Boots"
  | "Gloves"
  | "Accessory"
  | "Relic"
  | "Mount"
  | "Other";
export type TechType =
  | "Blacksmithing"
  | "Martial Art"
  | "Technology"
  | "Biology"
  | "Alchemy"
  | "Runic"
  | "Forbidden"
  | "Other";
export type MonsterTier =
  | "Minion"
  | "Common"
  | "Elite"
  | "Champion"
  | "Boss"
  | "Legendary"
  | "World-Threat";
export type NationType =
  | "Kingdom"
  | "Empire"
  | "Tribe"
  | "Republic"
  | "Theocracy"
  | "Nomadic"
  | "Hidden"
  | "Ruin";
export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Unique"
  | "Mythic";
export type EquipAccess = "Equipped" | "Stored" | "No Access";
export type EventType =
  | "Story"
  | "Trauma"
  | "Revelation"
  | "Conflict"
  | "Bond"
  | "Loss"
  | "Growth"
  | "Mystery";
export type PowerTier =
  | "Latent"
  | "Awakening"
  | "Capable"
  | "Skilled"
  | "Elite"
  | "Peak"
  | "Transcendent";
export type Difficulty =
  | "Trivial"
  | "Minor"
  | "Moderate"
  | "Significant"
  | "Severe"
  | "Catastrophic";
export type ArcStage =
  | "Unaware"
  | "Questioning"
  | "Resisting"
  | "Breaking"
  | "Transforming"
  | "Integrated";

export interface StatusEntry {
  id: string;
  eventId: string;
  startDate: string;
  endDate: string;
  power: string;
  arcStage: string;
  role?: string;
  archetype?: string;
  emotionalState: string;
  physicalState: string;
  note: string;
}

export interface Character {
  id: string;
  name: string;
  color: string;
  role: string;
  archetype: string;
  coreWound: string;
  coreFear: string;
  coreDesire: string;
  philosophy: string;
  secrets: string;
  arcStart: string;
  arcType?: string;
  arcLie?: string;
  arcTruth?: string;
  arcBreakingPoint?: string;
  arcFromEventId?: string;
  arcToEventId?: string;
  arcEnd: string;
  statusTimeline: StatusEntry[];
  traumas: Trauma[];
  relationships: Relationship[];
  branch: Branch[];
  attributes: Record<string, EventAttributes>;
  conditions: Condition[];
  skills: Skill[];
  equipment: Equipment[];
  achievements: Achievement[];
  losses: Loss[];
}

export interface NationConnection {
  id: string;
  withNation: string;
  relation: string;
  since: string;
  until: string;
  notes: string;
}

export interface Event {
  id: string;
  time: number;
  title: string;
  type: EventType;
  chapters: string[];
  startDate: string;
  endDate: string;
  setting: string;
  description: string;
  consequence: string;
  characters: string[];
  subplot?: string;
}

export interface EventAttributes {
  power?: string;
  difficulty?: string;
  arcStage?: string;
  emotionalState?: string;
  physicalState?: string;
  sceneMotive?: string;
  knowledge?: string;
  beliefs?: string;
  secret?: string;
  traumaActive?: string;
  notes?: string;
  arcBefore?: string;
  arcAfter?: string;
}

export interface Trauma {
  id: string;
  title: string;
  when: string;
  description: string;
  trigger: string;
  manifestation: string;
}

export interface RelTimelineEntry {
  id: string;
  time: number;
  dynamic: string;
}

export interface Relationship {
  id: string;
  withId: string;
  feel: string;
  timeline: RelTimelineEntry[];
}

export interface Branch {
  id: string;
  time: number;
  title: string;
  type: EventType;
  description: string;
  impact: string;
  crossings: Crossing[];
}

export interface Crossing {
  withId: string;
  note: string;
}

export interface Condition {
  id: string;
  type: CondType;
  name: string;
  atTime: string;
  atEventId: string;
  why: string;
  description: string;
  effects: string;
  isActive: boolean;
}

export interface Skill {
  id: string;
  name: string;
  atTime: string;
  atEventId: string;
  howGained: string;
  source: string;
  appearance: string;
  attitude: string;
  stats: string;
  cost: string;
  costDescription: string;
  uses: string;
  cooldown: string;
  upside: string;
  downside: string;
  requirement: string;
  notes: string;
}

export interface Equipment {
  id: string;
  slot: EquipSlot;
  name: string;
  atTime: string;
  atEventId: string;
  stats: string;
  curses: string;
  unbindCondition: string;
  uses: string;
  creator: string;
  createdWhy: string;
  ingredients: string;
  lore: string;
  accessState: EquipAccess;
  accessNote: string;
}

export interface Achievement {
  id: string;
  title: string;
  atTime: string;
  atEventId: string;
  description: string;
  gained: string;
}

export interface Loss {
  id: string;
  title: string;
  atTime: string;
  atEventId: string;
  description: string;
}

export interface Nation {
  id: string;
  name: string;
  type: NationType;
  capital: string;
  ruler: string;
  population: string;
  geography: string;
  culture: string;
  military: string;
  economy: string;
  periodActive: string;
  connections: NationConnection[];
  allianceLogic: string;
  secrets: string;
  lore: string;
}

export interface Monster {
  id: string;
  name: string;
  tier: MonsterTier;
  habitat: string;
  appearance: string;
  abilities: string;
  weaknesses: string;
  drops: string;
  lore: string;
  behavior: string;
  firstSeen: string;
}

export interface Technique {
  id: string;
  name: string;
  type: TechType;
  origin: string;
  creator: string;
  era: string;
  description: string;
  effect: string;
  requirement: string;
  cost: string;
  secret: string;
  lore: string;
}

export interface Ingredient {
  id: string;
  name: string;
  rarity: Rarity;
  location: string;
  appearance: string;
  properties: string;
  uses: string;
  danger: string;
  lore: string;
}

export interface BookData {
  id: string;
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
  chapters: Chapter[];
  foreshadows: Foreshadow[];
}

export interface SceneCard {
  id: string;
  title: string;
  pov: string;
  goal: string;
  conflict: string;
  outcome: string;
}

export interface Draft {
  id: string;
  name: string;
  body: string;
  createdAt: number;
}

export interface Foreshadow {
  id: string;
  plantChapterId: string;
  payoffChapterId: string;
  description: string;
  status: "Planted" | "Payoffed" | "Abandoned";
}

export interface Chapter {
  id: string;
  number: string;
  title: string;
  timeRef: string;
  synopsis: string;
  body: string;
  notes: string;
  order: number;
  pinnedChars?: string[];
  pinnedEventIds?: string[];
  scenes?: SceneCard[];
  drafts?: Draft[];
}

export interface Treasure {
  id: string;
  name: string;
  rarity: Rarity;
  location: string;
  description: string;
  stats: string;
  curses: string;
  unbindCondition: string;
  creator: string;
  history: string;
  ingredients: string;
}

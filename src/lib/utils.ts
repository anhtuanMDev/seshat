export { CHAR_COLORS, EVENT_TYPES, POWER_TIERS, DIFFICULTY, ARC_STAGES, COND_TYPES, EQUIP_SLOTS, TECH_TYPES, MON_TIERS, NAT_TYPES, RARITY, EQUIP_ACCESS } from './constants';

export const uid = () => Math.random().toString(36).slice(2, 8);

export const mkChar = (n: string, color: string) => ({
  id: uid(), name: n, color,
  role: "", archetype: "", coreWound: "", coreFear: "", coreDesire: "", philosophy: "",
  secrets: "", arcStart: "", arcEnd: "",
  traumas: [], relationships: [], branch: [], attributes: {},
  conditions: [], skills: [], equipment: [], achievements: [], losses: [],
});

export const mkEvent = () => ({ id: uid(), time: 1, title: "Untitled event", type: "Story", chapter: "", date: "", description: "", consequence: "", setting: "", characters: [] });
export const mkBranch = () => ({ id: uid(), time: 1, title: "", type: "Story", description: "", impact: "", crossings: [] });
export const mkTrauma = () => ({ id: uid(), title: "", when: "", description: "", trigger: "", manifestation: "" });
export const mkRel = () => ({ id: uid(), withId: "", dynamic: "", feel: "", history: "" });
export const mkCond = () => ({ id: uid(), type: "Physical", name: "", atTime: "", atEventId: "", why: "", description: "", effects: "", isActive: true });
export const mkSkill = () => ({ id: uid(), name: "", atTime: "", atEventId: "", howGained: "", source: "", appearance: "", attitude: "", stats: "", cost: "", costDescription: "", uses: "∞", cooldown: "", upside: "", downside: "", requirement: "", notes: "" });
export const mkEquip = () => ({ id: uid(), slot: "Weapon", name: "", atTime: "", atEventId: "", stats: "", curses: "", unbindCondition: "", uses: "∞", creator: "", createdWhy: "", ingredients: "", lore: "", accessState: "Equipped", accessNote: "" });
export const mkAchieve = () => ({ id: uid(), title: "", atTime: "", atEventId: "", description: "", gained: "" });
export const mkLoss = () => ({ id: uid(), title: "", atTime: "", atEventId: "", description: "" });

export const mkNation = () => ({ id: uid(), name: "", type: "Kingdom", capital: "", ruler: "", population: "", geography: "", culture: "", military: "", economy: "", allies: "", enemies: "", secrets: "", lore: "" });
export const mkMonster = () => ({ id: uid(), name: "", tier: "Minion", habitat: "", appearance: "", abilities: "", weaknesses: "", drops: "", lore: "", behavior: "", firstSeen: "" });
export const mkTechnique = () => ({ id: uid(), name: "", type: "Blacksmithing", origin: "", creator: "", era: "", description: "", effect: "", requirement: "", cost: "", secret: "", lore: "" });
export const mkIngredient = () => ({ id: uid(), name: "", rarity: "Uncommon", location: "", appearance: "", properties: "", uses: "", danger: "", lore: "" });
export const mkTreasure = () => ({ id: uid(), name: "", rarity: "Rare", location: "", description: "", stats: "", curses: "", unbindCondition: "", creator: "", history: "", ingredients: "" });

const S: Record<string, any> = {
   app:     { display:"flex", flexDirection:"column", height:"100vh", fontFamily:"'Georgia',serif", background:"#faf9f7", color:"#1a1a1a" },
   row:     { display:"flex", flex:1, overflow:"hidden" },
   top:     { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:48, borderBottom:"1px solid #e0ddd8", flexShrink:0 },
   logo:    { fontSize:13, letterSpacing:4, textTransform:"uppercase", color:"#444" },
   side:    { width:224, borderRight:"1px solid #e0ddd8", overflowY:"auto", padding:"20px 0", flexShrink:0 },
   main:    { flex:1, overflowY:"auto", padding:"32px 44px" },
   h2:      { fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"#444", margin:"0 0 14px", fontWeight:400 },
   dim:     { color:"#444", fontSize:12 },
   label:   { display:"block", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"#444", marginBottom:4 },
   select:  { width:"100%", fontSize:13, padding:"4px 0", border:"none", outline:"none", background:"transparent" },
   pill:    { fontSize:11, padding:"4px 10px", borderRadius:4, border:"1px solid #ccc", background:"transparent", cursor:"pointer" },
   grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" },
   grid3:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 24px" },
   grid4:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"0 20px" },
   input:   { fontSize:14, padding:"4px 0", border:"none", outline:"none", background:"transparent", width:"100%" },
   ghost:   { background:"transparent", border:"none", outline:"none", fontSize:14, cursor:"pointer", padding:"2px 0", whiteSpace:"nowrap" },
   textarea:{ fontFamily:"'Georgia',serif", fontSize:14, padding:"8px 10px", border:"1px solid #bbb", borderRadius:4, outline:"none", width:"100%", background:"transparent", resize:"vertical" },
};

export { S };
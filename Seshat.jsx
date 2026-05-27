import { useState } from "react";

const uid = () => Math.random().toString(36).slice(2, 8);

const CHAR_COLORS = ["#c0392b","#2980b9","#27ae60","#8e44ad","#e67e22","#16a085","#d35400","#2c3e50"];
const EVENT_TYPES = ["Story","Trauma","Revelation","Conflict","Bond","Loss","Growth","Mystery"];
const POWER_TIERS = ["Latent","Awakening","Capable","Skilled","Elite","Peak","Transcendent"];
const DIFFICULTY  = ["Trivial","Minor","Moderate","Significant","Severe","Catastrophic"];
const ARC_STAGES  = ["Unaware","Questioning","Resisting","Breaking","Transforming","Integrated"];
const COND_TYPES  = ["Physical","Mental","Social","Spiritual","Cursed","Blessed","Wounded","Enhanced"];
const EQUIP_SLOTS = ["Weapon","Offhand","Armor","Helmet","Boots","Gloves","Accessory","Relic","Mount","Other"];
const TECH_TYPES  = ["Blacksmithing","Martial Art","Technology","Biology","Alchemy","Runic","Forbidden","Other"];
const MON_TIERS   = ["Minion","Common","Elite","Champion","Boss","Legendary","World-Threat"];
const NAT_TYPES   = ["Kingdom","Empire","Tribe","Republic","Theocracy","Nomadic","Hidden","Ruin"];
const RARITY      = ["Common","Uncommon","Rare","Epic","Legendary","Unique","Mythic"];

// ── makers ────────────────────────────────────────────────────────────────────
const mkChar = (n, color) => ({
  id:uid(), name:n, color,
  role:"", archetype:"", coreWound:"", coreFear:"", coreDesire:"", philosophy:"",
  secrets:"", arcStart:"", arcEnd:"",
  traumas:[], relationships:[], branch:[], attributes:{},
  conditions:[],
  skills:[],
  equipment:[],
  achievements:[],
  losses:[],
});

const mkEvent     = () => ({ id:uid(), time:1, title:"Untitled event", type:"Story", chapter:"", date:"", description:"", consequence:"", setting:"", characters:[] });
const mkBranch    = () => ({ id:uid(), time:1, title:"", type:"Story", description:"", impact:"", crossings:[] });
const mkTrauma    = () => ({ id:uid(), title:"", when:"", description:"", trigger:"", manifestation:"" });
const mkRel       = () => ({ id:uid(), withId:"", dynamic:"", feel:"", history:"" });
const mkCond      = () => ({ id:uid(), type:"Physical", name:"", atTime:"", atEventId:"", why:"", description:"", effects:"", isActive:true });
const mkSkill     = () => ({ id:uid(), name:"", atTime:"", atEventId:"", howGained:"", source:"", appearance:"", attitude:"", stats:"", cost:"", costDescription:"", uses:"∞", cooldown:"", upside:"", downside:"", requirement:"", notes:"" });
const mkEquip     = () => ({ id:uid(), slot:"Weapon", name:"", atTime:"", atEventId:"", stats:"", curses:"", unbindCondition:"", uses:"∞", creator:"", createdWhy:"", ingredients:"", lore:"", accessState:"Equipped", accessNote:"" });
const EQUIP_ACCESS = ["Equipped","Stored","No Access"];
const mkAchieve   = () => ({ id:uid(), title:"", atTime:"", atEventId:"", description:"", gained:"" });
const mkLoss      = () => ({ id:uid(), title:"", atTime:"", atEventId:"", description:"" });

// world entities
const mkNation    = () => ({ id:uid(), name:"", type:"Kingdom", capital:"", ruler:"", population:"", geography:"", culture:"", military:"", economy:"", allies:"", enemies:"", secrets:"", lore:"" });
const mkMonster   = () => ({ id:uid(), name:"", tier:MON_TIERS[0], habitat:"", appearance:"", abilities:"", weaknesses:"", drops:"", lore:"", behavior:"", firstSeen:"" });
const mkTechnique = () => ({ id:uid(), name:"", type:TECH_TYPES[0], origin:"", creator:"", era:"", description:"", effect:"", requirement:"", cost:"", secret:"", lore:"" });
const mkIngredient= () => ({ id:uid(), name:"", rarity:RARITY[0], location:"", appearance:"", properties:"", uses:"", danger:"", lore:"" });
const mkTreasure  = () => ({ id:uid(), name:"", rarity:RARITY[2], location:"", description:"", stats:"", curses:"", unbindCondition:"", creator:"", history:"", ingredients:"" });

// ── export ────────────────────────────────────────────────────────────────────
function buildExport(state) {
  const L = [];
  const ev = id => state.events.find(e=>e.id===id);
  const evLabel = id => { const e=ev(id); return e ? `[T${e.time}] ${e.title}` : ""; };

  L.push(`WORLD: ${state.title}`);
  if (state.synopsis) L.push(`Synopsis: ${state.synopsis}`);
  if (state.setting)  L.push(`Setting: ${state.setting}`);
  if (state.themes)   L.push(`Themes: ${state.themes}`);
  if (state.rules)    L.push(`Rules: ${state.rules}`);

  // Nations
  if ((state.nations||[]).length) {
    L.push(`\n${"─".repeat(60)}\nNATIONS\n${"─".repeat(60)}`);
    for (const n of state.nations) {
      L.push(`\n${n.name.toUpperCase()}${n.type?` [${n.type}]`:""}`);
      if (n.capital)    L.push(`  Capital: ${n.capital}`);
      if (n.ruler)      L.push(`  Ruler: ${n.ruler}`);
      if (n.population) L.push(`  Population: ${n.population}`);
      if (n.geography)  L.push(`  Geography: ${n.geography}`);
      if (n.culture)    L.push(`  Culture: ${n.culture}`);
      if (n.military)   L.push(`  Military: ${n.military}`);
      if (n.economy)    L.push(`  Economy: ${n.economy}`);
      if (n.allies)     L.push(`  Allies: ${n.allies}`);
      if (n.enemies)    L.push(`  Enemies: ${n.enemies}`);
      if (n.secrets)    L.push(`  Secrets: ${n.secrets}`);
      if (n.lore)       L.push(`  Lore: ${n.lore}`);
    }
  }

  // Techniques
  if ((state.techniques||[]).length) {
    L.push(`\n${"─".repeat(60)}\nTECHNIQUES\n${"─".repeat(60)}`);
    for (const t of state.techniques) {
      L.push(`\n${t.name.toUpperCase()}${t.type?` [${t.type}]`:""}`);
      if (t.origin)      L.push(`  Origin: ${t.origin}`);
      if (t.creator)     L.push(`  Creator: ${t.creator}`);
      if (t.era)         L.push(`  Era: ${t.era}`);
      if (t.description) L.push(`  Description: ${t.description}`);
      if (t.effect)      L.push(`  Effect: ${t.effect}`);
      if (t.requirement) L.push(`  Requirement: ${t.requirement}`);
      if (t.cost)        L.push(`  Cost: ${t.cost}`);
      if (t.secret)      L.push(`  Secrets: ${t.secret}`);
      if (t.lore)        L.push(`  Lore: ${t.lore}`);
    }
  }

  // Ingredients/Resources
  if ((state.ingredients||[]).length) {
    L.push(`\n${"─".repeat(60)}\nINGREDIENTS & RESOURCES\n${"─".repeat(60)}`);
    for (const i of state.ingredients) {
      L.push(`\n${i.name.toUpperCase()}${i.rarity?` [${i.rarity}]`:""}`);
      if (i.location)   L.push(`  Found at: ${i.location}`);
      if (i.appearance) L.push(`  Appearance: ${i.appearance}`);
      if (i.properties) L.push(`  Properties: ${i.properties}`);
      if (i.uses)       L.push(`  Uses: ${i.uses}`);
      if (i.danger)     L.push(`  Danger: ${i.danger}`);
      if (i.lore)       L.push(`  Lore: ${i.lore}`);
    }
  }

  // Monsters
  if ((state.monsters||[]).length) {
    L.push(`\n${"─".repeat(60)}\nMONSTERS\n${"─".repeat(60)}`);
    for (const m of state.monsters) {
      L.push(`\n${m.name.toUpperCase()}${m.tier?` [${m.tier}]`:""}`);
      if (m.habitat)    L.push(`  Habitat: ${m.habitat}`);
      if (m.appearance) L.push(`  Appearance: ${m.appearance}`);
      if (m.behavior)   L.push(`  Behavior: ${m.behavior}`);
      if (m.abilities)  L.push(`  Abilities: ${m.abilities}`);
      if (m.weaknesses) L.push(`  Weaknesses: ${m.weaknesses}`);
      if (m.drops)      L.push(`  Drops: ${m.drops}`);
      if (m.firstSeen)  L.push(`  First seen: ${m.firstSeen}`);
      if (m.lore)       L.push(`  Lore: ${m.lore}`);
    }
  }

  // Treasures
  if ((state.treasures||[]).length) {
    L.push(`\n${"─".repeat(60)}\nTREASURES & ARTIFACTS\n${"─".repeat(60)}`);
    for (const tr of state.treasures) {
      L.push(`\n${tr.name.toUpperCase()}${tr.rarity?` [${tr.rarity}]`:""}`);
      if (tr.location)        L.push(`  Location: ${tr.location}`);
      if (tr.description)     L.push(`  Description: ${tr.description}`);
      if (tr.stats)           L.push(`  Stats: ${tr.stats}`);
      if (tr.curses)          L.push(`  Curses: ${tr.curses}`);
      if (tr.unbindCondition) L.push(`  Unbind: ${tr.unbindCondition}`);
      if (tr.creator)         L.push(`  Creator: ${tr.creator}`);
      if (tr.history)         L.push(`  History: ${tr.history}`);
      if (tr.ingredients)     L.push(`  Made from: ${tr.ingredients}`);
    }
  }

  L.push(`\n${"─".repeat(60)}\nCHARACTERS\n${"─".repeat(60)}`);
  for (const c of state.characters) {
    L.push(`\n${c.name.toUpperCase()}${c.role?` — ${c.role}`:""}${c.archetype?` [${c.archetype}]`:""}`);
    if (c.coreWound)  L.push(`  Wound:   ${c.coreWound}`);
    if (c.coreFear)   L.push(`  Fear:    ${c.coreFear}`);
    if (c.coreDesire) L.push(`  Desire:  ${c.coreDesire}`);
    if (c.philosophy) L.push(`  Belief:  ${c.philosophy}`);
    if (c.secrets)    L.push(`  Secrets: ${c.secrets}`);
    if (c.arcStart||c.arcEnd) L.push(`  Arc: ${c.arcStart} → ${c.arcEnd}`);

    // Current status snapshot
    const activeConditions = (c.conditions||[]).filter(cd=>cd.isActive);
    const latestEvent = [...state.events].sort((a,b)=>b.time-a.time).find(e=>(e.characters||[]).includes(c.id));
    const currentAttr = latestEvent ? (c.attributes?.[latestEvent.id]||{}) : {};
    if (latestEvent || activeConditions.length) {
      L.push(`  ── Current Status ──`);
      if (latestEvent) {
        if (currentAttr.power)    L.push(`    Power tier: ${currentAttr.power}`);
        if (currentAttr.arcStage) L.push(`    Arc stage: ${currentAttr.arcStage}`);
        if (currentAttr.emotionalState) L.push(`    Emotional state: ${currentAttr.emotionalState}`);
        if (currentAttr.physicalState)  L.push(`    Physical state: ${currentAttr.physicalState}`);
      }
      if (activeConditions.length) {
        L.push(`    Active conditions: ${activeConditions.map(cd=>`${cd.name} (${cd.type})`).join(", ")}`);
      }
    }

    if (c.traumas?.length) {
      L.push(`  Traumas:`);
      for (const t of c.traumas) {
        L.push(`    • ${t.title}${t.when?` (${t.when})`:""}`);
        if (t.description)   L.push(`      What: ${t.description}`);
        if (t.trigger)       L.push(`      Trigger: ${t.trigger}`);
        if (t.manifestation) L.push(`      Manifests: ${t.manifestation}`);
      }
    }

    if (c.conditions?.length) {
      L.push(`  Conditions:`);
      for (const cd of c.conditions) {
        const eRef = evLabel(cd.atEventId);
        L.push(`    • [${cd.type}] ${cd.name}${cd.isActive?" (active)":" (resolved)"}${cd.atTime?` — T${cd.atTime}`:""}${eRef?` ${eRef}`:""}`);
        if (cd.why)         L.push(`      Why: ${cd.why}`);
        if (cd.description) L.push(`      Description: ${cd.description}`);
        if (cd.effects)     L.push(`      Effects: ${cd.effects}`);
      }
    }

    if (c.achievements?.length) {
      L.push(`  Achievements:`);
      for (const a of c.achievements) {
        const eRef = evLabel(a.atEventId);
        L.push(`    ✓ ${a.title}${a.atTime?` — T${a.atTime}`:""}${eRef?` ${eRef}`:""}`);
        if (a.description) L.push(`      ${a.description}`);
        if (a.gained)      L.push(`      Gained: ${a.gained}`);
      }
    }

    if (c.losses?.length) {
      L.push(`  Losses:`);
      for (const ls of c.losses) {
        const eRef = evLabel(ls.atEventId);
        L.push(`    ✗ ${ls.title}${ls.atTime?` — T${ls.atTime}`:""}${eRef?` ${eRef}`:""}`);
        if (ls.description) L.push(`      ${ls.description}`);
      }
    }

    if (c.skills?.length) {
      L.push(`  Skills:`);
      for (const sk of c.skills) {
        const eRef = evLabel(sk.atEventId);
        L.push(`    ◆ ${sk.name}${sk.atTime?` — acquired T${sk.atTime}`:""}${eRef?` ${eRef}`:""}`);
        if (sk.howGained)    L.push(`      How gained: ${sk.howGained}`);
        if (sk.source)       L.push(`      Source: ${sk.source}`);
        if (sk.stats)        L.push(`      Stats: ${sk.stats}`);
        if (sk.cost)         L.push(`      Cost: ${sk.cost}${sk.costDescription?` — ${sk.costDescription}`:""}`);
        if (sk.uses)         L.push(`      Uses: ${sk.uses}${sk.cooldown?` | Cooldown: ${sk.cooldown}`:""}`);
        if (sk.upside)       L.push(`      Upside: ${sk.upside}`);
        if (sk.downside)     L.push(`      Downside: ${sk.downside}`);
        if (sk.requirement)  L.push(`      Requirement: ${sk.requirement}`);
        if (sk.appearance)   L.push(`      Appearance change: ${sk.appearance}`);
        if (sk.attitude)     L.push(`      Attitude change: ${sk.attitude}`);
        if (sk.notes)        L.push(`      Notes: ${sk.notes}`);
      }
    }

    if (c.equipment?.length) {
      L.push(`  Equipment:`);
      for (const eq of c.equipment) {
        const eRef = evLabel(eq.atEventId);
        const acc = eq.accessState||"Equipped";
        L.push(`    ▣ [${eq.slot}] ${eq.name} (${acc.toLowerCase()})${eq.atTime?` — obtained T${eq.atTime}`:""}${eRef?` ${eRef}`:""}`);
        if (eq.accessNote && acc!=="Equipped") L.push(`      Access note: ${eq.accessNote}`);
        if (eq.stats)           L.push(`      Stats: ${eq.stats}`);
        if (eq.curses)          L.push(`      Curses: ${eq.curses}`);
        if (eq.unbindCondition) L.push(`      Unbind condition: ${eq.unbindCondition}`);
        if (eq.uses)            L.push(`      Uses: ${eq.uses}`);
        if (eq.creator)         L.push(`      Creator: ${eq.creator}`);
        if (eq.createdWhy)      L.push(`      Created for: ${eq.createdWhy}`);
        if (eq.ingredients)     L.push(`      Ingredients: ${eq.ingredients}`);
        if (eq.lore)            L.push(`      Lore: ${eq.lore}`);
      }
    }

    if (c.relationships?.length) {
      L.push(`  Relationships:`);
      for (const r of c.relationships) {
        const other = state.characters.find(x=>x.id===r.withId);
        if (!other) continue;
        L.push(`    → ${other.name}: ${r.dynamic}${r.feel?` | ${r.feel}`:""}${r.history?` | ${r.history}`:""}`);
      }
    }

    if (c.branch?.length) {
      L.push(`  Pre-story:`);
      for (const bev of [...c.branch].sort((a,b)=>a.time-b.time)) {
        L.push(`    [T${bev.time}] ${bev.title} — ${bev.type}`);
        if (bev.description) L.push(`      ${bev.description}`);
        if (bev.impact)      L.push(`      Impact: ${bev.impact}`);
        for (const cr of (bev.crossings||[])) {
          const other = state.characters.find(x=>x.id===cr.withId);
          if (other) L.push(`      ↔ Crosses ${other.name}: ${cr.note}`);
        }
      }
    }
  }

  L.push(`\n${"─".repeat(60)}\nMAIN TIMELINE\n${"─".repeat(60)}`);
  for (const ev of [...state.events].sort((a,b)=>a.time-b.time)) {
    const tag = [ev.chapter&&`Ch. ${ev.chapter}`, ev.date].filter(Boolean).join(" · ");
    L.push(`\n[T${ev.time}${tag?` · ${tag}`:""}] ${ev.title} — ${ev.type}`);
    if (ev.setting)     L.push(`  Setting: ${ev.setting}`);
    if (ev.description) L.push(`  ${ev.description}`);
    if (ev.consequence) L.push(`  → ${ev.consequence}`);
    for (const cid of (ev.characters||[])) {
      const c = state.characters.find(x=>x.id===cid);
      if (!c) continue;
      const a = c.attributes?.[ev.id]||{};
      const parts = [];
      if (a.power)          parts.push(`power: ${a.power}`);
      if (a.difficulty)     parts.push(`vs: ${a.difficulty}`);
      if (a.arcStage)       parts.push(`arc: ${a.arcStage}`);
      if (a.emotionalState) parts.push(`emotion: ${a.emotionalState}`);
      if (a.physicalState)  parts.push(`physical: ${a.physicalState}`);
      if (parts.length) L.push(`  ${c.name} — ${parts.join(" · ")}`);
      if (a.sceneMotive)  L.push(`    wants: ${a.sceneMotive}`);
      if (a.knowledge)    L.push(`    knows: ${a.knowledge}`);
      if (a.beliefs)      L.push(`    holds: ${a.beliefs}`);
      if (a.secret)       L.push(`    hiding: ${a.secret}`);
      if (a.arcBefore)    L.push(`    entering: ${a.arcBefore}`);
      if (a.arcAfter)     L.push(`    leaving: ${a.arcAfter}`);
      if (a.traumaActive) L.push(`    trauma: ${a.traumaActive}`);
      if (a.notes)        L.push(`    [AI] ${a.notes}`);
    }
  }

  L.push(`\n${"─".repeat(60)}\nAI GUIDANCE\n${"─".repeat(60)}`);
  L.push(`Honor: accumulated trauma · scene motive vs long-term desire · secrets that shape dialogue · relationship subtext · arc stage limits what they can do · conditions that distort perception · skill costs and when they'd pay them · equipment curses and how they manifest · world techniques and how they are rare or known · nation politics bleeding into character motivation`);
  return L.join("\n");
}

// ── styles ────────────────────────────────────────────────────────────────────
const S = {
  app:     { display:"flex", flexDirection:"column", height:"100vh", fontFamily:"'Georgia',serif", background:"#faf9f7", color:"#1a1a1a", fontSize:14 },
  row:     { display:"flex", flex:1, overflow:"hidden" },
  top:     { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:48, borderBottom:"1px solid #e0ddd8", flexShrink:0 },
  logo:    { fontSize:13, letterSpacing:4, textTransform:"uppercase", color:"#444" },
  side:    { width:224, borderRight:"1px solid #e0ddd8", overflowY:"auto", padding:"20px 0", flexShrink:0 },
  main:    { flex:1, overflowY:"auto", padding:"32px 44px" },
  label:   { display:"block", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"#444", marginBottom:4 },
  input:   { width:"100%", background:"transparent", border:"none", borderBottom:"1px solid #bbb", padding:"4px 0", fontSize:14, fontFamily:"Georgia,serif", color:"#1a1a1a", outline:"none", boxSizing:"border-box" },
  textarea:{ width:"100%", background:"transparent", border:"none", borderBottom:"1px solid #bbb", padding:"4px 0", fontSize:14, fontFamily:"Georgia,serif", color:"#1a1a1a", outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.6 },
  select:  { background:"transparent", border:"none", borderBottom:"1px solid #bbb", padding:"4px 0", fontSize:13, fontFamily:"Georgia,serif", color:"#1a1a1a", outline:"none" },
  ghost:   { background:"none", border:"none", cursor:"pointer", fontFamily:"Georgia,serif", fontSize:12, color:"#333", letterSpacing:1, padding:"4px 0" },
  pill:    { background:"none", border:"1px solid currentColor", borderRadius:2, cursor:"pointer", fontFamily:"Georgia,serif", fontSize:11, padding:"3px 10px", letterSpacing:1 },
  rule:    { border:"none", borderTop:"1px solid #e0ddd8", margin:"20px 0" },
  h2:      { fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"#444", margin:"0 0 14px", fontWeight:400 },
  dim:     { color:"#444", fontSize:12 },
  grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" },
  grid3:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 24px" },
  grid4:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"0 20px" },
};

// ── primitives ────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, multi, placeholder="", rows=3, width }) {
  const st = width ? { ...S.input, width } : S.input;
  return (
    <div style={{ marginBottom:16 }}>
      <label style={S.label}>{label}</label>
      {multi
        ? <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={S.textarea}/>
        : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={st}/>}
    </div>
  );
}

function Sel({ label, value, onChange, opts }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={S.label}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={S.select}>
        <option value="">—</option>
        {opts.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={S.label}>{label}</label>
      <button onClick={()=>onChange(!value)} style={{
        ...S.ghost, border:"1px solid #bbb", borderRadius:2, padding:"3px 12px",
        color: value ? "#27ae60" : "#c0392b",
      }}>{value ? "Yes" : "No"}</button>
    </div>
  );
}

function EventPicker({ label, value, onChange, events }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={S.label}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={S.select}>
        <option value="">— none —</option>
        {[...events].sort((a,b)=>a.time-b.time).map(e=>(
          <option key={e.id} value={e.id}>T{e.time} · {e.title}</option>
        ))}
      </select>
    </div>
  );
}

function Section({ title, children, action, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:8 }}>
      <hr style={S.rule}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:open?14:0 }}>
        <button onClick={()=>setOpen(o=>!o)} style={{ ...S.ghost, fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"#444", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:10, color:"#aaa" }}>{open?"▾":"▸"}</span>
          {title}
        </button>
        {open && action}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function SideItem({ label, sub, active, color, onClick, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ padding:"8px 24px", cursor:"pointer", background:active?"#f0ede8":hover?"#f5f3f0":"transparent",
        display:"flex", justifyContent:"space-between", alignItems:"center", transition:"background 0.1s" }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:13, color:color||"#1a1a1a", display:"flex", alignItems:"center", gap:6 }}>
          {color && <span style={{ width:6,height:6,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0 }}/>}
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
        </div>
        {sub && <div style={{ color:"#444", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>}
      </div>
      {(hover||active) && onDelete && (
        <button onClick={e=>{e.stopPropagation();onDelete();}} style={{...S.ghost,fontSize:16,color:"#888",padding:0,marginLeft:6,flexShrink:0}}>×</button>
      )}
    </div>
  );
}

function EntryBlock({ color, onDelete, children }) {
  return (
    <div style={{ marginBottom:24, paddingLeft:14, borderLeft:`2px solid ${color||"#ddd"}` }}>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
        <button onClick={onDelete} style={{...S.ghost,color:"#aaa",fontSize:12}}>remove</button>
      </div>
      {children}
    </div>
  );
}

// ── Character Status Panel ─────────────────────────────────────────────────────
function CharStatusPanel({ char, events }) {
  const sortedEvts = [...events].sort((a,b)=>b.time-a.time);
  const latestEvent = sortedEvts.find(e=>(e.characters||[]).includes(char.id));
  const currentAttr = latestEvent ? (char.attributes?.[latestEvent.id]||{}) : {};
  const activeConditions = (char.conditions||[]).filter(cd=>cd.isActive);
  const equippedItems = (char.equipment||[]).filter(eq=>(eq.accessState||"Equipped")==="Equipped");
  const cursedItems = equippedItems.filter(eq=>eq.curses&&eq.curses.trim().length>0);
  const achievements = (char.achievements||[]);
  const losses = (char.losses||[]);

  if (!latestEvent && !activeConditions.length && !equippedItems.length && !achievements.length && !losses.length) return null;

  const badgeStyle = (color) => ({
    display:"inline-block", padding:"2px 8px", borderRadius:2, fontSize:11,
    border:`1px solid ${color}`, color:color, marginRight:6, marginBottom:4, letterSpacing:1,
  });

  return (
    <div style={{ background:"#f0ede8", padding:16, borderRadius:2, marginBottom:24, borderLeft:`3px solid ${char.color}` }}>
      <p style={{ ...S.h2, marginBottom:10, color:char.color }}>Current Status</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
        {currentAttr.power    && <span style={badgeStyle("#2980b9")}>{currentAttr.power}</span>}
        {currentAttr.arcStage && <span style={badgeStyle("#8e44ad")}>{currentAttr.arcStage}</span>}
        {currentAttr.emotionalState && <span style={badgeStyle("#e67e22")}>{currentAttr.emotionalState}</span>}
        {currentAttr.physicalState  && <span style={badgeStyle(currentAttr.physicalState.toLowerCase().includes("injur")||currentAttr.physicalState.toLowerCase().includes("wound")?"#c0392b":"#27ae60")}>{currentAttr.physicalState}</span>}
      </div>
      {latestEvent && (
        <p style={{...S.dim,marginBottom:8}}>Last seen at: <strong>T{latestEvent.time} — {latestEvent.title}</strong></p>
      )}
      {activeConditions.length>0 && (
        <div style={{ marginBottom:8 }}>
          <p style={{...S.dim,marginBottom:4}}>Active conditions:</p>
          <div style={{ display:"flex", flexWrap:"wrap" }}>
            {activeConditions.map(cd=>(
              <span key={cd.id} style={badgeStyle(
                cd.type==="Cursed"?"#8e44ad":cd.type==="Wounded"||cd.type==="Physical"?"#c0392b":
                cd.type==="Blessed"||cd.type==="Enhanced"?"#27ae60":"#e67e22"
              )}>{cd.name} [{cd.type}]</span>
            ))}
          </div>
        </div>
      )}
      {cursedItems.length>0 && (
        <div style={{ marginBottom:8 }}>
          <p style={{...S.dim,marginBottom:4}}>Cursed equipment:</p>
          <div style={{ display:"flex", flexWrap:"wrap" }}>
            {cursedItems.map(eq=>(
              <span key={eq.id} style={badgeStyle("#8e44ad")}>⚠ {eq.name}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:16 }}>
        {achievements.length>0 && <p style={{...S.dim}}><strong>{achievements.length}</strong> achievement{achievements.length!==1?"s":""}</p>}
        {losses.length>0       && <p style={{...S.dim,color:"#c0392b"}}><strong>{losses.length}</strong> loss{losses.length!==1?"es":""}</p>}
        {(char.skills||[]).length>0 && <p style={S.dim}><strong>{char.skills.length}</strong> skill{char.skills.length!==1?"s":""}</p>}
        {equippedItems.length>0 && <p style={S.dim}><strong>{equippedItems.length}</strong> equipped</p>}
      </div>
    </div>
  );
}

// ── World sheet ───────────────────────────────────────────────────────────────
function WorldSheet({ state, setState }) {
  const up    = (f,v) => setState(s=>({...s,[f]:v}));
  const addW  = (field, mk) => setState(s=>({...s,[field]:[...(s[field]||[]),mk()]}));
  const delW  = (field, id) => setState(s=>({...s,[field]:(s[field]||[]).filter(x=>x.id!==id)}));
  const upW   = (field,id,f,v) => setState(s=>({...s,[field]:(s[field]||[]).map(x=>x.id===id?{...x,[f]:v}:x)}));

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <input value={state.title} onChange={e=>up("title",e.target.value)}
          style={{...S.input,fontSize:22,borderBottom:"none",padding:0}}/>
      </div>
      <Field label="Synopsis / premise" value={state.synopsis||""} onChange={v=>up("synopsis",v)} multi rows={4} placeholder="What is this world? What is the central tension?"/>
      <Field label="Setting" value={state.setting||""} onChange={v=>up("setting",v)} placeholder="Time period, place, atmosphere…"/>
      <Field label="Themes" value={state.themes||""} onChange={v=>up("themes",v)} placeholder="The ideas the story is really about…"/>
      <Field label="World rules / logic" value={state.rules||""} onChange={v=>up("rules",v)} multi rows={3} placeholder="Magic systems, political structures, physical laws…"/>

      {/* ── Nations ── */}
      <Section title={`Nations & Factions (${(state.nations||[]).length})`} action={<button style={S.ghost} onClick={()=>addW("nations",mkNation)}>+ add</button>} defaultOpen={false}>
        <p style={{...S.dim,marginBottom:14}}>Kingdoms, empires, tribes, hidden societies. The political landscape your characters live inside.</p>
        {(state.nations||[]).map(n=>(
          <EntryBlock key={n.id} color="#2c3e50" onDelete={()=>delW("nations",n.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={n.name} onChange={v=>upW("nations",n.id,"name",v)} placeholder="The Iron Dominion…"/>
              <Sel label="Type" value={n.type} onChange={v=>upW("nations",n.id,"type",v)} opts={NAT_TYPES}/>
              <Field label="Capital" value={n.capital} onChange={v=>upW("nations",n.id,"capital",v)} placeholder="Ashveil…"/>
            </div>
            <div style={S.grid2}>
              <Field label="Ruler / governing power" value={n.ruler} onChange={v=>upW("nations",n.id,"ruler",v)} placeholder="Emperor Kael the Blind…"/>
              <Field label="Population / scale" value={n.population} onChange={v=>upW("nations",n.id,"population",v)} placeholder="12 million, mostly agrarian…"/>
            </div>
            <Field label="Geography" value={n.geography} onChange={v=>upW("nations",n.id,"geography",v)} placeholder="Frozen tundra split by the Ashen River…"/>
            <div style={S.grid2}>
              <Field label="Culture & customs" value={n.culture} onChange={v=>upW("nations",n.id,"culture",v)} multi rows={2} placeholder="Warrior-scholars. Death rites, honor debts…"/>
              <Field label="Military power" value={n.military} onChange={v=>upW("nations",n.id,"military",v)} multi rows={2} placeholder="50,000 standing army. Elite Grave Knights…"/>
            </div>
            <div style={S.grid2}>
              <Field label="Economy & resources" value={n.economy} onChange={v=>upW("nations",n.id,"economy",v)} placeholder="Exports void iron, imports grain…"/>
              <div>
                <div style={S.grid2}>
                  <Field label="Allies" value={n.allies} onChange={v=>upW("nations",n.id,"allies",v)} placeholder="The Sea Confederacy…"/>
                  <Field label="Enemies" value={n.enemies} onChange={v=>upW("nations",n.id,"enemies",v)} placeholder="The Free Holds…"/>
                </div>
              </div>
            </div>
            <Field label="Hidden secrets" value={n.secrets} onChange={v=>upW("nations",n.id,"secrets",v)} multi rows={2} placeholder="The emperor is already dead. The throne is controlled by…"/>
            <Field label="Lore & history" value={n.lore} onChange={v=>upW("nations",n.id,"lore",v)} multi rows={3} placeholder="Founded 400 years ago after the Collapse…"/>
          </EntryBlock>
        ))}
        {!(state.nations||[]).length && <p style={S.dim}>No nations yet.</p>}
      </Section>

      {/* ── Techniques ── */}
      <Section title={`Techniques (${(state.techniques||[]).length})`} action={<button style={S.ghost} onClick={()=>addW("techniques",mkTechnique)}>+ add</button>} defaultOpen={false}>
        <p style={{...S.dim,marginBottom:14}}>Martial arts, blacksmithing schools, biological arts, forbidden knowledge. How things are made and mastered in this world.</p>
        {(state.techniques||[]).map(t=>(
          <EntryBlock key={t.id} color="#16a085" onDelete={()=>delW("techniques",t.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={t.name} onChange={v=>upW("techniques",t.id,"name",v)} placeholder="Void Step Discipline…"/>
              <Sel label="Type" value={t.type} onChange={v=>upW("techniques",t.id,"type",v)} opts={TECH_TYPES}/>
              <Field label="Era / period" value={t.era} onChange={v=>upW("techniques",t.id,"era",v)} placeholder="Ancient, Third Age…"/>
            </div>
            <div style={S.grid2}>
              <Field label="Origin / where it came from" value={t.origin} onChange={v=>upW("techniques",t.id,"origin",v)} placeholder="Born in the monastery of the silent…"/>
              <Field label="Creator (if known)" value={t.creator} onChange={v=>upW("techniques",t.id,"creator",v)} placeholder="The Blind Master, unknown…"/>
            </div>
            <Field label="What it does / how it works" value={t.description} onChange={v=>upW("techniques",t.id,"description",v)} multi rows={3} placeholder="A martial discipline that bends the practitioner's shadow into a physical weapon…"/>
            <Field label="Effects & power" value={t.effect} onChange={v=>upW("techniques",t.id,"effect",v)} multi rows={2} placeholder="Can intercept attacks, strike from unexpected angles, blind opponents…"/>
            <div style={S.grid2}>
              <Field label="Requirements to learn" value={t.requirement} onChange={v=>upW("techniques",t.id,"requirement",v)} placeholder="Must have lost something precious, years of darkness training…"/>
              <Field label="Cost / price of mastery" value={t.cost} onChange={v=>upW("techniques",t.id,"cost",v)} placeholder="Gradual blindness, shortened lifespan…"/>
            </div>
            <Field label="Secrets / hidden layers" value={t.secret} onChange={v=>upW("techniques",t.id,"secret",v)} multi rows={2} placeholder="The true final form requires the practitioner to sacrifice their name…"/>
            <Field label="Lore" value={t.lore} onChange={v=>upW("techniques",t.id,"lore",v)} multi rows={2} placeholder="Lost for three centuries until a wandering monk rediscovered the scrolls…"/>
          </EntryBlock>
        ))}
        {!(state.techniques||[]).length && <p style={S.dim}>No techniques yet.</p>}
      </Section>

      {/* ── Ingredients / Resources ── */}
      <Section title={`Ingredients & Resources (${(state.ingredients||[]).length})`} action={<button style={S.ghost} onClick={()=>addW("ingredients",mkIngredient)}>+ add</button>} defaultOpen={false}>
        <p style={{...S.dim,marginBottom:14}}>Materials, herbs, minerals, essences. The raw stuff of your world — what things are made from.</p>
        {(state.ingredients||[]).map(i=>(
          <EntryBlock key={i.id} color="#d35400" onDelete={()=>delW("ingredients",i.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={i.name} onChange={v=>upW("ingredients",i.id,"name",v)} placeholder="Void iron, Moonpetal…"/>
              <Sel label="Rarity" value={i.rarity} onChange={v=>upW("ingredients",i.id,"rarity",v)} opts={RARITY}/>
              <Field label="Found at / habitat" value={i.location} onChange={v=>upW("ingredients",i.id,"location",v)} placeholder="Deep rift mines, only in eclipse season…"/>
            </div>
            <div style={S.grid2}>
              <Field label="Appearance" value={i.appearance} onChange={v=>upW("ingredients",i.id,"appearance",v)} placeholder="Black ore with crimson veins that pulse…"/>
              <Field label="Properties / nature" value={i.properties} onChange={v=>upW("ingredients",i.id,"properties",v)} placeholder="Absorbs light, conducts soul energy…"/>
            </div>
            <Field label="Uses — what it makes or enables" value={i.uses} onChange={v=>upW("ingredients",i.id,"uses",v)} multi rows={2} placeholder="Used in forging void-touched weapons, cursed armor, binding rituals…"/>
            <Field label="Danger / handling risks" value={i.danger} onChange={v=>upW("ingredients",i.id,"danger",v)} placeholder="Prolonged contact causes memory erosion…"/>
            <Field label="Lore" value={i.lore} onChange={v=>upW("ingredients",i.id,"lore",v)} multi rows={2} placeholder="Once abundant before the Sundering…"/>
          </EntryBlock>
        ))}
        {!(state.ingredients||[]).length && <p style={S.dim}>No ingredients yet.</p>}
      </Section>

      {/* ── Monsters ── */}
      <Section title={`Monsters (${(state.monsters||[]).length})`} action={<button style={S.ghost} onClick={()=>addW("monsters",mkMonster)}>+ add</button>} defaultOpen={false}>
        <p style={{...S.dim,marginBottom:14}}>Creatures, beasts, horrors. What hunts your characters — and what drops when they die.</p>
        {(state.monsters||[]).map(m=>(
          <EntryBlock key={m.id} color="#c0392b" onDelete={()=>delW("monsters",m.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={m.name} onChange={v=>upW("monsters",m.id,"name",v)} placeholder="Hollow Warden…"/>
              <Sel label="Tier" value={m.tier} onChange={v=>upW("monsters",m.id,"tier",v)} opts={MON_TIERS}/>
              <Field label="Habitat" value={m.habitat} onChange={v=>upW("monsters",m.id,"habitat",v)} placeholder="Rifts, abandoned fortresses…"/>
            </div>
            <Field label="Appearance" value={m.appearance} onChange={v=>upW("monsters",m.id,"appearance",v)} multi rows={2} placeholder="Twelve feet tall, skin of cracked obsidian, no face — only a hollow screaming mouth…"/>
            <Field label="Behavior / intelligence" value={m.behavior} onChange={v=>upW("monsters",m.id,"behavior",v)} multi rows={2} placeholder="Hunts by fear-scent. Territorial. Will not cross running water…"/>
            <Field label="Abilities / attacks" value={m.abilities} onChange={v=>upW("monsters",m.id,"abilities",v)} multi rows={2} placeholder="Soul-shriek (paralyzes), Void-step (teleport), Regeneration…"/>
            <div style={S.grid2}>
              <Field label="Weaknesses" value={m.weaknesses} onChange={v=>upW("monsters",m.id,"weaknesses",v)} placeholder="Sunlight, salt circles, named iron…"/>
              <Field label="What it drops" value={m.drops} onChange={v=>upW("monsters",m.id,"drops",v)} placeholder="Hollow core (ingredient), Warden's eye (relic)…"/>
            </div>
            <Field label="First recorded encounter" value={m.firstSeen} onChange={v=>upW("monsters",m.id,"firstSeen",v)} placeholder="T3 — The Rift of Asveth"/>
            <Field label="Lore" value={m.lore} onChange={v=>upW("monsters",m.id,"lore",v)} multi rows={2} placeholder="Once human. Created when the Ritual of Unmaking was performed incomplete…"/>
          </EntryBlock>
        ))}
        {!(state.monsters||[]).length && <p style={S.dim}>No monsters yet.</p>}
      </Section>

      {/* ── Treasures ── */}
      <Section title={`Treasures & Artifacts (${(state.treasures||[]).length})`} action={<button style={S.ghost} onClick={()=>addW("treasures",mkTreasure)}>+ add</button>} defaultOpen={false}>
        <p style={{...S.dim,marginBottom:14}}>World-level relics, legendary items not yet held by anyone. When a character claims one, add it to their equipment too.</p>
        {(state.treasures||[]).map(tr=>(
          <EntryBlock key={tr.id} color="#e67e22" onDelete={()=>delW("treasures",tr.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={tr.name} onChange={v=>upW("treasures",tr.id,"name",v)} placeholder="The Ashen Crown…"/>
              <Sel label="Rarity" value={tr.rarity} onChange={v=>upW("treasures",tr.id,"rarity",v)} opts={RARITY}/>
              <Field label="Current location" value={tr.location} onChange={v=>upW("treasures",tr.id,"location",v)} placeholder="Sealed in the Tomb of Kael…"/>
            </div>
            <Field label="Description" value={tr.description} onChange={v=>upW("treasures",tr.id,"description",v)} multi rows={2} placeholder="A crown of blackened bone that weeps silver tears…"/>
            <Field label="Stats & powers" value={tr.stats} onChange={v=>upW("treasures",tr.id,"stats",v)} multi rows={3} placeholder="+200 to all attributes · Grants command over the dead · Doubles soul capacity…"/>
            <div style={S.grid2}>
              <Field label="Curses (if any)" value={tr.curses} onChange={v=>upW("treasures",tr.id,"curses",v)} multi rows={2} placeholder="Slowly replaces the wearer's blood with void-water…"/>
              <Field label="Condition to unbind curse" value={tr.unbindCondition} onChange={v=>upW("treasures",tr.id,"unbindCondition",v)} multi rows={2} placeholder="Worn by its creator's descendant during a solar eclipse…"/>
            </div>
            <div style={S.grid2}>
              <Field label="Creator" value={tr.creator} onChange={v=>upW("treasures",tr.id,"creator",v)} placeholder="The God-Smith Velath…"/>
              <Field label="Ingredients / materials" value={tr.ingredients} onChange={v=>upW("treasures",tr.id,"ingredients",v)} placeholder="God-bone, first tears, void iron…"/>
            </div>
            <Field label="History" value={tr.history} onChange={v=>upW("treasures",tr.id,"history",v)} multi rows={3} placeholder="Forged to end the First War. Shattered into three pieces. Reassembled once, with catastrophic results…"/>
          </EntryBlock>
        ))}
        {!(state.treasures||[]).length && <p style={S.dim}>No treasures yet.</p>}
      </Section>
    </div>
  );
}

// ── Character sheet ───────────────────────────────────────────────────────────
function CharSheet({ char, state, setState }) {
  const up    = (f,v) => setState(s=>({...s,characters:s.characters.map(c=>c.id===char.id?{...c,[f]:v}:c)}));

  const add  = (field, mk) => up(field, [...(char[field]||[]), mk()]);
  const del  = (field, id) => up(field, (char[field]||[]).filter(x=>x.id!==id));
  const upIt = (field, id, f, v) => up(field, (char[field]||[]).map(x=>x.id===id?{...x,[f]:v}:x));

  const upBranch    = (bid,f,v) => up("branch", char.branch.map(b=>b.id===bid?{...b,[f]:v}:b));
  const addCrossing = (bid) => up("branch", char.branch.map(b=>b.id===bid?{...b,crossings:[...(b.crossings||[]),{withId:"",note:""}]}:b));
  const upCrossing  = (bid,idx,f,v) => up("branch", char.branch.map(b=>b.id===bid?{...b,crossings:b.crossings.map((cr,i)=>i===idx?{...cr,[f]:v}:cr)}:b));

  const others = state.characters.filter(c=>c.id!==char.id);
  const events = state.events;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ width:8,height:8,borderRadius:"50%",background:char.color,display:"inline-block",flexShrink:0 }}/>
        <input value={char.name} onChange={e=>up("name",e.target.value)}
          style={{...S.input,fontSize:22,borderBottom:"none",padding:0,flex:1}}/>
      </div>

      {/* ── Status ── */}
      <Section title="Status">
        <CharStatusPanel char={char} events={events}/>
        <p style={{...S.dim,marginTop:4}}>Derived from latest event appearance, active conditions, and equipped items.</p>
      </Section>

      {/* ── Identity ── */}
      <Section title="Identity">
        <div style={S.grid2}>
          <Field label="Role in story" value={char.role} onChange={v=>up("role",v)} placeholder="Protagonist, mentor…"/>
          <Field label="Archetype" value={char.archetype} onChange={v=>up("archetype",v)} placeholder="The trickster…"/>
        </div>
      </Section>

      {/* ── Psychological core ── */}
      <Section title="Psychological core">
        <Field label="Core wound" value={char.coreWound} onChange={v=>up("coreWound",v)} multi rows={2} placeholder="The formative trauma that shaped everything."/>
        <div style={S.grid2}>
          <Field label="Core fear" value={char.coreFear} onChange={v=>up("coreFear",v)} placeholder="What they most dread."/>
          <Field label="Core desire" value={char.coreDesire} onChange={v=>up("coreDesire",v)} placeholder="What they most want."/>
        </div>
        <Field label="Philosophy / belief system" value={char.philosophy} onChange={v=>up("philosophy",v)} multi rows={2} placeholder="How they see the world."/>
        <Field label="Secrets (always carried)" value={char.secrets||""} onChange={v=>up("secrets",v)} multi rows={2} placeholder="What they hide. How it shapes every word they say."/>
        <hr style={S.rule}/>
        <p style={{...S.h2,marginBottom:8}}>Traumas</p>
        {(char.traumas||[]).map(t=>(
          <EntryBlock key={t.id} color={char.color} onDelete={()=>del("traumas",t.id)}>
            <div style={S.grid2}>
              <Field label="Trauma name" value={t.title} onChange={v=>upIt("traumas",t.id,"title",v)} placeholder="The abandonment…"/>
              <Field label="When it happened" value={t.when} onChange={v=>upIt("traumas",t.id,"when",v)} placeholder="T2, age 12…"/>
            </div>
            <Field label="What happened" value={t.description} onChange={v=>upIt("traumas",t.id,"description",v)} multi rows={2}/>
            <div style={S.grid2}>
              <Field label="Triggered by" value={t.trigger} onChange={v=>upIt("traumas",t.id,"trigger",v)} placeholder="Loud voices, being abandoned…"/>
              <Field label="Manifests as" value={t.manifestation} onChange={v=>upIt("traumas",t.id,"manifestation",v)} placeholder="Freezes, lashes out…"/>
            </div>
          </EntryBlock>
        ))}
        <button style={S.ghost} onClick={()=>add("traumas",mkTrauma)}>+ add trauma</button>
      </Section>

      {/* ── Character arc ── */}
      <Section title="Character arc">
        <p style={{...S.dim,marginBottom:12}}>Where they begin and where they end. The transformation the story puts them through.</p>
        <div style={S.grid2}>
          <Field label="Arc start — who they are" value={char.arcStart||""} onChange={v=>up("arcStart",v)} placeholder="Closed off, convinced the world is cruel…"/>
          <Field label="Arc end — who they become" value={char.arcEnd||""} onChange={v=>up("arcEnd",v)} placeholder="Capable of trust, grief without collapse…"/>
        </div>
      </Section>

      {/* ── Conditions ── */}
      <Section title={`Conditions (${(char.conditions||[]).length})`} action={<button style={S.ghost} onClick={()=>add("conditions",mkCond)}>+ add</button>}>
        <p style={{...S.dim,marginBottom:14}}>Current physical, mental, social, or spiritual states — wounds, curses, blessings, enhancements. Tied to a specific time and event.</p>
        {(char.conditions||[]).map(cd=>(
          <EntryBlock key={cd.id} color={cd.isActive?"#e67e22":"#aaa"} onDelete={()=>del("conditions",cd.id)}>
            <div style={S.grid3}>
              <Sel label="Type" value={cd.type} onChange={v=>upIt("conditions",cd.id,"type",v)} opts={COND_TYPES}/>
              <Field label="Name" value={cd.name} onChange={v=>upIt("conditions",cd.id,"name",v)} placeholder="Cursed sight, broken ribs…"/>
              <Toggle label="Currently active?" value={cd.isActive} onChange={v=>upIt("conditions",cd.id,"isActive",v)}/>
            </div>
            <div style={S.grid2}>
              <Field label="At time (T#)" value={cd.atTime} onChange={v=>upIt("conditions",cd.id,"atTime",v)} placeholder="T3"/>
              <EventPicker label="At event" value={cd.atEventId} onChange={v=>upIt("conditions",cd.id,"atEventId",v)} events={events}/>
            </div>
            <Field label="Why / how they got it" value={cd.why} onChange={v=>upIt("conditions",cd.id,"why",v)} multi rows={2} placeholder="What caused this condition?"/>
            <Field label="Description" value={cd.description} onChange={v=>upIt("conditions",cd.id,"description",v)} multi rows={2} placeholder="What does it feel like, look like?"/>
            <Field label="Effects on the character" value={cd.effects} onChange={v=>upIt("conditions",cd.id,"effects",v)} multi rows={2} placeholder="What can they no longer do? What new things can they do?"/>
          </EntryBlock>
        ))}
        {!(char.conditions||[]).length && <p style={S.dim}>No conditions yet.</p>}
      </Section>

      {/* ── Achievements & losses ── */}
      <Section title={`Achievements & losses (${(char.achievements||[]).length + (char.losses||[]).length})`}>
        <p style={{...S.dim,marginBottom:14}}>What they've gained and lost over the course of the story. Each entry is tied to a time and event.</p>
        <p style={{...S.h2,marginBottom:8}}>Achievements</p>
        {(char.achievements||[]).map(a=>(
          <EntryBlock key={a.id} color="#27ae60" onDelete={()=>del("achievements",a.id)}>
            <div style={S.grid2}>
              <Field label="Title" value={a.title} onChange={v=>upIt("achievements",a.id,"title",v)} placeholder="Mastered the void step…"/>
              <Field label="At time (T#)" value={a.atTime} onChange={v=>upIt("achievements",a.id,"atTime",v)} placeholder="T4"/>
            </div>
            <EventPicker label="At event" value={a.atEventId} onChange={v=>upIt("achievements",a.id,"atEventId",v)} events={events}/>
            <Field label="Description" value={a.description} onChange={v=>upIt("achievements",a.id,"description",v)} multi rows={2} placeholder="What happened. Why it matters."/>
            <Field label="What they gained" value={a.gained} onChange={v=>upIt("achievements",a.id,"gained",v)} placeholder="Respect of the guild, a new power, a scar…"/>
          </EntryBlock>
        ))}
        <button style={{...S.ghost,marginBottom:20}} onClick={()=>add("achievements",mkAchieve)}>+ add achievement</button>
        <hr style={S.rule}/>
        <p style={{...S.h2,marginBottom:8}}>Losses</p>
        {(char.losses||[]).map(ls=>(
          <EntryBlock key={ls.id} color="#c0392b" onDelete={()=>del("losses",ls.id)}>
            <div style={S.grid2}>
              <Field label="What was lost" value={ls.title} onChange={v=>upIt("losses",ls.id,"title",v)} placeholder="Their mentor, their right eye…"/>
              <Field label="At time (T#)" value={ls.atTime} onChange={v=>upIt("losses",ls.id,"atTime",v)} placeholder="T6"/>
            </div>
            <EventPicker label="At event" value={ls.atEventId} onChange={v=>upIt("losses",ls.id,"atEventId",v)} events={events}/>
            <Field label="Description" value={ls.description} onChange={v=>upIt("losses",ls.id,"description",v)} multi rows={2} placeholder="How it happened. What it cost them emotionally."/>
          </EntryBlock>
        ))}
        <button style={S.ghost} onClick={()=>add("losses",mkLoss)}>+ add loss</button>
      </Section>

      {/* ── Skills ── */}
      <Section title={`Skills (${(char.skills||[]).length})`} action={<button style={S.ghost} onClick={()=>add("skills",mkSkill)}>+ add</button>}>
        <p style={{...S.dim,marginBottom:14}}>Every skill with full context — how they got it, what it costs, what it changes about them.</p>
        {(char.skills||[]).map(sk=>(
          <EntryBlock key={sk.id} color={char.color} onDelete={()=>del("skills",sk.id)}>
            <div style={S.grid2}>
              <Field label="Skill name" value={sk.name} onChange={v=>upIt("skills",sk.id,"name",v)} placeholder="Void step, Soul reading…"/>
              <Field label="Acquired at time (T#)" value={sk.atTime} onChange={v=>upIt("skills",sk.id,"atTime",v)} placeholder="T3"/>
            </div>
            <EventPicker label="Acquired at event" value={sk.atEventId} onChange={v=>upIt("skills",sk.id,"atEventId",v)} events={events}/>
            <Field label="How they got it" value={sk.howGained} onChange={v=>upIt("skills",sk.id,"howGained",v)} multi rows={2} placeholder="Trained under a master, born with it, stolen, unlocked by trauma…"/>
            <Field label="Source / origin" value={sk.source} onChange={v=>upIt("skills",sk.id,"source",v)} placeholder="Ancient bloodline, divine blessing, years of practice…"/>
            <hr style={{...S.rule,margin:"12px 0"}}/>
            <p style={{...S.h2,marginBottom:10}}>What it changes</p>
            <div style={S.grid2}>
              <Field label="Appearance change" value={sk.appearance} onChange={v=>upIt("skills",sk.id,"appearance",v)} placeholder="Eyes turn silver, veins glow…"/>
              <Field label="Attitude / behavior change" value={sk.attitude} onChange={v=>upIt("skills",sk.id,"attitude",v)} placeholder="Becomes colder, more calculated…"/>
            </div>
            <hr style={{...S.rule,margin:"12px 0"}}/>
            <p style={{...S.h2,marginBottom:10}}>Stats & mechanics</p>
            <Field label="Stats / power description" value={sk.stats} onChange={v=>upIt("skills",sk.id,"stats",v)} multi rows={2} placeholder="What it does mechanically and narratively. Range, effect, scale…"/>
            <div style={S.grid2}>
              <Field label="Cost (mana, HP, sanity…)" value={sk.cost} onChange={v=>upIt("skills",sk.id,"cost",v)} placeholder="30 mana, 1 year of life…"/>
              <Field label="Cost description" value={sk.costDescription} onChange={v=>upIt("skills",sk.id,"costDescription",v)} placeholder="What using it feels like physically…"/>
            </div>
            <div style={S.grid3}>
              <Field label="Uses" value={sk.uses} onChange={v=>upIt("skills",sk.id,"uses",v)} placeholder="∞"/>
              <Field label="Cooldown" value={sk.cooldown} onChange={v=>upIt("skills",sk.id,"cooldown",v)} placeholder="3 turns, 1 day…"/>
              <Field label="Requirement (optional)" value={sk.requirement} onChange={v=>upIt("skills",sk.id,"requirement",v)} placeholder="Must be wounded, full moon…"/>
            </div>
            <div style={S.grid2}>
              <Field label="Upside" value={sk.upside} onChange={v=>upIt("skills",sk.id,"upside",v)} multi rows={2} placeholder="What makes it powerful or unique?"/>
              <Field label="Downside" value={sk.downside} onChange={v=>upIt("skills",sk.id,"downside",v)} multi rows={2} placeholder="What does it cost beyond the resource? Side effects?"/>
            </div>
            <Field label="Narrator notes" value={sk.notes} onChange={v=>upIt("skills",sk.id,"notes",v)} multi rows={2} placeholder="When and why they'd use this. What it reveals about them."/>
          </EntryBlock>
        ))}
        {!(char.skills||[]).length && <p style={S.dim}>No skills yet.</p>}
      </Section>

      {/* ── Equipment ── */}
      <Section title={`Equipment (${(char.equipment||[]).length})`} action={<button style={S.ghost} onClick={()=>add("equipment",mkEquip)}>+ add</button>}>
        <p style={{...S.dim,marginBottom:14}}>Every item with full history — stats, curses, how they got it, who made it and why.</p>
        {(char.equipment||[]).map(eq=>{
          const acc = eq.accessState||"Equipped";
          const accColor = acc==="Equipped" ? "#27ae60" : acc==="Stored" ? "#e67e22" : "#c0392b";
          return (
          <EntryBlock key={eq.id} color={eq.curses&&eq.curses.trim()?"#8e44ad":char.color} onDelete={()=>del("equipment",eq.id)}>
            <div style={S.grid3}>
              <Sel label="Slot" value={eq.slot} onChange={v=>upIt("equipment",eq.id,"slot",v)} opts={EQUIP_SLOTS}/>
              <Field label="Name" value={eq.name} onChange={v=>upIt("equipment",eq.id,"name",v)} placeholder="Ashen blade…"/>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Access</label>
                <div style={{ display:"flex", gap:6 }}>
                  {EQUIP_ACCESS.map(opt=>(
                    <button key={opt} onClick={()=>upIt("equipment",eq.id,"accessState",opt)} style={{
                      ...S.ghost, border:`1px solid ${acc===opt?accColor:"#ccc"}`, borderRadius:2,
                      padding:"3px 8px", fontSize:11, color:acc===opt?accColor:"#aaa",
                    }}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
            {acc !== "Equipped" && (
              <Field label={acc==="Stored"?"Where it's stored / why not worn":"Why no access (lost, sealed, stolen…)"} value={eq.accessNote||""} onChange={v=>upIt("equipment",eq.id,"accessNote",v)} placeholder={acc==="Stored"?"Left at the guild vault, too heavy to carry…":"Stolen at T4, sealed inside the tomb…"}/>
            )}
            <div style={S.grid2}>
              <Field label="Obtained at time (T#)" value={eq.atTime} onChange={v=>upIt("equipment",eq.id,"atTime",v)} placeholder="T2"/>
              <EventPicker label="Obtained at event" value={eq.atEventId} onChange={v=>upIt("equipment",eq.id,"atEventId",v)} events={events}/>
            </div>
            <hr style={{...S.rule,margin:"12px 0"}}/>
            <p style={{...S.h2,marginBottom:10}}>Stats</p>
            <Field label="Stats / properties" value={eq.stats} onChange={v=>upIt("equipment",eq.id,"stats",v)} multi rows={3} placeholder="+40 ATK · +15 DEF · Ignores 20% magic resistance · Deals bonus fire damage…"/>
            <Field label="Uses" value={eq.uses} onChange={v=>upIt("equipment",eq.id,"uses",v)} placeholder="∞ or a specific number"/>
            <hr style={{...S.rule,margin:"12px 0"}}/>
            <p style={{...S.h2,marginBottom:10}}>Curse</p>
            <Field label="Curse (if any)" value={eq.curses} onChange={v=>upIt("equipment",eq.id,"curses",v)} multi rows={2} placeholder="Slowly drains the wielder's memories · Cannot be removed without consequence…"/>
            <Field label="Condition to unbind curse" value={eq.unbindCondition} onChange={v=>upIt("equipment",eq.id,"unbindCondition",v)} multi rows={2} placeholder="Only removed by the one who forged it · Must be submerged in the blood of its first victim…"/>
            <hr style={{...S.rule,margin:"12px 0"}}/>
            <p style={{...S.h2,marginBottom:10}}>Origin</p>
            <div style={S.grid2}>
              <Field label="Creator (optional)" value={eq.creator} onChange={v=>upIt("equipment",eq.id,"creator",v)} placeholder="The blind smith of Arath…"/>
              <Field label="Why it was created" value={eq.createdWhy} onChange={v=>upIt("equipment",eq.id,"createdWhy",v)} placeholder="Forged to kill a god, gifted at a wedding…"/>
            </div>
            <Field label="Ingredients / materials" value={eq.ingredients} onChange={v=>upIt("equipment",eq.id,"ingredients",v)} multi rows={2} placeholder="Void iron, a dragon's last breath, the grief of a mother…"/>
            <Field label="Lore / history" value={eq.lore} onChange={v=>upIt("equipment",eq.id,"lore",v)} multi rows={3} placeholder="The full story of this item before and after the character got it."/>
          </EntryBlock>
          );
        })}
        {!(char.equipment||[]).length && <p style={S.dim}>No equipment yet.</p>}
      </Section>

      {/* ── Relationships ── */}
      <Section title={`Relationships (${(char.relationships||[]).length})`} action={<button style={S.ghost} onClick={()=>add("relationships",mkRel)}>+ add</button>}>
        {(char.relationships||[]).map(r=>(
          <EntryBlock key={r.id} color="#888" onDelete={()=>del("relationships",r.id)}>
            <div style={{ display:"flex", gap:16, alignItems:"flex-end" }}>
              <div style={{ flex:1 }}>
                <label style={S.label}>With</label>
                <select value={r.withId} onChange={e=>upIt("relationships",r.id,"withId",e.target.value)} style={S.select}>
                  <option value="">— select —</option>
                  {others.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ flex:2 }}>
                <Field label="Dynamic" value={r.dynamic} onChange={v=>upIt("relationships",r.id,"dynamic",v)} placeholder="Mentor, rival, unrequited love…"/>
              </div>
            </div>
            <div style={S.grid2}>
              <Field label="How they feel" value={r.feel} onChange={v=>upIt("relationships",r.id,"feel",v)} placeholder="Admires but resents…"/>
              <Field label="Shared history" value={r.history} onChange={v=>upIt("relationships",r.id,"history",v)} placeholder="What binds or divides them?"/>
            </div>
          </EntryBlock>
        ))}
        {!(char.relationships||[]).length && <p style={S.dim}>No relationships yet.</p>}
      </Section>

      {/* ── Pre-story branch ── */}
      <Section title={`Pre-story branch (${char.branch?.length||0})`} action={<button style={S.ghost} onClick={()=>up("branch",[...(char.branch||[]),mkBranch()])}>+ add event</button>}>
        <p style={{...S.dim,marginBottom:14}}>Events before they appear in the main story. May be unknown to other characters.</p>
        {[...char.branch].sort((a,b)=>a.time-b.time).map(bev=>(
          <EntryBlock key={bev.id} color={char.color} onDelete={()=>up("branch",char.branch.filter(b=>b.id!==bev.id))}>
            <div style={{ display:"flex", gap:16, marginBottom:10 }}>
              <div style={{ width:52, flexShrink:0 }}>
                <label style={S.label}>T</label>
                <input type="number" value={bev.time} onChange={e=>upBranch(bev.id,"time",+e.target.value)} style={{...S.input,width:52}}/>
              </div>
              <div style={{ flex:1 }}>
                <label style={S.label}>Title</label>
                <input value={bev.title} onChange={e=>upBranch(bev.id,"title",e.target.value)} style={S.input}/>
              </div>
              <div>
                <label style={S.label}>Type</label>
                <select value={bev.type} onChange={e=>upBranch(bev.id,"type",e.target.value)} style={S.select}>
                  {EVENT_TYPES.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <Field label="What happened" value={bev.description} onChange={v=>upBranch(bev.id,"description",v)} multi rows={2}/>
            <Field label="Lasting impact" value={bev.impact} onChange={v=>upBranch(bev.id,"impact",v)} placeholder="Skills, wounds, beliefs formed…"/>
            {(bev.crossings||[]).map((cr,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"0 16px", marginTop:8, paddingTop:8, borderTop:"1px solid #eee" }}>
                <div>
                  <label style={S.label}>Crosses with</label>
                  <select value={cr.withId} onChange={e=>upCrossing(bev.id,i,"withId",e.target.value)} style={S.select}>
                    <option value="">—</option>
                    {others.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Field label="What passed between them" value={cr.note} onChange={v=>upCrossing(bev.id,i,"note",v)} placeholder="How they met, what happened…"/>
              </div>
            ))}
            <button style={{...S.ghost,fontSize:11,marginTop:4}} onClick={()=>addCrossing(bev.id)}>+ crossing</button>
          </EntryBlock>
        ))}
        {!char.branch.length && <p style={S.dim}>No pre-story events yet.</p>}
      </Section>
    </div>
  );
}

// ── Event sheet ───────────────────────────────────────────────────────────────
function EventSheet({ event, state, setState }) {
  const up = (f,v) => setState(s=>({...s,events:s.events.map(e=>e.id===event.id?{...e,[f]:v}:e)}));
  const toggleChar = (cid) => {
    const cur = event.characters||[];
    up("characters", cur.includes(cid)?cur.filter(x=>x!==cid):[...cur,cid]);
  };
  const upAttr = (cid,f,v) => setState(s=>({...s,characters:s.characters.map(c=>c.id===cid?{...c,attributes:{...c.attributes,[event.id]:{...(c.attributes?.[event.id]||{}),[f]:v}}}:c)}));
  const getAttr = (cid) => state.characters.find(c=>c.id===cid)?.attributes?.[event.id]||{};

  return (
    <div>
      <input value={event.title} onChange={e=>up("title",e.target.value)}
        style={{...S.input,fontSize:22,borderBottom:"none",padding:0,marginBottom:16}}/>
      <div style={{ display:"grid", gridTemplateColumns:"56px auto 1fr 1fr", gap:"0 24px", marginBottom:16, alignItems:"end" }}>
        <div>
          <label style={S.label}>Time</label>
          <input type="number" value={event.time} onChange={e=>up("time",+e.target.value)} style={{...S.input,width:52}}/>
        </div>
        <div>
          <label style={S.label}>Type</label>
          <select value={event.type} onChange={e=>up("type",e.target.value)} style={S.select}>
            {EVENT_TYPES.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <Field label="Chapter" value={event.chapter||""} onChange={v=>up("chapter",v)} placeholder="3 or Prologue"/>
        <Field label="Date / Period" value={event.date||""} onChange={v=>up("date",v)} placeholder="March 1842"/>
      </div>
      <Field label="Setting / location" value={event.setting||""} onChange={v=>up("setting",v)} placeholder="Where and what it feels like here…"/>
      <Field label="What happens" value={event.description} onChange={v=>up("description",v)} multi rows={3}/>
      <Field label="Consequence / after-effects" value={event.consequence} onChange={v=>up("consequence",v)} multi rows={2}/>

      <Section title="Characters present">
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
          {state.characters.map(c=>(
            <button key={c.id} onClick={()=>toggleChar(c.id)} style={{
              ...S.pill, color:event.characters?.includes(c.id)?c.color:"#aaa",
              borderColor:event.characters?.includes(c.id)?c.color:"#ccc",
            }}>{c.name}</button>
          ))}
          {!state.characters.length && <span style={S.dim}>Add characters first.</span>}
        </div>
        {(event.characters||[]).map(cid=>{
          const c = state.characters.find(x=>x.id===cid);
          if (!c) return null;
          const a = getAttr(cid);
          return (
            <div key={cid} style={{ marginBottom:28, paddingLeft:14, borderLeft:`2px solid ${c.color}60` }}>
              <p style={{...S.dim,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                <span style={{ width:6,height:6,borderRadius:"50%",background:c.color,display:"inline-block" }}/>
                {c.name}
              </p>
              <div style={S.grid3}>
                <Sel label="Power tier" value={a.power||""} onChange={v=>upAttr(cid,"power",v)} opts={POWER_TIERS}/>
                <Sel label="Difficulty faced" value={a.difficulty||""} onChange={v=>upAttr(cid,"difficulty",v)} opts={DIFFICULTY}/>
                <Sel label="Arc stage" value={a.arcStage||""} onChange={v=>upAttr(cid,"arcStage",v)} opts={ARC_STAGES}/>
                <Field label="Emotional state" value={a.emotionalState||""} onChange={v=>upAttr(cid,"emotionalState",v)} placeholder="Grief, resolute…"/>
                <Field label="Physical state" value={a.physicalState||""} onChange={v=>upAttr(cid,"physicalState",v)} placeholder="Injured, peak…"/>
                <Field label="Scene motive" value={a.sceneMotive||""} onChange={v=>upAttr(cid,"sceneMotive",v)} placeholder="What they want right now"/>
              </div>
              <div style={S.grid2}>
                <Field label="Knowledge held" value={a.knowledge||""} onChange={v=>upAttr(cid,"knowledge",v)} placeholder="What they know here…"/>
                <Field label="Active beliefs" value={a.beliefs||""} onChange={v=>upAttr(cid,"beliefs",v)} placeholder="Truths they hold now…"/>
                <Field label="Secret in this scene" value={a.secret||""} onChange={v=>upAttr(cid,"secret",v)} placeholder="What they're hiding here…"/>
                <Field label="Trauma surfacing" value={a.traumaActive||""} onChange={v=>upAttr(cid,"traumaActive",v)} placeholder="Which wound is active?"/>
              </div>
              <div style={S.grid2}>
                <Field label="Before this event" value={a.arcBefore||""} onChange={v=>upAttr(cid,"arcBefore",v)} placeholder="Who they are walking in…"/>
                <Field label="After this event" value={a.arcAfter||""} onChange={v=>upAttr(cid,"arcAfter",v)} placeholder="How this changes them…"/>
              </div>
              <Field label="AI narrator note" value={a.notes||""} onChange={v=>upAttr(cid,"notes",v)} multi rows={2}
                placeholder="Private instruction. Subtext, what they can't say, how to betray the wound without naming it."/>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

// ── Fight Simulation ──────────────────────────────────────────────────────────
const POWER_SCORE = { Latent:1, Awakening:2, Capable:3, Skilled:4, Elite:5, Peak:6, Transcendent:7 };
const COND_PENALTY = { Physical:-1, Wounded:-1.5, Mental:-0.5, Cursed:-0.5, Spiritual:0, Social:0, Blessed:1, Enhanced:1 };

function scoreFighter(char, events, atEventId) {
  let score = 0;
  const notes = [];

  // Power tier from selected event or latest
  const resolveEvent = atEventId ? events.find(e=>e.id===atEventId) : [...events].sort((a,b)=>b.time-a.time).find(e=>(e.characters||[]).includes(char.id));
  const attr = resolveEvent ? (char.attributes?.[resolveEvent.id]||{}) : {};
  const powerTier = attr.power || "";
  const powerPts = POWER_SCORE[powerTier] || 0;
  if (powerPts) { score += powerPts * 3; notes.push({ label:"Power tier", value:powerTier, pts:powerPts*3, positive:true }); }

  // Skills (equipped = active, count weighted by upside/downside)
  const skills = (char.skills||[]);
  const skillPts = skills.length * 1.2;
  if (skillPts) { score += skillPts; notes.push({ label:"Skills", value:`${skills.length} known`, pts:Math.round(skillPts*10)/10, positive:true }); }

  // Equipment — only Equipped items count
  const equippedItems = (char.equipment||[]).filter(eq=>(eq.accessState||"Equipped")==="Equipped");
  const storedItems   = (char.equipment||[]).filter(eq=>(eq.accessState||"Equipped")==="Stored");
  const noAccessItems = (char.equipment||[]).filter(eq=>(eq.accessState||"Equipped")==="No Access");
  const cursedEquipped = equippedItems.filter(eq=>eq.curses&&eq.curses.trim());
  const equipPts = equippedItems.length * 1.0 - cursedEquipped.length * 0.5;
  if (equippedItems.length) { score += equipPts; notes.push({ label:"Equipped items", value:`${equippedItems.length} on body${cursedEquipped.length?`, ${cursedEquipped.length} cursed`:""}`, pts:Math.round(equipPts*10)/10, positive:equipPts>=0 }); }
  if (noAccessItems.length) notes.push({ label:"No access items", value:`${noAccessItems.length} unavailable`, pts:0, positive:false, neutral:true });
  if (storedItems.length)   notes.push({ label:"Stored items", value:`${storedItems.length} not worn`, pts:0, positive:false, neutral:true });

  // Active conditions
  const activeConditions = (char.conditions||[]).filter(cd=>cd.isActive);
  for (const cd of activeConditions) {
    const pen = COND_PENALTY[cd.type] ?? 0;
    if (pen !== 0) { score += pen; notes.push({ label:`Condition: ${cd.name}`, value:`[${cd.type}]`, pts:pen, positive:pen>0 }); }
  }

  // Achievements & losses
  const achievePts = (char.achievements||[]).length * 0.3;
  const lossPts    = (char.losses||[]).length * -0.15;
  if (achievePts) { score += achievePts; notes.push({ label:"Achievements", value:`${char.achievements.length}`, pts:Math.round(achievePts*10)/10, positive:true }); }
  if (lossPts)    { score += lossPts;    notes.push({ label:"Losses",       value:`${char.losses.length}`,       pts:Math.round(lossPts*10)/10, positive:false }); }

  // Arc stage modifier
  const ARC_MOD = { Unaware:0, Questioning:0.2, Resisting:0.5, Breaking:1, Transforming:1.5, Integrated:2 };
  const arcMod = ARC_MOD[attr.arcStage] ?? 0;
  if (arcMod) { score += arcMod; notes.push({ label:"Arc stage", value:attr.arcStage, pts:arcMod, positive:true }); }

  // Emotional state penalty/boost (simple keyword scan)
  const emo = (attr.emotionalState||"").toLowerCase();
  if (emo.includes("grief")||emo.includes("broken")||emo.includes("despair")) { score -= 1; notes.push({ label:"Emotional state", value:attr.emotionalState, pts:-1, positive:false }); }
  else if (emo.includes("resolute")||emo.includes("focused")||emo.includes("calm")) { score += 0.5; notes.push({ label:"Emotional state", value:attr.emotionalState, pts:0.5, positive:true }); }
  else if (emo.includes("rage")||emo.includes("fury")) { score += 0.3; notes.push({ label:"Emotional state", value:attr.emotionalState, pts:0.3, positive:true }); }

  return { score: Math.max(0.1, score), notes, attr, resolveEvent };
}

function FightSim({ state }) {
  const chars = state.characters;
  const [aId, setAId] = useState(chars[0]?.id||"");
  const [bId, setBId] = useState(chars[1]?.id||"");
  const [aEventId, setAEventId] = useState("");
  const [bEventId, setBEventId] = useState("");

  const charA = chars.find(c=>c.id===aId);
  const charB = chars.find(c=>c.id===bId);

  const ready = charA && charB && charA.id !== charB.id;
  const resultA = ready ? scoreFighter(charA, state.events, aEventId) : null;
  const resultB = ready ? scoreFighter(charB, state.events, bEventId) : null;

  const total  = ready ? resultA.score + resultB.score : 1;
  const pctA   = ready ? Math.round((resultA.score / total) * 100) : 50;
  const pctB   = ready ? 100 - pctA : 50;

  const colA = charA?.color || "#2980b9";
  const colB = charB?.color || "#c0392b";

  const NoteRow = ({ n, color }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", borderBottom:"1px solid #e0ddd8", fontSize:12 }}>
      <span style={{ color:"#444" }}>{n.label}: <span style={{ color:"#1a1a1a" }}>{n.value}</span></span>
      {!n.neutral && <span style={{ color: n.positive ? "#27ae60" : "#c0392b", fontWeight:500, minWidth:40, textAlign:"right" }}>
        {n.pts > 0 ? "+" : ""}{n.pts}
      </span>}
      {n.neutral && <span style={{ color:"#aaa", fontSize:11, minWidth:40, textAlign:"right" }}>info</span>}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#1a1a1a", marginBottom:4 }}>Fight Simulation</p>
        <p style={{ ...S.dim }}>Compare two characters at any point in the timeline. Win % is calculated from power tier, skills, equipped items, conditions, arc stage, and emotional state.</p>
      </div>

      {chars.length < 2 && (
        <p style={{ ...S.dim, fontStyle:"italic" }}>Add at least two characters to use the fight simulator.</p>
      )}

      {chars.length >= 2 && (
        <>
          {/* Fighter pickers */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:"0 24px", alignItems:"center", marginBottom:28 }}>
            <div>
              <label style={S.label}>Fighter A</label>
              <select value={aId} onChange={e=>setAId(e.target.value)} style={{...S.select,width:"100%"}}>
                <option value="">— select —</option>
                {chars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {charA && (
                <div style={{ marginTop:8 }}>
                  <EventPicker label="At timeline point" value={aEventId} onChange={setAEventId} events={state.events.filter(e=>(e.characters||[]).includes(charA.id))}/>
                </div>
              )}
            </div>
            <div style={{ textAlign:"center", paddingTop:20, fontSize:16, color:"#aaa", letterSpacing:2 }}>vs</div>
            <div>
              <label style={S.label}>Fighter B</label>
              <select value={bId} onChange={e=>setBId(e.target.value)} style={{...S.select,width:"100%"}}>
                <option value="">— select —</option>
                {chars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {charB && (
                <div style={{ marginTop:8 }}>
                  <EventPicker label="At timeline point" value={bEventId} onChange={setBEventId} events={state.events.filter(e=>(e.characters||[]).includes(charB.id))}/>
                </div>
              )}
            </div>
          </div>

          {!ready && <p style={S.dim}>Select two different characters to simulate.</p>}

          {ready && (
            <>
              {/* Win bar */}
              <div style={{ marginBottom:28 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:colA, fontWeight:500 }}>{charA.name} — {pctA}%</span>
                  <span style={{ fontSize:13, color:colB, fontWeight:500 }}>{pctB}% — {charB.name}</span>
                </div>
                <div style={{ height:24, borderRadius:2, overflow:"hidden", display:"flex" }}>
                  <div style={{ width:`${pctA}%`, background:colA, transition:"width 0.4s" }}/>
                  <div style={{ width:`${pctB}%`, background:colB, transition:"width 0.4s" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}>
                  {pctA === pctB
                    ? <span style={{ ...S.dim, fontSize:13 }}>Even match</span>
                    : <span style={{ fontSize:13, color: pctA > pctB ? colA : colB, fontWeight:500 }}>
                        {pctA > pctB ? charA.name : charB.name} has the edge ({Math.abs(pctA-pctB)}% margin)
                      </span>
                  }
                </div>
              </div>

              {/* Event context */}
              <div style={{ ...S.grid2, marginBottom:20 }}>
                <div style={{ padding:"8px 12px", background:"#f5f3f0", borderRadius:2, borderLeft:`3px solid ${colA}` }}>
                  <p style={{ ...S.dim, marginBottom:4 }}>Snapshot</p>
                  <p style={{ fontSize:12, color:"#1a1a1a" }}>{resultA.resolveEvent ? `T${resultA.resolveEvent.time} — ${resultA.resolveEvent.title}` : "No timeline data"}</p>
                  {resultA.attr.power && <p style={{ fontSize:11, color:"#444" }}>Power: {resultA.attr.power}</p>}
                </div>
                <div style={{ padding:"8px 12px", background:"#f5f3f0", borderRadius:2, borderLeft:`3px solid ${colB}` }}>
                  <p style={{ ...S.dim, marginBottom:4 }}>Snapshot</p>
                  <p style={{ fontSize:12, color:"#1a1a1a" }}>{resultB.resolveEvent ? `T${resultB.resolveEvent.time} — ${resultB.resolveEvent.title}` : "No timeline data"}</p>
                  {resultB.attr.power && <p style={{ fontSize:11, color:"#444" }}>Power: {resultB.attr.power}</p>}
                </div>
              </div>

              {/* Score breakdowns */}
              <div style={S.grid2}>
                <div>
                  <p style={{ ...S.h2, color:colA, marginBottom:8 }}>{charA.name} — score: {Math.round(resultA.score*10)/10}</p>
                  {resultA.notes.map((n,i)=><NoteRow key={i} n={n} color={colA}/>)}
                  {!resultA.notes.length && <p style={S.dim}>No data found.</p>}
                </div>
                <div>
                  <p style={{ ...S.h2, color:colB, marginBottom:8 }}>{charB.name} — score: {Math.round(resultB.score*10)/10}</p>
                  {resultB.notes.map((n,i)=><NoteRow key={i} n={n} color={colB}/>)}
                  {!resultB.notes.length && <p style={S.dim}>No data found.</p>}
                </div>
              </div>

              <hr style={{...S.rule,margin:"24px 0 12px"}}/>
              <p style={{...S.dim,fontSize:11}}>Scoring: power tier (×3), skills (×1.2 each), equipped items (×1, −0.5 per cursed), conditions (varies by type), arc stage (0–2), emotional state (±0.3–1.5), achievements (+0.3 each), losses (−0.15 each). Items not equipped or inaccessible do not contribute to combat score.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Export modal ──────────────────────────────────────────────────────────────
function ExportModal({ state, onClose }) {
  const text = buildExport(state);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(250,249,247,0.94)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:"min(700px,92vw)", display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={S.h2}>Export for AI</span>
          <div style={{ display:"flex", gap:20 }}>
            <button onClick={copy} style={{...S.ghost,color:copied?"#27ae60":"#333"}}>{copied?"Copied":"Copy all"}</button>
            <button onClick={onClose} style={S.ghost}>Close</button>
          </div>
        </div>
        <p style={S.dim}>Paste into your AI's system prompt. Full psychology, conditions, skills, equipment, achievements, losses, relationships, world entities, and behavioral guidance.</p>
        <textarea readOnly value={text} style={{
          ...S.textarea, borderBottom:"none", background:"#f0ede8", padding:20, borderRadius:4,
          height:460, resize:"none", fontFamily:"monospace", fontSize:12, lineHeight:1.7,
        }}/>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
const INIT = {
  title:"Untitled world", synopsis:"", setting:"", themes:"", rules:"",
  nations:[], techniques:[], ingredients:[], monsters:[], treasures:[],
  events:[{ id:uid(), time:1, title:"The story begins", type:"Story", chapter:"", date:"", setting:"", description:"", consequence:"", characters:[] }],
  characters:[],
};

export default function App() {
  const [state, setState] = useState(INIT);
  const [view, setView]   = useState("world");
  const [selected, setSelected] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const addChar = () => {
    const c = mkChar(`Character ${state.characters.length+1}`, CHAR_COLORS[state.characters.length%CHAR_COLORS.length]);
    setState(s=>({...s,characters:[...s.characters,c]}));
    setView("characters"); setSelected(c.id);
  };
  const delChar = (id) => {
    setState(s=>({...s,characters:s.characters.filter(c=>c.id!==id),events:s.events.map(e=>({...e,characters:(e.characters||[]).filter(x=>x!==id)}))}));
    if(selected===id) setSelected(null);
  };
  const addEvent = () => {
    const maxT = state.events.reduce((m,e)=>Math.max(m,e.time),0);
    const e = { ...mkEvent(), time: maxT + 1 };
    setState(s=>({...s,events:[...s.events,e]}));
    setView("events"); setSelected(e.id);
  };
  const delEvent = (id) => {
    setState(s=>({...s,events:s.events.filter(e=>e.id!==id)}));
    if(selected===id) setSelected(null);
  };

  const selEvent  = state.events.find(e=>e.id===selected);
  const selChar   = state.characters.find(c=>c.id===selected);
  const sortedEvt = [...state.events].sort((a,b)=>a.time-b.time);

  const navBtn = (id, label) => (
    <button onClick={()=>{setView(id);setSelected(null);}} style={{
      ...S.ghost, fontSize:11, letterSpacing:2, textTransform:"uppercase",
      color: view===id && !selected ? "#1a1a1a" : "#444",
    }}>{label}</button>
  );

  // world entity counts for sidebar label
  const worldCount = (state.nations||[]).length+(state.techniques||[]).length+(state.ingredients||[]).length+(state.monsters||[]).length+(state.treasures||[]).length;

  return (
    <div style={S.app}>
      <div style={S.top}>
        <span style={S.logo}>Seshat</span>
        <input value={state.title} onChange={e=>setState(s=>({...s,title:e.target.value}))}
          style={{...S.input,width:240,textAlign:"center",borderBottom:"none",fontSize:13,color:"#555",letterSpacing:1}}/>
        <button onClick={()=>setShowExport(true)} style={{...S.ghost,letterSpacing:2}}>Export for AI</button>
        <button onClick={()=>{setView("fight");setSelected(null);}} style={{...S.ghost,letterSpacing:2,color:view==="fight"?"#c0392b":"#444",borderBottom:view==="fight"?"1px solid #c0392b":"none"}}>⚔ Fight</button>
      </div>

      <div style={S.row}>
        <div style={S.side}>
          <div style={{ padding:"0 24px 10px" }}>{navBtn("world", worldCount>0?`World (${worldCount})`:"World")}</div>
          <div style={{ height:1, background:"#e0ddd8", margin:"4px 0 10px" }}/>
          <div style={{ padding:"0 24px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            {navBtn("events","Timeline")}
            <button onClick={addEvent} style={{...S.ghost,fontSize:16}}>+</button>
          </div>
          {sortedEvt.map(e=>{
            const tag = [e.chapter&&`Ch.${e.chapter}`,e.date].filter(Boolean).join(" · ");
            return (
              <SideItem key={e.id} label={e.title}
                sub={`T${e.time}${tag?` · ${tag}`:""} · ${e.type}`}
                active={selected===e.id && view==="events"}
                onClick={()=>{setView("events");setSelected(e.id);}}
                onDelete={()=>delEvent(e.id)}/>
            );
          })}
          <div style={{ height:1, background:"#e0ddd8", margin:"12px 0 10px" }}/>
          <div style={{ padding:"0 24px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            {navBtn("characters","Characters")}
            <button onClick={addChar} style={{...S.ghost,fontSize:16}}>+</button>
          </div>
          {state.characters.map(c=>(
            <SideItem key={c.id} label={c.name}
              sub={[c.role,c.archetype].filter(Boolean).join(" · ")||undefined}
              color={c.color}
              active={selected===c.id && view==="characters"}
              onClick={()=>{setView("characters");setSelected(c.id);}}
              onDelete={()=>delChar(c.id)}/>
          ))}
        </div>

        <div style={S.main}>
          {view==="world" && !selected && <WorldSheet state={state} setState={setState}/>}
          {view==="fight" && <FightSim state={state}/>}
          {view==="events" && selEvent && <EventSheet event={selEvent} state={state} setState={setState}/>}
          {view==="characters" && selChar && <CharSheet char={selChar} state={state} setState={setState}/>}
          {((view==="events"&&!selEvent)||(view==="characters"&&!selChar)) && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:8 }}>
              <p style={{...S.dim,fontSize:13,letterSpacing:1}}>Select an item from the sidebar</p>
              <p style={{...S.dim,fontSize:11}}>or use the + buttons to add</p>
            </div>
          )}
        </div>
      </div>

      {showExport && <ExportModal state={state} onClose={()=>setShowExport(false)}/>}
    </div>
  );
}

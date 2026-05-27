import { worldStore } from '../store/worldStore';
import { useWorldTitle, useSynopsis, useSetting, useThemes, useRules, useNations, useTechniques, useIngredients, useMonsters, useTreasures } from '../hooks/useWorldStore';
import { mkNation, mkMonster, mkTechnique, mkIngredient, mkTreasure, S } from '../lib/utils';
import { Sel } from '../components/ui';
import { Section } from '../components/ui/Section';
import { EntryBlock } from '../components/ui/EntryBlock';
import { NAT_TYPES, TECH_TYPES, RARITY, MON_TIERS } from '../lib/constants';
import { TextField, Button, styled } from '@mui/material';

const StyledTextField = styled(TextField)(() => ({
  width: '100%',
  '& .MuiInputBase-root': {
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    color: '#1a1a1a',
    background: 'transparent',
    '&:before': { borderBottom: '1px solid #bbb' },
    '&:after': { borderBottom: '1px solid #bbb' },
  },
  '& .MuiInputLabel-root': {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#444',
  },
}));

const GhostButton = styled(Button)(() => ({
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  color: '#333',
  letterSpacing: 1,
  padding: '4px 0',
  textTransform: 'none',
  background: 'none',
  '&:hover': { background: 'none' },
}));

export default function WorldPage() {
  const title = useWorldTitle();
  const synopsis = useSynopsis();
  const setting = useSetting();
  const themes = useThemes();
  const rules = useRules();
  const nations = useNations();
  const techniques = useTechniques();
  const ingredients = useIngredients();
  const monsters = useMonsters();
  const treasures = useTreasures();

  const setTitle = (v: string) => worldStore.title.set(v);
  const setSynopsis = (v: string) => worldStore.synopsis.set(v);
  const setSetting = (v: string) => worldStore.setting.set(v);
  const setThemes = (v: string) => worldStore.themes.set(v);
  const setRules = (v: string) => worldStore.rules.set(v);

const add = (field: string, mk: () => any) => (worldStore as any)[field].push(mk());
   const del = (field: string, id: string) => (worldStore as any)[field].set((prev: any[]) => prev.filter((x: any) => x.id !== id));
   const update = (field: string, id: string, key: string, v: string) => {
     const idx = ((worldStore as any)[field].get() as any[]).findIndex((x: any) => x.id === id);
     if (idx >= 0) (worldStore as any)[field][idx][key].set(v);
   };

  const Field = ({ label, value, onChange, multi, placeholder = "", rows = 3 }: { label?: string; value: string; onChange: (v: string) => void; multi?: boolean; placeholder?: string; rows?: number }) => (
    <StyledTextField
      label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      multiline={multi}
      rows={multi ? rows : undefined}
      placeholder={placeholder}
      variant="standard"
      fullWidth
    />
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <StyledTextField value={title} onChange={e => setTitle(e.target.value)}
          variant="standard" fullWidth sx={{ fontSize: 22, borderBottom: "none", '& .MuiInputBase-input': { fontSize: 22, padding: 0 } }} />
      </div>
      <Field label="Synopsis / premise" value={synopsis || ""} onChange={setSynopsis} multi rows={4} placeholder="What is this world? What is the central tension?" />
      <Field label="Setting" value={setting || ""} onChange={setSetting} placeholder="Time period, place, atmosphere…" />
      <Field label="Themes" value={themes || ""} onChange={setThemes} placeholder="The ideas the story is really about…" />
      <Field label="World rules / logic" value={rules || ""} onChange={setRules} multi rows={3} placeholder="Magic systems, political structures, physical laws…" />

      <Section title={`Nations & Factions (${nations.length})`} action={<GhostButton onClick={() => add("nations", mkNation)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Kingdoms, empires, tribes, hidden societies. The political landscape your characters live inside.</p>
        {nations.map((n: any) => (
          <EntryBlock key={n.id} color="#2c3e50" onDelete={() => del("nations", n.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={n.name} onChange={v => update("nations", n.id, "name", v)} placeholder="The Iron Dominion…" />
              <Sel label="Type" value={n.type} onChange={v => update("nations", n.id, "type", v)} opts={NAT_TYPES} />
              <Field label="Capital" value={n.capital || ""} onChange={v => update("nations", n.id, "capital", v)} placeholder="Ashveil…" />
            </div>
            <div style={S.grid2}>
              <Field label="Ruler / governing power" value={n.ruler || ""} onChange={v => update("nations", n.id, "ruler", v)} placeholder="Emperor Kael the Blind…" />
              <Field label="Population / scale" value={n.population || ""} onChange={v => update("nations", n.id, "population", v)} placeholder="12 million, mostly agrarian…" />
            </div>
            <Field label="Geography" value={n.geography || ""} onChange={v => update("nations", n.id, "geography", v)} placeholder="Frozen tundra split by the Ashen River…" />
            <div style={S.grid2}>
              <Field label="Culture & customs" value={n.culture || ""} onChange={v => update("nations", n.id, "culture", v)} multi rows={2} placeholder="Warrior-scholars. Death rites, honor debts…" />
              <Field label="Military power" value={n.military || ""} onChange={v => update("nations", n.id, "military", v)} multi rows={2} placeholder="50,000 standing army. Elite Grave Knights…" />
            </div>
            <div style={S.grid2}>
              <Field label="Economy & resources" value={n.economy || ""} onChange={v => update("nations", n.id, "economy", v)} placeholder="Exports void iron, imports grain…" />
              <Field label="Allies" value={n.allies || ""} onChange={v => update("nations", n.id, "allies", v)} placeholder="The Sea Confederacy…" />
              <Field label="Enemies" value={n.enemies || ""} onChange={v => update("nations", n.id, "enemies", v)} placeholder="The Free Holds…" />
            </div>
            <Field label="Hidden secrets" value={n.secrets || ""} onChange={v => update("nations", n.id, "secrets", v)} multi rows={2} placeholder="The emperor is already dead. The throne is controlled by…" />
            <Field label="Lore & history" value={n.lore || ""} onChange={v => update("nations", n.id, "lore", v)} multi rows={3} placeholder="Founded 400 years ago after the Collapse…" />
          </EntryBlock>
        ))}
        {!nations.length && <p style={S.dim}>No nations yet.</p>}
      </Section>

      <Section title={`Techniques (${techniques.length})`} action={<GhostButton onClick={() => add("techniques", mkTechnique)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Martial arts, blacksmithing schools, biological arts, forbidden knowledge. How things are made and mastered in this world.</p>
        {techniques.map((t: any) => (
          <EntryBlock key={t.id} color="#16a085" onDelete={() => del("techniques", t.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={t.name || ""} onChange={v => update("techniques", t.id, "name", v)} placeholder="Void Step Discipline…" />
              <Sel label="Type" value={t.type} onChange={v => update("techniques", t.id, "type", v)} opts={TECH_TYPES} />
              <Field label="Era / period" value={t.era || ""} onChange={v => update("techniques", t.id, "era", v)} placeholder="Ancient, Third Age…" />
            </div>
            <div style={S.grid2}>
              <Field label="Origin / where it came from" value={t.origin || ""} onChange={v => update("techniques", t.id, "origin", v)} placeholder="Born in the monastery of the silent…" />
              <Field label="Creator (if known)" value={t.creator || ""} onChange={v => update("techniques", t.id, "creator", v)} placeholder="The Blind Master, unknown…" />
            </div>
            <Field label="What it does / how it works" value={t.description || ""} onChange={v => update("techniques", t.id, "description", v)} multi rows={3} placeholder="A martial discipline that bends the practitioner's shadow into a physical weapon…" />
            <Field label="Effects & power" value={t.effect || ""} onChange={v => update("techniques", t.id, "effect", v)} multi rows={2} placeholder="Can intercept attacks, strike from unexpected angles, blind opponents…" />
            <div style={S.grid2}>
              <Field label="Requirements to learn" value={t.requirement || ""} onChange={v => update("techniques", t.id, "requirement", v)} placeholder="Must have lost something precious, years of darkness training…" />
              <Field label="Cost / price of mastery" value={t.cost || ""} onChange={v => update("techniques", t.id, "cost", v)} placeholder="Gradual blindness, shortened lifespan…" />
            </div>
            <Field label="Secrets / hidden layers" value={t.secret || ""} onChange={v => update("techniques", t.id, "secret", v)} multi rows={2} placeholder="The true final form requires the practitioner to sacrifice their name…" />
            <Field label="Lore" value={t.lore || ""} onChange={v => update("techniques", t.id, "lore", v)} multi rows={2} placeholder="Lost for three centuries until a wandering monk rediscovered the scrolls…" />
          </EntryBlock>
        ))}
        {!techniques.length && <p style={S.dim}>No techniques yet.</p>}
      </Section>

      <Section title={`Ingredients & Resources (${ingredients.length})`} action={<GhostButton onClick={() => add("ingredients", mkIngredient)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Materials, herbs, minerals, essences. The raw stuff of your world — what things are made from.</p>
        {ingredients.map((i: any) => (
          <EntryBlock key={i.id} color="#d35400" onDelete={() => del("ingredients", i.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={i.name || ""} onChange={v => update("ingredients", i.id, "name", v)} placeholder="Void iron, Moonpetal…" />
              <Sel label="Rarity" value={i.rarity} onChange={v => update("ingredients", i.id, "rarity", v)} opts={RARITY} />
              <Field label="Found at / habitat" value={i.location || ""} onChange={v => update("ingredients", i.id, "location", v)} placeholder="Deep rift mines, only in eclipse season…" />
            </div>
            <div style={S.grid2}>
              <Field label="Appearance" value={i.appearance || ""} onChange={v => update("ingredients", i.id, "appearance", v)} placeholder="Black ore with crimson veins that pulse…" />
              <Field label="Properties / nature" value={i.properties || ""} onChange={v => update("ingredients", i.id, "properties", v)} placeholder="Absorbs light, conducts soul energy…" />
            </div>
            <Field label="Uses — what it makes or enables" value={i.uses || ""} onChange={v => update("ingredients", i.id, "uses", v)} multi rows={2} placeholder="Used in forging void-touched weapons, cursed armor, binding rituals…" />
            <Field label="Danger / handling risks" value={i.danger || ""} onChange={v => update("ingredients", i.id, "danger", v)} placeholder="Prolonged contact causes memory erosion…" />
            <Field label="Lore" value={i.lore || ""} onChange={v => update("ingredients", i.id, "lore", v)} multi rows={2} placeholder="Once abundant before the Sundering…" />
          </EntryBlock>
        ))}
        {!ingredients.length && <p style={S.dim}>No ingredients yet.</p>}
      </Section>

      <Section title={`Monsters (${monsters.length})`} action={<GhostButton onClick={() => add("monsters", mkMonster)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Creatures, beasts, horrors. What hunts your characters — and what drops when they die.</p>
        {monsters.map((m: any) => (
          <EntryBlock key={m.id} color="#c0392b" onDelete={() => del("monsters", m.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={m.name || ""} onChange={v => update("monsters", m.id, "name", v)} placeholder="Hollow Warden…" />
              <Sel label="Tier" value={m.tier} onChange={v => update("monsters", m.id, "tier", v)} opts={MON_TIERS} />
              <Field label="Habitat" value={m.habitat || ""} onChange={v => update("monsters", m.id, "habitat", v)} placeholder="Rifts, abandoned fortresses…" />
            </div>
            <Field label="Appearance" value={m.appearance || ""} onChange={v => update("monsters", m.id, "appearance", v)} multi rows={2} placeholder="Twelve feet tall, skin of cracked obsidian, no face — only a hollow screaming mouth…" />
            <Field label="Behavior / intelligence" value={m.behavior || ""} onChange={v => update("monsters", m.id, "behavior", v)} multi rows={2} placeholder="Hunts by fear-scent. Territorial. Will not cross running water…" />
            <Field label="Abilities / attacks" value={m.abilities || ""} onChange={v => update("monsters", m.id, "abilities", v)} multi rows={2} placeholder="Soul-shriek (paralyzes), Void-step (teleport), Regeneration…" />
            <div style={S.grid2}>
              <Field label="Weaknesses" value={m.weaknesses || ""} onChange={v => update("monsters", m.id, "weaknesses", v)} placeholder="Sunlight, salt circles, named iron…" />
              <Field label="What it drops" value={m.drops || ""} onChange={v => update("monsters", m.id, "drops", v)} placeholder="Hollow core (ingredient), Warden's eye (relic)…" />
            </div>
            <Field label="First recorded encounter" value={m.firstSeen || ""} onChange={v => update("monsters", m.id, "firstSeen", v)} placeholder="T3 — The Rift of Asveth" />
            <Field label="Lore" value={m.lore || ""} onChange={v => update("monsters", m.id, "lore", v)} multi rows={2} placeholder="Once human. Created when the Ritual of Unmaking was performed incomplete…" />
          </EntryBlock>
        ))}
        {!monsters.length && <p style={S.dim}>No monsters yet.</p>}
      </Section>

      <Section title={`Treasures & Artifacts (${treasures.length})`} action={<GhostButton onClick={() => add("treasures", mkTreasure)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>World-level relics, legendary items not yet held by anyone. When a character claims one, add it to their equipment too.</p>
        {treasures.map((tr: any) => (
          <EntryBlock key={tr.id} color="#e67e22" onDelete={() => del("treasures", tr.id)}>
            <div style={S.grid3}>
              <Field label="Name" value={tr.name || ""} onChange={v => update("treasures", tr.id, "name", v)} placeholder="The Ashen Crown…" />
              <Sel label="Rarity" value={tr.rarity} onChange={v => update("treasures", tr.id, "rarity", v)} opts={RARITY} />
              <Field label="Current location" value={tr.location || ""} onChange={v => update("treasures", tr.id, "location", v)} placeholder="Sealed in the Tomb of Kael…" />
            </div>
            <Field label="Description" value={tr.description || ""} onChange={v => update("treasures", tr.id, "description", v)} multi rows={2} placeholder="A crown of blackened bone that weeps silver tears…" />
            <Field label="Stats & powers" value={tr.stats || ""} onChange={v => update("treasures", tr.id, "stats", v)} multi rows={3} placeholder="+200 to all attributes · Grants command over the dead · Doubles soul capacity…" />
            <div style={S.grid2}>
              <Field label="Curses (if any)" value={tr.curses || ""} onChange={v => update("treasures", tr.id, "curses", v)} multi rows={2} placeholder="Slowly replaces the wearer's blood with void-water…" />
              <Field label="Condition to unbind curse" value={tr.unbindCondition || ""} onChange={v => update("treasures", tr.id, "unbindCondition", v)} multi rows={2} placeholder="Worn by its creator's descendant during a solar eclipse…" />
            </div>
            <div style={S.grid2}>
              <Field label="Creator" value={tr.creator || ""} onChange={v => update("treasures", tr.id, "creator", v)} placeholder="The God-Smith Velath…" />
              <Field label="Ingredients / materials" value={tr.ingredients || ""} onChange={v => update("treasures", tr.id, "ingredients", v)} placeholder="God-bone, first tears, void iron…" />
            </div>
            <Field label="History" value={tr.history || ""} onChange={v => update("treasures", tr.id, "history", v)} multi rows={3} placeholder="Forged to end the First War. Shattered into three pieces. Reassembled once, with catastrophic results…" />
          </EntryBlock>
        ))}
        {!treasures.length && <p style={S.dim}>No treasures yet.</p>}
      </Section>
    </div>
  );
}
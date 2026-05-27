import { worldStore } from "../store/worldStore";
import {
  useWorldTitle,
  useSynopsis,
  useSetting,
  useThemes,
  useRules,
  useNations,
  useTechniques,
  useIngredients,
  useMonsters,
  useTreasures,
} from "../hooks/useWorldStore";
import {
  mkNation,
  mkMonster,
  mkTechnique,
  mkIngredient,
  mkTreasure,
  S,
} from "../lib/utils";
import { Field, Sel, Section, EntryBlock } from "../components/ui";
import { NAT_TYPES, TECH_TYPES, RARITY, MON_TIERS } from "../lib/constants";
import { Button, styled } from "@mui/material";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type {
  Nation,
  Technique,
  Ingredient,
  Monster,
  Treasure,
} from "../store/worldStore";

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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const add = (field: string, mk: () => any) =>
    (worldStore as any)[field].push(mk());
  const del = (field: string, id: string) =>
    (worldStore as any)[field].set((prev: any[]) =>
      prev.filter((x: any) => x.id !== id),
    );
  const update = (field: string, id: string, key: string, v: string) => {
    const idx = ((worldStore as any)[field].get() as any[]).findIndex(
      (x: any) => x.id === id,
    );
    if (idx >= 0) (worldStore as any)[field][idx][key].set(v);
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const ref = useAnimateIn();

  return (
    <div ref={ref}>
      {/* ── Title ── */}
      <div style={{ marginBottom: 24 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            ...S.input,
            fontSize: 22,
            border: "none",
            padding: 0,
            color: "var(--text-primary)",
          }}
        />
      </div>

      <Field
        label="Synopsis / premise"
        value={synopsis || ""}
        onChange={setSynopsis}
        multi
        rows={4}
        placeholder="What is this world? What is the central tension?"
      />
      <Field
        label="Setting"
        value={setting || ""}
        onChange={setSetting}
        placeholder="Time period, place, atmosphere…"
      />
      <Field
        label="Themes"
        value={themes || ""}
        onChange={setThemes}
        placeholder="The ideas the story is really about…"
      />
      <Field
        label="World rules / logic"
        value={rules || ""}
        onChange={setRules}
        multi
        rows={3}
        placeholder="Magic systems, political structures, physical laws…"
      />

      {/* ── Nations ── */}
      <Section
        title={`Nations & Factions (${nations.length})`}
        action={
          <GhostButton onClick={() => add("nations", mkNation)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Kingdoms, empires, tribes, hidden societies. The political landscape
          your characters live inside.
        </p>
        {nations.map((n: Nation) => (
          <EntryBlock
            key={n.id}
            color="var(--color-dark)"
            onDelete={() => del("nations", n.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={n.name || ""}
                onChange={(v) => update("nations", n.id, "name", v)}
                placeholder="The Iron Dominion…"
              />
              <Sel
                label="Type"
                value={n.type || ""}
                onChange={(v) => update("nations", n.id, "type", v)}
                opts={NAT_TYPES}
              />
              <Field
                label="Capital"
                value={n.capital || ""}
                onChange={(v) => update("nations", n.id, "capital", v)}
                placeholder="Ashveil…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Ruler / governing power"
                value={n.ruler || ""}
                onChange={(v) => update("nations", n.id, "ruler", v)}
                placeholder="Emperor Kael the Blind…"
              />
              <Field
                label="Population / scale"
                value={n.population || ""}
                onChange={(v) => update("nations", n.id, "population", v)}
                placeholder="12 million, mostly agrarian…"
              />
            </div>
            <Field
              label="Geography"
              value={n.geography || ""}
              onChange={(v) => update("nations", n.id, "geography", v)}
              placeholder="Frozen tundra split by the Ashen River…"
            />
            <div style={S.grid2}>
              <Field
                label="Culture & customs"
                value={n.culture || ""}
                onChange={(v) => update("nations", n.id, "culture", v)}
                multi
                rows={2}
                placeholder="Warrior-scholars. Death rites, honor debts…"
              />
              <Field
                label="Military power"
                value={n.military || ""}
                onChange={(v) => update("nations", n.id, "military", v)}
                multi
                rows={2}
                placeholder="50,000 standing army. Elite Grave Knights…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Economy & resources"
                value={n.economy || ""}
                onChange={(v) => update("nations", n.id, "economy", v)}
                placeholder="Exports void iron, imports grain…"
              />
              <Field
                label="Allies"
                value={n.allies || ""}
                onChange={(v) => update("nations", n.id, "allies", v)}
                placeholder="The Sea Confederacy…"
              />
              <Field
                label="Enemies"
                value={n.enemies || ""}
                onChange={(v) => update("nations", n.id, "enemies", v)}
                placeholder="The Free Holds…"
              />
            </div>
            <Field
              label="Hidden secrets"
              value={n.secrets || ""}
              onChange={(v) => update("nations", n.id, "secrets", v)}
              multi
              rows={2}
              placeholder="The emperor is already dead. The throne is controlled by…"
            />
            <Field
              label="Lore & history"
              value={n.lore || ""}
              onChange={(v) => update("nations", n.id, "lore", v)}
              multi
              rows={3}
              placeholder="Founded 400 years ago after the Collapse…"
            />
          </EntryBlock>
        ))}
        {!nations.length && <p style={S.dim}>No nations yet.</p>}
      </Section>

      {/* ── Techniques ── */}
      <Section
        title={`Techniques (${techniques.length})`}
        action={
          <GhostButton onClick={() => add("techniques", mkTechnique)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Martial arts, blacksmithing schools, biological arts, forbidden
          knowledge. How things are made and mastered in this world.
        </p>
        {techniques.map((t: Technique) => (
          <EntryBlock
            key={t.id}
            color="var(--color-teal)"
            onDelete={() => del("techniques", t.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={t.name || ""}
                onChange={(v) => update("techniques", t.id, "name", v)}
                placeholder="Void Step Discipline…"
              />
              <Sel
                label="Type"
                value={t.type || ""}
                onChange={(v) => update("techniques", t.id, "type", v)}
                opts={TECH_TYPES}
              />
              <Field
                label="Era / period"
                value={t.era || ""}
                onChange={(v) => update("techniques", t.id, "era", v)}
                placeholder="Ancient, Third Age…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Origin / where it came from"
                value={t.origin || ""}
                onChange={(v) => update("techniques", t.id, "origin", v)}
                placeholder="Born in the monastery of the silent…"
              />
              <Field
                label="Creator (if known)"
                value={t.creator || ""}
                onChange={(v) => update("techniques", t.id, "creator", v)}
                placeholder="The Blind Master, unknown…"
              />
            </div>
            <Field
              label="What it does / how it works"
              value={t.description || ""}
              onChange={(v) => update("techniques", t.id, "description", v)}
              multi
              rows={3}
              placeholder="A martial discipline that bends the practitioner's shadow…"
            />
            <Field
              label="Effects & power"
              value={t.effect || ""}
              onChange={(v) => update("techniques", t.id, "effect", v)}
              multi
              rows={2}
              placeholder="Can intercept attacks, strike from unexpected angles…"
            />
            <div style={S.grid2}>
              <Field
                label="Requirements to learn"
                value={t.requirement || ""}
                onChange={(v) => update("techniques", t.id, "requirement", v)}
                placeholder="Must have lost something precious…"
              />
              <Field
                label="Cost / price of mastery"
                value={t.cost || ""}
                onChange={(v) => update("techniques", t.id, "cost", v)}
                placeholder="Gradual blindness, shortened lifespan…"
              />
            </div>
            <Field
              label="Secrets / hidden layers"
              value={t.secret || ""}
              onChange={(v) => update("techniques", t.id, "secret", v)}
              multi
              rows={2}
              placeholder="The true final form requires…"
            />
            <Field
              label="Lore"
              value={t.lore || ""}
              onChange={(v) => update("techniques", t.id, "lore", v)}
              multi
              rows={2}
              placeholder="Lost for three centuries until…"
            />
          </EntryBlock>
        ))}
        {!techniques.length && <p style={S.dim}>No techniques yet.</p>}
      </Section>

      {/* ── Ingredients ── */}
      <Section
        title={`Ingredients & Resources (${ingredients.length})`}
        action={
          <GhostButton onClick={() => add("ingredients", mkIngredient)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Materials, herbs, minerals, essences. The raw stuff of your world —
          what things are made from.
        </p>
        {ingredients.map((i: Ingredient) => (
          <EntryBlock
            key={i.id}
            color="var(--color-brown)"
            onDelete={() => del("ingredients", i.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={i.name || ""}
                onChange={(v) => update("ingredients", i.id, "name", v)}
                placeholder="Void iron, Moonpetal…"
              />
              <Sel
                label="Rarity"
                value={i.rarity || ""}
                onChange={(v) => update("ingredients", i.id, "rarity", v)}
                opts={RARITY}
              />
              <Field
                label="Found at / habitat"
                value={i.location || ""}
                onChange={(v) => update("ingredients", i.id, "location", v)}
                placeholder="Deep rift mines, only in eclipse season…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Appearance"
                value={i.appearance || ""}
                onChange={(v) => update("ingredients", i.id, "appearance", v)}
                placeholder="Black ore with crimson veins that pulse…"
              />
              <Field
                label="Properties / nature"
                value={i.properties || ""}
                onChange={(v) => update("ingredients", i.id, "properties", v)}
                placeholder="Absorbs light, conducts soul energy…"
              />
            </div>
            <Field
              label="Uses — what it makes or enables"
              value={i.uses || ""}
              onChange={(v) => update("ingredients", i.id, "uses", v)}
              multi
              rows={2}
              placeholder="Used in forging void-touched weapons…"
            />
            <Field
              label="Danger / handling risks"
              value={i.danger || ""}
              onChange={(v) => update("ingredients", i.id, "danger", v)}
              placeholder="Prolonged contact causes memory erosion…"
            />
            <Field
              label="Lore"
              value={i.lore || ""}
              onChange={(v) => update("ingredients", i.id, "lore", v)}
              multi
              rows={2}
              placeholder="Once abundant before the Sundering…"
            />
          </EntryBlock>
        ))}
        {!ingredients.length && <p style={S.dim}>No ingredients yet.</p>}
      </Section>

      {/* ── Monsters ── */}
      <Section
        title={`Monsters (${monsters.length})`}
        action={
          <GhostButton onClick={() => add("monsters", mkMonster)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Creatures, beasts, horrors. What hunts your characters — and what
          drops when they die.
        </p>
        {monsters.map((m: Monster) => (
          <EntryBlock
            key={m.id}
            color="var(--color-red)"
            onDelete={() => del("monsters", m.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={m.name || ""}
                onChange={(v) => update("monsters", m.id, "name", v)}
                placeholder="Hollow Warden…"
              />
              <Sel
                label="Tier"
                value={m.tier || ""}
                onChange={(v) => update("monsters", m.id, "tier", v)}
                opts={MON_TIERS}
              />
              <Field
                label="Habitat"
                value={m.habitat || ""}
                onChange={(v) => update("monsters", m.id, "habitat", v)}
                placeholder="Rifts, abandoned fortresses…"
              />
            </div>
            <Field
              label="Appearance"
              value={m.appearance || ""}
              onChange={(v) => update("monsters", m.id, "appearance", v)}
              multi
              rows={2}
              placeholder="Twelve feet tall, skin of cracked obsidian…"
            />
            <Field
              label="Behavior / intelligence"
              value={m.behavior || ""}
              onChange={(v) => update("monsters", m.id, "behavior", v)}
              multi
              rows={2}
              placeholder="Hunts by fear-scent. Territorial…"
            />
            <Field
              label="Abilities / attacks"
              value={m.abilities || ""}
              onChange={(v) => update("monsters", m.id, "abilities", v)}
              multi
              rows={2}
              placeholder="Soul-shriek (paralyzes), Void-step (teleport)…"
            />
            <div style={S.grid2}>
              <Field
                label="Weaknesses"
                value={m.weaknesses || ""}
                onChange={(v) => update("monsters", m.id, "weaknesses", v)}
                placeholder="Sunlight, salt circles, named iron…"
              />
              <Field
                label="What it drops"
                value={m.drops || ""}
                onChange={(v) => update("monsters", m.id, "drops", v)}
                placeholder="Hollow core (ingredient), Warden's eye (relic)…"
              />
            </div>
            <Field
              label="First recorded encounter"
              value={m.firstSeen || ""}
              onChange={(v) => update("monsters", m.id, "firstSeen", v)}
              placeholder="T3 — The Rift of Asveth"
            />
            <Field
              label="Lore"
              value={m.lore || ""}
              onChange={(v) => update("monsters", m.id, "lore", v)}
              multi
              rows={2}
              placeholder="Once human. Created when the Ritual of Unmaking…"
            />
          </EntryBlock>
        ))}
        {!monsters.length && <p style={S.dim}>No monsters yet.</p>}
      </Section>

      {/* ── Treasures ── */}
      <Section
        title={`Treasures & Artifacts (${treasures.length})`}
        action={
          <GhostButton onClick={() => add("treasures", mkTreasure)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          World-level relics, legendary items not yet held by anyone. When a
          character claims one, add it to their equipment too.
        </p>
        {treasures.map((tr: Treasure) => (
          <EntryBlock
            key={tr.id}
            color="var(--color-orange)"
            onDelete={() => del("treasures", tr.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={tr.name || ""}
                onChange={(v) => update("treasures", tr.id, "name", v)}
                placeholder="The Ashen Crown…"
              />
              <Sel
                label="Rarity"
                value={tr.rarity || ""}
                onChange={(v) => update("treasures", tr.id, "rarity", v)}
                opts={RARITY}
              />
              <Field
                label="Current location"
                value={tr.location || ""}
                onChange={(v) => update("treasures", tr.id, "location", v)}
                placeholder="Sealed in the Tomb of Kael…"
              />
            </div>
            <Field
              label="Description"
              value={tr.description || ""}
              onChange={(v) => update("treasures", tr.id, "description", v)}
              multi
              rows={2}
              placeholder="A crown of blackened bone that weeps silver tears…"
            />
            <Field
              label="Stats & powers"
              value={tr.stats || ""}
              onChange={(v) => update("treasures", tr.id, "stats", v)}
              multi
              rows={3}
              placeholder="+200 to all attributes · Grants command over the dead…"
            />
            <div style={S.grid2}>
              <Field
                label="Curses (if any)"
                value={tr.curses || ""}
                onChange={(v) => update("treasures", tr.id, "curses", v)}
                multi
                rows={2}
                placeholder="Slowly replaces the wearer's blood with void-water…"
              />
              <Field
                label="Condition to unbind curse"
                value={tr.unbindCondition || ""}
                onChange={(v) =>
                  update("treasures", tr.id, "unbindCondition", v)
                }
                multi
                rows={2}
                placeholder="Worn by its creator's descendant during a solar eclipse…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Creator"
                value={tr.creator || ""}
                onChange={(v) => update("treasures", tr.id, "creator", v)}
                placeholder="The God-Smith Velath…"
              />
              <Field
                label="Ingredients / materials"
                value={tr.ingredients || ""}
                onChange={(v) => update("treasures", tr.id, "ingredients", v)}
                placeholder="God-bone, first tears, void iron…"
              />
            </div>
            <Field
              label="History"
              value={tr.history || ""}
              onChange={(v) => update("treasures", tr.id, "history", v)}
              multi
              rows={3}
              placeholder="Forged to end the First War. Shattered into three pieces…"
            />
          </EntryBlock>
        ))}
        {!treasures.length && <p style={S.dim}>No treasures yet.</p>}
      </Section>
    </div>
  );
}

import { worldStore } from "../store/worldStore";
import { S, mkNation, mkMonster, mkTechnique, mkIngredient, mkTreasure } from "../lib/utils";
import { Field, Sel, Section, EntryBlock } from "../components/ui";
import { NAT_TYPES, TECH_TYPES, RARITY, MON_TIERS } from "../lib/constants";
import { Button, styled } from "@mui/material";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Control } from "react-hook-form";
import type { Nation, Technique, Ingredient, Monster, Treasure } from "../store/worldStore";

interface WorldForm {
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
  control: Control<WorldForm>;
  index: number;
  onDelete: () => void;
}

function NationBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-dark)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`nations.${index}.name` as const} control={control} placeholder="The Iron Dominion…" />
        <Sel label="Type" name={`nations.${index}.type` as const} control={control} opts={NAT_TYPES} />
        <Field label="Capital" name={`nations.${index}.capital` as const} control={control} placeholder="Ashveil…" />
      </div>
      <div style={S.grid2}>
        <Field label="Ruler / governing power" name={`nations.${index}.ruler` as const} control={control} placeholder="Emperor Kael the Blind…" />
        <Field label="Population / scale" name={`nations.${index}.population` as const} control={control} placeholder="12 million, mostly agrarian…" />
      </div>
      <Field label="Geography" name={`nations.${index}.geography` as const} control={control} placeholder="Frozen tundra split by the Ashen River…" />
      <div style={S.grid2}>
        <Field label="Culture & customs" name={`nations.${index}.culture` as const} control={control} multi rows={2} placeholder="Warrior-scholars. Death rites, honor debts…" />
        <Field label="Military power" name={`nations.${index}.military` as const} control={control} multi rows={2} placeholder="50,000 standing army. Elite Grave Knights…" />
      </div>
      <div style={S.grid2}>
        <Field label="Economy & resources" name={`nations.${index}.economy` as const} control={control} placeholder="Exports void iron, imports grain…" />
        <Field label="Allies" name={`nations.${index}.allies` as const} control={control} placeholder="The Sea Confederacy…" />
        <Field label="Enemies" name={`nations.${index}.enemies` as const} control={control} placeholder="The Free Holds…" />
      </div>
      <Field label="Hidden secrets" name={`nations.${index}.secrets` as const} control={control} multi rows={2} placeholder="The emperor is already dead. The throne is controlled by…" />
      <Field label="Lore & history" name={`nations.${index}.lore` as const} control={control} multi rows={3} placeholder="Founded 400 years ago after the Collapse…" />
    </EntryBlock>
  );
}

function TechniqueBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-teal)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`techniques.${index}.name` as const} control={control} placeholder="Void Step Discipline…" />
        <Sel label="Type" name={`techniques.${index}.type` as const} control={control} opts={TECH_TYPES} />
        <Field label="Era / period" name={`techniques.${index}.era` as const} control={control} placeholder="Ancient, Third Age…" />
      </div>
      <div style={S.grid2}>
        <Field label="Origin / where it came from" name={`techniques.${index}.origin` as const} control={control} placeholder="Born in the monastery of the silent…" />
        <Field label="Creator (if known)" name={`techniques.${index}.creator` as const} control={control} placeholder="The Blind Master, unknown…" />
      </div>
      <Field label="What it does / how it works" name={`techniques.${index}.description` as const} control={control} multi rows={3} placeholder="A martial discipline that bends the practitioner's shadow…" />
      <Field label="Effects & power" name={`techniques.${index}.effect` as const} control={control} multi rows={2} placeholder="Can intercept attacks, strike from unexpected angles…" />
      <div style={S.grid2}>
        <Field label="Requirements to learn" name={`techniques.${index}.requirement` as const} control={control} placeholder="Must have lost something precious…" />
        <Field label="Cost / price of mastery" name={`techniques.${index}.cost` as const} control={control} placeholder="Gradual blindness, shortened lifespan…" />
      </div>
      <Field label="Secrets / hidden layers" name={`techniques.${index}.secret` as const} control={control} multi rows={2} placeholder="The true final form requires…" />
      <Field label="Lore" name={`techniques.${index}.lore` as const} control={control} multi rows={2} placeholder="Lost for three centuries until…" />
    </EntryBlock>
  );
}

function IngredientBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-brown)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`ingredients.${index}.name` as const} control={control} placeholder="Void iron, Moonpetal…" />
        <Sel label="Rarity" name={`ingredients.${index}.rarity` as const} control={control} opts={RARITY} />
        <Field label="Found at / habitat" name={`ingredients.${index}.location` as const} control={control} placeholder="Deep rift mines, only in eclipse season…" />
      </div>
      <div style={S.grid2}>
        <Field label="Appearance" name={`ingredients.${index}.appearance` as const} control={control} placeholder="Black ore with crimson veins that pulse…" />
        <Field label="Properties / nature" name={`ingredients.${index}.properties` as const} control={control} placeholder="Absorbs light, conducts soul energy…" />
      </div>
      <Field label="Uses — what it makes or enables" name={`ingredients.${index}.uses` as const} control={control} multi rows={2} placeholder="Used in forging void-touched weapons…" />
      <Field label="Danger / handling risks" name={`ingredients.${index}.danger` as const} control={control} placeholder="Prolonged contact causes memory erosion…" />
      <Field label="Lore" name={`ingredients.${index}.lore` as const} control={control} multi rows={2} placeholder="Once abundant before the Sundering…" />
    </EntryBlock>
  );
}

function MonsterBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-red)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`monsters.${index}.name` as const} control={control} placeholder="Hollow Warden…" />
        <Sel label="Tier" name={`monsters.${index}.tier` as const} control={control} opts={MON_TIERS} />
        <Field label="Habitat" name={`monsters.${index}.habitat` as const} control={control} placeholder="Rifts, abandoned fortresses…" />
      </div>
      <Field label="Appearance" name={`monsters.${index}.appearance` as const} control={control} multi rows={2} placeholder="Twelve feet tall, skin of cracked obsidian…" />
      <Field label="Behavior / intelligence" name={`monsters.${index}.behavior` as const} control={control} multi rows={2} placeholder="Hunts by fear-scent. Territorial…" />
      <Field label="Abilities / attacks" name={`monsters.${index}.abilities` as const} control={control} multi rows={2} placeholder="Soul-shriek (paralyzes), Void-step (teleport)…" />
      <div style={S.grid2}>
        <Field label="Weaknesses" name={`monsters.${index}.weaknesses` as const} control={control} placeholder="Sunlight, salt circles, named iron…" />
        <Field label="What it drops" name={`monsters.${index}.drops` as const} control={control} placeholder="Hollow core (ingredient), Warden's eye (relic)…" />
      </div>
      <Field label="First recorded encounter" name={`monsters.${index}.firstSeen` as const} control={control} placeholder="T3 — The Rift of Asveth" />
      <Field label="Lore" name={`monsters.${index}.lore` as const} control={control} multi rows={2} placeholder="Once human. Created when the Ritual of Unmaking…" />
    </EntryBlock>
  );
}

function TreasureBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-orange)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`treasures.${index}.name` as const} control={control} placeholder="The Ashen Crown…" />
        <Sel label="Rarity" name={`treasures.${index}.rarity` as const} control={control} opts={RARITY} />
        <Field label="Current location" name={`treasures.${index}.location` as const} control={control} placeholder="Sealed in the Tomb of Kael…" />
      </div>
      <Field label="Description" name={`treasures.${index}.description` as const} control={control} multi rows={2} placeholder="A crown of blackened bone that weeps silver tears…" />
      <Field label="Stats & powers" name={`treasures.${index}.stats` as const} control={control} multi rows={3} placeholder="+200 to all attributes · Grants command over the dead…" />
      <div style={S.grid2}>
        <Field label="Curses (if any)" name={`treasures.${index}.curses` as const} control={control} multi rows={2} placeholder="Slowly replaces the wearer's blood with void-water…" />
        <Field label="Condition to unbind curse" name={`treasures.${index}.unbindCondition` as const} control={control} multi rows={2} placeholder="Worn by its creator's descendant during a solar eclipse…" />
      </div>
      <div style={S.grid2}>
        <Field label="Creator" name={`treasures.${index}.creator` as const} control={control} placeholder="The God-Smith Velath…" />
        <Field label="Ingredients / materials" name={`treasures.${index}.ingredients` as const} control={control} placeholder="God-bone, first tears, void iron…" />
      </div>
      <Field label="History" name={`treasures.${index}.history` as const} control={control} multi rows={3} placeholder="Forged to end the First War. Shattered into three pieces…" />
    </EntryBlock>
  );
}

export default function WorldPage() {
  const { register, handleSubmit, control, reset, setValue, getValues } = useForm<WorldForm>({
    defaultValues: {
      title: "",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
    },
  });

  useEffect(() => {
    reset({
      title: worldStore.title.get() || "",
      synopsis: worldStore.synopsis.get() || "",
      setting: worldStore.setting.get() || "",
      themes: worldStore.themes.get() || "",
      rules: worldStore.rules.get() || "",
      nations: worldStore.nations.get() || [],
      techniques: worldStore.techniques.get() || [],
      ingredients: worldStore.ingredients.get() || [],
      monsters: worldStore.monsters.get() || [],
      treasures: worldStore.treasures.get() || [],
    });
  }, [reset]);

  const ref = useAnimateIn();

  const nations = useWatch({ control, name: "nations" }) || [];
  const techniques = useWatch({ control, name: "techniques" }) || [];
  const ingredients = useWatch({ control, name: "ingredients" }) || [];
  const monsters = useWatch({ control, name: "monsters" }) || [];
  const treasures = useWatch({ control, name: "treasures" }) || [];

  const onSubmit = (data: WorldForm) => {
    worldStore.title.set(data.title);
    worldStore.synopsis.set(data.synopsis);
    worldStore.setting.set(data.setting);
    worldStore.themes.set(data.themes);
    worldStore.rules.set(data.rules);
    worldStore.nations.set(data.nations);
    worldStore.techniques.set(data.techniques);
    worldStore.ingredients.set(data.ingredients);
    worldStore.monsters.set(data.monsters);
    worldStore.treasures.set(data.treasures);
  };

  const addItem = (
    field: "nations" | "techniques" | "ingredients" | "monsters" | "treasures",
    mk: () => Nation | Technique | Ingredient | Monster | Treasure,
  ) => {
    const items = getValues(field);
    setValue(field, [...items, mk()] as typeof items);
  };

  const delItem = (
    field: "nations" | "techniques" | "ingredients" | "monsters" | "treasures",
    delId: string,
  ) => {
    const items = getValues(field);
    setValue(field, items.filter((x) => x.id !== delId) as typeof items);
  };

  return (
    <div ref={ref}>
      {/* ── Title ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <input
          {...register("title")}
          style={{
            ...S.input,
            fontSize: 22,
            border: "none",
            padding: 0,
            flex: 1,
            color: "var(--text-primary)",
          }}
        />
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

      <Field label="Synopsis / premise" name="synopsis" control={control} multi rows={4} placeholder="What is this world? What is the central tension?" />
      <Field label="Setting" name="setting" control={control} placeholder="Time period, place, atmosphere…" />
      <Field label="Themes" name="themes" control={control} placeholder="The ideas the story is really about…" />
      <Field label="World rules / logic" name="rules" control={control} multi rows={3} placeholder="Magic systems, political structures, physical laws…" />

      {/* ── Nations ── */}
      <Section
        title={`Nations & Factions (${nations.length})`}
        action={
          <GhostButton onClick={() => addItem("nations", mkNation)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Kingdoms, empires, tribes, hidden societies. The political landscape
          your characters live inside.
        </p>
        {nations.map((n: Nation, i: number) => (
          <NationBlock
            key={n.id}
            control={control}
            index={i}
            onDelete={() => delItem("nations", n.id)}
          />
        ))}
        {!nations.length && <p style={S.dim}>No nations yet.</p>}
      </Section>

      {/* ── Techniques ── */}
      <Section
        title={`Techniques (${techniques.length})`}
        action={
          <GhostButton onClick={() => addItem("techniques", mkTechnique)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Martial arts, blacksmithing schools, biological arts, forbidden
          knowledge. How things are made and mastered in this world.
        </p>
        {techniques.map((t: Technique, i: number) => (
          <TechniqueBlock
            key={t.id}
            control={control}
            index={i}
            onDelete={() => delItem("techniques", t.id)}
          />
        ))}
        {!techniques.length && <p style={S.dim}>No techniques yet.</p>}
      </Section>

      {/* ── Ingredients ── */}
      <Section
        title={`Ingredients & Resources (${ingredients.length})`}
        action={
          <GhostButton onClick={() => addItem("ingredients", mkIngredient)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Materials, herbs, minerals, essences. The raw stuff of your world —
          what things are made from.
        </p>
        {ingredients.map((item: Ingredient, i: number) => (
          <IngredientBlock
            key={item.id}
            control={control}
            index={i}
            onDelete={() => delItem("ingredients", item.id)}
          />
        ))}
        {!ingredients.length && <p style={S.dim}>No ingredients yet.</p>}
      </Section>

      {/* ── Monsters ── */}
      <Section
        title={`Monsters (${monsters.length})`}
        action={
          <GhostButton onClick={() => addItem("monsters", mkMonster)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Creatures, beasts, horrors. What hunts your characters — and what
          drops when they die.
        </p>
        {monsters.map((m: Monster, i: number) => (
          <MonsterBlock
            key={m.id}
            control={control}
            index={i}
            onDelete={() => delItem("monsters", m.id)}
          />
        ))}
        {!monsters.length && <p style={S.dim}>No monsters yet.</p>}
      </Section>

      {/* ── Treasures ── */}
      <Section
        title={`Treasures & Artifacts (${treasures.length})`}
        action={
          <GhostButton onClick={() => addItem("treasures", mkTreasure)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          World-level relics, legendary items not yet held by anyone. When a
          character claims one, add it to their equipment too.
        </p>
        {treasures.map((tr: Treasure, i: number) => (
          <TreasureBlock
            key={tr.id}
            control={control}
            index={i}
            onDelete={() => delItem("treasures", tr.id)}
          />
        ))}
        {!treasures.length && <p style={S.dim}>No treasures yet.</p>}
      </Section>
    </div>
  );
}

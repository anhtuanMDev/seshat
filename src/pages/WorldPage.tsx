import { worldStore } from "../store/worldStore";
import { S, mkNation, mkMonster, mkTechnique, mkIngredient, mkTreasure } from "../lib/utils";
import { Field, Sel, Section, EntryBlock } from "../components/ui";
import { NAT_TYPES, TECH_TYPES, RARITY, MON_TIERS } from "../lib/constants";
import { Button, styled } from "@mui/material";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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

export default function WorldPage() {
  const { register, handleSubmit, watch, reset, setValue, getValues } = useForm<WorldForm>({
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
    mk: () => any,
  ) => {
    setValue(field, [...(getValues(field) as any[]), mk()] as any);
  };

  const delItem = (
    field: "nations" | "techniques" | "ingredients" | "monsters" | "treasures",
    delId: string,
  ) => {
    setValue(field, (getValues(field) as any[]).filter((x: any) => x.id !== delId) as any);
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

      <Field
        label="Synopsis / premise"
        value={watch("synopsis")}
        onChange={(v) => setValue("synopsis", v)}
        multi
        rows={4}
        placeholder="What is this world? What is the central tension?"
      />
      <Field
        label="Setting"
        value={watch("setting")}
        onChange={(v) => setValue("setting", v)}
        placeholder="Time period, place, atmosphere…"
      />
      <Field
        label="Themes"
        value={watch("themes")}
        onChange={(v) => setValue("themes", v)}
        placeholder="The ideas the story is really about…"
      />
      <Field
        label="World rules / logic"
        value={watch("rules")}
        onChange={(v) => setValue("rules", v)}
        multi
        rows={3}
        placeholder="Magic systems, political structures, physical laws…"
      />

      {/* ── Nations ── */}
      <Section
        title={`Nations & Factions (${(watch("nations") || []).length})`}
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
        {(watch("nations") || []).map((n: Nation, i: number) => (
          <EntryBlock
            key={n.id}
            color="var(--color-dark)"
            onDelete={() => delItem("nations", n.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={watch(`nations.${i}.name`)}
                onChange={(v) => setValue(`nations.${i}.name`, v)}
                placeholder="The Iron Dominion…"
              />
              <Sel
                label="Type"
                value={watch(`nations.${i}.type`)}
                onChange={(v) => setValue(`nations.${i}.type`, v)}
                opts={NAT_TYPES}
              />
              <Field
                label="Capital"
                value={watch(`nations.${i}.capital`)}
                onChange={(v) => setValue(`nations.${i}.capital`, v)}
                placeholder="Ashveil…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Ruler / governing power"
                value={watch(`nations.${i}.ruler`)}
                onChange={(v) => setValue(`nations.${i}.ruler`, v)}
                placeholder="Emperor Kael the Blind…"
              />
              <Field
                label="Population / scale"
                value={watch(`nations.${i}.population`)}
                onChange={(v) => setValue(`nations.${i}.population`, v)}
                placeholder="12 million, mostly agrarian…"
              />
            </div>
            <Field
              label="Geography"
              value={watch(`nations.${i}.geography`)}
              onChange={(v) => setValue(`nations.${i}.geography`, v)}
              placeholder="Frozen tundra split by the Ashen River…"
            />
            <div style={S.grid2}>
              <Field
                label="Culture & customs"
                value={watch(`nations.${i}.culture`)}
                onChange={(v) => setValue(`nations.${i}.culture`, v)}
                multi
                rows={2}
                placeholder="Warrior-scholars. Death rites, honor debts…"
              />
              <Field
                label="Military power"
                value={watch(`nations.${i}.military`)}
                onChange={(v) => setValue(`nations.${i}.military`, v)}
                multi
                rows={2}
                placeholder="50,000 standing army. Elite Grave Knights…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Economy & resources"
                value={watch(`nations.${i}.economy`)}
                onChange={(v) => setValue(`nations.${i}.economy`, v)}
                placeholder="Exports void iron, imports grain…"
              />
              <Field
                label="Allies"
                value={watch(`nations.${i}.allies`)}
                onChange={(v) => setValue(`nations.${i}.allies`, v)}
                placeholder="The Sea Confederacy…"
              />
              <Field
                label="Enemies"
                value={watch(`nations.${i}.enemies`)}
                onChange={(v) => setValue(`nations.${i}.enemies`, v)}
                placeholder="The Free Holds…"
              />
            </div>
            <Field
              label="Hidden secrets"
              value={watch(`nations.${i}.secrets`)}
              onChange={(v) => setValue(`nations.${i}.secrets`, v)}
              multi
              rows={2}
              placeholder="The emperor is already dead. The throne is controlled by…"
            />
            <Field
              label="Lore & history"
              value={watch(`nations.${i}.lore`)}
              onChange={(v) => setValue(`nations.${i}.lore`, v)}
              multi
              rows={3}
              placeholder="Founded 400 years ago after the Collapse…"
            />
          </EntryBlock>
        ))}
        {!(watch("nations") || []).length && <p style={S.dim}>No nations yet.</p>}
      </Section>

      {/* ── Techniques ── */}
      <Section
        title={`Techniques (${(watch("techniques") || []).length})`}
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
        {(watch("techniques") || []).map((t: Technique, i: number) => (
          <EntryBlock
            key={t.id}
            color="var(--color-teal)"
            onDelete={() => delItem("techniques", t.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={watch(`techniques.${i}.name`)}
                onChange={(v) => setValue(`techniques.${i}.name`, v)}
                placeholder="Void Step Discipline…"
              />
              <Sel
                label="Type"
                value={watch(`techniques.${i}.type`)}
                onChange={(v) => setValue(`techniques.${i}.type`, v)}
                opts={TECH_TYPES}
              />
              <Field
                label="Era / period"
                value={watch(`techniques.${i}.era`)}
                onChange={(v) => setValue(`techniques.${i}.era`, v)}
                placeholder="Ancient, Third Age…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Origin / where it came from"
                value={watch(`techniques.${i}.origin`)}
                onChange={(v) => setValue(`techniques.${i}.origin`, v)}
                placeholder="Born in the monastery of the silent…"
              />
              <Field
                label="Creator (if known)"
                value={watch(`techniques.${i}.creator`)}
                onChange={(v) => setValue(`techniques.${i}.creator`, v)}
                placeholder="The Blind Master, unknown…"
              />
            </div>
            <Field
              label="What it does / how it works"
              value={watch(`techniques.${i}.description`)}
              onChange={(v) => setValue(`techniques.${i}.description`, v)}
              multi
              rows={3}
              placeholder="A martial discipline that bends the practitioner's shadow…"
            />
            <Field
              label="Effects & power"
              value={watch(`techniques.${i}.effect`)}
              onChange={(v) => setValue(`techniques.${i}.effect`, v)}
              multi
              rows={2}
              placeholder="Can intercept attacks, strike from unexpected angles…"
            />
            <div style={S.grid2}>
              <Field
                label="Requirements to learn"
                value={watch(`techniques.${i}.requirement`)}
                onChange={(v) => setValue(`techniques.${i}.requirement`, v)}
                placeholder="Must have lost something precious…"
              />
              <Field
                label="Cost / price of mastery"
                value={watch(`techniques.${i}.cost`)}
                onChange={(v) => setValue(`techniques.${i}.cost`, v)}
                placeholder="Gradual blindness, shortened lifespan…"
              />
            </div>
            <Field
              label="Secrets / hidden layers"
              value={watch(`techniques.${i}.secret`)}
              onChange={(v) => setValue(`techniques.${i}.secret`, v)}
              multi
              rows={2}
              placeholder="The true final form requires…"
            />
            <Field
              label="Lore"
              value={watch(`techniques.${i}.lore`)}
              onChange={(v) => setValue(`techniques.${i}.lore`, v)}
              multi
              rows={2}
              placeholder="Lost for three centuries until…"
            />
          </EntryBlock>
        ))}
        {!(watch("techniques") || []).length && <p style={S.dim}>No techniques yet.</p>}
      </Section>

      {/* ── Ingredients ── */}
      <Section
        title={`Ingredients & Resources (${(watch("ingredients") || []).length})`}
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
        {(watch("ingredients") || []).map((i: Ingredient, idx: number) => (
          <EntryBlock
            key={i.id}
            color="var(--color-brown)"
            onDelete={() => delItem("ingredients", i.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={watch(`ingredients.${idx}.name`)}
                onChange={(v) => setValue(`ingredients.${idx}.name`, v)}
                placeholder="Void iron, Moonpetal…"
              />
              <Sel
                label="Rarity"
                value={watch(`ingredients.${idx}.rarity`)}
                onChange={(v) => setValue(`ingredients.${idx}.rarity`, v)}
                opts={RARITY}
              />
              <Field
                label="Found at / habitat"
                value={watch(`ingredients.${idx}.location`)}
                onChange={(v) => setValue(`ingredients.${idx}.location`, v)}
                placeholder="Deep rift mines, only in eclipse season…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Appearance"
                value={watch(`ingredients.${idx}.appearance`)}
                onChange={(v) => setValue(`ingredients.${idx}.appearance`, v)}
                placeholder="Black ore with crimson veins that pulse…"
              />
              <Field
                label="Properties / nature"
                value={watch(`ingredients.${idx}.properties`)}
                onChange={(v) => setValue(`ingredients.${idx}.properties`, v)}
                placeholder="Absorbs light, conducts soul energy…"
              />
            </div>
            <Field
              label="Uses — what it makes or enables"
              value={watch(`ingredients.${idx}.uses`)}
              onChange={(v) => setValue(`ingredients.${idx}.uses`, v)}
              multi
              rows={2}
              placeholder="Used in forging void-touched weapons…"
            />
            <Field
              label="Danger / handling risks"
              value={watch(`ingredients.${idx}.danger`)}
              onChange={(v) => setValue(`ingredients.${idx}.danger`, v)}
              placeholder="Prolonged contact causes memory erosion…"
            />
            <Field
              label="Lore"
              value={watch(`ingredients.${idx}.lore`)}
              onChange={(v) => setValue(`ingredients.${idx}.lore`, v)}
              multi
              rows={2}
              placeholder="Once abundant before the Sundering…"
            />
          </EntryBlock>
        ))}
        {!(watch("ingredients") || []).length && <p style={S.dim}>No ingredients yet.</p>}
      </Section>

      {/* ── Monsters ── */}
      <Section
        title={`Monsters (${(watch("monsters") || []).length})`}
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
        {(watch("monsters") || []).map((m: Monster, i: number) => (
          <EntryBlock
            key={m.id}
            color="var(--color-red)"
            onDelete={() => delItem("monsters", m.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={watch(`monsters.${i}.name`)}
                onChange={(v) => setValue(`monsters.${i}.name`, v)}
                placeholder="Hollow Warden…"
              />
              <Sel
                label="Tier"
                value={watch(`monsters.${i}.tier`)}
                onChange={(v) => setValue(`monsters.${i}.tier`, v)}
                opts={MON_TIERS}
              />
              <Field
                label="Habitat"
                value={watch(`monsters.${i}.habitat`)}
                onChange={(v) => setValue(`monsters.${i}.habitat`, v)}
                placeholder="Rifts, abandoned fortresses…"
              />
            </div>
            <Field
              label="Appearance"
              value={watch(`monsters.${i}.appearance`)}
              onChange={(v) => setValue(`monsters.${i}.appearance`, v)}
              multi
              rows={2}
              placeholder="Twelve feet tall, skin of cracked obsidian…"
            />
            <Field
              label="Behavior / intelligence"
              value={watch(`monsters.${i}.behavior`)}
              onChange={(v) => setValue(`monsters.${i}.behavior`, v)}
              multi
              rows={2}
              placeholder="Hunts by fear-scent. Territorial…"
            />
            <Field
              label="Abilities / attacks"
              value={watch(`monsters.${i}.abilities`)}
              onChange={(v) => setValue(`monsters.${i}.abilities`, v)}
              multi
              rows={2}
              placeholder="Soul-shriek (paralyzes), Void-step (teleport)…"
            />
            <div style={S.grid2}>
              <Field
                label="Weaknesses"
                value={watch(`monsters.${i}.weaknesses`)}
                onChange={(v) => setValue(`monsters.${i}.weaknesses`, v)}
                placeholder="Sunlight, salt circles, named iron…"
              />
              <Field
                label="What it drops"
                value={watch(`monsters.${i}.drops`)}
                onChange={(v) => setValue(`monsters.${i}.drops`, v)}
                placeholder="Hollow core (ingredient), Warden's eye (relic)…"
              />
            </div>
            <Field
              label="First recorded encounter"
              value={watch(`monsters.${i}.firstSeen`)}
              onChange={(v) => setValue(`monsters.${i}.firstSeen`, v)}
              placeholder="T3 — The Rift of Asveth"
            />
            <Field
              label="Lore"
              value={watch(`monsters.${i}.lore`)}
              onChange={(v) => setValue(`monsters.${i}.lore`, v)}
              multi
              rows={2}
              placeholder="Once human. Created when the Ritual of Unmaking…"
            />
          </EntryBlock>
        ))}
        {!(watch("monsters") || []).length && <p style={S.dim}>No monsters yet.</p>}
      </Section>

      {/* ── Treasures ── */}
      <Section
        title={`Treasures & Artifacts (${(watch("treasures") || []).length})`}
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
        {(watch("treasures") || []).map((tr: Treasure, i: number) => (
          <EntryBlock
            key={tr.id}
            color="var(--color-orange)"
            onDelete={() => delItem("treasures", tr.id)}
          >
            <div style={S.grid3}>
              <Field
                label="Name"
                value={watch(`treasures.${i}.name`)}
                onChange={(v) => setValue(`treasures.${i}.name`, v)}
                placeholder="The Ashen Crown…"
              />
              <Sel
                label="Rarity"
                value={watch(`treasures.${i}.rarity`)}
                onChange={(v) => setValue(`treasures.${i}.rarity`, v)}
                opts={RARITY}
              />
              <Field
                label="Current location"
                value={watch(`treasures.${i}.location`)}
                onChange={(v) => setValue(`treasures.${i}.location`, v)}
                placeholder="Sealed in the Tomb of Kael…"
              />
            </div>
            <Field
              label="Description"
              value={watch(`treasures.${i}.description`)}
              onChange={(v) => setValue(`treasures.${i}.description`, v)}
              multi
              rows={2}
              placeholder="A crown of blackened bone that weeps silver tears…"
            />
            <Field
              label="Stats & powers"
              value={watch(`treasures.${i}.stats`)}
              onChange={(v) => setValue(`treasures.${i}.stats`, v)}
              multi
              rows={3}
              placeholder="+200 to all attributes · Grants command over the dead…"
            />
            <div style={S.grid2}>
              <Field
                label="Curses (if any)"
                value={watch(`treasures.${i}.curses`)}
                onChange={(v) => setValue(`treasures.${i}.curses`, v)}
                multi
                rows={2}
                placeholder="Slowly replaces the wearer's blood with void-water…"
              />
              <Field
                label="Condition to unbind curse"
                value={watch(`treasures.${i}.unbindCondition`)}
                onChange={(v) => setValue(`treasures.${i}.unbindCondition`, v)}
                multi
                rows={2}
                placeholder="Worn by its creator's descendant during a solar eclipse…"
              />
            </div>
            <div style={S.grid2}>
              <Field
                label="Creator"
                value={watch(`treasures.${i}.creator`)}
                onChange={(v) => setValue(`treasures.${i}.creator`, v)}
                placeholder="The God-Smith Velath…"
              />
              <Field
                label="Ingredients / materials"
                value={watch(`treasures.${i}.ingredients`)}
                onChange={(v) => setValue(`treasures.${i}.ingredients`, v)}
                placeholder="God-bone, first tears, void iron…"
              />
            </div>
            <Field
              label="History"
              value={watch(`treasures.${i}.history`)}
              onChange={(v) => setValue(`treasures.${i}.history`, v)}
              multi
              rows={3}
              placeholder="Forged to end the First War. Shattered into three pieces…"
            />
          </EntryBlock>
        ))}
        {!(watch("treasures") || []).length && <p style={S.dim}>No treasures yet.</p>}
      </Section>
    </div>
  );
}

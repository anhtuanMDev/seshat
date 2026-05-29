import { appStore } from "../store/appStore";
import { useActiveBookIdx } from "../hooks/useWorldStore";
import { S, mkNation, mkNationConnection, mkMonster, mkTechnique, mkIngredient, mkTreasure } from "../lib/utils";
import { Field, Section, GhostButton } from "../components/ui";
import { FlagIcon, BuildIcon, ScienceIcon, BugReportIcon, DiamondIcon, SaveIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NationBlock } from "../components/world/NationBlock";
import { TechniqueBlock } from "../components/world/TechniqueBlock";
import { IngredientBlock } from "../components/world/IngredientBlock";
import { MonsterBlock } from "../components/world/MonsterBlock";
import { TreasureBlock } from "../components/world/TreasureBlock";
import type { WorldForm } from "../components/world/types";
import type { Nation, Technique, Ingredient, Monster, Treasure } from "../store/appStore";
import type { NationConnection } from "../lib/types";

export default function WorldPage() {
  const bookIdx = useActiveBookIdx();

  const { register, handleSubmit, control, reset, setValue, getValues } = useForm<WorldForm>({
    defaultValues: {
      title: "", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
    },
  });

  useEffect(() => {
    if (bookIdx < 0) return;
    reset({
      title: appStore.books[bookIdx].title.get() || "",
      synopsis: appStore.books[bookIdx].synopsis.get() || "",
      setting: appStore.books[bookIdx].setting.get() || "",
      themes: appStore.books[bookIdx].themes.get() || "",
      rules: appStore.books[bookIdx].rules.get() || "",
      nations: appStore.books[bookIdx].nations.get() || [],
      techniques: appStore.books[bookIdx].techniques.get() || [],
      ingredients: appStore.books[bookIdx].ingredients.get() || [],
      monsters: appStore.books[bookIdx].monsters.get() || [],
      treasures: appStore.books[bookIdx].treasures.get() || [],
    });
  }, [bookIdx, reset]);

  const ref = useAnimateIn();

  const nations = useWatch({ control, name: "nations" }) || [];
  const techniques = useWatch({ control, name: "techniques" }) || [];
  const ingredients = useWatch({ control, name: "ingredients" }) || [];
  const monsters = useWatch({ control, name: "monsters" }) || [];
  const treasures = useWatch({ control, name: "treasures" }) || [];

  const onSubmit = (data: WorldForm) => {
    if (bookIdx < 0) return;
    appStore.books[bookIdx].title.set(data.title);
    appStore.books[bookIdx].synopsis.set(data.synopsis);
    appStore.books[bookIdx].setting.set(data.setting);
    appStore.books[bookIdx].themes.set(data.themes);
    appStore.books[bookIdx].rules.set(data.rules);
    appStore.books[bookIdx].nations.set(data.nations);
    appStore.books[bookIdx].techniques.set(data.techniques);
    appStore.books[bookIdx].ingredients.set(data.ingredients);
    appStore.books[bookIdx].monsters.set(data.monsters);
    appStore.books[bookIdx].treasures.set(data.treasures);
  };

  const addItem = (field: "nations" | "techniques" | "ingredients" | "monsters" | "treasures", mk: () => Nation | Technique | Ingredient | Monster | Treasure) => {
    const items = getValues(field);
    setValue(field, [...items, mk()] as typeof items);
  };

  const delItem = (field: "nations" | "techniques" | "ingredients" | "monsters" | "treasures", delId: string) => {
    const items = getValues(field);
    setValue(field, items.filter((x) => x.id !== delId) as typeof items);
  };

  const addConnection = (nationIdx: number) => {
    const nations = getValues("nations");
    const updated = [...nations];
    updated[nationIdx] = { ...updated[nationIdx], connections: [...(updated[nationIdx].connections || []), mkNationConnection()] };
    setValue("nations", updated);
  };

  const delConnection = (nationIdx: number, connId: string) => {
    const nations = getValues("nations");
    const updated = [...nations];
    updated[nationIdx] = { ...updated[nationIdx], connections: (updated[nationIdx].connections || []).filter((c: NationConnection) => c.id !== connId) };
    setValue("nations", updated);
  };

  return (
    <div ref={ref}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <input {...register("title")} style={{ ...S.input, fontSize: 22, border: "none", padding: 0, flex: 1, color: "var(--text-primary)" }} />
        <button onClick={handleSubmit(onSubmit)} title="Save changes" style={{ ...S.ghost, fontSize: 11, letterSpacing: 1, color: "var(--color-green)", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}><SaveIcon sx={{ fontSize: 12 }} />save</button>
      </div>

      <Field label="Synopsis / premise" name="synopsis" control={control} multi rows={4} placeholder="What is this world? What is the central tension?" />
      <Field label="Setting" name="setting" control={control} placeholder="Time period, place, atmosphere…" />
      <Field label="Themes" name="themes" control={control} placeholder="The ideas the story is really about…" />
      <Field label="World rules / logic" name="rules" control={control} multi rows={3} placeholder="Magic systems, political structures, physical laws…" />

      <Section title={<><FlagIcon sx={{ fontSize: 12, marginRight: 4 }} />Nations & Factions ({nations.length})</>} action={<GhostButton onClick={() => addItem("nations", mkNation)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Kingdoms, empires, tribes, hidden societies. The political landscape your characters live inside.</p>
        {nations.map((n: Nation, i: number) => <NationBlock key={n.id} control={control} index={i} onDelete={() => delItem("nations", n.id)} connections={n.connections || []} onAddConnection={() => addConnection(i)} onDelConnection={(connId) => delConnection(i, connId)} />)}
        {!nations.length && <p style={S.dim}>No nations yet.</p>}
      </Section>

      <Section title={<><BuildIcon sx={{ fontSize: 12, marginRight: 4 }} />Techniques ({techniques.length})</>} action={<GhostButton onClick={() => addItem("techniques", mkTechnique)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Martial arts, blacksmithing schools, biological arts, forbidden knowledge. How things are made and mastered in this world.</p>
        {techniques.map((t: Technique, i: number) => <TechniqueBlock key={t.id} control={control} index={i} onDelete={() => delItem("techniques", t.id)} />)}
        {!techniques.length && <p style={S.dim}>No techniques yet.</p>}
      </Section>

      <Section title={<><ScienceIcon sx={{ fontSize: 12, marginRight: 4 }} />Ingredients & Resources ({ingredients.length})</>} action={<GhostButton onClick={() => addItem("ingredients", mkIngredient)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Materials, herbs, minerals, essences. The raw stuff of your world — what things are made from.</p>
        {ingredients.map((item: Ingredient, i: number) => <IngredientBlock key={item.id} control={control} index={i} onDelete={() => delItem("ingredients", item.id)} />)}
        {!ingredients.length && <p style={S.dim}>No ingredients yet.</p>}
      </Section>

      <Section title={<><BugReportIcon sx={{ fontSize: 12, marginRight: 4 }} />Monsters ({monsters.length})</>} action={<GhostButton onClick={() => addItem("monsters", mkMonster)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>Creatures, beasts, horrors. What hunts your characters — and what drops when they die.</p>
        {monsters.map((m: Monster, i: number) => <MonsterBlock key={m.id} control={control} index={i} onDelete={() => delItem("monsters", m.id)} />)}
        {!monsters.length && <p style={S.dim}>No monsters yet.</p>}
      </Section>

      <Section title={<><DiamondIcon sx={{ fontSize: 12, marginRight: 4 }} />Treasures & Artifacts ({treasures.length})</>} action={<GhostButton onClick={() => addItem("treasures", mkTreasure)}>+ add</GhostButton>} defaultOpen={false}>
        <p style={{ ...S.dim, marginBottom: 14 }}>World-level relics, legendary items not yet held by anyone. When a character claims one, add it to their equipment too.</p>
        {treasures.map((tr: Treasure, i: number) => <TreasureBlock key={tr.id} control={control} index={i} onDelete={() => delItem("treasures", tr.id)} />)}
        {!treasures.length && <p style={S.dim}>No treasures yet.</p>}
      </Section>
    </div>
  );
}

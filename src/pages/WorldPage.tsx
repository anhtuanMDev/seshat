import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { updateFilesOnGitHub } from "../lib/githubSync";
import { useActiveBookIdx } from "../hooks/useWorldStore";
import {
  S,
  mkNation,
  mkNationConnection,
  mkMonster,
  mkTechnique,
  mkIngredient,
  mkTreasure,
} from "../lib/utils";
import { Field, Section, GhostButton } from "../components/ui";
import {
  FlagIcon,
  BuildIcon,
  ScienceIcon,
  BugReportIcon,
  DiamondIcon,
  SaveIcon,
} from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useEffect, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSelector } from "@legendapp/state/react";
import { NationBlock } from "../components/world/NationBlock";
import { TechniqueBlock } from "../components/world/TechniqueBlock";
import { IngredientBlock } from "../components/world/IngredientBlock";
import { MonsterBlock } from "../components/world/MonsterBlock";
import { TreasureBlock } from "../components/world/TreasureBlock";
import type { WorldForm } from "../components/world/types";
import type {
  Nation,
  Technique,
  Ingredient,
  Monster,
  Treasure,
} from "../store/appStore";
import type { NationConnection } from "../lib/types";

export default function WorldPage() {
  const bookIdx = useActiveBookIdx();

  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<WorldForm>({
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

  const [isSaving, setIsSaving] = useState(false);
  const lastBookIdxRef = useRef<number>(-1);

  const bookData = useSelector(() => {
    if (bookIdx < 0) return null;
    return appStore.books[bookIdx].get();
  });

  useEffect(() => {
    if (!bookData) return;
    
    const isDifferentBook = lastBookIdxRef.current !== bookIdx;
    lastBookIdxRef.current = bookIdx;

    if (isDifferentBook || (!isDirty && !isSaving)) {
      reset({
        title: bookData.title || "",
        synopsis: bookData.synopsis || "",
        setting: bookData.setting || "",
        themes: bookData.themes || "",
        rules: bookData.rules || "",
        nations: bookData.nations || [],
        techniques: bookData.techniques || [],
        ingredients: bookData.ingredients || [],
        monsters: bookData.monsters || [],
        treasures: bookData.treasures || [],
      });
    }
  }, [bookIdx, bookData, reset, isDirty, isSaving]);

  const ref = useAnimateIn();
  const [isFloating, setIsFloating] = useState(false);

  const nations = useWatch({ control, name: "nations" }) || [];
  const techniques = useWatch({ control, name: "techniques" }) || [];
  const ingredients = useWatch({ control, name: "ingredients" }) || [];
  const monsters = useWatch({ control, name: "monsters" }) || [];
  const treasures = useWatch({ control, name: "treasures" }) || [];

  const onSubmit = async (data: WorldForm) => {
    try {
      if (bookIdx < 0) return;
      appStore.books[bookIdx].title.set(data.title || "");
      appStore.books[bookIdx].synopsis.set(data.synopsis || "");
      appStore.books[bookIdx].setting.set(data.setting || "");
      appStore.books[bookIdx].themes.set(data.themes || "");
      appStore.books[bookIdx].rules.set(data.rules || "");
      appStore.books[bookIdx].nations.set(data.nations || []);
      appStore.books[bookIdx].techniques.set(data.techniques || []);
      appStore.books[bookIdx].ingredients.set(data.ingredients || []);
      appStore.books[bookIdx].monsters.set(data.monsters || []);
      appStore.books[bookIdx].treasures.set(data.treasures || []);

      const token =
        localStorage.getItem("seshat-auth-token") ||
        sessionStorage.getItem("seshat-auth-token");
      const bookId = appStore.activeBookId.get();
      if (token && bookId) {
        setIsSaving(true);
        try {
          const files: { path: string; content: string }[] = [];

          files.push({
            path: "book.json",
            content: JSON.stringify(
              {
                id: bookId,
                title: data.title || "",
                synopsis: data.synopsis || "",
                setting: data.setting || "",
                themes: data.themes || "",
                rules: data.rules || "",
              },
              null,
              2,
            ),
          });

          files.push({
            path: "world/world.json",
            content: JSON.stringify(
              { id: bookId, title: data.title || "" },
              null,
              2,
            ),
          });

          (data.nations || []).forEach((n) =>
            files.push({
              path: `world/nations/nation_${n.id}.json`,
              content: JSON.stringify(n, null, 2),
            }),
          );
          (data.techniques || []).forEach((t) =>
            files.push({
              path: `world/techniques/technique_${t.id}.json`,
              content: JSON.stringify(t, null, 2),
            }),
          );
          (data.ingredients || []).forEach((i) =>
            files.push({
              path: `world/ingredients/ingredient_${i.id}.json`,
              content: JSON.stringify(i, null, 2),
            }),
          );
          (data.monsters || []).forEach((m) =>
            files.push({
              path: `world/monsters/monster_${m.id}.json`,
              content: JSON.stringify(m, null, 2),
            }),
          );
          (data.treasures || []).forEach((tr) =>
            files.push({
              path: `world/treasures/treasure_${tr.id}.json`,
              content: JSON.stringify(tr, null, 2),
            }),
          );

          await updateFilesOnGitHub(token, bookId, files);
          showToast("World synced to cloud", "success");
          reset(data);
        } finally {
          setIsSaving(false);
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      showToast("Error saving world: " + errorMessage, "error");
    }
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

  const addConnection = (nationIdx: number) => {
    const nations = getValues("nations");
    const updated = [...nations];
    updated[nationIdx] = {
      ...updated[nationIdx],
      connections: [
        ...(updated[nationIdx].connections || []),
        mkNationConnection(),
      ],
    };
    setValue("nations", updated);
  };

  const delConnection = (nationIdx: number, connId: string) => {
    const nations = getValues("nations");
    const updated = [...nations];
    updated[nationIdx] = {
      ...updated[nationIdx],
      connections: (updated[nationIdx].connections || []).filter(
        (c: NationConnection) => c.id !== connId,
      ),
    };
    setValue("nations", updated);
  };

  return (
    <>
      <div 
        ref={ref} 
        className="seshat-page-container"
        onScroll={(e) => setIsFloating(e.currentTarget.scrollTop > 80)}
      >
      <div className="seshat-flex-between" style={styles.header}>
        <input
          {...register("title")}
          style={styles.titleInput}
        />
        <button
          disabled={!isDirty || isSaving}
          onClick={() => onSubmit(getValues())}
          title="Save changes"
          style={
            isDirty
              ? {
                  ...styles.saveBtnActive,
                  cursor: isSaving ? "default" : "pointer",
                  opacity: isSaving ? 0.7 : 1,
                }
              : styles.saveBtnInactive
          }
        >
          <SaveIcon sx={{ fontSize: 14 }} />
          {isSaving ? "saving..." : "save"}
        </button>
      </div>

      <Field
        label="Synopsis / premise"
        name="synopsis"
        control={control}
        multi
        rows={4}
        placeholder="What is this world? What is the central tension?"
      />
      <Field
        label="Setting"
        name="setting"
        control={control}
        multi
        rows={2}
        placeholder="Time period, place, atmosphere…"
      />
      <Field
        label="Themes"
        name="themes"
        control={control}
        multi
        rows={2}
        placeholder="The ideas the story is really about…"
      />
      <Field
        label="World rules / logic"
        name="rules"
        control={control}
        multi
        rows={3}
        placeholder="Magic systems, political structures, physical laws…"
      />

      <Section
        title={
          <>
            <FlagIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Nations & Factions ({nations.length})
          </>
        }
        action={
          <GhostButton onClick={() => addItem("nations", mkNation)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
          Kingdoms, empires, tribes, hidden societies. The political landscape
          your characters live inside.
        </p>
        {nations.map((n: Nation, i: number) => (
          <NationBlock
            key={n.id}
            control={control}
            index={i}
            onDelete={() => delItem("nations", n.id)}
            connections={n.connections || []}
            onAddConnection={() => addConnection(i)}
            onDelConnection={(connId) => delConnection(i, connId)}
          />
        ))}
        {!nations.length && <p style={S.dim}>No nations yet.</p>}
      </Section>

      <Section
        title={
          <>
            <BuildIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Techniques ({techniques.length})
          </>
        }
        action={
          <GhostButton onClick={() => addItem("techniques", mkTechnique)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
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

      <Section
        title={
          <>
            <ScienceIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Ingredients & Resources ({ingredients.length})
          </>
        }
        action={
          <GhostButton onClick={() => addItem("ingredients", mkIngredient)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
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

      <Section
        title={
          <>
            <BugReportIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Monsters ({monsters.length})
          </>
        }
        action={
          <GhostButton onClick={() => addItem("monsters", mkMonster)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
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

      <Section
        title={
          <>
            <DiamondIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Treasures & Artifacts ({treasures.length})
          </>
        }
        action={
          <GhostButton onClick={() => addItem("treasures", mkTreasure)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
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

      {isFloating && (
        <div className="seshat-chapter-toolbar floating">
          <button
            disabled={!isDirty || isSaving}
            onClick={() => onSubmit(getValues())}
            title="Save changes"
            style={
              isDirty
                ? {
                    ...styles.saveBtnActive,
                    cursor: isSaving ? "default" : "pointer",
                    opacity: isSaving ? 0.7 : 1,
                  }
                : styles.saveBtnInactive
            }
          >
            <SaveIcon sx={{ fontSize: 14 }} />
            {isSaving ? "saving..." : "save"}
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  header: {
    marginBottom: "var(--space-6)",
    gap: "var(--space-4)",
  },
  titleInput: {
    ...S.input,
    fontSize: "var(--text-2xl)",
    border: "none",
    padding: 0,
    flex: 1,
    color: "var(--text-primary)",
  },
  saveBtnActive: {
    background: "var(--color-green)",
    color: "var(--bg-app)",
    border: "none",
    borderRadius: 4,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  saveBtnInactive: {
    ...S.ghost,
    fontSize: 12,
    letterSpacing: 1,
    color: "var(--color-green)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 4,
    opacity: 0.5,
    cursor: "default",
  },
  sectionSubtitle: {
    ...S.dim,
    marginBottom: "var(--space-3)",
  },
} satisfies Record<string, React.CSSProperties>;

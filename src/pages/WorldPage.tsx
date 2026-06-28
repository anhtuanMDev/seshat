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
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { useSelector } from "@legendapp/state/react";
import { NationBlock } from "../components/world/NationBlock";
import { TechniqueBlock } from "../components/world/TechniqueBlock";
import { IngredientBlock } from "../components/world/IngredientBlock";
import { MonsterBlock } from "../components/world/MonsterBlock";
import { TreasureBlock } from "../components/world/TreasureBlock";
import { Modal } from "../components/ui/Modal";
import { DeleteIcon, SmartToyIcon } from "../components/ui/icons";
import { NationCard } from "../components/world/NationCard";
import { TechniqueCard } from "../components/world/TechniqueCard";
import { IngredientCard } from "../components/world/IngredientCard";
import { MonsterCard } from "../components/world/MonsterCard";
import { TreasureCard } from "../components/world/TreasureCard";
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
  const navigate = useNavigate();

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

  const [modal, setModal] = useState<{
    type: "nation" | "technique" | "ingredient" | "monster" | "treasure";
    idx: number | null;
    isNew?: boolean;
  } | null>(null);

  const addWorldItem = (
    type: "nation" | "technique" | "ingredient" | "monster" | "treasure",
    mk: () => Nation | Technique | Ingredient | Monster | Treasure
  ) => {
    let currentLength = 0;
    if (type === "nation") {
      const current = getValues("nations") || [];
      setValue("nations", [...current, mk() as Nation], { shouldDirty: true });
      currentLength = current.length;
    } else if (type === "technique") {
      const current = getValues("techniques") || [];
      setValue("techniques", [...current, mk() as Technique], { shouldDirty: true });
      currentLength = current.length;
    } else if (type === "ingredient") {
      const current = getValues("ingredients") || [];
      setValue("ingredients", [...current, mk() as Ingredient], { shouldDirty: true });
      currentLength = current.length;
    } else if (type === "monster") {
      const current = getValues("monsters") || [];
      setValue("monsters", [...current, mk() as Monster], { shouldDirty: true });
      currentLength = current.length;
    } else if (type === "treasure") {
      const current = getValues("treasures") || [];
      setValue("treasures", [...current, mk() as Treasure], { shouldDirty: true });
      currentLength = current.length;
    }
    setModal({ type, idx: currentLength, isNew: true });
  };

  const handleCancelModal = () => {
    if (!modal) return;
    if (modal.isNew) {
      if (modal.type === "nation") {
        setValue("nations", (getValues("nations") || []).filter((_, idx) => idx !== modal.idx));
      } else if (modal.type === "technique") {
        setValue("techniques", (getValues("techniques") || []).filter((_, idx) => idx !== modal.idx));
      } else if (modal.type === "ingredient") {
        setValue("ingredients", (getValues("ingredients") || []).filter((_, idx) => idx !== modal.idx));
      } else if (modal.type === "monster") {
        setValue("monsters", (getValues("monsters") || []).filter((_, idx) => idx !== modal.idx));
      } else if (modal.type === "treasure") {
        setValue("treasures", (getValues("treasures") || []).filter((_, idx) => idx !== modal.idx));
      }
    }
    setModal(null);
  };

  const handleSaveModal = () => {
    setModal(null);
  };

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

      showToast("World saved locally", "success");
      reset(data);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      showToast("Error saving world: " + errorMessage, "error");
    }
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
          <GhostButton onClick={() => addWorldItem("nation", mkNation as () => Nation)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
          Kingdoms, empires, tribes, hidden societies. The political landscape
          your characters live inside.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          {nations.map((n: Nation, i: number) => (
            <NationCard
              key={n.id}
              nation={n}
              onEdit={() => setModal({ type: "nation", idx: i })}
            />
          ))}
        </div>
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
          <GhostButton onClick={() => addWorldItem("technique", mkTechnique as () => Technique)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
          Martial arts, blacksmithing schools, biological arts, forbidden
          knowledge. How things are made and mastered in this world.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          {techniques.map((t: Technique, i: number) => (
            <TechniqueCard
              key={t.id}
              technique={t}
              onEdit={() => setModal({ type: "technique", idx: i })}
            />
          ))}
        </div>
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
          <GhostButton onClick={() => addWorldItem("ingredient", mkIngredient as () => Ingredient)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
          Materials, herbs, minerals, essences. The raw stuff of your world —
          what things are made from.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          {ingredients.map((item: Ingredient, i: number) => (
            <IngredientCard
              key={item.id}
              ingredient={item}
              onEdit={() => setModal({ type: "ingredient", idx: i })}
            />
          ))}
        </div>
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
          <GhostButton onClick={() => addWorldItem("monster", mkMonster as () => Monster)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
          Creatures, beasts, horrors. What hunts your characters — and what
          drops when they die.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          {monsters.map((m: Monster, i: number) => (
            <MonsterCard
              key={m.id}
              monster={m}
              onEdit={() => setModal({ type: "monster", idx: i })}
            />
          ))}
        </div>
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
          <GhostButton onClick={() => addWorldItem("treasure", mkTreasure as () => Treasure)}>
            + add
          </GhostButton>
        }
        defaultOpen={false}
      >
        <p style={styles.sectionSubtitle}>
          World-level relics, legendary items not yet held by anyone. When a
          character claims one, add it to their equipment too.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          {treasures.map((tr: Treasure, i: number) => (
            <TreasureCard
              key={tr.id}
              treasure={tr}
              onEdit={() => setModal({ type: "treasure", idx: i })}
            />
          ))}
        </div>
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

      {modal?.type === "nation" && modal.idx !== null && (
        <Modal
          title={modal.isNew ? "Add Nation / Faction" : "Edit Nation / Faction Details"}
          onClose={handleCancelModal}
          variant="wide"
          footer={
            <div className="seshat-flex-between" style={{ width: "100%" }}>
              <div>
                {!modal.isNew && (
                  <button
                    onClick={() => {
                      delItem("nations", nations[modal.idx!].id);
                      setModal(null);
                    }}
                    className="seshat-modal-btn-delete"
                    title="Delete this nation/faction"
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                    Delete
                  </button>
                )}
                {!modal.isNew && (
                  <button
                    onClick={() => navigate(`/ai?focusType=nation&focusId=${nations[modal.idx!].id}`)}
                    className="seshat-modal-btn-cancel"
                    style={{ marginLeft: 12, color: "var(--color-purple)", border: "1px solid var(--color-purple)" }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                    Ask AI
                  </button>
                )}
              </div>
              <div className="seshat-flex-align" style={{ gap: 12 }}>
                <button
                  onClick={handleCancelModal}
                  className="seshat-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="seshat-modal-btn-submit"
                >
                  <SaveIcon sx={{ fontSize: 16 }} />
                  Save
                </button>
              </div>
            </div>
          }
        >
          <NationBlock
            control={control}
            index={modal.idx}
            onDelete={() => {}}
            connections={nations[modal.idx!]?.connections || []}
            onAddConnection={() => addConnection(modal.idx!)}
            onDelConnection={(connId) => delConnection(modal.idx!, connId)}
          />
        </Modal>
      )}

      {modal?.type === "technique" && modal.idx !== null && (
        <Modal
          title={modal.isNew ? "Add Technique" : "Edit Technique Details"}
          onClose={handleCancelModal}
          variant="wide"
          footer={
            <div className="seshat-flex-between" style={{ width: "100%" }}>
              <div>
                {!modal.isNew && (
                  <button
                    onClick={() => {
                      delItem("techniques", techniques[modal.idx!].id);
                      setModal(null);
                    }}
                    className="seshat-modal-btn-delete"
                    title="Delete this technique"
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                    Delete
                  </button>
                )}
                {!modal.isNew && (
                  <button
                    onClick={() => navigate(`/ai?focusType=technique&focusId=${techniques[modal.idx!].id}`)}
                    className="seshat-modal-btn-cancel"
                    style={{ marginLeft: 12, color: "var(--color-purple)", border: "1px solid var(--color-purple)" }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                    Ask AI
                  </button>
                )}
              </div>
              <div className="seshat-flex-align" style={{ gap: 12 }}>
                <button
                  onClick={handleCancelModal}
                  className="seshat-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="seshat-modal-btn-submit"
                >
                  <SaveIcon sx={{ fontSize: 16 }} />
                  Save
                </button>
              </div>
            </div>
          }
        >
          <TechniqueBlock
            control={control}
            index={modal.idx}
            onDelete={() => {}}
          />
        </Modal>
      )}
      {modal?.type === "ingredient" && modal.idx !== null && (
        <Modal
          title={modal.isNew ? "Add Ingredient / Resource" : "Edit Ingredient / Resource Details"}
          onClose={handleCancelModal}
          variant="wide"
          footer={
            <div className="seshat-flex-between" style={{ width: "100%" }}>
              <div>
                {!modal.isNew && (
                  <button
                    onClick={() => {
                      delItem("ingredients", ingredients[modal.idx!].id);
                      setModal(null);
                    }}
                    className="seshat-modal-btn-delete"
                    title="Delete this ingredient"
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                    Delete
                  </button>
                )}
                {!modal.isNew && (
                  <button
                    onClick={() => navigate(`/ai?focusType=ingredient&focusId=${ingredients[modal.idx!].id}`)}
                    className="seshat-modal-btn-cancel"
                    style={{ marginLeft: 12, color: "var(--color-purple)", border: "1px solid var(--color-purple)" }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                    Ask AI
                  </button>
                )}
              </div>
              <div className="seshat-flex-align" style={{ gap: 12 }}>
                <button
                  onClick={handleCancelModal}
                  className="seshat-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="seshat-modal-btn-submit"
                >
                  <SaveIcon sx={{ fontSize: 16 }} />
                  Save
                </button>
              </div>
            </div>
          }
        >
          <IngredientBlock
            control={control}
            index={modal.idx}
            onDelete={() => {}}
          />
        </Modal>
      )}

      {modal?.type === "monster" && modal.idx !== null && (
        <Modal
          title={modal.isNew ? "Add Monster / Hazard" : "Edit Monster / Hazard Details"}
          onClose={handleCancelModal}
          variant="wide"
          footer={
            <div className="seshat-flex-between" style={{ width: "100%" }}>
              <div>
                {!modal.isNew && (
                  <button
                    onClick={() => {
                      delItem("monsters", monsters[modal.idx!].id);
                      setModal(null);
                    }}
                    className="seshat-modal-btn-delete"
                    title="Delete this monster"
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                    Delete
                  </button>
                )}
                {!modal.isNew && (
                  <button
                    onClick={() => navigate(`/ai?focusType=monster&focusId=${monsters[modal.idx!].id}`)}
                    className="seshat-modal-btn-cancel"
                    style={{ marginLeft: 12, color: "var(--color-purple)", border: "1px solid var(--color-purple)" }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                    Ask AI
                  </button>
                )}
              </div>
              <div className="seshat-flex-align" style={{ gap: 12 }}>
                <button
                  onClick={handleCancelModal}
                  className="seshat-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="seshat-modal-btn-submit"
                >
                  <SaveIcon sx={{ fontSize: 16 }} />
                  Save
                </button>
              </div>
            </div>
          }
        >
          <MonsterBlock
            control={control}
            index={modal.idx}
            onDelete={() => {}}
          />
        </Modal>
      )}

      {modal?.type === "treasure" && modal.idx !== null && (
        <Modal
          title={modal.isNew ? "Add Treasure / Artifact" : "Edit Treasure / Artifact Details"}
          onClose={handleCancelModal}
          variant="wide"
          footer={
            <div className="seshat-flex-between" style={{ width: "100%" }}>
              <div>
                {!modal.isNew && (
                  <button
                    onClick={() => {
                      delItem("treasures", treasures[modal.idx!].id);
                      setModal(null);
                    }}
                    className="seshat-modal-btn-delete"
                    title="Delete this treasure"
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                    Delete
                  </button>
                )}
                {!modal.isNew && (
                  <button
                    onClick={() => navigate(`/ai?focusType=treasure&focusId=${treasures[modal.idx!].id}`)}
                    className="seshat-modal-btn-cancel"
                    style={{ marginLeft: 12, color: "var(--color-purple)", border: "1px solid var(--color-purple)" }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                    Ask AI
                  </button>
                )}
              </div>
              <div className="seshat-flex-align" style={{ gap: 12 }}>
                <button
                  onClick={handleCancelModal}
                  className="seshat-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="seshat-modal-btn-submit"
                >
                  <SaveIcon sx={{ fontSize: 16 }} />
                  Save
                </button>
              </div>
            </div>
          }
        >
          <TreasureBlock
            control={control}
            index={modal.idx}
            onDelete={() => {}}
          />
        </Modal>
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

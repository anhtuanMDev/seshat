import { appStore } from "../store/appStore";
import { useCharacters, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, mkChar } from "../lib/utils";
import { Field, Section, EntryBlock } from "../components/ui";
import { PeopleIcon, AddIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { CHAR_COLORS } from "../lib/constants";
import type { Character } from "../lib/types";
import { useCallback } from "react";

type ObservableOf<T> = { [K in keyof T]: { set(v: T[K]): void } };

export default function CharacterListPage() {
  const characters = useCharacters();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();

  const add = useCallback(() => {
    if (bookIdx < 0) return;
    const c = mkChar(`Character ${characters.length + 1}`, CHAR_COLORS[characters.length % CHAR_COLORS.length]);
    appStore.books[bookIdx].characters.push(c);
  }, [characters.length, bookIdx]);

  const del = useCallback((id: string) => {
    if (bookIdx < 0) return;
    appStore.books[bookIdx].characters.set((prev: Character[]) =>
      prev.filter((x) => x.id !== id),
    );
  }, [bookIdx]);

  const update = useCallback(<K extends keyof Character>(id: string, key: K, v: Character[K]) => {
    if (bookIdx < 0) return;
    const idx = appStore.books[bookIdx].characters.get().findIndex((x) => x.id === id);
    if (idx >= 0) (appStore.books[bookIdx].characters[idx] as ObservableOf<Character>)[key].set(v);
  }, [bookIdx]);

  return (
    <div ref={ref}>
      <Section
        title={<><PeopleIcon sx={{ fontSize: 12, marginRight: 4 }} />Characters ({characters.length})</>}
        action={
          <button onClick={add} style={{ ...S.ghost, display: "flex", alignItems: "center", gap: 2 }}>
            <AddIcon sx={{ fontSize: 14 }} />add
          </button>
        }
        defaultOpen={true}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Your story's characters with their core details.
        </p>
        {characters.map((c: Character) => {
          const color = c.color || "#c0392b";
          return (
            <EntryBlock
              key={c.id}
              color={color}
              onDelete={() => del(c.id)}
            >
              <div style={S.grid2}>
                <Field
                  label="Name"
                  value={c.name || ""}
                  onChange={(v) => update(c.id, "name", v)}
                  placeholder="Character name…"
                />
                <Field
                  label="Role in story"
                  value={c.role || ""}
                  onChange={(v) => update(c.id, "role", v)}
                  placeholder="Protagonist, mentor…"
                />
                <Field
                  label="Archetype"
                  value={c.archetype || ""}
                  onChange={(v) => update(c.id, "archetype", v)}
                  placeholder="The trickster…"
                />
              </div>
              <Field
                label="Core wound"
                value={c.coreWound || ""}
                onChange={(v) => update(c.id, "coreWound", v)}
                multi
                rows={2}
                placeholder="The formative trauma that shaped everything."
              />
              <div style={S.grid2}>
                <Field
                  label="Core fear"
                  value={c.coreFear || ""}
                  onChange={(v) => update(c.id, "coreFear", v)}
                  placeholder="What they most dread."
                />
                <Field
                  label="Core desire"
                  value={c.coreDesire || ""}
                  onChange={(v) => update(c.id, "coreDesire", v)}
                  placeholder="What they most want."
                />
                <Field
                  label="Philosophy / belief system"
                  value={c.philosophy || ""}
                  onChange={(v) => update(c.id, "philosophy", v)}
                  multi
                  rows={2}
                  placeholder="How they see the world."
                />
                <Field
                  label="Secrets (always carried)"
                  value={c.secrets || ""}
                  onChange={(v) => update(c.id, "secrets", v)}
                  multi
                  rows={2}
                  placeholder="What they hide. How it shapes every word they say."
                />
              </div>
              <div style={S.grid2}>
                <Field
                  label="Arc start — who they are"
                  value={c.arcStart || ""}
                  onChange={(v) => update(c.id, "arcStart", v)}
                  placeholder="Closed off, convinced the world is cruel…"
                />
                <Field
                  label="Arc end — who they become"
                  value={c.arcEnd || ""}
                  onChange={(v) => update(c.id, "arcEnd", v)}
                  placeholder="Capable of trust, grief without collapse…"
                />
              </div>
            </EntryBlock>
          );
        })}
        {!characters.length && <p style={S.dim}>No characters yet.</p>}
      </Section>
    </div>
  );
}

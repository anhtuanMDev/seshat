import { useSelector } from "@legendapp/state/react";
import { worldStore } from "../store/worldStore";

export const useWorldTitle = () => useSelector(() => worldStore.title.get());
export const useSynopsis = () => useSelector(() => worldStore.synopsis.get());
export const useSetting = () => useSelector(() => worldStore.setting.get());
export const useThemes = () => useSelector(() => worldStore.themes.get());
export const useRules = () => useSelector(() => worldStore.rules.get());
export const useEvents = () => useSelector(() => worldStore.events.get());
export const useCharacters = () =>
  useSelector(() => worldStore.characters.get());
export const useNations = () => useSelector(() => worldStore.nations.get());
export const useTechniques = () =>
  useSelector(() => worldStore.techniques.get());
export const useIngredients = () =>
  useSelector(() => worldStore.ingredients.get());
export const useMonsters = () => useSelector(() => worldStore.monsters.get());
export const useTreasures = () => useSelector(() => worldStore.treasures.get());
export const useEvent = (id: string) =>
  useSelector(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    worldStore.events.find((e: any) => e.id.get() === id)?.get(),
  );
export const useCharacter = (id: string) =>
  useSelector(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    worldStore.characters.find((c: any) => c.id.get() === id)?.get(),
  );

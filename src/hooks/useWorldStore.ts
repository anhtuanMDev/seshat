import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";

export const useActiveBookIdx = () => useSelector(() => {
  const activeId = appStore.activeBookId.get();
  return appStore.books.get().findIndex(b => b.id === activeId);
});

export const useActiveBookId = () => useSelector(() => appStore.activeBookId.get());

export const useBooks = () => useSelector(() => appStore.books.get());

export const useWorldTitle = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].title.get() : "");
};

export const useSynopsis = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].synopsis.get() : "");
};

export const useSetting = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].setting.get() : "");
};

export const useThemes = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].themes.get() : "");
};

export const useRules = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].rules.get() : "");
};

export const useEvents = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].events.get() : []);
};

export const useCharacters = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].characters.get() : []);
};

export const useNations = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].nations.get() : []);
};

export const useTechniques = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].techniques.get() : []);
};

export const useIngredients = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].ingredients.get() : []);
};

export const useMonsters = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].monsters.get() : []);
};

export const useTreasures = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].treasures.get() : []);
};

export const useChapters = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].chapters.get() : []);
};

export const useBookEvent = (id: string) => {
  const idx = useActiveBookIdx();
  return useSelector(() => {
    if (idx < 0) return undefined;
    return appStore.books[idx].events.get().find((e) => e.id === id);
  });
};

export const useBookEventIdx = (id: string) => {
  const idx = useActiveBookIdx();
  return useSelector(() => {
    if (idx < 0) return -1;
    return appStore.books[idx].events.get().findIndex((e) => e.id === id);
  });
};

export const useBookCharacter = (id: string) => {
  const idx = useActiveBookIdx();
  return useSelector(() => {
    if (idx < 0) return undefined;
    return appStore.books[idx].characters.get().find((c) => c.id === id);
  });
};

export const useBookCharacterIdx = (id: string) => {
  const idx = useActiveBookIdx();
  return useSelector(() => {
    if (idx < 0) return -1;
    return appStore.books[idx].characters.get().findIndex((c) => c.id === id);
  });
};

export const useBookChapter = (id: string) => {
  const idx = useActiveBookIdx();
  return useSelector(() => {
    if (idx < 0) return undefined;
    return appStore.books[idx].chapters.get()?.find((c) => c.id === id);
  });
};

export const useBookChapterIdx = (id: string) => {
  const idx = useActiveBookIdx();
  return useSelector(() => {
    if (idx < 0) return -1;
    return appStore.books[idx].chapters.get()?.findIndex((c) => c.id === id) ?? -1;
  });
};

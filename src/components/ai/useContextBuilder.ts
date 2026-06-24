// ─────────────────────────────────────────────────────────────────────────────
// useContextBuilder — loads book data and generates the AI context string
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../../store/appStore";
import type {
  BookData,
  Character,
  Event,
  Technique,
  Treasure,
  Nation,
  Ingredient,
  Monster,
} from "../../store/appStore";
import { buildExport } from "../../lib/export";
import { loadBookFromGitHub } from "../../lib/githubSync";
import { showToast } from "../../store/toastStore";

export function useContextBuilder(focusType: string | null, focusId: string | null) {
  const books = useSelector(() => appStore.books.get() || []);

  const [selectedBookId, setSelectedBookId] = useState<string>(
    () => appStore.activeBookId.get() || "none",
  );
  const [contextText, setContextText] = useState("");
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  const generateContextFromBook = useCallback(
    (b: BookData) => {
      let contextData = {
        title: b.title || "",
        synopsis: b.synopsis || "",
        setting: b.setting || "",
        themes: b.themes || "",
        rules: b.rules || "",
        nations: b.nations || [],
        techniques: b.techniques || [],
        ingredients: b.ingredients || [],
        monsters: b.monsters || [],
        treasures: b.treasures || [],
        events: b.events || [],
        characters: b.characters || [],
      };

      if (focusType && focusId && focusType !== "none") {
        if (focusType === "character") {
          const char = contextData.characters.find((c: Character) => c.id === focusId);
          if (char) {
            const relatedCharIds =
              char.relationships?.map((r: { withId: string }) => r.withId) || [];
            char.branch?.forEach((b: { crossings?: { withId: string }[] }) => {
              b.crossings?.forEach((cr: { withId: string }) => relatedCharIds.push(cr.withId));
            });
            const relatedChars = contextData.characters.filter(
              (c: Character) => relatedCharIds.includes(c.id) && c.id !== char.id,
            );

            const skillStr = JSON.stringify(char.skills || []).toLowerCase();
            const relatedTechs = contextData.techniques.filter((t: Technique) =>
              skillStr.includes(t.name?.toLowerCase() || ""),
            );

            const equipStr = JSON.stringify(char.equipment || []).toLowerCase();
            const relatedTreasures = contextData.treasures.filter((t: Treasure) =>
              equipStr.includes(t.name?.toLowerCase() || ""),
            );

            contextData = {
              ...contextData,
              title: `${contextData.title} (Focus: Character - ${char.name})`,
              characters: [char, ...relatedChars],
              nations: contextData.nations,
              techniques: relatedTechs,
              ingredients: [],
              monsters: [],
              treasures: relatedTreasures,
            };
          }
        } else if (focusType === "event") {
          const ev = contextData.events.find((e: Event) => e.id === focusId);
          if (ev) {
            const charIds = ev.characters || [];
            const chars = contextData.characters.filter((c: Character) =>
              charIds.includes(c.id),
            );

            const skillStr = JSON.stringify(
              chars.map((c: Character) => c.skills || []),
            ).toLowerCase();
            const relatedTechs = contextData.techniques.filter((t: Technique) =>
              skillStr.includes(t.name?.toLowerCase() || ""),
            );

            const equipStr = JSON.stringify(
              chars.map((c: Character) => c.equipment || []),
            ).toLowerCase();
            const relatedTreasures = contextData.treasures.filter((t: Treasure) =>
              equipStr.includes(t.name?.toLowerCase() || ""),
            );

            contextData = {
              ...contextData,
              title: `${contextData.title} (Focus: Event - ${ev.title})`,
              events: contextData.events,
              characters: chars,
              nations: contextData.nations,
              techniques: relatedTechs,
              ingredients: [],
              monsters: [],
              treasures: relatedTreasures,
            };
          }
        } else {
          const collectionName = (focusType + "s") as keyof typeof contextData;
          type WorldItem = Nation | Technique | Ingredient | Monster | Treasure;
          const items = contextData[collectionName] as Array<WorldItem>;
          if (items) {
            const item = items.find((x) => x.id === focusId);
            if (item) {
              contextData = {
                ...contextData,
                title: `${contextData.title} (Focus: ${
                  focusType.charAt(0).toUpperCase() + focusType.slice(1)
                } - ${item.name})`,
                characters: [],
                events: [],
                nations: focusType === "nation" ? [item as Nation] : [],
                techniques: focusType === "technique" ? [item as Technique] : [],
                ingredients: focusType === "ingredient" ? [item as Ingredient] : [],
                monsters: focusType === "monster" ? [item as Monster] : [],
                treasures: focusType === "treasure" ? [item as Treasure] : [],
              };
            }
          }
        }
      }

      setContextText(buildExport(contextData));
    },
    [focusType, focusId],
  );

  useEffect(() => {
    if (selectedBookId === "none") {
      setTimeout(() => setContextText(""), 0);
      return;
    }

    const loadContext = async () => {
      const bookIdx = books.findIndex((b) => b && b.id === selectedBookId);
      if (bookIdx < 0) return;

      const book = books[bookIdx];
      if (book.isFullyLoaded) {
        generateContextFromBook(book);
      } else {
        setIsLoadingContext(true);
        const token =
          localStorage.getItem("seshat-auth-token") ||
          sessionStorage.getItem("seshat-auth-token");
        if (token) {
          try {
            const fullBook = await loadBookFromGitHub(token, selectedBookId);
            if (fullBook) {
              appStore.books[bookIdx].set(fullBook);
              generateContextFromBook(fullBook);
            }
          } catch (err) {
            console.error(err);
            showToast("Failed to load book context", "error");
            setSelectedBookId("none");
          }
        }
        setIsLoadingContext(false);
      }
    };

    loadContext();
  }, [selectedBookId, books, generateContextFromBook]);

  return {
    books,
    selectedBookId,
    setSelectedBookId,
    contextText,
    isLoadingContext,
  };
}

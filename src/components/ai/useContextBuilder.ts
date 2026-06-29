// ─────────────────────────────────────────────────────────────────────────────
// useContextBuilder — loads book data and generates the AI context string.
// Supports granular selection: specific chapters, characters, events, files.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "@legendapp/state/react";
import { useLocation } from "react-router-dom";
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
import type { Chapter } from "../../lib/types";

export function useContextBuilder(focusType: string | null, focusId: string | null) {
  const books = useSelector(() => appStore.books.get() || []);
  const location = useLocation();

  const [selectedBookId, setSelectedBookId] = useState<string>(
    () => location.state?.bookId || appStore.activeBookId.get() || "none",
  );
  const [contextText, setContextText] = useState("");
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Granular inclusions — empty set means "include all"
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [selectedFileContents, setSelectedFileContents] = useState<string[]>([]);

  // Reset granular selections when book changes
  const prevBookId = useRef(selectedBookId);

  // Keep latest granular selections in a ref so the async loader can read them
  // without needing them as effect dependencies.
  const selectionsRef = useRef({ selectedCharacterIds, selectedEventIds, selectedChapterIds, selectedFileContents });
  useEffect(() => {
    selectionsRef.current = { selectedCharacterIds, selectedEventIds, selectedChapterIds, selectedFileContents };
  });

  const buildContext = useCallback(
    (b: BookData, overrides?: {
      charIds?: Set<string>;
      eventIds?: Set<string>;
      chapterIds?: Set<string>;
      fileContents?: string[];
    }) => {
      const charIds = overrides?.charIds ?? selectionsRef.current.selectedCharacterIds;
      const eventIds = overrides?.eventIds ?? selectionsRef.current.selectedEventIds;
      const chapterIds = overrides?.chapterIds ?? selectionsRef.current.selectedChapterIds;
      const fileContents = overrides?.fileContents ?? selectionsRef.current.selectedFileContents;

      const filterOrAll = <T extends { id: string }>(items: T[], ids: Set<string>): T[] =>
        ids.size === 0 ? items : items.filter((x) => ids.has(x.id));

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
        events: filterOrAll(b.events || [], eventIds),
        characters: filterOrAll(b.characters || [], charIds),
      };

      // Apply URL-param focus narrowing
      if (focusType && focusId && focusType !== "none") {
        if (focusType === "character") {
          const char = contextData.characters.find((c: Character) => c.id === focusId);
          if (char) {
            const relatedCharIds = char.relationships?.map((r: { withId: string }) => r.withId) || [];
            char.branch?.forEach((bv: { crossings?: { withId: string }[] }) => {
              bv.crossings?.forEach((cr: { withId: string }) => relatedCharIds.push(cr.withId));
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
              techniques: relatedTechs,
              ingredients: [],
              monsters: [],
              treasures: relatedTreasures,
            };
          }
        } else if (focusType === "event") {
          const ev = contextData.events.find((e: Event) => e.id === focusId);
          if (ev) {
            const charEvIds = ev.characters || [];
            const chars = contextData.characters.filter((c: Character) => charEvIds.includes(c.id));
            const skillStr = JSON.stringify(chars.map((c: Character) => c.skills || [])).toLowerCase();
            const relatedTechs = contextData.techniques.filter((t: Technique) =>
              skillStr.includes(t.name?.toLowerCase() || ""),
            );
            const equipStr = JSON.stringify(chars.map((c: Character) => c.equipment || [])).toLowerCase();
            const relatedTreasures = contextData.treasures.filter((t: Treasure) =>
              equipStr.includes(t.name?.toLowerCase() || ""),
            );
            contextData = {
              ...contextData,
              title: `${contextData.title} (Focus: Event - ${ev.title})`,
              characters: chars,
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
                title: `${contextData.title} (Focus: ${focusType.charAt(0).toUpperCase() + focusType.slice(1)} - ${item.name})`,
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

      let text = buildExport(contextData);

      // Append selected chapter bodies
      if (chapterIds.size > 0) {
        const chapters = (b.chapters || []).filter((ch: Chapter) => chapterIds.has(ch.id));
        if (chapters.length) {
          text += `\n\n${"─".repeat(60)}\nSELECTED CHAPTERS\n${"─".repeat(60)}`;
          for (const ch of chapters) {
            text += `\n\nChapter ${ch.number}: ${ch.title}`;
            if (ch.synopsis) text += `\nSynopsis: ${ch.synopsis}`;
            if (ch.notes) text += `\nNotes: ${ch.notes}`;
            if (ch.body) text += `\nBody:\n${ch.body}`;
          }
        }
      }

      // Append uploaded file text
      if (fileContents.length > 0) {
        text += `\n\n${"─".repeat(60)}\nATTACHED FILES\n${"─".repeat(60)}`;
        for (const fc of fileContents) text += `\n\n${fc}`;
      }

      return text;
    },
    [focusType, focusId],
  );

  // Load book from GitHub if needed, then build context
  useEffect(() => {
    if (selectedBookId === "none") {
      setTimeout(() => setContextText(""), 0);
      return;
    }

    let cancelled = false;

    const loadContext = async () => {
      const bookIdx = books.findIndex((b) => b && b.id === selectedBookId);
      if (bookIdx < 0) return;

      const book = books[bookIdx];
      if (book.isFullyLoaded) {
        if (!cancelled) setTimeout(() => setContextText(buildContext(book)), 0);
      } else {
        setIsLoadingContext(true);
        const token =
          localStorage.getItem("seshat-auth-token") ||
          sessionStorage.getItem("seshat-auth-token");
        if (token && !cancelled) {
          try {
            const fullBook = await loadBookFromGitHub(token, selectedBookId);
            if (fullBook && !cancelled) {
              appStore.books[bookIdx].set(fullBook);
              setContextText(buildContext(fullBook));
            }
          } catch (err) {
            console.error(err);
            if (!cancelled) {
              showToast("Failed to load book context", "error");
              setSelectedBookId("none");
            }
          }
        }
        if (!cancelled) setIsLoadingContext(false);
      }
    };

    loadContext();
    return () => { cancelled = true; };
  }, [selectedBookId, books, buildContext]);

  // Reset granular selections and regenerate when book changes
  useEffect(() => {
    if (prevBookId.current === selectedBookId) return;
    prevBookId.current = selectedBookId;
    setSelectedCharacterIds(new Set());
    setSelectedEventIds(new Set());
    setSelectedChapterIds(new Set());
    setSelectedFileContents([]);
  }, [selectedBookId]);

  // Regenerate when selections change (book already loaded)
  useEffect(() => {
    if (selectedBookId === "none") return;
    const book = books.find((b) => b && b.id === selectedBookId);
    if (!book?.isFullyLoaded) return;
    const text = buildContext(book, {
      charIds: selectedCharacterIds,
      eventIds: selectedEventIds,
      chapterIds: selectedChapterIds,
      fileContents: selectedFileContents,
    });
    setTimeout(() => setContextText(text), 0);
  }, [selectedCharacterIds, selectedEventIds, selectedChapterIds, selectedFileContents, selectedBookId, books, buildContext]);

  return {
    books,
    selectedBookId,
    setSelectedBookId,
    contextText,
    isLoadingContext,
    selectedCharacterIds,
    setSelectedCharacterIds,
    selectedEventIds,
    setSelectedEventIds,
    selectedChapterIds,
    setSelectedChapterIds,
    selectedFileContents,
    setSelectedFileContents,
  };
}

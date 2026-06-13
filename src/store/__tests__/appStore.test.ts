import { describe, it, expect, beforeEach } from "vitest";
import { appStore, type BookData } from "../appStore";

// Need to reset the persist state but appStore is a singleton.
// Vitest runs tests in isolation.

describe("appStore", () => {
  beforeEach(() => {
    appStore.activeBookId.set(null);
    appStore.books.set([]);
  });

  it("initializes with null activeBookId and empty books", () => {
    expect(appStore.activeBookId.get()).toBeNull();
    expect(appStore.books.get()).toEqual([]);
  });

  it("can add a book and set it active", () => {
    const book: BookData = {
      id: "b1",
      title: "Test Book",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: [],
      characters: [],
      chapters: [],
      foreshadows: [],
    };
    
    appStore.books.push(book);
    appStore.activeBookId.set("b1");
    
    expect(appStore.books.get().length).toBe(1);
    expect(appStore.activeBookId.get()).toBe("b1");
  });
});

import "@testing-library/jest-dom/vitest";

// stub localStorage for jsdom
const store: Record<string, string> = {};
const mockStorage: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  length: 0,
  key: () => null,
};
Object.defineProperty(window, "localStorage", { value: mockStorage });

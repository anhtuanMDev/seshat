import { describe, it, expect, beforeEach } from "vitest";
import { toastStore, showToast, hideToast } from "../toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    toastStore.set({ open: false, message: "", severity: "success" });
  });

  it("initializes closed", () => {
    const s = toastStore.get();
    expect(s.open).toBe(false);
    expect(s.message).toBe("");
  });

  it("showToast opens a toast", () => {
    showToast("Success message", "success");
    const s = toastStore.get();
    expect(s.open).toBe(true);
    expect(s.message).toBe("Success message");
    expect(s.severity).toBe("success");
  });

  it("hideToast closes toast", () => {
    showToast("First", "info");
    hideToast();
    
    const afterRemove = toastStore.get();
    expect(afterRemove.open).toBe(false);
  });
});

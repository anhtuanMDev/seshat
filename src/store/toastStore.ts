import { observable } from "@legendapp/state";

export const toastStore = observable({
  open: false,
  message: "",
  severity: "success" as "success" | "error" | "info" | "warning",
});

export const showToast = (message: string, severity: "success" | "error" | "info" | "warning" = "success") => {
  toastStore.set({ open: true, message, severity });
};

export const hideToast = () => {
  toastStore.open.set(false);
};

import { useContext } from "react";
import { ThemeContext } from "./useTheme";
import type { ThemeContextValue } from "./useTheme";

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { ThemeProvider } from "./hooks/useTheme";
import { GlobalToast } from "./components/GlobalToast";

import "./index.css";
import "./styles/base.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <GlobalToast />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);

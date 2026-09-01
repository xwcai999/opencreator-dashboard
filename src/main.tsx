import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DashboardApp } from "./App";
import { createHttpDashboardDataSource } from "./http-data-source";

const apiBase = import.meta.env.VITE_OPENCREATOR_API_BASE?.trim();
const source = apiBase
  ? createHttpDashboardDataSource(apiBase, {
      enableWawaActions: import.meta.env.VITE_OPENCREATOR_ENABLE_WAWA_ACTIONS === "true"
    })
  : undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode><DashboardApp source={source} /></StrictMode>
);

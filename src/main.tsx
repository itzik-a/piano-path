import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { startSync } from "./state/sync";
import "./styles.css";

startSync();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

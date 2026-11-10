import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/fonts";
import "./styles/tokens.css";
import "./styles/content.css";
import "./styles/app.css";
import "./styles/developer.css";
import "./styles/business.css";
import "./styles/business-pages.css";
import "./styles/museum.css";
import { createBrowserModeStore } from "./state/mode";
import { App } from "./app/App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App store={createBrowserModeStore()} />
    </StrictMode>,
  );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/fonts";
import "./styles/tokens.css";
import "./styles/content.css";
import "./styles/app.css";
import "./styles/business.css";
import "./styles/business-pages.css";
import { App } from "./app/App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

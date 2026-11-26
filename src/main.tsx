import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-700.css";
import "./portfolio/portfolio.css";
import "./portfolio/opening.css";
import { Portfolio } from "./portfolio/Portfolio";

createRoot(document.getElementById("root")!).render(
  <StrictMode><Portfolio /></StrictMode>,
);

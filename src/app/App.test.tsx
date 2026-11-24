import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { App } from "./App";

it("shows one portfolio with approved business and technical work and an arcade link", () => {
  const html = renderToStaticMarkup(<App />);
  expect(html).toContain('id="education"');
  expect(html).toContain('id="projects"');
  expect(html).toContain("TaskNest");
  expect(html).toContain("How it is built");
  expect(html).toContain("Barsarani Sahoo");
  expect(html).toContain('href="?view=arcade"');
  expect(html).not.toContain('role="switch"');
  expect(html).not.toContain("?view=museum");
});

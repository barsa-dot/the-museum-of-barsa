import { expect, it } from "vitest";
import { viewFromUrl } from "./view";

it("opens an arcade link and defaults to the portfolio for old or unknown views", () => {
  const site = "https://portfolio.test/";
  expect(viewFromUrl(site)).toBe("portfolio");
  expect(viewFromUrl(site + "?view=arcade")).toBe("arcade");
  expect(viewFromUrl(site + "?view=museum")).toBe("portfolio");
  expect(viewFromUrl(site + "?mode=developer")).toBe("portfolio");
});

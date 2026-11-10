import { describe, expect, it } from "vitest";
import { urlForView, viewFromUrl } from "./view";

const SITE = "https://museum.test/";

describe("view in the URL", () => {
  it("defaults to the portfolio", () => {
    expect(viewFromUrl(SITE)).toBe("portfolio");
    expect(viewFromUrl(`${SITE}?view=nonsense`)).toBe("portfolio");
  });

  it("reads the museum view", () => {
    expect(viewFromUrl(`${SITE}?view=museum`)).toBe("museum");
  });

  it("keeps the mode parameter when entering the museum and drops the #section", () => {
    expect(urlForView(`${SITE}?mode=business#projects`, "museum")).toBe(`${SITE}?mode=business&view=museum`);
  });

  it("returns to the portfolio keeping other parameters", () => {
    expect(urlForView(`${SITE}?mode=developer&view=museum`, "portfolio")).toBe(`${SITE}?mode=developer`);
  });
});

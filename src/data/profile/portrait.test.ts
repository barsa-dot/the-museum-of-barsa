import { existsSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { profile } from "./index";

const publicDir = new URL("../../../app/public/", import.meta.url);

describe.each([
  ["photo", profile.portrait.photo],
  ["pixel", profile.portrait.pixel],
] as const)("%s portrait asset", (_name, asset) => {
  it("is configured with descriptive alt text", () => {
    expect(asset).not.toBeNull();
    expect(asset!.alt).toMatch(/Barsarani Sahoo/);
  });

  it("exists in app/public with the stated dimensions", async () => {
    const file = new URL(asset!.src, publicDir);
    expect(existsSync(file)).toBe(true);
    const meta = await sharp(file.pathname.replace(/^\/([A-Z]:)/, "$1")).metadata();
    expect([meta.width, meta.height]).toEqual([asset!.width, asset!.height]);
  });

  it("carries no embedded metadata (no EXIF, location or profile data)", async () => {
    const meta = await sharp(new URL(asset!.src, publicDir).pathname.replace(/^\/([A-Z]:)/, "$1")).metadata();
    expect([meta.exif, meta.xmp, meta.iptc]).toEqual([undefined, undefined, undefined]);
  });

  it("is small enough for the web", async () => {
    const { size } = await sharp(new URL(asset!.src, publicDir).pathname.replace(/^\/([A-Z]:)/, "$1")).metadata();
    expect(size ?? 0).toBeLessThan(120 * 1024);
  });
});

it("keeps the pixel portrait square and the photo 4:5, matching their frames", () => {
  expect(profile.portrait.pixel!.width).toBe(profile.portrait.pixel!.height);
  expect(profile.portrait.photo!.width / profile.portrait.photo!.height).toBeCloseTo(4 / 5);
});

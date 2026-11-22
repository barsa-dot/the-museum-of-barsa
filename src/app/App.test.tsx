import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { STORAGE_KEY, createModeStore, resolveInitialMode, type StorageLike } from "../state/mode";
import { MODES } from "../data/profile/presentation";

function storage(initial: Record<string, string> = {}): StorageLike {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

const render = (stored?: string) =>
  renderToStaticMarkup(<App store={createModeStore({ storage: storage(stored ? { [STORAGE_KEY]: stored } : {}) })} />);

describe("portfolio entrance", () => {
  it("opens directly in Business and places a single switch below the name", () => {
    const html = render();
    expect(html).toContain('id="content"');
    expect(html).toContain('class="id-card"');
    expect(html).toMatch(/<h1[^>]*>Barsarani Sahoo<\/h1><button[^>]*role="switch"[^>]*aria-checked="false"/);
    expect(html.match(/role="switch"/g)).toHaveLength(1);
    expect(html).not.toContain('class="chooser"');
  });
});

describe.each(MODES)("returning visitor in %s mode", (mode) => {
  const html = render(mode);

  it("opens the portfolio with the saved switch state", () => {
    expect(html).toContain('id="education"');
    expect(html).toContain('aria-label="Tech view"');
    expect(html).toContain(`aria-checked="${mode === "developer"}"`);
  });

  it("offers a shortcut to the switch and a skip link", () => {
    expect(html).toContain('href="#portfolio-view"');
    expect(html).toContain('href="#content"');
  });
});

describe("pre-paint script in app/index.html", () => {
  const page = readFileSync(new URL("../../app/index.html", import.meta.url), "utf8");
  const script = page.match(/<script>([\s\S]*?)<\/script>/)?.[1];

  function runScript(url: string, stored: string | null, blocked = false): string | null {
    let applied: string | null = null;
    const fakeStorage = {
      getItem: (k: string) => {
        if (blocked) throw new Error("blocked");
        return k === STORAGE_KEY ? stored : null;
      },
    };
    const fakeDocument = { documentElement: { setAttribute: (_: string, v: string) => void (applied = v) } };
    new Function("location", "localStorage", "document", "URLSearchParams", script!)(
      new URL(url),
      fakeStorage,
      fakeDocument,
      URLSearchParams,
    );
    return applied;
  }

  it("exists", () => expect(script).toBeTruthy());

  it("loads the app from inside the Vite root, so the dev server can serve it", () => {
    // A path like "../src/main.tsx" builds fine but 404s on the dev server
    // (white screen), because app/ is the server root.
    const entries = [...page.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]!);
    expect(entries).toEqual(["/entry.ts"]);
    expect(readFileSync(new URL("../../app/entry.ts", import.meta.url), "utf8")).toContain('import "../src/main"');
  });

  it.each([
    ["https://x.test/", null],
    ["https://x.test/", "business"],
    ["https://x.test/", "neon"],
    ["https://x.test/?mode=developer", "business"],
    ["https://x.test/?mode=hacker", "developer"],
    ["https://x.test/#projects", "developer"],
  ])("agrees with resolveInitialMode for %s with stored %s", (url, stored) => {
    const expected = resolveInitialMode({ getUrl: () => url, storage: storage(stored ? { [STORAGE_KEY]: stored } : {}) }).mode ?? "business";
    expect(runScript(url, stored)).toBe(expected);
  });

  it("survives blocked storage", () => {
    expect(runScript("https://x.test/", null, true)).toBe("business");
    expect(runScript("https://x.test/?mode=business", null, true)).toBe("business");
  });
});

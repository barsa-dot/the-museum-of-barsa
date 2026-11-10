import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { MODE_OPTIONS } from "./ModeChooser";
import { currentSectionId } from "./ModeSwitch";
import { STORAGE_KEY, createModeStore, resolveInitialMode, type StorageLike } from "../state/mode";
import { MODES } from "../data/profile/presentation";

function storage(initial: Record<string, string> = {}): StorageLike {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

const render = (stored?: string) =>
  renderToStaticMarkup(<App store={createModeStore({ storage: storage(stored ? { [STORAGE_KEY]: stored } : {}) })} />);

describe("first visit", () => {
  const html = render();

  it("shows the mode choice, not the old title intro", () => {
    expect(html).toContain('class="chooser"');
    expect(html).not.toMatch(/Enter the Museum/i);
    expect(html).not.toContain('id="content"');
  });

  it("offers both modes as buttons drawn in their own mode", () => {
    for (const mode of MODES) {
      expect(html).toMatch(new RegExp(`<button[^>]*data-mode="${mode}"`));
    }
    expect(html.match(/<button/g)).toHaveLength(2);
  });

  it("says both modes hold the same work", () => {
    expect(html).toContain("Both modes hold the same projects, education and experience.");
    expect(html).toContain("remembered on this device");
  });

  it("names the owner as the page heading", () => {
    expect(html).toMatch(/<h1[^>]*>Barsarani Sahoo<\/h1>/);
  });

  it("describes each mode by emphasis only, with no claims", () => {
    for (const option of MODE_OPTIONS) {
      expect(option.description).toMatch(/^Leads with /);
      expect(option.description).not.toMatch(/\d/);
    }
  });
});

describe.each(MODES)("returning visitor in %s mode", (mode) => {
  const html = render(mode);

  it("goes straight to the content", () => {
    expect(html).not.toContain('class="chooser"');
    expect(html).toContain('id="content"');
    expect(html).toContain('id="education"');
  });

  it("shows the mode switch with the current mode pressed", () => {
    expect(html).toContain('aria-label="Visual mode"');
    const pressed = [...html.matchAll(/aria-pressed="true"[^>]*>([^<]+)</g)].map((m) => m[1]);
    expect(pressed).toEqual([mode === "developer" ? "Developer" : "Business"]);
  });

  it("offers a way back to the mode choice and a skip link", () => {
    expect(html).toContain("Show the mode choice again");
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
    const expected = resolveInitialMode({ getUrl: () => url, storage: storage(stored ? { [STORAGE_KEY]: stored } : {}) }).mode;
    expect(runScript(url, stored)).toBe(expected);
  });

  it("survives blocked storage", () => {
    expect(runScript("https://x.test/", null, true)).toBeNull();
    expect(runScript("https://x.test/?mode=business", null, true)).toBe("business");
  });
});

describe("currentSectionId", () => {
  const fakeDoc = (tops: Record<string, number>) =>
    ({
      querySelectorAll: () =>
        Object.entries(tops).map(([id, top]) => ({ id, getBoundingClientRect: () => ({ top }) })),
    }) as unknown as Document;

  it("returns the section being read", () => {
    expect(currentSectionId(fakeDoc({ about: -900, education: -100, projects: 600 }), 900)).toBe("education");
  });

  it("returns null at the top of the page above all sections", () => {
    expect(currentSectionId(fakeDoc({ about: 400, education: 1200 }), 900)).toBeNull();
  });
});

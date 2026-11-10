import { describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, createModeStore, resolveInitialMode, urlWithMode, type ModeEnvironment, type StorageLike } from "./mode";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

const blockedStorage: StorageLike = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
  removeItem: () => { throw new Error("blocked"); },
};

function fakeRoot() {
  const attrs: Record<string, string> = {};
  return {
    attrs,
    setAttribute: (n: string, v: string) => void (attrs[n] = v),
    removeAttribute: (n: string) => void delete attrs[n],
  };
}

function env(url: string, storage: StorageLike | null = memoryStorage()) {
  let current = url;
  const root = fakeRoot();
  const e: ModeEnvironment = {
    storage,
    root,
    getUrl: () => current,
    replaceUrl: (u) => void (current = u),
  };
  return { e, root, url: () => current };
}

const SITE = "https://museum.example/";

describe("initial mode", () => {
  it("shows the selection screen on a first visit", () => {
    expect(resolveInitialMode(env(SITE).e)).toEqual({ mode: null, source: "none" });
  });

  it("uses a remembered choice", () => {
    const { e } = env(SITE, memoryStorage({ [STORAGE_KEY]: "business" }));
    expect(resolveInitialMode(e)).toEqual({ mode: "business", source: "stored" });
  });

  it("lets a shared ?mode= link win without overwriting the saved preference", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "business" });
    const { e } = env(`${SITE}?mode=developer`, storage);
    expect(resolveInitialMode(e)).toEqual({ mode: "developer", source: "url" });
    expect(storage.data[STORAGE_KEY]).toBe("business");
  });

  it("ignores an invalid ?mode= value", () => {
    expect(resolveInitialMode(env(`${SITE}?mode=hacker`).e).mode).toBeNull();
  });

  it("clears a corrupt stored value", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "neon" });
    expect(resolveInitialMode(env(SITE, storage).e).mode).toBeNull();
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
  });

  it("works when storage is blocked", () => {
    expect(resolveInitialMode(env(SITE, blockedStorage).e).mode).toBeNull();
  });
});

describe("mode store", () => {
  it("applies data-mode to the root element", () => {
    const { e, root } = env(SITE, memoryStorage({ [STORAGE_KEY]: "developer" }));
    createModeStore(e);
    expect(root.attrs["data-mode"]).toBe("developer");
  });

  it("remembers a chosen mode", () => {
    const storage = memoryStorage();
    const store = createModeStore(env(SITE, storage).e);
    store.choose("business");
    expect(store.get()).toEqual({ mode: "business", source: "chosen" });
    expect(storage.data[STORAGE_KEY]).toBe("business");
  });

  it("can choose without remembering", () => {
    const storage = memoryStorage();
    const store = createModeStore(env(SITE, storage).e);
    store.choose("business", { remember: false });
    expect(store.get().mode).toBe("business");
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
  });

  it("toggles between modes and notifies listeners", () => {
    const store = createModeStore(env(SITE).e);
    const listener = vi.fn();
    store.subscribe(listener);
    store.toggle(); // nothing chosen yet → no-op
    expect(listener).not.toHaveBeenCalled();
    store.choose("developer");
    store.toggle();
    expect(store.get().mode).toBe("business");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("forgets the preference and returns to the selection screen", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "developer" });
    const { e, root } = env(SITE, storage);
    const store = createModeStore(e);
    store.forget();
    expect(store.get()).toEqual({ mode: null, source: "none" });
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
    expect(root.attrs["data-mode"]).toBeUndefined();
  });

  it("keeps working in memory when storage is blocked", () => {
    const store = createModeStore(env(SITE, blockedStorage).e);
    expect(() => store.choose("developer")).not.toThrow();
    expect(store.get().mode).toBe("developer");
  });

  it("stops notifying after unsubscribe", () => {
    const store = createModeStore(env(SITE).e);
    const listener = vi.fn();
    store.subscribe(listener)();
    store.choose("business");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("switching preserves context", () => {
  it("keeps path and #section when a shared link's mode is switched", () => {
    const { e, url } = env(`${SITE}rooms/library?mode=developer#education`);
    const store = createModeStore(e);
    store.toggle();
    expect(url()).toBe(`${SITE}rooms/library?mode=business#education`);
  });

  it("leaves ordinary URLs untouched", () => {
    const { e, url } = env(`${SITE}rooms/library#education`);
    createModeStore(e).choose("business");
    expect(url()).toBe(`${SITE}rooms/library#education`);
  });

  it("removes ?mode= when returning to the selection screen", () => {
    const { e, url } = env(`${SITE}?mode=business#projects`);
    createModeStore(e).forget();
    expect(url()).toBe(`${SITE}#projects`);
  });

  it("builds shareable links for a mode", () => {
    expect(urlWithMode(`${SITE}rooms/archive?x=1#work`, "business")).toBe(`${SITE}rooms/archive?x=1&mode=business#work`);
  });
});

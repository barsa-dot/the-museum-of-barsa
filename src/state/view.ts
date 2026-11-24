export type View = "portfolio" | "arcade";

export function viewFromUrl(url: string): View {
  return new URL(url).searchParams.get("view") === "arcade" ? "arcade" : "portfolio";
}

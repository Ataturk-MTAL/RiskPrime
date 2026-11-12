import type { Tab } from "$lib/state.svelte";

export interface Route {
  tab: Tab;
  id: string | null;
}

const SEGMENTS: Record<Tab, string> = {
  overview: "genel",
  school: "okul",
  checklists: "kontrol",
  risk: "risk",
  readiness: "hazirlik",
};

/** "#kontrol/abc" -> { tab: "checklists", id: "abc" }; anything unknown opens the overview. */
export function parseHash(hash: string): Route {
  const [segment, ...rest] = hash.replace(/^#/, "").split("/");
  const tab = (Object.keys(SEGMENTS) as Tab[]).find((t) => SEGMENTS[t] === segment) ?? "overview";
  const id = rest.join("/");
  return { tab, id: tab === "checklists" || tab === "risk" ? id || null : null };
}

export function formatHash(tab: Tab, id: string | null): string {
  const hasId = id && (tab === "checklists" || tab === "risk");
  return `#${SEGMENTS[tab]}${hasId ? `/${id}` : ""}`;
}

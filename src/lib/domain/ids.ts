// Id generation, shared by every domain module (kept apart so modules never import each other in a cycle).
export function newId(prefix: string): string {
  const c = globalThis.crypto;
  const body =
    c && typeof c.randomUUID === "function"
      ? c.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  return `${prefix}-${body}`;
}

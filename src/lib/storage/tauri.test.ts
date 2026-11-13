import { describe, expect, test, vi } from "vite-plus/test";
import { emptyAssessment } from "$lib/domain/assessment";
import { serialize } from "$lib/domain/file";
import { createTauriStore, type Invoke } from "./tauri";

const fakeInvoke = (result: unknown) =>
  vi.fn(async () => result) as unknown as Invoke & ReturnType<typeof vi.fn>;

describe("createTauriStore", () => {
  test("list calls periods_list", async () => {
    const invoke = fakeInvoke([]);
    expect(await createTauriStore(invoke).list()).toEqual([]);
    expect(invoke).toHaveBeenCalledWith("periods_list");
  });

  test("save sends the serialized document", async () => {
    const a = emptyAssessment("2026-2027");
    const invoke = fakeInvoke({ id: "x" });
    await createTauriStore(invoke).save(a);
    expect(invoke).toHaveBeenCalledWith("periods_save", { document: serialize(a) });
  });

  test("load parses the stored document through the file migration path", async () => {
    const a = emptyAssessment("2026-2027");
    const loaded = await createTauriStore(fakeInvoke(serialize(a))).load("2026-2027#r1");
    expect(loaded?.period).toBe("2026-2027");
  });

  test("load returns null for a missing or unreadable document", async () => {
    expect(await createTauriStore(fakeInvoke(null)).load("x")).toBeNull();
    expect(await createTauriStore(fakeInvoke("not json")).load("x")).toBeNull();
  });

  test("remove passes the id", async () => {
    const invoke = fakeInvoke(undefined);
    await createTauriStore(invoke).remove("x");
    expect(invoke).toHaveBeenCalledWith("periods_remove", { id: "x" });
  });
});

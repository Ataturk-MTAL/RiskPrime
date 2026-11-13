import { describe, expect, test, vi } from "vite-plus/test";
import { saveToDisk } from "./download";

const blob = new Blob(["abc"]);

describe("saveToDisk", () => {
  test("writes the bytes to the picked path", async () => {
    const write = vi.fn(async () => {});
    const pickPath = vi.fn(async () => "/tmp/r.pdf");
    expect(await saveToDisk(blob, "r.PDF", { pickPath, write })).toBe(true);
    expect(pickPath).toHaveBeenCalledWith("r.PDF", "pdf");
    expect(write).toHaveBeenCalledWith("/tmp/r.pdf", new Uint8Array([97, 98, 99]));
  });

  test("returns false without writing when the user cancels", async () => {
    const write = vi.fn(async () => {});
    expect(await saveToDisk(blob, "r.pdf", { pickPath: async () => null, write })).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
});

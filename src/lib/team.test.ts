import { describe, expect, it } from "vitest";
import { shuffle } from "./team";

describe("team card order", () => {
  it("keeps every member exactly once when shuffled", () => {
    const ids = ["a", "b", "c", "d", "e"];
    expect([...shuffle(ids)].sort()).toEqual(ids);
  });

  it("produces a different first card depending on chance", () => {
    const ids = ["a", "b", "c", "d"];
    expect(shuffle(ids, () => 0)[0]).toBe("b");
    expect(shuffle(ids, () => 0.999)[0]).toBe("a");
  });
});

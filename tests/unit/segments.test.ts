import { describe, it, expect } from "vitest";
import { splitSegments } from "../../src/lib/segments";

describe("splitSegments", () => {
  it("splits on sentence boundaries", () => {
    const r = splitSegments("Hello world. How are you? I am fine!");
    expect(r).toEqual([
      { text: "Hello world." },
      { text: "How are you?" },
      { text: "I am fine!" },
    ]);
  });

  it("trims whitespace and skips empties", () => {
    const r = splitSegments("  One.   Two.   ");
    expect(r).toEqual([{ text: "One." }, { text: "Two." }]);
  });

  it("returns a single segment for a sentence-less string", () => {
    const r = splitSegments("just one thing");
    expect(r).toEqual([{ text: "just one thing" }]);
  });

  it("returns empty array for empty input", () => {
    expect(splitSegments("")).toEqual([]);
    expect(splitSegments("   ")).toEqual([]);
  });
});

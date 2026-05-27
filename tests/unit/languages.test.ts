import { describe, it, expect } from "vitest";
import { LANGUAGES, languageByCode, isLanguageCode, parseLanguages } from "../../src/lib/languages";

describe("languages", () => {
  it("contains >40 entries", () => {
    expect(LANGUAGES.length).toBeGreaterThan(40);
  });

  it("every code is 2-3 letter lowercase", () => {
    for (const l of LANGUAGES) {
      expect(l.code).toMatch(/^[a-z]{2,3}$/);
      expect(l.english.length).toBeGreaterThan(0);
      expect(l.name.length).toBeGreaterThan(0);
    }
  });

  it("lookup helpers work", () => {
    expect(languageByCode("vi")?.english).toBe("Vietnamese");
    expect(languageByCode("VI")?.english).toBe("Vietnamese");
    expect(isLanguageCode("en")).toBe(true);
    expect(isLanguageCode("xx")).toBe(false);
  });

  it("parseLanguages filters unknown codes", () => {
    expect(parseLanguages(null)).toEqual([]);
    expect(parseLanguages("")).toEqual([]);
    expect(parseLanguages('["vi","en","XX","zz"]')).toEqual(["vi", "en"]);
    expect(parseLanguages("not-json")).toEqual([]);
    expect(parseLanguages('"vi"')).toEqual([]);
  });
});

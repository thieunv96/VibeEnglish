import { describe, it, expect } from "vitest";
import { COUNTRIES, countryByCode, flagOf, isCountryCode } from "../../src/lib/countries";

describe("countries", () => {
  it("contains >200 entries", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
  });

  it("every code is 2-letter uppercase", () => {
    for (const c of COUNTRIES) {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.flag.length).toBeGreaterThan(0);
    }
  });

  it("lookup helpers work", () => {
    expect(countryByCode("VN")?.name).toBe("Vietnam");
    expect(countryByCode("vn")?.name).toBe("Vietnam");
    expect(countryByCode(null)).toBeUndefined();
    expect(flagOf("US")).toBe("🇺🇸");
    expect(isCountryCode("DE")).toBe(true);
    expect(isCountryCode("ZZ")).toBe(false);
  });
});

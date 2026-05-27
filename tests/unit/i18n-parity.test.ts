import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Deep key-set parity across the four locale catalogs (REF-02 / CONCERNS LOW-9).
// Adding a translatable string requires editing all four messages/*.json files;
// nothing else enforces that. This test fails (naming the offending keys) the
// moment es/fr/vi drift from en — including keys nested inside objects, not just
// the 24 top-level groups.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "..", "messages");

function load(locale: string): Record<string, unknown> {
  const raw = readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

// Recurse into plain objects (not arrays) and return sorted dotted key paths,
// e.g. "nav.home", "profile.nativeLanguages".
function deepKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...deepKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

const en = load("en");
const enKeys = deepKeys(en);
const LOCALES = ["es", "fr", "vi"] as const;

describe("i18n locale key parity", () => {
  it("en catalog has nested keys (recursion sanity check)", () => {
    // Guards against a regression where deepKeys stops recursing and only sees
    // the ~24 top-level groups instead of the full ~269 nested paths.
    expect(enKeys.length).toBeGreaterThan(Object.keys(en).length);
    expect(enKeys.length).toBeGreaterThan(100);
  });

  for (const locale of LOCALES) {
    it(`${locale} has no missing keys vs en`, () => {
      const localeKeys = deepKeys(load(locale));
      const missing = enKeys.filter((k) => !localeKeys.includes(k));
      expect(missing, `${locale} missing: ${missing.join(", ")}`).toEqual([]);
    });

    it(`${locale} has no extra keys beyond en`, () => {
      const localeKeys = deepKeys(load(locale));
      const extra = localeKeys.filter((k) => !enKeys.includes(k));
      expect(extra, `${locale} extra: ${extra.join(", ")}`).toEqual([]);
    });
  }
});

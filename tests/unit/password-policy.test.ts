import { describe, it, expect } from "vitest";
import { isStrongPassword, PASSWORD_MIN_LENGTH } from "../../src/lib/password-policy";

describe("password-policy", () => {
  it("requires a minimum length of 8", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it("rejects passwords shorter than the minimum even with letter + digit", () => {
    expect(isStrongPassword("short1")).toBe(false); // len 6
  });

  it("rejects passwords with no digit", () => {
    expect(isStrongPassword("abcdefgh")).toBe(false); // len 8, no digit
  });

  it("rejects passwords with no letter", () => {
    expect(isStrongPassword("12345678")).toBe(false); // len 8, no letter
  });

  it("accepts a long-enough password with a letter and a digit", () => {
    expect(isStrongPassword("abcd1234")).toBe(true); // len 8, letter + digit
  });

  it("rejects empty / non-string input", () => {
    expect(isStrongPassword("")).toBe(false);
    expect(isStrongPassword(undefined as unknown as string)).toBe(false);
  });
});

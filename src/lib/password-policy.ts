export const PASSWORD_MIN_LENGTH = 8;

// Stronger than the legacy 6-char minimum (SEC-02 / CONCERNS MED-7):
// require at least 8 characters AND at least one letter AND one digit.
export function isStrongPassword(pw: string): boolean {
  return (
    typeof pw === "string" &&
    pw.length >= PASSWORD_MIN_LENGTH &&
    /[A-Za-z]/.test(pw) &&
    /\d/.test(pw)
  );
}

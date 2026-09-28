// Single server-side password policy for every credential path
// (admin create, self change, recovery reset). Client forms may be stricter,
// but nothing weaker than this is ever accepted.

const MIN_LENGTH = 8;

export function validatePasswordStrength(value: unknown): string | null {
  if (typeof value !== "string" || value.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters long.`;
  }
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
    return "Password must include upper + lower case letters and a number.";
  }
  if (value.length > 128) {
    return "Password must be at most 128 characters long.";
  }
  return null;
}

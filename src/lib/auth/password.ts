import "server-only";

export function validatePasswordStrength(password: string) {
  const issues: string[] = [];

  if (password.length < 10) {
    issues.push("Use at least 10 characters.");
  }

  if (!/[a-z]/.test(password)) {
    issues.push("Include a lowercase letter.");
  }

  if (!/[A-Z]/.test(password)) {
    issues.push("Include an uppercase letter.");
  }

  if (!/\d/.test(password)) {
    issues.push("Include a number.");
  }

  return {
    valid: issues.length === 0,
    message: issues[0] ?? null,
  };
}

import { describe, expect, it } from "vitest";
import { validatePasswordStrength } from "./password";

describe("validatePasswordStrength", () => {
  it("should return valid for a strong password", () => {
    const result = validatePasswordStrength("StrongPass123");
    expect(result.valid).toBe(true);
    expect(result.message).toBeNull();
  });

  it("should return invalid if password is less than 10 characters", () => {
    const result = validatePasswordStrength("Short12");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Use at least 10 characters.");
  });

  it("should return invalid if password lacks a lowercase letter", () => {
    const result = validatePasswordStrength("NOLOWERCASE123");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Include a lowercase letter.");
  });

  it("should return invalid if password lacks an uppercase letter", () => {
    const result = validatePasswordStrength("nouppercase123");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Include an uppercase letter.");
  });

  it("should return invalid if password lacks a number", () => {
    const result = validatePasswordStrength("NoNumberHere");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Include a number.");
  });

  it("should return the first issue when multiple criteria fail", () => {
    // Fails length, uppercase, number
    const result = validatePasswordStrength("short");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Use at least 10 characters.");
  });
});

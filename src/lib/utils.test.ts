import { describe, expect, it } from "vitest";
import {
  cn,
  humanizeEnum,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  initials,
  splitList,
  slugify,
  truncate,
  clamp,
} from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("joins class names", () => {
      expect(cn("a", "b")).toBe("a b");
      expect(cn("a", { b: true, c: false })).toBe("a b");
      expect(cn("a", ["b", "c"])).toBe("a b c");
    });

    it("handles undefined and null", () => {
      expect(cn("a", undefined, null, "b")).toBe("a b");
    });
  });

  describe("humanizeEnum", () => {
    it("converts snake_case to Title Case", () => {
      expect(humanizeEnum("PENDING")).toBe("Pending");
      expect(humanizeEnum("IN_PROGRESS")).toBe("In Progress");
      expect(humanizeEnum("PUBLISHED_AT")).toBe("Published At");
    });

    it("handles single word", () => {
      expect(humanizeEnum("DRAFT")).toBe("Draft");
    });
  });

  describe("formatDate", () => {
    it("formats dates correctly", () => {
      // Use a fixed date string to avoid locale issues if possible,
      // but date-fns should be consistent
      const date = new Date("2023-01-01T12:00:00Z");
      expect(formatDate(date)).toBe("1 Jan 2023");
    });

    it("returns 'Not set' for null or undefined", () => {
      expect(formatDate(null)).toBe("Not set");
      expect(formatDate(undefined)).toBe("Not set");
    });
  });

  describe("formatDateTime", () => {
    it("formats date and time correctly", () => {
      const date = new Date("2023-01-01T12:00:00Z");
      const result = formatDateTime(date);
      // Depending on the local time, the hour might change, but the format should match
      expect(result).toMatch(/\d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}/);
    });

    it("returns 'Not set' for null or undefined", () => {
      expect(formatDateTime(null)).toBe("Not set");
      expect(formatDateTime(undefined)).toBe("Not set");
    });
  });

  describe("formatRelativeDate", () => {
    it("returns relative time string", () => {
      const now = new Date();
      expect(formatRelativeDate(now)).toBe("less than a minute ago");
    });

    it("returns 'Not set' for null or undefined", () => {
      expect(formatRelativeDate(null)).toBe("Not set");
      expect(formatRelativeDate(undefined)).toBe("Not set");
    });
  });

  describe("initials", () => {
    it("extracts initials from name", () => {
      expect(initials("John Doe")).toBe("JD");
      expect(initials("jane smith")).toBe("JS");
      expect(initials("Alice")).toBe("A");
      expect(initials("John Quincy Adams")).toBe("JQ");
    });

    it("handles multiple spaces", () => {
      expect(initials("  John   Doe  ")).toBe("JD");
    });
  });

  describe("splitList", () => {
    it("splits by comma or newline", () => {
      expect(splitList("a, b, c")).toEqual(["a", "b", "c"]);
      expect(splitList("a\nb\nc")).toEqual(["a", "b", "c"]);
      expect(splitList("a, b\nc, d")).toEqual(["a", "b", "c", "d"]);
    });

    it("filters out empty items and trims", () => {
      expect(splitList("a,, b, ,c\n\nd")).toEqual(["a", "b", "c", "d"]);
    });

    it("returns empty array for empty, null or undefined", () => {
      expect(splitList(null)).toEqual([]);
      expect(splitList(undefined)).toEqual([]);
      expect(splitList("")).toEqual([]);
      expect(splitList("   ")).toEqual([]);
    });
  });

  describe("slugify", () => {
    it("converts string to slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("Hello   World")).toBe("hello-world");
      expect(slugify("!@#$%^&*()")).toBe("");
      expect(slugify("This is a Test!")).toBe("this-is-a-test");
      expect(slugify("-leading and trailing-")).toBe("leading-and-trailing");
      expect(slugify("Multiple---Hyphens")).toBe("multiple-hyphens");
    });

    it("handles numbers", () => {
      expect(slugify("Item 123")).toBe("item-123");
    });
  });

  describe("truncate", () => {
    it("truncates long strings", () => {
      expect(truncate("Hello World", 5)).toBe("Hell…");
      expect(truncate("Hello World", 20)).toBe("Hello World");
    });

    it("handles exactly max length", () => {
      expect(truncate("12345", 5)).toBe("12345");
    });

    it("uses custom ellipsis", () => {
      expect(truncate("Hello World", 5)).toContain("…");
    });
  });

  describe("clamp", () => {
    it("clamps values to range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("handles min equal to max", () => {
      expect(clamp(5, 10, 10)).toBe(10);
    });
  });
});

import { describe, expect, it } from "vitest";
import { formatMemberStartMeta, normalizeAuthorName } from "@/lib/content/slug";

describe("formatMemberStartMeta", () => {
  it("prefixes start date with group label", () => {
    expect(formatMemberStartMeta("2025", "Enrolled")).toBe("Enrolled · 2025");
    expect(formatMemberStartMeta("2024", "Joined")).toBe("Joined · 2024");
  });

  it("returns date only when label is omitted", () => {
    expect(formatMemberStartMeta("2025")).toBe("2025");
  });
});

describe("normalizeAuthorName", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(normalizeAuthorName("  Yurun   Chen ")).toBe("yurun chen");
    expect(normalizeAuthorName("Shengyu Zhang")).toBe("shengyu zhang");
  });

  it("ignores periods and diacritics so names match members", () => {
    expect(normalizeAuthorName("Y. Chen")).toBe("y chen");
    expect(normalizeAuthorName("José Ñ")).toBe("jose n");
  });
});

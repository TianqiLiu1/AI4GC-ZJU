import { afterEach, describe, expect, it, vi } from "vitest";
import { getSecurityHeaders } from "./headers";

describe("getSecurityHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes clickjacking protections in all environments", () => {
    const keys = getSecurityHeaders().map((header) => header.key);

    expect(keys).toContain("X-Frame-Options");
    expect(keys).toContain("X-Content-Type-Options");
  });

  it("does not set a site-wide X-Robots-Tag noindex header (indexing is robots.txt/meta-driven)", () => {
    const keys = getSecurityHeaders().map((header) => header.key);
    expect(keys).not.toContain("X-Robots-Tag");
  });

  it("adds HSTS and CSP only in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const devKeys = getSecurityHeaders().map((header) => header.key);
    expect(devKeys).not.toContain("Strict-Transport-Security");
    expect(devKeys).not.toContain("Content-Security-Policy");

    vi.stubEnv("NODE_ENV", "production");
    const prodKeys = getSecurityHeaders().map((header) => header.key);
    expect(prodKeys).toContain("Strict-Transport-Security");
    expect(prodKeys).toContain("Content-Security-Policy");
  });
});

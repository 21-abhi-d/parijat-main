import { describe, expect, it } from "vitest";

import { formatAUD, slugify, truncate } from "~/lib/utils";

describe("formatAUD", () => {
  it("formats whole dollars", () => {
    expect(formatAUD(1200)).toBe("$1,200");
  });

  it("formats zero", () => {
    expect(formatAUD(0)).toBe("$0");
  });

  it("rounds to nearest dollar", () => {
    // AUD formatting with 0 decimals
    expect(formatAUD(99.99)).toBe("$100");
  });
});

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("Banarasi Silk Saree")).toBe("banarasi-silk-saree");
  });

  it("removes special characters", () => {
    expect(slugify("SAR-001 (Gold)")).toBe("sar-001-gold");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("Silk  --  Saree")).toBe("silk-saree");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify(" -hello- ")).toBe("hello");
  });
});

describe("truncate", () => {
  it("returns unchanged string when under limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis", () => {
    const result = truncate("A beautiful Banarasi silk saree", 15);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(16); // 15 + ellipsis
  });
});

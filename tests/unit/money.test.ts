/**
 * Money tests
 *
 * Typed amounts become integer cents and are shown back unchanged.
 *
 */

import { describe, expect, it } from "vitest";
import { formatEuro, parseEuro, toEuroInput } from "../../src/utils/aggregations";

describe("parseEuro", () => {
  it("accepts a comma or a dot as the decimal separator", () => {
    expect(parseEuro("12,50")).toBe(1250);
    expect(parseEuro("12.50")).toBe(1250);
    expect(parseEuro("12,5")).toBe(1250);
    expect(parseEuro(" 12 ")).toBe(1200);
    expect(parseEuro("0")).toBe(0);
  });

  it("keeps cents exact where floats drift", () => {
    expect(parseEuro("0,29")).toBe(29);
    expect(parseEuro("1,15")).toBe(115);
    expect(parseEuro("4,35")).toBe(435);
  });

  it("allows a sign for base balances", () => {
    expect(parseEuro("-50,25")).toBe(-5025);
  });

  it("rejects anything that is not a plain amount", () => {
    for (const bad of ["", "abc", "12,505", "1.234,56", "12,", ",5", "12 50", "12€"]) {
      expect(parseEuro(bad), bad).toBeNull();
    }
  });
});

describe("editing an amount", () => {
  it("shows cents in the field and parses back unchanged", () => {
    expect(toEuroInput(1250)).toBe("12,50");
    for (const cents of [0, 1, 29, 1250, 250075, -5025]) {
      expect(parseEuro(toEuroInput(cents))).toBe(cents);
    }
  });
});

describe("formatEuro", () => {
  // Intl puts a non breaking space before the sign
  const euro = (cents: number) => formatEuro(cents).replace(/\s/g, " ");

  it("shows integer cents as euros", () => {
    expect(euro(123456)).toBe("1.234,56 €");
    expect(euro(1)).toBe("0,01 €");
    expect(euro(-5050)).toBe("-50,50 €");
  });
});

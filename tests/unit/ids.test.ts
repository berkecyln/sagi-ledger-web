/**
 * Id tests
 *
 * Generated record ids match the format PocketBase accepts.
 *
 */

import { describe, expect, it } from "vitest";
import { isValidId, newId } from "../../src/api/ids";

describe("record ids", () => {
  it("generates valid, distinct ids", () => {
    const ids = Array.from({ length: 1000 }, () => newId());
    expect(ids.every(isValidId)).toBe(true);
    expect(new Set(ids).size).toBe(1000);
  });

  it("rejects the wrong shape", () => {
    expect(isValidId(crypto.randomUUID())).toBe(false);
    expect(isValidId("ABCDEFGHIJKLMNO")).toBe(false);
    expect(isValidId("abc")).toBe(false);
  });
});

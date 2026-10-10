/**
 * Id tests
 *
 * Generated record ids match the format PocketBase accepts.
 *
 */

import { describe, expect, it } from "vitest";
import { isValidId, newId } from "../../src/api/ids";

describe("record ids", () => {
  it("generates ids the server accepts", () => {
    for (let i = 0; i < 100; i++) expect(isValidId(newId())).toBe(true);
  });

  it("rejects the wrong shape", () => {
    expect(isValidId(crypto.randomUUID())).toBe(false);
    expect(isValidId("ABCDEFGHIJKLMNO")).toBe(false);
    expect(isValidId("abc")).toBe(false);
  });
});

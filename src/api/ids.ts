/**
 * Record ids
 *
 * Ids are generated here and sent with every create.
 *
 * PocketBase id format:
 *    length (15, exactly)
 *    characters (a-z and 0-9 only)
 *
 */

const ID_LENGTH = 15;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

// Generate a new record id
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  let id = "";
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
  return id;
}

// Check a string is a valid record id
export function isValidId(id: string): boolean {
  return new RegExp(`^[a-z0-9]{${ID_LENGTH}}$`).test(id);
}

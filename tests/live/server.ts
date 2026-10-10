/**
 * Live test helpers
 *
 * The local test server and throwaway users on it.
 *
 */

import PocketBase, { BaseAuthStore, ClientResponseError } from "pocketbase";
import { newId } from "../../src/api";

// Test server started by setup.ts, invite code from pocketbase/pb_schema.json
export const TEST_API_URL = "http://127.0.0.1:8091";
export const INVITE_CODE = "test-invite-code";

// Return a random username with a prefix
export function username(prefix: string): string {
  return `${prefix}_${Math.floor(Math.random() * 100000)}`;
}

// Return a strong random password
export function password(): string {
  return `Probe_${newId()}`;
}

// Create a signed in client for a new user, returns the client and user id
export async function newUser(prefix: string): Promise<{ client: PocketBase; id: string }> {
  const client = new PocketBase(TEST_API_URL, new BaseAuthStore());
  client.autoCancellation(false);
  const name = username(prefix);
  const pass = password();
  await client.collection("users").create({ username: name, password: pass, passwordConfirm: pass, inviteCode: INVITE_CODE });
  const auth = await client.collection("users").authWithPassword(name, pass);
  return { client, id: auth.record.id };
}

// Return the HTTP status of a request, 200 when it succeeds
export async function statusOf(request: Promise<unknown>): Promise<number> {
  try {
    await request;
    return 200;
  } catch (error) {
    if (error instanceof ClientResponseError) return error.status;
    throw error;
  }
}

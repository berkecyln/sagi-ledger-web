/**
 * Authentication
 *
 * Sign in, sign up, sign out, and reading the current session.
 *
 */

import { pb } from "./client";
import { describeError, statusOf } from "./errors";

export interface SessionUser {
  id: string;
  username: string;
}

// Convert an SDK auth record to a SessionUser
function toSessionUser(record: { id: string; username?: string } | null): SessionUser | null {
  if (!record) return null;
  return { id: record.id, username: record.username ?? "" };
}

// Return the currently signed in user, or null
export function currentUser(): SessionUser | null {
  return toSessionUser(pb.authStore.record as { id: string; username?: string } | null);
}

// Check whether a valid session exists
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

// Subscribe to session changes, returns an unsubscribe
export function onAuthChange(callback: (user: SessionUser | null) => void): () => void {
  return pb.authStore.onChange(() => callback(currentUser()), false);
}

// Sign in with username and password
export async function login(username: string, password: string): Promise<SessionUser> {
  try {
    const result = await pb.collection("users").authWithPassword(username, password);
    return { id: result.record.id, username: result.record.username };
  } catch (error) {
    throw new Error(describeLoginError(error));
  }
}

// Create an account with an invite code, then sign in
export async function signup(
  username: string,
  password: string,
  inviteCode: string,
): Promise<SessionUser> {
  try {
    await pb.collection("users").create({
      username,
      password,
      passwordConfirm: password,
      inviteCode,
    });
  } catch (error) {
    throw new Error(describeSignupError(error));
  }
  // Create does not authenticate
  return login(username, password);
}

// Clear the session
export function logout(): void {
  pb.authStore.clear();
}

// Return a message for a failed login
function describeLoginError(error: unknown): string {
  if (statusOf(error) === 400) return "Wrong username or password.";
  return describeError(error);
}

// Return a message for a failed signup
function describeSignupError(error: unknown): string {
  if (statusOf(error) === 400) {
    // Field validation fills data, a rejected create rule leaves it empty
    const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
    if (data && Object.keys(data).length > 0) return describeError(error);
    return "That invite code is not valid.";
  }
  if (statusOf(error) === 403) return "Signups are closed.";
  return describeError(error);
}

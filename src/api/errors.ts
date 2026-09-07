/**
 * Error handling
 *
 * Turns a PocketBase rejection into a message the UI can show.
 *
 * Statuses seen in practice:
 *    0 (request never reached the server)
 *    400 (validation failed, or an access rule rejected the write)
 *    403 (not signed in, or the action is closed)
 *    404 (record gone, or hidden by an access rule)
 *    429 (rate limited)
 *
 */

// Shape of a PocketBase error
interface HttpErrorLike {
  status?: number;
  response?: { message?: string };
}

// Return the HTTP status of an error
export function statusOf(error: unknown): number {
  const status = (error as HttpErrorLike | null)?.status;
  return typeof status === "number" ? status : 0;
}

// Check whether an error is a rate limit rejection
export function isRateLimited(error: unknown): boolean {
  return statusOf(error) === 429;
}

// Return a message to show the user
export function describeError(error: unknown): string {
  switch (statusOf(error)) {
    case 0:
      return "Cannot reach the server. Check your connection.";
    case 400:
      return (error as HttpErrorLike).response?.message ?? "The server rejected that request.";
    case 401:
    case 403:
      return "Not allowed. Try signing in again.";
    case 404:
      return "That record no longer exists.";
    case 429:
      return "Too many attempts. Wait a moment and try again.";
    default:
      return "Something went wrong. Try again.";
  }
}

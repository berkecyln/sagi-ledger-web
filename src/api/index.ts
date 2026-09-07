/**
 * Api layer entry point
 *
 * Everything outside src/api imports from here.
 *
 */

export { pb } from "./client";
export { newId, isValidId } from "./ids";
export { describeError, isRateLimited, statusOf } from "./errors";
export {
  throttledWrite,
  createThrottle,
  pendingWrites,
  subscribePendingWrites,
} from "./throttle";
export {
  login,
  signup,
  logout,
  currentUser,
  isAuthenticated,
  onAuthChange,
} from "./auth";
export type { SessionUser } from "./auth";
export {
  ensureAccount,
  updateAccount,
  deleteAccount,
  accountIdFor,
  accountNameFor,
  resetAccountCache,
} from "./accounts";
export { createTransaction, updateTransaction, deleteTransaction } from "./transactions";
export {
  createTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
} from "./templateItems";
export { createDescription, deleteDescription } from "./descriptions";
export { loadAll, emptyState, isEmpty } from "./loadAll";
export type { HydratedState } from "./loadAll";
export type * from "./types";

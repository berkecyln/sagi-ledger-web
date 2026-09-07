/**
 * PocketBase connection
 *
 * The single SDK instance every other api module talks through.
 *
 */

import PocketBase from "pocketbase";

// Base URL of the backend
const API_URL = import.meta.env?.VITE_API_URL ?? "https://api.sagiledger.com";

export const pb = new PocketBase(API_URL);

// Auto cancellation drops same-endpoint calls made back to back
pb.autoCancellation(false);

/**
 * Server row shapes
 *
 * One interface per collection, mirroring the PocketBase schema.
 *
 */

import type { TransactionType } from "../types";

export interface AccountRecord {
  id: string;
  user: string;
  name: string;
  color: string;
  baseBalance: number;
}

export interface DescriptionRecord {
  id: string;
  user: string;
  type: TransactionType;
  label: string;
}

export interface TransactionRecord {
  id: string;
  user: string;
  type: TransactionType;
  // Integer cents
  amount: number;
  description: string;
  // Relation id of the account
  account: string;
  date: string;
}

export interface TemplateItemRecord {
  id: string;
  user: string;
  type: TransactionType;
  amount: number;
  description: string;
  account: string;
  day?: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // integer cents
  description: string;
  account: string;
  date: string; // ISO date string YYYY-MM-DD
}

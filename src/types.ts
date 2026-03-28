export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  account: string;
  date: string; // ISO date string YYYY-MM-DD
}

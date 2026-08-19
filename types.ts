
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface User {
  email: string;
  name: string;
}

export interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
}

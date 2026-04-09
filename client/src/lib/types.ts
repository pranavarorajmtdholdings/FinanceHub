export interface Account {
  id: string;
  userId: string;
  institutionId?: string;
  plaidAccountId?: string;
  name: string;
  officialName?: string;
  accountType: "checking" | "savings" | "investment" | "credit";
  accountSubtype: "checking" | "savings" | "401k" | "ira" | "brokerage" | "credit_card" | "line_of_credit";
  mask?: string;
  currentBalance: string;
  availableBalance?: string;
  creditLimit?: string;
  lastUpdated: string;
  isActive: boolean;
  isManual: boolean;
}

export interface Institution {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  url?: string;
}

export interface AccountSummary {
  totalChecking: number;
  totalSavings: number;
  totalInvestments: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  creditUtilization: number;
}

export interface UpcomingPayment {
  id: string;
  accountId: string;
  dueDate: string;
  minimumPayment: string;
  account?: {
    name: string;
    mask: string;
  };
}

import { Wallet, PiggyBank, TrendingUp, CreditCard } from "lucide-react";

interface SummaryTilesProps {
  summary?: {
    totalChecking: number;
    totalSavings: number;
    totalInvestments: number;
    totalCreditLimit: number;
    totalCreditUsed: number;
    creditUtilization: number;
  };
}

export default function SummaryTiles({ summary }: SummaryTilesProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6 border border-border">
            <div className="skeleton h-12 w-12 rounded-lg mb-4"></div>
            <div className="skeleton h-4 w-24 mb-2"></div>
            <div className="skeleton h-8 w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const creditAvailable = summary.totalCreditLimit - summary.totalCreditUsed;
  
  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return "text-success";
    if (utilization < 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="summary-tiles">
      {/* Checking Account Tile */}
      <div className="bg-card rounded-lg p-6 border border-border hover-lift" data-testid="checking-tile">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Checking
          </span>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Checking</h3>
        <p className="text-2xl font-bold text-foreground" data-testid="total-checking">
          {formatCurrency(summary.totalChecking)}
        </p>
        <p className="text-xs text-success mt-2 flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" />
          Available balance
        </p>
      </div>

      {/* Savings Account Tile */}
      <div className="bg-card rounded-lg p-6 border border-border hover-lift" data-testid="savings-tile">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <PiggyBank className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Savings
          </span>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Savings</h3>
        <p className="text-2xl font-bold text-foreground" data-testid="total-savings">
          {formatCurrency(summary.totalSavings)}
        </p>
        <p className="text-xs text-success mt-2 flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" />
          Growing balance
        </p>
      </div>

      {/* Investment Account Tile */}
      <div className="bg-card rounded-lg p-6 border border-border hover-lift" data-testid="investments-tile">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Investments
          </span>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Investments</h3>
        <p className="text-2xl font-bold text-foreground" data-testid="total-investments">
          {formatCurrency(summary.totalInvestments)}
        </p>
        <p className="text-xs text-success mt-2 flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" />
          Portfolio value
        </p>
      </div>

      {/* Credit Cards Tile */}
      <div className="bg-card rounded-lg p-6 border border-border hover-lift" data-testid="credit-tile">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-accent" />
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Credit
          </span>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Credit Available</h3>
        <p className="text-2xl font-bold text-foreground" data-testid="credit-available">
          {formatCurrency(creditAvailable)}
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Utilization</span>
            <span className={`font-medium ${getUtilizationColor(summary.creditUtilization)}`} data-testid="utilization-percentage">
              {summary.creditUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="utilization-bar bg-muted">
            <div 
              className={`h-full ${summary.creditUtilization < 30 ? 'bg-success' : summary.creditUtilization < 70 ? 'bg-warning' : 'bg-destructive'}`}
              style={{ width: `${Math.min(summary.creditUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

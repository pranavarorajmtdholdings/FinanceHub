interface Account {
  id: string;
  name: string;
  accountType: string;
  institutionId: string;
  currentBalance: string;
  creditLimit: string;
}

interface UtilizationBreakdownProps {
  accounts: Account[];
}

export default function UtilizationBreakdown({ accounts }: UtilizationBreakdownProps) {
  const creditCards = accounts.filter(account => account.accountType === 'credit');

  const getUtilizationData = () => {
    const institutionData = new Map();

    creditCards.forEach(card => {
      const balance = parseFloat(card.currentBalance || '0');
      const limit = parseFloat(card.creditLimit || '0');
      const used = limit - balance;
      const utilization = limit > 0 ? (used / limit) * 100 : 0;

      const institutionKey = card.institutionId || 'Unknown';
      
      if (institutionData.has(institutionKey)) {
        const existing = institutionData.get(institutionKey);
        existing.used += used;
        existing.limit += limit;
        existing.utilization = existing.limit > 0 ? (existing.used / existing.limit) * 100 : 0;
        existing.cards.push(card);
      } else {
        institutionData.set(institutionKey, {
          name: getInstitutionName(card.name),
          used,
          limit,
          utilization,
          cards: [card],
          initials: getInitials(getInstitutionName(card.name)),
        });
      }
    });

    return Array.from(institutionData.values());
  };

  const getInstitutionName = (cardName: string) => {
    // Extract institution name from card name
    const nameLower = cardName.toLowerCase();
    if (nameLower.includes('chase')) return 'Chase';
    if (nameLower.includes('amex') || nameLower.includes('american express')) return 'American Express';
    if (nameLower.includes('discover')) return 'Discover';
    if (nameLower.includes('citi')) return 'Citibank';
    if (nameLower.includes('capital one')) return 'Capital One';
    if (nameLower.includes('wells fargo')) return 'Wells Fargo';
    if (nameLower.includes('bank of america')) return 'Bank of America';
    
    // Default to first word of card name
    return cardName.split(' ')[0];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return 'bg-success';
    if (utilization < 70) return 'bg-warning';
    return 'bg-destructive';
  };

  const getIconColor = (utilization: number, index: number) => {
    if (utilization < 30) return 'bg-success/10 text-success';
    if (utilization < 70) return 'bg-warning/10 text-warning';
    if (utilization >= 70) return 'bg-destructive/10 text-destructive';
    
    // Fallback colors for variety
    const colors = [
      'bg-primary/10 text-primary',
      'bg-accent/10 text-accent',
      'bg-purple-100 text-purple-600',
    ];
    return colors[index % colors.length];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const utilizationData = getUtilizationData();

  if (creditCards.length === 0) {
    return (
      <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6" data-testid="utilization-breakdown">
        <h2 className="text-lg font-semibold text-foreground mb-4">Credit Utilization Breakdown</h2>
        <div className="text-center py-8" data-testid="no-credit-cards-message">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground">No credit cards to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6" data-testid="utilization-breakdown">
      <h2 className="text-lg font-semibold text-foreground mb-4">Credit Utilization Breakdown</h2>
      
      <div className="space-y-4">
        {utilizationData.map((issuer, index) => (
          <div key={`${issuer.name}-${index}`} data-testid={`utilization-item-${issuer.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIconColor(issuer.utilization, index)}`}>
                  <span className="text-xs font-bold">{issuer.initials}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{issuer.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground" data-testid={`utilization-amounts-${issuer.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {formatCurrency(issuer.used)} / {formatCurrency(issuer.limit)}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`utilization-percentage-${issuer.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {issuer.utilization.toFixed(1)}% utilized
                </p>
              </div>
            </div>
            <div className="utilization-bar bg-muted">
              <div 
                className={`h-full ${getUtilizationColor(issuer.utilization)}`}
                style={{ width: `${Math.min(issuer.utilization, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

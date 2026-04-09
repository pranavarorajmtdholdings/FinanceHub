import { CreditCard } from "lucide-react";

interface Payment {
  id: string;
  accountId: string;
  dueDate: string;
  minimumPayment: string;
  account?: {
    name: string;
    mask: string;
  };
}

interface ThisWeekPanelProps {
  payments: Payment[];
}

export default function ThisWeekPanel({ payments }: ThisWeekPanelProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount || '0'));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalDue = payments.reduce((sum, payment) => {
    return sum + parseFloat(payment.minimumPayment || '0');
  }, 0);

  const getCardInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCardColor = (index: number) => {
    const colors = [
      'bg-primary/10 text-primary',
      'bg-accent/10 text-accent',
      'bg-warning/10 text-warning',
      'bg-destructive/10 text-destructive',
      'bg-success/10 text-success'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="this-week-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">This Week</h2>
        {payments.length > 0 && (
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md" data-testid="payments-due-count">
            {payments.length} due
          </span>
        )}
      </div>
      
      {payments.length === 0 ? (
        <div className="text-center py-8" data-testid="no-payments-message">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No payments due this week</p>
        </div>
      ) : (
        <>
          <div className="space-y-3" data-testid="payments-list">
            {payments.map((payment, index) => (
              <div 
                key={payment.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                data-testid={`payment-item-${payment.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCardColor(index)}`}>
                    <span className="text-xs font-bold">
                      {payment.account?.name ? getCardInitials(payment.account.name) : 'CC'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground" data-testid={`payment-name-${payment.id}`}>
                      {payment.account?.name || 'Credit Card'}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`payment-due-date-${payment.id}`}>
                      Due {formatDate(payment.dueDate)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground" data-testid={`payment-amount-${payment.id}`}>
                  {formatCurrency(payment.minimumPayment)}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Due This Week</span>
              <span className="text-lg font-bold text-foreground" data-testid="total-due-amount">
                {formatCurrency(totalDue.toString())}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import SummaryTiles from "@/components/dashboard/summary-tiles";
import ThisWeekPanel from "@/components/dashboard/this-week-panel";
import UtilizationBreakdown from "@/components/dashboard/utilization-breakdown";
import AccountTable from "@/components/dashboard/account-table";
import EmptyState from "@/components/dashboard/empty-state";
import PlaidLinkModal from "@/components/dashboard/plaid-link-modal";
import ManualAddModal from "@/components/dashboard/manual-add-modal";
import BulkEditBalancesModal from "@/components/dashboard/bulk-edit-balances-modal";
import { useState } from "react";
import { RefreshCw, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountSummary {
  totalChecking: number;
  totalSavings: number;
  totalInvestments: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  creditUtilization: number;
}

interface UpcomingPayment {
  id: string;
  accountId: string;
  dueDate: string;
  minimumPayment: string;
  account?: {
    name: string;
    mask: string;
  };
}

export default function Dashboard() {
  const [isPlaidModalOpen, setIsPlaidModalOpen] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const { toast } = useToast();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Array<{
    id: string;
    name: string;
    accountType: string;
    currentBalance: string | null;
    availableBalance: string | null;
    creditLimit: string | null;
    lastUpdated: string | null;
    mask: string | null;
    isManual: boolean | null;
    isFavorite: boolean | null;
    institutionId: string | null;
    officialName: string | null;
  }>>({
    queryKey: ["/api/accounts"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/accounts/refresh");
      return await res.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/accounts/summary"] });
      toast({
        title: "Accounts Refreshed",
        description: `Successfully refreshed ${data.refreshedCount || 0} Plaid-linked account(s).`,
      });
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh accounts. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const hasPlaidAccounts = accounts.some((a) => !a.isManual);
  const hasManualAccounts = accounts.some((a) => a.isManual);

  const { data: summary, isLoading: summaryLoading } = useQuery<AccountSummary>({
    queryKey: ["/api/accounts/summary"],
  });

  const { data: upcomingPayments = [], isLoading: paymentsLoading } = useQuery<UpcomingPayment[]>({
    queryKey: ["/api/payments/upcoming"],
  });

  const hasAccounts = accounts.length > 0;
  const isLoading = accountsLoading || summaryLoading || paymentsLoading;

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <NavigationHeader />
      
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-6">
                  <div className="skeleton h-12 w-12 rounded-lg mb-4"></div>
                  <div className="skeleton h-4 w-24 mb-2"></div>
                  <div className="skeleton h-8 w-32"></div>
                </div>
              ))}
            </div>
          </div>
        ) : hasAccounts ? (
          <>
            <SummaryTiles summary={summary} />

            <div className="flex items-center gap-3 mb-6">
              {hasPlaidAccounts && (
                <Button
                  variant="outline"
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending}
                  data-testid="button-refresh-all"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                  {refreshMutation.isPending ? "Refreshing..." : "Refresh All Accounts"}
                </Button>
              )}
              {hasManualAccounts && (
                <Button
                  variant="outline"
                  onClick={() => setIsBulkEditOpen(true)}
                  data-testid="button-bulk-edit"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Manual Balances
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <ThisWeekPanel payments={upcomingPayments} />
              <UtilizationBreakdown accounts={accounts} />
            </div>

            <AccountTable 
              accounts={accounts} 
              onConnectAccount={() => setIsPlaidModalOpen(true)}
            />
          </>
        ) : (
          <EmptyState 
            onConnectAccount={() => setIsPlaidModalOpen(true)}
            onAddManually={() => setIsManualAddModalOpen(true)}
          />
        )}

        {/* Quick Actions */}
        {hasAccounts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-card rounded-lg border border-border p-6 hover-lift cursor-pointer" data-testid="import-csv-action">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Import CSV</h3>
                  <p className="text-sm text-muted-foreground">Upload transaction history</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 hover-lift cursor-pointer" data-testid="set-alerts-action">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Set Alerts</h3>
                  <p className="text-sm text-muted-foreground">Configure notifications</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 hover-lift cursor-pointer" data-testid="view-analytics-action">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">View Analytics</h3>
                  <p className="text-sm text-muted-foreground">Spending insights</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PlaidLinkModal 
        isOpen={isPlaidModalOpen}
        onClose={() => setIsPlaidModalOpen(false)}
        onOpenManualAdd={() => {
          setIsPlaidModalOpen(false);
          setIsManualAddModalOpen(true);
        }}
      />

      <ManualAddModal 
        isOpen={isManualAddModalOpen}
        onClose={() => setIsManualAddModalOpen(false)}
      />

      <BulkEditBalancesModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        accounts={accounts.filter((a) => a.isManual)}
      />
    </div>
  );
}

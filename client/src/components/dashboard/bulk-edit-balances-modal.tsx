import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wallet, PiggyBank, TrendingUp, CreditCard, Save } from "lucide-react";
interface AccountData {
  id: string;
  name: string;
  accountType: string;
  mask: string | null;
  currentBalance: string | null;
  creditLimit: string | null;
  isManual: boolean | null;
}

interface BulkEditBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountData[];
}

export default function BulkEditBalancesModal({ isOpen, onClose, accounts }: BulkEditBalancesModalProps) {
  const { toast } = useToast();
  const [balances, setBalances] = useState<Record<string, { currentBalance: string; creditLimit: string }>>({});

  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      const initial: Record<string, { currentBalance: string; creditLimit: string }> = {};
      for (const account of accounts) {
        initial[account.id] = {
          currentBalance: account.currentBalance || "0",
          creditLimit: account.creditLimit || "0",
        };
      }
      setBalances(initial);
    }
  }, [isOpen, accounts]);

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: { id: string; currentBalance: string; creditLimit?: string }[]) => {
      const res = await apiRequest("POST", "/api/accounts/bulk-update-balances", { updates });
      return await res.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/accounts/summary"] });
      toast({
        title: "Balances Updated",
        description: `Successfully updated ${data.updatedCount || 0} account balance(s).`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update balances. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isValidAmount = (value: string) => /^\d+(\.\d{1,2})?$/.test(value);

  const handleSave = () => {
    for (const account of accounts) {
      const bal = balances[account.id];
      if (!bal || !isValidAmount(bal.currentBalance)) {
        toast({
          title: "Invalid Balance",
          description: `Please enter a valid balance for "${account.name}".`,
          variant: "destructive",
        });
        return;
      }
      if (account.accountType === "credit" && !isValidAmount(bal.creditLimit)) {
        toast({
          title: "Invalid Credit Limit",
          description: `Please enter a valid credit limit for "${account.name}".`,
          variant: "destructive",
        });
        return;
      }
    }

    const updates = accounts.map((account) => ({
      id: account.id,
      currentBalance: balances[account.id]?.currentBalance || "0",
      ...(account.accountType === "credit" ? { creditLimit: balances[account.id]?.creditLimit || "0" } : {}),
    }));
    bulkUpdateMutation.mutate(updates);
  };

  const updateBalance = (accountId: string, field: "currentBalance" | "creditLimit", value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setBalances((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [field]: cleaned,
      },
    }));
  };

  const getAccountIcon = (accountType: string) => {
    switch (accountType) {
      case "checking":
        return <Wallet className="w-5 h-5 text-primary" />;
      case "savings":
        return <PiggyBank className="w-5 h-5 text-purple-600" />;
      case "investment":
        return <TrendingUp className="w-5 h-5 text-success" />;
      case "credit":
        return <CreditCard className="w-5 h-5 text-accent" />;
      default:
        return <Wallet className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" data-testid="bulk-edit-modal">
        <DialogHeader>
          <DialogTitle>Edit Manual Account Balances</DialogTitle>
          <DialogDescription>
            Update the balances for your manually-added accounts below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No manual accounts found.
            </p>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="border border-border rounded-lg p-4 space-y-3"
                data-testid={`bulk-edit-account-${account.id}`}
              >
                <div className="flex items-center gap-3">
                  {getAccountIcon(account.accountType)}
                  <div>
                    <p className="font-medium text-foreground text-sm" data-testid={`bulk-edit-name-${account.id}`}>
                      {account.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                      {account.mask ? ` • ****${account.mask}` : ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`balance-${account.id}`} className="text-xs text-muted-foreground">
                      Current Balance
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        id={`balance-${account.id}`}
                        type="text"
                        inputMode="decimal"
                        className="pl-7"
                        value={balances[account.id]?.currentBalance || ""}
                        onChange={(e) => updateBalance(account.id, "currentBalance", e.target.value)}
                        data-testid={`input-balance-${account.id}`}
                      />
                    </div>
                  </div>

                  {account.accountType === "credit" && (
                    <div>
                      <Label htmlFor={`limit-${account.id}`} className="text-xs text-muted-foreground">
                        Credit Limit
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          id={`limit-${account.id}`}
                          type="text"
                          inputMode="decimal"
                          className="pl-7"
                          value={balances[account.id]?.creditLimit || ""}
                          onChange={(e) => updateBalance(account.id, "creditLimit", e.target.value)}
                          data-testid={`input-limit-${account.id}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-bulk-edit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={bulkUpdateMutation.isPending || accounts.length === 0}
            data-testid="button-save-bulk-edit"
          >
            <Save className="w-4 h-4 mr-2" />
            {bulkUpdateMutation.isPending ? "Saving..." : "Save All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

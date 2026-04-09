import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, Plus, Search, Star, Eye, Edit, Trash2 } from "lucide-react";
import { Wallet, PiggyBank, TrendingUp, CreditCard } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Account } from "@shared/schema";

interface AccountTableProps {
  accounts: Account[];
  onConnectAccount: () => void;
}

export default function AccountTable({ accounts, onConnectAccount }: AccountTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await apiRequest("PATCH", `/api/accounts/${accountId}/favorite`);
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const getAccountIcon = (accountType: string) => {
    switch (accountType) {
      case 'checking':
        return <Wallet className="w-5 h-5 text-primary" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-purple-600" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'credit':
        return <CreditCard className="w-5 h-5 text-accent" />;
      default:
        return <Wallet className="w-5 h-5 text-primary" />;
    }
  };

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType) {
      case 'checking':
        return 'bg-primary/10 text-primary';
      case 'savings':
        return 'bg-purple-100 text-purple-600';
      case 'investment':
        return 'bg-success/10 text-success';
      case 'credit':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount || '0'));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const getInstitutionName = (accountName: string) => {
    // Extract institution name from account name
    const nameLower = accountName.toLowerCase();
    if (nameLower.includes('chase')) return 'Chase';
    if (nameLower.includes('ally')) return 'Ally Bank';
    if (nameLower.includes('vanguard')) return 'Vanguard';
    if (nameLower.includes('amex') || nameLower.includes('american express')) return 'American Express';
    if (nameLower.includes('discover')) return 'Discover';
    if (nameLower.includes('citi')) return 'Citibank';
    if (nameLower.includes('capital one')) return 'Capital One';
    if (nameLower.includes('wells fargo')) return 'Wells Fargo';
    if (nameLower.includes('bank of america')) return 'Bank of America';
    
    return 'Manual Entry';
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.mask?.includes(searchTerm);
    const matchesType = accountTypeFilter === "all" || account.accountType === accountTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(filteredAccounts.map(account => account.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId]);
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId));
    }
  };

  const getCreditCardAvailable = (currentBalance: string, creditLimit: string) => {
    const balance = parseFloat(currentBalance || '0');
    const limit = parseFloat(creditLimit || '0');
    const used = limit - balance;
    const utilization = limit > 0 ? (used / limit) * 100 : 0;
    
    return {
      available: balance,
      utilization,
      used,
    };
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return "text-success";
    if (utilization < 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="bg-card rounded-lg border border-border" data-testid="account-table">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Account Management</h2>
            <p className="text-sm text-muted-foreground">View and manage all your connected accounts</p>
          </div>
          <Button onClick={onConnectAccount} className="inline-flex items-center" data-testid="button-connect-account">
            <Plus className="w-5 h-5 mr-2" />
            Connect Account
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search accounts..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-accounts"
            />
          </div>
          <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-account-type">
              <SelectValue placeholder="All Account Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Account Types</SelectItem>
              <SelectItem value="checking">Checking</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="credit">Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Issuer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredAccounts.map((account) => {
              const isSelected = selectedAccounts.includes(account.id);
              const isCredit = account.accountType === 'credit';
              const creditInfo = isCredit ? getCreditCardAvailable(account.currentBalance, account.creditLimit || '0') : null;

              return (
                <tr 
                  key={account.id} 
                  className="hover:bg-muted/30 transition-colors"
                  data-testid={`account-row-${account.id}`}
                >
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectAccount(account.id, checked === true)}
                      data-testid={`checkbox-account-${account.id}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={() => toggleFavoriteMutation.mutate(account.id)}
                        data-testid={`button-favorite-${account.id}`}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            account.isFavorite
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground hover:text-yellow-400"
                          }`}
                        />
                      </Button>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getAccountTypeColor(account.accountType).replace('text-', 'bg-').replace(/text-(\w+)/, 'bg-$1/10')}`}>
                        {getAccountIcon(account.accountType)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground" data-testid={`account-name-${account.id}`}>
                          {account.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`account-mask-${account.id}`}>
                          ****{account.mask}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeColor(account.accountType)}`}>
                      {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground" data-testid={`account-issuer-${account.id}`}>
                    {getInstitutionName(account.name)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground" data-testid={`account-balance-${account.id}`}>
                    {isCredit ? formatCurrency(account.creditLimit || '0') : formatCurrency(account.currentBalance)}
                  </td>
                  <td className="px-6 py-4" data-testid={`account-available-${account.id}`}>
                    {isCredit && creditInfo ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-foreground">{formatCurrency(creditInfo.available.toString())}</span>
                        <span className={`text-xs ${getUtilizationColor(creditInfo.utilization)}`}>
                          ({creditInfo.utilization.toFixed(1)}%)
                        </span>
                      </div>
                    ) : account.accountType === 'investment' ? (
                      <span className="text-sm text-success">Portfolio Value</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{formatCurrency(account.availableBalance || account.currentBalance)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground" data-testid={`account-updated-${account.id}`}>
                    {formatDate(account.lastUpdated)}
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-account-actions-${account.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem data-testid={`button-view-${account.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid={`button-edit-${account.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Account
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" data-testid={`button-delete-${account.id}`}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground" data-testid="pagination-info">
          Showing <span className="font-medium text-foreground">{filteredAccounts.length}</span> of{" "}
          <span className="font-medium text-foreground">{accounts.length}</span> accounts
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled data-testid="button-previous-page">
            Previous
          </Button>
          <Button size="sm" data-testid="button-current-page">
            1
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-next-page">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

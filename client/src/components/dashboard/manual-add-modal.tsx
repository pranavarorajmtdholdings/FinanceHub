import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const manualAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  accountType: z.enum(["checking", "savings", "investment", "credit"], {
    required_error: "Please select an account type",
  }),
  accountSubtype: z.enum(["checking", "savings", "401k", "ira", "brokerage", "credit_card", "line_of_credit"]),
  institutionName: z.string().min(1, "Institution name is required"),
  mask: z.string().length(4, "Please enter exactly 4 digits").regex(/^\d{4}$/, "Must be 4 numbers"),
  currentBalance: z.string().min(1, "Current balance is required"),
  creditLimit: z.string().optional(),
  dueDate: z.string().optional(),
});

type ManualAccountForm = z.infer<typeof manualAccountSchema>;

interface ManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualAddModal({ isOpen, onClose }: ManualAddModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ManualAccountForm>({
    resolver: zodResolver(manualAccountSchema),
    defaultValues: {
      name: "",
      accountType: undefined,
      accountSubtype: undefined,
      institutionName: "",
      mask: "",
      currentBalance: "",
      creditLimit: "",
      dueDate: "",
    },
  });

  const accountType = form.watch("accountType");

  const createAccountMutation = useMutation({
    mutationFn: async (data: ManualAccountForm) => {
      const accountData = {
        name: data.name,
        accountType: data.accountType,
        accountSubtype: data.accountSubtype,
        mask: data.mask,
        currentBalance: data.currentBalance,
        availableBalance: data.accountType === "credit" ? undefined : data.currentBalance,
        creditLimit: data.accountType === "credit" ? data.creditLimit : undefined,
        institutionId: null,
        plaidAccountId: null,
        officialName: data.name,
        isManual: true,
      };

      const res = await apiRequest("POST", "/api/accounts/manual", accountData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Added Successfully",
        description: "Your account has been added to the dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/summary"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error("Error adding account:", error);
      toast({
        title: "Failed to Add Account",
        description: "There was an error adding your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSubtypeOptions = (accountType: string) => {
    switch (accountType) {
      case "checking":
        return [{ value: "checking", label: "Checking" }];
      case "savings":
        return [{ value: "savings", label: "Savings" }];
      case "investment":
        return [
          { value: "401k", label: "401(k)" },
          { value: "ira", label: "IRA" },
          { value: "brokerage", label: "Brokerage" },
        ];
      case "credit":
        return [
          { value: "credit_card", label: "Credit Card" },
          { value: "line_of_credit", label: "Line of Credit" },
        ];
      default:
        return [];
    }
  };

  const onSubmit = (data: ManualAccountForm) => {
    createAccountMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="manual-add-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold" data-testid="manual-add-title">
              Add Account Manually
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-manual-modal"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="manual-account-form">
            {/* Account Type Selection */}
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Auto-set subtype for simple account types
                      if (value === "checking") {
                        form.setValue("accountSubtype", "checking");
                      } else if (value === "savings") {
                        form.setValue("accountSubtype", "savings");
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-account-type">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Checking Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="investment">Investment Account</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Subtype */}
            {accountType && getSubtypeOptions(accountType).length > 1 && (
              <FormField
                control={form.control}
                name="accountSubtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Subtype</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-account-subtype">
                          <SelectValue placeholder="Select subtype" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getSubtypeOptions(accountType).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Chase Checking"
                        {...field}
                        data-testid="input-account-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institutionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Chase Bank"
                        {...field}
                        data-testid="input-institution-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mask"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number (Last 4 digits)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234"
                        maxLength={4}
                        {...field}
                        data-testid="input-account-mask"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {accountType === "credit" ? "Available Credit" : "Current Balance"}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          data-testid="input-current-balance"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Credit Card Specific Fields */}
            {accountType === "credit" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="creditLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Limit</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                            data-testid="input-credit-limit"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Payment Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-due-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAccountMutation.isPending}
                data-testid="button-submit-add"
              >
                {createAccountMutation.isPending ? "Adding..." : "Add Account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Bell, BellOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Alert, Account } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const alertFormSchema = z.object({
  accountId: z.string().optional(),
  alertType: z.enum(["balance_threshold", "due_date", "utilization_spike"]),
  thresholdAmount: z.string().optional(),
  thresholdPercentage: z.string().optional(),
  daysBeforeDue: z.string().optional(),
  notificationMethod: z.enum(["in_app", "email"]),
  isActive: z.boolean().default(true),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

export default function AlertsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      alertType: "balance_threshold",
      accountId: "all",
      thresholdAmount: "",
      thresholdPercentage: "",
      daysBeforeDue: "",
      notificationMethod: "in_app",
      isActive: true,
    },
  });

  const alertType = form.watch("alertType");

  const createAlertMutation = useMutation({
    mutationFn: async (data: AlertFormValues) => {
      const payload = {
        accountId: data.accountId && data.accountId !== "all" ? data.accountId : null,
        alertType: data.alertType,
        thresholdAmount: data.thresholdAmount ? parseFloat(data.thresholdAmount) : null,
        thresholdPercentage: data.thresholdPercentage ? parseInt(data.thresholdPercentage) : null,
        daysBeforeDue: data.daysBeforeDue ? parseInt(data.daysBeforeDue) : null,
        notificationMethod: data.notificationMethod,
        isActive: data.isActive,
      };
      const res = await apiRequest("POST", "/api/alerts", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Alert created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("DELETE", `/api/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Success",
        description: "Alert deleted successfully",
      });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}`, { isActive: !isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "balance_threshold":
        return "Balance Threshold";
      case "due_date":
        return "Due Date Reminder";
      case "utilization_spike":
        return "Utilization Spike";
      default:
        return type;
    }
  };

  const getAlertDescription = (alert: Alert) => {
    switch (alert.alertType) {
      case "balance_threshold":
        return `Alert when balance ${alert.thresholdAmount ? `falls below $${alert.thresholdAmount}` : "threshold reached"}`;
      case "due_date":
        return `Alert ${alert.daysBeforeDue || 7} days before payment due`;
      case "utilization_spike":
        return `Alert when utilization exceeds ${alert.thresholdPercentage || 70}%`;
      default:
        return "Alert configured";
    }
  };

  const onSubmit = (data: AlertFormValues) => {
    createAlertMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="alerts-title">Alerts & Notifications</h1>
          <p className="text-muted-foreground">
            Set up custom alerts to stay on top of your finances
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Active Alerts</h2>
              <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-alert">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-testid="dialog-add-alert">
                <DialogHeader>
                  <DialogTitle>Create New Alert</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="alertType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-alert-type">
                                <SelectValue placeholder="Select alert type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="balance_threshold">Balance Threshold</SelectItem>
                              <SelectItem value="due_date">Due Date Reminder</SelectItem>
                              <SelectItem value="utilization_spike">Utilization Spike</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-account">
                                <SelectValue placeholder="All accounts" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">All Accounts</SelectItem>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {alertType === "balance_threshold" && (
                      <FormField
                        control={form.control}
                        name="thresholdAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Threshold Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="1000.00"
                                {...field}
                                data-testid="input-threshold-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {alertType === "utilization_spike" && (
                      <FormField
                        control={form.control}
                        name="thresholdPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Threshold Percentage (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="70"
                                {...field}
                                data-testid="input-threshold-percentage"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {alertType === "due_date" && (
                      <FormField
                        control={form.control}
                        name="daysBeforeDue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days Before Due Date</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="30"
                                placeholder="7"
                                {...field}
                                data-testid="input-days-before-due"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="notificationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-notification-method">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="in_app">In-App Notification</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createAlertMutation.isPending}
                        data-testid="button-submit-alert"
                      >
                        {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4" data-testid="empty-alerts-message">
                  No alerts configured yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first alert to get notified about important financial events
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {alert.isActive ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground" data-testid={`alert-type-${alert.id}`}>
                          {getAlertTypeLabel(alert.alertType)}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`alert-description-${alert.id}`}>
                          {getAlertDescription(alert)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {alert.notificationMethod === "in_app" ? "In-App" : "Email"}
                          </span>
                          {!alert.isActive && (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAlertMutation.mutate({ id: alert.id, isActive: alert.isActive ?? false })}
                        data-testid={`button-toggle-alert-${alert.id}`}
                      >
                        {alert.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                        data-testid={`button-delete-alert-${alert.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

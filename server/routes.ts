import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { plaidClient } from "./services/plaid";
import { insertAccountSchema, insertAlertSchema, updateAccountSchema, updateAlertSchema } from "@shared/schema";

// Centralized async route handler that catches errors and handles Zod validation
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }
      console.error(`${req.method} ${req.path} failed:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// In production, get userId from session/auth
function getUserId(): string {
  return "user-1"; // Hardcoded for demo
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user accounts
  app.get("/api/accounts", asyncHandler(async (_req, res) => {
    const accounts = await storage.getAccountsByUserId(getUserId());
    res.json(accounts);
  }));

  // Get account summary
  app.get("/api/accounts/summary", asyncHandler(async (_req, res) => {
    const summary = await storage.getAccountSummaryByUserId(getUserId());
    res.json(summary);
  }));

  // Get upcoming payments
  app.get("/api/payments/upcoming", asyncHandler(async (req, res) => {
    const daysParam = req.query.days;
    const days = daysParam !== undefined ? Math.max(1, Math.min(365, Number(daysParam) || 7)) : 7;

    const payments = await storage.getUpcomingPayments(getUserId(), days);

    const paymentsWithAccounts = await Promise.all(
      payments.map(async (payment) => {
        const account = await storage.getAccountById(payment.accountId);
        return { ...payment, account };
      })
    );

    res.json(paymentsWithAccounts);
  }));

  // Create Plaid link token
  app.post("/api/plaid/link-token", asyncHandler(async (_req, res) => {
    const linkToken = await plaidClient.createLinkToken(getUserId());
    res.json({ linkToken });
  }));

  // Exchange public token for access token
  app.post("/api/plaid/exchange-token", asyncHandler(async (req, res) => {
    const { public_token } = req.body;
    if (!public_token || typeof public_token !== "string") {
      res.status(400).json({ message: "Public token is required" });
      return;
    }

    const result = await plaidClient.exchangePublicToken(public_token, getUserId());
    res.json(result);
  }));

  // Refresh account balances
  app.post("/api/accounts/refresh", asyncHandler(async (_req, res) => {
    const result = await plaidClient.refreshAccounts(getUserId());
    res.json(result);
  }));

  // Bulk update manual account balances
  app.post("/api/accounts/bulk-update-balances", asyncHandler(async (req, res) => {
    const userId = getUserId();

    const balanceUpdateSchema = z.object({
      updates: z.array(z.object({
        id: z.string().min(1),
        currentBalance: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid dollar amount"),
        creditLimit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid dollar amount").optional(),
      })).min(1, "At least one update is required"),
    });

    const parsed = balanceUpdateSchema.parse(req.body);

    const userAccounts = await storage.getAccountsByUserId(userId);
    const manualAccountMap = new Map(
      userAccounts.filter(a => a.isManual).map(a => [a.id, a])
    );

    let updatedCount = 0;
    for (const update of parsed.updates) {
      const account = manualAccountMap.get(update.id);
      if (!account) continue;

      const updateData: Record<string, string> = {
        currentBalance: update.currentBalance,
      };
      if (update.creditLimit !== undefined && account.accountType === "credit") {
        updateData.creditLimit = update.creditLimit;
      }

      await storage.updateAccount(update.id, updateData);
      updatedCount++;
    }

    res.json({ success: true, updatedCount });
  }));

  // Add manual account
  app.post("/api/accounts/manual", asyncHandler(async (req, res) => {
    const accountData = insertAccountSchema.parse({
      ...req.body,
      userId: getUserId(),
      isManual: true,
    });

    const account = await storage.createAccount(accountData);
    res.json(account);
  }));

  // Update account
  app.patch("/api/accounts/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = updateAccountSchema.parse(req.body);

    const account = await storage.updateAccount(id, updates);
    res.json(account);
  }));

  // Delete account
  app.delete("/api/accounts/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    await storage.deleteAccount(id);
    res.json({ success: true });
  }));

  // Toggle favorite account
  app.patch("/api/accounts/:id/favorite", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentAccount = await storage.getAccountById(id);

    if (!currentAccount) {
      res.status(404).json({ message: "Account not found" });
      return;
    }

    const account = await storage.updateAccount(id, {
      isFavorite: !currentAccount.isFavorite,
    });
    res.json(account);
  }));

  // Get user alerts
  app.get("/api/alerts", asyncHandler(async (_req, res) => {
    const alerts = await storage.getAlertsByUserId(getUserId());
    res.json(alerts);
  }));

  // Create alert
  app.post("/api/alerts", asyncHandler(async (req, res) => {
    const { alertType, thresholdAmount, thresholdPercentage, daysBeforeDue } = req.body;

    if (alertType === "balance_threshold" && !thresholdAmount) {
      res.status(400).json({ message: "Threshold amount is required for balance threshold alerts" });
      return;
    }
    if (alertType === "utilization_spike" && !thresholdPercentage) {
      res.status(400).json({ message: "Threshold percentage is required for utilization spike alerts" });
      return;
    }
    if (alertType === "due_date" && !daysBeforeDue) {
      res.status(400).json({ message: "Days before due is required for due date alerts" });
      return;
    }

    const alertData = insertAlertSchema.parse({
      ...req.body,
      userId: getUserId(),
    });

    const alert = await storage.createAlert(alertData);
    res.json(alert);
  }));

  // Update alert
  app.patch("/api/alerts/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getUserId();
    const updates = updateAlertSchema.parse(req.body);

    const existingAlert = await storage.getAlertById(id);
    if (!existingAlert) {
      res.status(404).json({ message: "Alert not found" });
      return;
    }
    if (existingAlert.userId !== userId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const alert = await storage.updateAlert(id, updates);
    res.json(alert);
  }));

  // Delete alert
  app.delete("/api/alerts/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getUserId();

    const existingAlert = await storage.getAlertById(id);
    if (!existingAlert) {
      res.status(404).json({ message: "Alert not found" });
      return;
    }
    if (existingAlert.userId !== userId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    await storage.deleteAlert(id);
    res.json({ success: true });
  }));

  // Get triggered alerts
  app.get("/api/alerts/triggered", asyncHandler(async (req, res) => {
    const onlyUnread = req.query.unread === "true";
    const triggeredAlerts = await storage.getTriggeredAlertsByUserId(getUserId(), onlyUnread);
    res.json(triggeredAlerts);
  }));

  // Mark alert as read
  app.patch("/api/alerts/triggered/:id/read", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const alert = await storage.markAlertAsRead(id);
    res.json(alert);
  }));

  // Manually check all alerts (for testing)
  app.post("/api/alerts/check", asyncHandler(async (_req, res) => {
    const { AlertService } = await import("./alert-service");
    const alertService = new AlertService(storage);
    await alertService.checkAndTriggerAlerts(getUserId());
    res.json({ success: true, message: "Alerts checked successfully" });
  }));

  const httpServer = createServer(app);
  return httpServer;
}

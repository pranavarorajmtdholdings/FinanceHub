import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { plaidClient } from "./services/plaid";
import { insertAccountSchema, insertAlertSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user accounts
  app.get("/api/accounts", async (req, res) => {
    try {
      // In production, get userId from session/auth
      const userId = "user-1"; // Hardcoded for demo
      const accounts = await storage.getAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Get account summary
  app.get("/api/accounts/summary", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const summary = await storage.getAccountSummaryByUserId(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching account summary:", error);
      res.status(500).json({ message: "Failed to fetch account summary" });
    }
  });

  // Get upcoming payments
  app.get("/api/payments/upcoming", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const days = parseInt(req.query.days as string) || 7;
      const payments = await storage.getUpcomingPayments(userId, days);
      
      // Get account details for each payment
      const paymentsWithAccounts = await Promise.all(
        payments.map(async (payment) => {
          const account = await storage.getAccountById(payment.accountId);
          return {
            ...payment,
            account,
          };
        })
      );
      
      res.json(paymentsWithAccounts);
    } catch (error) {
      console.error("Error fetching upcoming payments:", error);
      res.status(500).json({ message: "Failed to fetch upcoming payments" });
    }
  });

  // Create Plaid link token
  app.post("/api/plaid/link-token", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const linkToken = await plaidClient.createLinkToken(userId);
      res.json({ linkToken });
    } catch (error) {
      console.error("Error creating link token:", error);
      res.status(500).json({ message: "Failed to create link token" });
    }
  });

  // Exchange public token for access token
  app.post("/api/plaid/exchange-token", async (req, res) => {
    try {
      const { public_token } = req.body;
      const userId = "user-1"; // Hardcoded for demo
      
      if (!public_token) {
        return res.status(400).json({ message: "Public token is required" });
      }

      const result = await plaidClient.exchangePublicToken(public_token, userId);
      res.json(result);
    } catch (error) {
      console.error("Error exchanging public token:", error);
      res.status(500).json({ message: "Failed to exchange public token" });
    }
  });

  // Refresh account balances
  app.post("/api/accounts/refresh", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const result = await plaidClient.refreshAccounts(userId);
      res.json(result);
    } catch (error) {
      console.error("Error refreshing accounts:", error);
      res.status(500).json({ message: "Failed to refresh accounts" });
    }
  });

  // Bulk update manual account balances
  app.post("/api/accounts/bulk-update-balances", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo

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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid balance data",
          errors: error.errors,
        });
      }
      console.error("Error bulk updating balances:", error);
      res.status(500).json({ message: "Failed to bulk update balances" });
    }
  });

  // Add manual account
  app.post("/api/accounts/manual", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const accountData = insertAccountSchema.parse({
        ...req.body,
        userId,
        isManual: true,
      });
      
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid account data", 
          errors: error.errors 
        });
      }
      console.error("Error creating manual account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Update account
  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const account = await storage.updateAccount(id, updates);
      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  // Delete account
  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAccount(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Toggle favorite account
  app.patch("/api/accounts/:id/favorite", async (req, res) => {
    try {
      const { id } = req.params;
      const currentAccount = await storage.getAccountById(id);
      
      if (!currentAccount) {
        return res.status(404).json({ message: "Account not found" });
      }

      const account = await storage.updateAccount(id, {
        isFavorite: !currentAccount.isFavorite,
      });
      res.json(account);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Get user alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const alerts = await storage.getAlertsByUserId(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Create alert
  app.post("/api/alerts", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      
      // Validate alert type-specific requirements
      const { alertType, thresholdAmount, thresholdPercentage, daysBeforeDue } = req.body;
      
      if (alertType === "balance_threshold" && !thresholdAmount) {
        return res.status(400).json({ message: "Threshold amount is required for balance threshold alerts" });
      }
      if (alertType === "utilization_spike" && !thresholdPercentage) {
        return res.status(400).json({ message: "Threshold percentage is required for utilization spike alerts" });
      }
      if (alertType === "due_date" && !daysBeforeDue) {
        return res.status(400).json({ message: "Days before due is required for due date alerts" });
      }
      
      const alertData = insertAlertSchema.parse({
        ...req.body,
        userId,
      });
      
      const alert = await storage.createAlert(alertData);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid alert data", 
          errors: error.errors 
        });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  // Update alert
  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = "user-1"; // Hardcoded for demo
      const updates = req.body;
      
      // Verify alert belongs to user
      const existingAlert = await storage.getAlertById(id);
      if (!existingAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      if (existingAlert.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const alert = await storage.updateAlert(id, updates);
      res.json(alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  // Delete alert
  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = "user-1"; // Hardcoded for demo
      
      // Verify alert belongs to user
      const existingAlert = await storage.getAlertById(id);
      if (!existingAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      if (existingAlert.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteAlert(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });

  // Get triggered alerts
  app.get("/api/alerts/triggered", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const onlyUnread = req.query.unread === 'true';
      const triggeredAlerts = await storage.getTriggeredAlertsByUserId(userId, onlyUnread);
      res.json(triggeredAlerts);
    } catch (error) {
      console.error("Error fetching triggered alerts:", error);
      res.status(500).json({ message: "Failed to fetch triggered alerts" });
    }
  });

  // Mark alert as read
  app.patch("/api/alerts/triggered/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.markAlertAsRead(id);
      res.json(alert);
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  // Manually check all alerts (for testing)
  app.post("/api/alerts/check", async (req, res) => {
    try {
      const userId = "user-1"; // Hardcoded for demo
      const { AlertService } = await import("./alert-service");
      const alertService = new AlertService(storage);
      await alertService.checkAndTriggerAlerts(userId);
      res.json({ success: true, message: "Alerts checked successfully" });
    } catch (error) {
      console.error("Error checking alerts:", error);
      res.status(500).json({ message: "Failed to check alerts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

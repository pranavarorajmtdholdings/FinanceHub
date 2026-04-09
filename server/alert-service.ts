import type { IStorage } from "./storage";
import type { Alert, Account, CreditCardPayment } from "@shared/schema";

export class AlertService {
  constructor(private storage: IStorage) {}

  async checkAndTriggerAlerts(userId: string): Promise<void> {
    const alerts = await this.storage.getAlertsByUserId(userId);
    const activeAlerts = alerts.filter(alert => alert.isActive);

    for (const alert of activeAlerts) {
      await this.checkAlert(alert, userId);
    }
  }

  private async checkAlert(alert: Alert, userId: string): Promise<void> {
    switch (alert.alertType) {
      case "balance_threshold":
        await this.checkBalanceThreshold(alert, userId);
        break;
      case "utilization_spike":
        await this.checkUtilizationSpike(alert, userId);
        break;
      case "due_date":
        await this.checkDueDate(alert, userId);
        break;
    }
  }

  private async checkBalanceThreshold(alert: Alert, userId: string): Promise<void> {
    if (!alert.thresholdAmount) return;

    const accounts = alert.accountId
      ? [await this.storage.getAccountById(alert.accountId)]
      : await this.storage.getAccountsByUserId(userId);

    for (const account of accounts) {
      if (!account || !account.currentBalance) continue;

      const balance = parseFloat(account.currentBalance);
      const threshold = parseFloat(alert.thresholdAmount);

      if (balance < threshold) {
        const message = alert.accountId
          ? `${account.name} balance ($${balance.toFixed(2)}) is below your threshold of $${threshold.toFixed(2)}`
          : `Account ${account.name} balance ($${balance.toFixed(2)}) is below your threshold of $${threshold.toFixed(2)}`;

        await this.triggerAlert(alert.id, message, userId);
      }
    }
  }

  private async checkUtilizationSpike(alert: Alert, userId: string): Promise<void> {
    if (!alert.thresholdPercentage) return;

    const accounts = alert.accountId
      ? [await this.storage.getAccountById(alert.accountId)]
      : await this.storage.getAccountsByUserId(userId);

    const creditAccounts = accounts.filter(
      (acc): acc is Account => acc !== undefined && acc.accountType === "credit" && !!acc.creditLimit && !!acc.currentBalance
    );

    for (const account of creditAccounts) {
      if (!account.creditLimit || !account.currentBalance) continue;

      const creditLimit = parseFloat(account.creditLimit);
      const balance = parseFloat(account.currentBalance);
      const utilization = (balance / creditLimit) * 100;

      if (utilization >= alert.thresholdPercentage) {
        const message = `${account.name} utilization (${utilization.toFixed(1)}%) has reached your alert threshold of ${alert.thresholdPercentage}%`;
        await this.triggerAlert(alert.id, message, userId);
      }
    }
  }

  private async checkDueDate(alert: Alert, userId: string): Promise<void> {
    if (!alert.daysBeforeDue) return;

    const allPayments = await this.storage.getUpcomingPayments(userId, 30);
    
    const relevantPayments = alert.accountId
      ? allPayments.filter(p => p.accountId === alert.accountId)
      : allPayments;

    for (const payment of relevantPayments) {
      const daysUntilDue = this.getDaysUntilDate(payment.dueDate);

      if (daysUntilDue <= alert.daysBeforeDue && daysUntilDue >= 0) {
        const account = await this.storage.getAccountById(payment.accountId);
        const message = daysUntilDue === 0
          ? `Payment due TODAY for ${account?.name || 'your account'}: $${payment.minimumPayment || '0.00'}`
          : `Payment due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} for ${account?.name || 'your account'}: $${payment.minimumPayment || '0.00'}`;

        await this.triggerAlert(alert.id, message, userId);
      }
    }
  }

  private getDaysUntilDate(date: Date | null): number {
    if (!date) return -1;
    const now = new Date();
    const due = new Date(date);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async triggerAlert(alertId: string, message: string, userId: string): Promise<void> {
    // Check if this alert was already triggered recently (within last hour)
    const existingTriggered = await this.storage.getTriggeredAlertsByUserId(userId, false);
    const recentlyTriggered = existingTriggered.find(ta => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const triggeredTime = ta.triggeredAt ? new Date(ta.triggeredAt) : new Date(0);
      return ta.alertId === alertId && triggeredTime > hourAgo;
    });

    if (recentlyTriggered) {
      // Already triggered recently, skip
      return;
    }

    await this.storage.createTriggeredAlert({
      alertId,
      message,
      isRead: false,
    });
  }
}

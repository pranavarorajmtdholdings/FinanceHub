import { 
  users, 
  accounts, 
  institutions, 
  plaidItems, 
  transactions, 
  creditCardPayments,
  alerts,
  triggeredAlerts,
  type User, 
  type InsertUser,
  type Account,
  type InsertAccount,
  type Institution,
  type PlaidItem,
  type InsertPlaidItem,
  type Transaction,
  type InsertTransaction,
  type CreditCardPayment,
  type InsertCreditCardPayment,
  type Alert,
  type InsertAlert,
  type TriggeredAlert,
  type InsertTriggeredAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Account methods
  getAccountsByUserId(userId: string): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<Account>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  
  // Institution methods
  getInstitution(id: string): Promise<Institution | undefined>;
  createOrUpdateInstitution(institution: Institution): Promise<Institution>;
  
  // Plaid methods
  getPlaidItemsByUserId(userId: string): Promise<PlaidItem[]>;
  getPlaidItemByItemId(itemId: string): Promise<PlaidItem | undefined>;
  createPlaidItem(item: InsertPlaidItem): Promise<PlaidItem>;
  updatePlaidItem(id: string, updates: Partial<PlaidItem>): Promise<PlaidItem>;
  
  // Transaction methods
  getTransactionsByAccountId(accountId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Credit card payment methods
  getCreditCardPaymentsByUserId(userId: string): Promise<CreditCardPayment[]>;
  getUpcomingPayments(userId: string, days?: number): Promise<CreditCardPayment[]>;
  createCreditCardPayment(payment: InsertCreditCardPayment): Promise<CreditCardPayment>;
  
  // Summary methods
  getAccountSummaryByUserId(userId: string): Promise<{
    totalChecking: number;
    totalSavings: number;
    totalInvestments: number;
    totalCreditLimit: number;
    totalCreditUsed: number;
    creditUtilization: number;
  }>;

  // Alert methods
  getAlertsByUserId(userId: string): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert>;
  deleteAlert(id: string): Promise<void>;
  
  // Triggered alert methods
  getTriggeredAlertsByUserId(userId: string, onlyUnread?: boolean): Promise<TriggeredAlert[]>;
  createTriggeredAlert(triggeredAlert: InsertTriggeredAlert): Promise<TriggeredAlert>;
  markAlertAsRead(id: string): Promise<TriggeredAlert>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAccountsByUserId(userId: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)))
      .orderBy(desc(accounts.isFavorite), accounts.accountType, accounts.name);
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ ...updates, lastUpdated: sql`now()` })
      .where(eq(accounts.id, id))
      .returning();
    return account;
  }

  async deleteAccount(id: string): Promise<void> {
    await db
      .update(accounts)
      .set({ isActive: false })
      .where(eq(accounts.id, id));
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution || undefined;
  }

  async createOrUpdateInstitution(institution: Institution): Promise<Institution> {
    const [result] = await db
      .insert(institutions)
      .values(institution)
      .onConflictDoUpdate({
        target: institutions.id,
        set: {
          name: institution.name,
          logo: institution.logo,
          primaryColor: institution.primaryColor,
          url: institution.url,
        },
      })
      .returning();
    return result;
  }

  async getPlaidItemsByUserId(userId: string): Promise<PlaidItem[]> {
    return await db
      .select()
      .from(plaidItems)
      .where(eq(plaidItems.userId, userId))
      .orderBy(desc(plaidItems.lastSync));
  }

  async getPlaidItemByItemId(itemId: string): Promise<PlaidItem | undefined> {
    const [item] = await db.select().from(plaidItems).where(eq(plaidItems.plaidItemId, itemId));
    return item || undefined;
  }

  async createPlaidItem(item: InsertPlaidItem): Promise<PlaidItem> {
    const [newItem] = await db
      .insert(plaidItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updatePlaidItem(id: string, updates: Partial<PlaidItem>): Promise<PlaidItem> {
    const [item] = await db
      .update(plaidItems)
      .set({ ...updates, lastSync: sql`now()` })
      .where(eq(plaidItems.id, id))
      .returning();
    return item;
  }

  async getTransactionsByAccountId(accountId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getCreditCardPaymentsByUserId(userId: string): Promise<CreditCardPayment[]> {
    return await db
      .select({
        id: creditCardPayments.id,
        accountId: creditCardPayments.accountId,
        dueDate: creditCardPayments.dueDate,
        minimumPayment: creditCardPayments.minimumPayment,
        lastStatementBalance: creditCardPayments.lastStatementBalance,
        isPaid: creditCardPayments.isPaid,
      })
      .from(creditCardPayments)
      .innerJoin(accounts, eq(creditCardPayments.accountId, accounts.id))
      .where(and(
        eq(accounts.userId, userId),
        eq(accounts.isActive, true),
        eq(creditCardPayments.isPaid, false)
      ))
      .orderBy(creditCardPayments.dueDate);
  }

  async getUpcomingPayments(userId: string, days = 7): Promise<CreditCardPayment[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await db
      .select({
        id: creditCardPayments.id,
        accountId: creditCardPayments.accountId,
        dueDate: creditCardPayments.dueDate,
        minimumPayment: creditCardPayments.minimumPayment,
        lastStatementBalance: creditCardPayments.lastStatementBalance,
        isPaid: creditCardPayments.isPaid,
      })
      .from(creditCardPayments)
      .innerJoin(accounts, eq(creditCardPayments.accountId, accounts.id))
      .where(and(
        eq(accounts.userId, userId),
        eq(accounts.isActive, true),
        eq(creditCardPayments.isPaid, false),
        lte(creditCardPayments.dueDate, futureDate)
      ))
      .orderBy(creditCardPayments.dueDate);
  }

  async createCreditCardPayment(payment: InsertCreditCardPayment): Promise<CreditCardPayment> {
    const [newPayment] = await db
      .insert(creditCardPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getAccountSummaryByUserId(userId: string): Promise<{
    totalChecking: number;
    totalSavings: number;
    totalInvestments: number;
    totalCreditLimit: number;
    totalCreditUsed: number;
    creditUtilization: number;
  }> {
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

    let totalChecking = 0;
    let totalSavings = 0;
    let totalInvestments = 0;
    let totalCreditLimit = 0;
    let totalCreditUsed = 0;

    for (const account of userAccounts) {
      const balance = parseFloat(account.currentBalance || '0');
      const creditLimit = parseFloat(account.creditLimit || '0');

      switch (account.accountType) {
        case 'checking':
          totalChecking += balance;
          break;
        case 'savings':
          totalSavings += balance;
          break;
        case 'investment':
          totalInvestments += balance;
          break;
        case 'credit':
          totalCreditLimit += creditLimit;
          totalCreditUsed += creditLimit - balance;
          break;
      }
    }

    const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

    return {
      totalChecking,
      totalSavings,
      totalInvestments,
      totalCreditLimit,
      totalCreditUsed,
      creditUtilization,
    };
  }

  async getAlertsByUserId(userId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  async deleteAlert(id: string): Promise<void> {
    await db.delete(alerts).where(eq(alerts.id, id));
  }

  async getTriggeredAlertsByUserId(userId: string, onlyUnread = false): Promise<TriggeredAlert[]> {
    const userAlerts = await db
      .select({ alertId: alerts.id })
      .from(alerts)
      .where(eq(alerts.userId, userId));

    const alertIds = userAlerts.map(a => a.alertId);

    if (alertIds.length === 0) {
      return [];
    }

    const query = db
      .select()
      .from(triggeredAlerts)
      .where(
        and(
          inArray(triggeredAlerts.alertId, alertIds),
          onlyUnread ? eq(triggeredAlerts.isRead, false) : undefined
        )
      )
      .orderBy(desc(triggeredAlerts.triggeredAt));

    return await query;
  }

  async createTriggeredAlert(triggeredAlert: InsertTriggeredAlert): Promise<TriggeredAlert> {
    const [newTriggeredAlert] = await db
      .insert(triggeredAlerts)
      .values(triggeredAlert)
      .returning();
    return newTriggeredAlert;
  }

  async markAlertAsRead(id: string): Promise<TriggeredAlert> {
    const [alert] = await db
      .update(triggeredAlerts)
      .set({ isRead: true })
      .where(eq(triggeredAlerts.id, id))
      .returning();
    return alert;
  }
}

export const storage = new DatabaseStorage();

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accountTypeEnum = pgEnum("account_type", ["checking", "savings", "investment", "credit"]);
export const accountSubtypeEnum = pgEnum("account_subtype", ["checking", "savings", "401k", "ira", "brokerage", "credit_card", "line_of_credit"]);
export const alertTypeEnum = pgEnum("alert_type", ["balance_threshold", "due_date", "utilization_spike"]);
export const notificationMethodEnum = pgEnum("notification_method", ["in_app", "email"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  primaryColor: text("primary_color"),
  url: text("url"),
});

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  institutionId: varchar("institution_id").references(() => institutions.id),
  plaidAccountId: text("plaid_account_id").unique(),
  name: text("name").notNull(),
  officialName: text("official_name"),
  accountType: accountTypeEnum("account_type").notNull(),
  accountSubtype: accountSubtypeEnum("account_subtype").notNull(),
  mask: text("mask"),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }),
  availableBalance: decimal("available_balance", { precision: 12, scale: 2 }),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  lastUpdated: timestamp("last_updated").default(sql`now()`),
  isActive: boolean("is_active").default(true),
  isManual: boolean("is_manual").default(false),
  isFavorite: boolean("is_favorite").default(false),
});

export const plaidItems = pgTable("plaid_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plaidItemId: text("plaid_item_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  institutionId: varchar("institution_id").references(() => institutions.id),
  cursor: text("cursor"),
  lastSync: timestamp("last_sync").default(sql`now()`),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  plaidTransactionId: text("plaid_transaction_id").unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  category: text("category").array(),
  merchantName: text("merchant_name"),
  pending: boolean("pending").default(false),
});

export const creditCardPayments = pgTable("credit_card_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  dueDate: timestamp("due_date").notNull(),
  minimumPayment: decimal("minimum_payment", { precision: 12, scale: 2 }),
  lastStatementBalance: decimal("last_statement_balance", { precision: 12, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  alertType: alertTypeEnum("alert_type").notNull(),
  thresholdAmount: decimal("threshold_amount", { precision: 12, scale: 2 }),
  thresholdPercentage: integer("threshold_percentage"),
  daysBeforeDue: integer("days_before_due"),
  notificationMethod: notificationMethodEnum("notification_method").notNull().default("in_app"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const triggeredAlerts = pgTable("triggered_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  triggeredAt: timestamp("triggered_at").default(sql`now()`),
  isRead: boolean("is_read").default(false),
  message: text("message").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  plaidItems: many(plaidItems),
  alerts: many(alerts),
}));

export const institutionsRelations = relations(institutions, ({ many }) => ({
  accounts: many(accounts),
  plaidItems: many(plaidItems),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  institution: one(institutions, {
    fields: [accounts.institutionId],
    references: [institutions.id],
  }),
  transactions: many(transactions),
  creditCardPayments: many(creditCardPayments),
  alerts: many(alerts),
}));

export const plaidItemsRelations = relations(plaidItems, ({ one }) => ({
  user: one(users, {
    fields: [plaidItems.userId],
    references: [users.id],
  }),
  institution: one(institutions, {
    fields: [plaidItems.institutionId],
    references: [institutions.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

export const creditCardPaymentsRelations = relations(creditCardPayments, ({ one }) => ({
  account: one(accounts, {
    fields: [creditCardPayments.accountId],
    references: [accounts.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [alerts.accountId],
    references: [accounts.id],
  }),
  triggeredAlerts: many(triggeredAlerts),
}));

export const triggeredAlertsRelations = relations(triggeredAlerts, ({ one }) => ({
  alert: one(alerts, {
    fields: [triggeredAlerts.alertId],
    references: [alerts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  lastUpdated: true,
});

export const insertPlaidItemSchema = createInsertSchema(plaidItems).omit({
  id: true,
  lastSync: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export const insertCreditCardPaymentSchema = createInsertSchema(creditCardPayments).omit({
  id: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertTriggeredAlertSchema = createInsertSchema(triggeredAlerts).omit({
  id: true,
  triggeredAt: true,
});

// Update schemas (partial versions for PATCH endpoints)
export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  accountType: z.enum(["checking", "savings", "investment", "credit"]).optional(),
  accountSubtype: z.enum(["checking", "savings", "401k", "ira", "brokerage", "credit_card", "line_of_credit"]).optional(),
  currentBalance: z.string().optional(),
  availableBalance: z.string().optional(),
  creditLimit: z.string().optional(),
  isFavorite: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateAlertSchema = z.object({
  accountId: z.string().nullable().optional(),
  alertType: z.enum(["balance_threshold", "due_date", "utilization_spike"]).optional(),
  thresholdAmount: z.string().nullable().optional(),
  thresholdPercentage: z.number().int().min(0).max(100).nullable().optional(),
  daysBeforeDue: z.number().int().min(1).max(365).nullable().optional(),
  notificationMethod: z.enum(["in_app", "email"]).optional(),
  isActive: z.boolean().optional(),
}).strict();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Institution = typeof institutions.$inferSelect;
export type PlaidItem = typeof plaidItems.$inferSelect;
export type InsertPlaidItem = z.infer<typeof insertPlaidItemSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type CreditCardPayment = typeof creditCardPayments.$inferSelect;
export type InsertCreditCardPayment = z.infer<typeof insertCreditCardPaymentSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type TriggeredAlert = typeof triggeredAlerts.$inferSelect;
export type InsertTriggeredAlert = z.infer<typeof insertTriggeredAlertSchema>;

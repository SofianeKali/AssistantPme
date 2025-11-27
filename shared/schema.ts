import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Companies table - Multi-tenant isolation
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Raison sociale
  address: text("address"), // Adresse complète
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("simple"), // admin, simple
  // Password hash for local authentication (bcrypt)
  // NULL for users who authenticate via OIDC only
  passwordHash: text("password_hash"),
  // Stripe integration for subscriptions
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionPlan: varchar("subscription_plan"), // starter, professional, enterprise, custom, trial
  subscriptionStatus: varchar("subscription_status"), // active, cancelled, past_due, trialing
  trialEndsAt: timestamp("trial_ends_at"), // Date de fin de l'essai gratuit (NULL si pas en essai)
  currentPeriodEnd: timestamp("current_period_end"), // Date de fin de la période de facturation actuelle
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Email configuration table
export const emailAccounts = pgTable("email_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull(), // gmail, outlook
  email: varchar("email").notNull(),
  imapHost: varchar("imap_host").notNull(),
  imapPort: integer("imap_port").notNull(),
  smtpHost: varchar("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  // SECURITY: Password encrypted at rest using AES-256-GCM
  // Automatically encrypted on write and decrypted on read by storage layer
  username: varchar("username").notNull(),
  password: text("password").notNull(), // Stored encrypted, returned decrypted
  isActive: boolean("is_active").notNull().default(true),
  scanFrequency: integer("scan_frequency").notNull().default(15), // minutes
  retentionDays: integer("retention_days").notNull().default(90), // Email retention period in days (default 3 months)
  // Connection status tracking for detecting authentication issues
  lastSyncStatus: varchar("last_sync_status").default('never'), // 'success' | 'error' | 'pending' | 'never'
  lastSuccessAt: timestamp("last_success_at"),
  lastErrorMessage: text("last_error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

// Tags for intelligent classification
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  color: varchar("color").notNull(), // hex color
  category: varchar("category").notNull(), // devis, facture, rdv, client, fournisseur, etc.
  isSystem: boolean("is_system").notNull().default(false), // system tags cannot be deleted
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

// Email Categories table - Company-specific custom categories for email classification
export const emailCategories = pgTable("email_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  key: varchar("key").notNull(), // Unique identifier per company: devis, facture, rdv, autre, custom-1, etc.
  label: varchar("label").notNull(), // Display name: Devis, Factures, Rendez-vous, etc.
  color: varchar("color").notNull().default("#6366f1"), // Hex color for UI
  icon: varchar("icon").notNull().default("Mail"), // Lucide icon name
  isSystem: boolean("is_system").notNull().default(false), // System categories cannot be deleted
  generateAutoResponse: boolean("generate_auto_response").notNull().default(true), // Whether to generate AI auto-response
  autoCreateTask: boolean("auto_create_task").notNull().default(false), // Whether to automatically create tasks from emails in this category
  autoMarkAsProcessed: boolean("auto_mark_as_processed").notNull().default(false), // Whether to automatically mark emails as processed (traité) when scanned
  redirectEmails: text("redirect_emails").array().default(sql`'{}'`), // Email addresses to forward attachments to
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueKeyPerCompany: unique("unique_category_key_per_company").on(table.companyId, table.key)
}));

export const insertEmailCategorySchema = createInsertSchema(emailCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailCategory = z.infer<typeof insertEmailCategorySchema>;
export type EmailCategory = typeof emailCategories.$inferSelect;

// Email Account Categories junction table - Associates categories with email accounts
export const emailAccountCategories = pgTable("email_account_categories", {
  emailAccountId: varchar("email_account_id").notNull().references(() => emailAccounts.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => emailCategories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: { columns: [table.emailAccountId, table.categoryId] }
}));

export const insertEmailAccountCategorySchema = createInsertSchema(emailAccountCategories).omit({
  createdAt: true,
});

export type InsertEmailAccountCategory = z.infer<typeof insertEmailAccountCategorySchema>;
export type EmailAccountCategory = typeof emailAccountCategories.$inferSelect;

// Emails table
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Owner of this email
  emailAccountId: varchar("email_account_id").notNull().references(() => emailAccounts.id, { onDelete: "cascade" }),
  messageId: varchar("message_id").notNull(), // Original email message ID
  subject: text("subject"),
  from: text("from").notNull(),
  to: text("to").notNull(),
  cc: text("cc"),
  body: text("body"),
  htmlBody: text("html_body"),
  receivedAt: timestamp("received_at").notNull(),
  // AI Analysis results
  aiAnalysis: jsonb("ai_analysis"), // { type, extractedData, suggestedTags, priority, sentiment }
  emailType: varchar("email_type"), // devis, facture, rdv, general
  priority: varchar("priority").default("normal"), // urgent, high, normal, low
  sentiment: varchar("sentiment"), // positive, neutral, negative
  suggestedResponse: text("suggested_response"), // AI-generated response suggestion
  // Assignment and status
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  status: varchar("status").notNull().default("nouveau"), // nouveau, en_cours, traite, archive
  hasAttachments: boolean("has_attachments").notNull().default(false),
  isRead: boolean("is_read").notNull().default(false),
  requiresResponse: boolean("requires_response").notNull().default(false),
  responseDeadline: timestamp("response_deadline"),
  // Response tracking
  sentResponse: text("sent_response"), // Final response that was sent
  respondedAt: timestamp("responded_at"), // When the response was sent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

// Email Replies table - Stores all sent email replies for conversation history
export const emailReplies = pgTable("email_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").notNull().references(() => emails.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  sentByUserId: varchar("sent_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  htmlContent: text("html_content").notNull(), // HTML formatted reply content
  plainTextContent: text("plain_text_content"), // Optional plain text version
  attachments: jsonb("attachments").default(sql`'[]'`), // [{id, name, mimeType, size, url, storageKey}]
  aiGenerated: boolean("ai_generated").notNull().default(false), // Whether this was AI-generated
  source: varchar("source").notNull().default("manual"), // 'manual' or 'ai'
  replyMessageId: varchar("reply_message_id"), // SMTP Message-ID for correlation
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_replies_email_id_sent_at").on(table.emailId, table.sentAt),
  index("idx_email_replies_company_user").on(table.companyId, table.sentByUserId, table.sentAt),
]);

export const insertEmailReplySchema = createInsertSchema(emailReplies).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailReply = z.infer<typeof insertEmailReplySchema>;
export type EmailReply = typeof emailReplies.$inferSelect;

// Email tags junction table
export const emailTags = pgTable("email_tags", {
  emailId: varchar("email_id").notNull().references(() => emails.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: { columns: [table.emailId, table.tagId] }
}));

// Documents (attachments)
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").references(() => emails.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalFilename: varchar("original_filename").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(), // bytes
  storageProvider: varchar("storage_provider").notNull(), // google_drive, local
  storagePath: text("storage_path").notNull(), // path or file ID
  driveFileId: varchar("drive_file_id"), // Google Drive file ID if applicable
  driveUrl: text("drive_url"), // Google Drive web view link
  documentType: varchar("document_type"), // facture, devis, contrat, autre
  // Extracted data from document
  extractedData: jsonb("extracted_data"), // { amount, date, supplier, etc. }
  // OCR extracted text
  ocrText: text("ocr_text"), // Text extracted by OCR from images/PDFs
  ocrProcessed: boolean("ocr_processed").notNull().default(false), // Whether OCR has been run
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Document tags junction table
export const documentTags = pgTable("document_tags", {
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: { columns: [table.documentId, table.tagId] }
}));

// Appointments (RDV)
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  emailId: varchar("email_id").references(() => emails.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  attendees: jsonb("attendees"), // array of email addresses
  status: varchar("status").notNull().default("planifie"), // planifie, confirme, annule, termine
  // AI suggestions
  aiSuggestions: jsonb("ai_suggestions"), // { prepTasks, documents, notes }
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Appointment tags junction table
export const appointmentTags = pgTable("appointment_tags", {
  appointmentId: varchar("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: { columns: [table.appointmentId, table.tagId] }
}));

// Tasks (Tâches à réaliser)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  emailId: varchar("email_id").references(() => emails.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => emailCategories.id),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("nouveau"), // nouveau, en_cours, termine
  priority: varchar("priority").notNull().default("moyenne"), // urgent, haute, moyenne, basse
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Alerts
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // devis_sans_reponse, facture_impayee, email_non_traite, rdv_a_venir
  severity: varchar("severity").notNull().default("info"), // critical, warning, info
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedEntityType: varchar("related_entity_type"), // email, document, appointment
  relatedEntityId: varchar("related_entity_id"), // Deprecated - use alertEmails junction table for multiple emails
  ruleId: varchar("rule_id").references(() => alertRules.id, { onDelete: "cascade" }), // Rule that generated this alert
  emailCount: integer("email_count").notNull().default(0), // Number of emails related to this alert
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedById: varchar("resolved_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// Alert Emails junction table - Links multiple emails to a single alert
export const alertEmails = pgTable("alert_emails", {
  alertId: varchar("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  emailId: varchar("email_id").notNull().references(() => emails.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: { columns: [table.alertId, table.emailId] }
}));

// Configuration settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  key: varchar("key").notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueKeyPerCompany: unique("unique_setting_key_per_company").on(table.companyId, table.key)
}));

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Cloud Storage Configurations (per-user credentials)
export const cloudStorageConfigs = pgTable("cloud_storage_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull(), // 'google_drive' or 'onedrive'
  // Credentials stored as JSON (encrypted at application layer)
  // For Google Drive: { clientId, clientSecret, refreshToken }
  // For OneDrive: { clientId, clientSecret, tenantId, refreshToken }
  credentials: jsonb("credentials").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_provider").on(table.userId, table.provider),
]);

export const insertCloudStorageConfigSchema = createInsertSchema(cloudStorageConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCloudStorageConfig = z.infer<typeof insertCloudStorageConfigSchema>;
export type CloudStorageConfig = typeof cloudStorageConfigs.$inferSelect;

// Email responses/drafts
export const emailResponses = pgTable("email_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").notNull().references(() => emails.id, { onDelete: "cascade" }),
  generatedBy: varchar("generated_by").notNull().default("ai"), // ai, user
  subject: text("subject"),
  body: text("body").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  approvedById: varchar("approved_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailResponseSchema = createInsertSchema(emailResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailResponse = z.infer<typeof insertEmailResponseSchema>;
export type EmailResponse = typeof emailResponses.$inferSelect;

// Reminders (relances automatiques)
export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").notNull().references(() => emails.id, { onDelete: "cascade" }),
  reminderType: varchar("reminder_type").notNull(), // devis_sans_reponse, facture_impayee
  reminderNumber: integer("reminder_number").notNull().default(1), // 1st, 2nd, 3rd reminder
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  sentToEmail: text("sent_to_email").notNull(),
  responseReceived: boolean("response_received").notNull().default(false),
  responseReceivedAt: timestamp("response_received_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

// Alert Rules (règles d'alertes personnalisées via IA)
export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Nom de la règle (ex: "Factures non traitées 24h")
  prompt: text("prompt").notNull(), // Prompt en langage naturel saisi par l'admin
  ruleData: jsonb("rule_data").notNull(), // Règle structurée générée par l'IA
  isActive: boolean("is_active").notNull().default(true),
  severity: varchar("severity").notNull().default("warning"), // critical, warning, info
  checkIntervalMinutes: integer("check_interval_minutes").notNull().default(60), // Intervalle de vérification en minutes
  lastCheckedAt: timestamp("last_checked_at"), // Dernière vérification de cette règle
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertRule = typeof alertRules.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  emailAccounts: many(emailAccounts),
  assignedEmails: many(emails),
  createdAppointments: many(appointments),
  resolvedAlerts: many(alerts),
  createdAlertRules: many(alertRules),
}));

export const emailAccountsRelations = relations(emailAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [emailAccounts.userId],
    references: [users.id],
  }),
  emails: many(emails),
}));

export const emailsRelations = relations(emails, ({ one, many }) => ({
  emailAccount: one(emailAccounts, {
    fields: [emails.emailAccountId],
    references: [emailAccounts.id],
  }),
  assignedTo: one(users, {
    fields: [emails.assignedToId],
    references: [users.id],
  }),
  emailTags: many(emailTags),
  documents: many(documents),
  appointments: many(appointments),
  responses: many(emailResponses),
  reminders: many(reminders),
}));

export const emailTagsRelations = relations(emailTags, ({ one }) => ({
  email: one(emails, {
    fields: [emailTags.emailId],
    references: [emails.id],
  }),
  tag: one(tags, {
    fields: [emailTags.tagId],
    references: [tags.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  emailTags: many(emailTags),
  documentTags: many(documentTags),
  appointmentTags: many(appointmentTags),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  email: one(emails, {
    fields: [documents.emailId],
    references: [emails.id],
  }),
  documentTags: many(documentTags),
}));

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentTags.documentId],
    references: [documents.id],
  }),
  tag: one(tags, {
    fields: [documentTags.tagId],
    references: [tags.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  email: one(emails, {
    fields: [appointments.emailId],
    references: [emails.id],
  }),
  createdBy: one(users, {
    fields: [appointments.createdById],
    references: [users.id],
  }),
  appointmentTags: many(appointmentTags),
}));

export const appointmentTagsRelations = relations(appointmentTags, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentTags.appointmentId],
    references: [appointments.id],
  }),
  tag: one(tags, {
    fields: [appointmentTags.tagId],
    references: [tags.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  resolvedBy: one(users, {
    fields: [alerts.resolvedById],
    references: [users.id],
  }),
  rule: one(alertRules, {
    fields: [alerts.ruleId],
    references: [alertRules.id],
  }),
  alertEmails: many(alertEmails),
}));

export const emailResponsesRelations = relations(emailResponses, ({ one }) => ({
  email: one(emails, {
    fields: [emailResponses.emailId],
    references: [emails.id],
  }),
  approvedBy: one(users, {
    fields: [emailResponses.approvedById],
    references: [users.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  email: one(emails, {
    fields: [reminders.emailId],
    references: [emails.id],
  }),
}));

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [alertRules.createdById],
    references: [users.id],
  }),
  alerts: many(alerts),
}));

export const alertEmailsRelations = relations(alertEmails, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertEmails.alertId],
    references: [alerts.id],
  }),
  email: one(emails, {
    fields: [alertEmails.emailId],
    references: [emails.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  email: one(emails, {
    fields: [tasks.emailId],
    references: [emails.id],
  }),
  category: one(emailCategories, {
    fields: [tasks.categoryId],
    references: [emailCategories.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
  }),
}));

// User Dashboard Layout Preferences
export const userDashboardLayout = pgTable("user_dashboard_layout", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  // Array of component IDs in the order they should be displayed
  // Example: ["categories", "chart-email-evolution", "chart-email-distribution", ...]
  layout: jsonb("layout").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserDashboardLayoutSchema = createInsertSchema(userDashboardLayout).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserDashboardLayout = z.infer<typeof insertUserDashboardLayoutSchema>;
export type UserDashboardLayout = typeof userDashboardLayout.$inferSelect;

export const userDashboardLayoutRelations = relations(userDashboardLayout, ({ one }) => ({
  user: one(users, {
    fields: [userDashboardLayout.userId],
    references: [users.id],
  }),
}));

// Invoices table - Subscription billing history
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // in cents, e.g., 1900 for €19.00
  currency: varchar("currency").notNull().default("eur"),
  plan: varchar("plan").notNull(), // starter, professional, enterprise
  description: varchar("description"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  invoiceNumber: varchar("invoice_number"), // For human-readable reference
  pdfUrl: varchar("pdf_url"), // URL to download the PDF
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const invoicesRelations = relations(invoices, ({ one }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
}));

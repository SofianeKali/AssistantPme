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

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("simple"), // admin, simple
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull(), // gmail, outlook
  email: varchar("email").notNull(),
  imapHost: varchar("imap_host").notNull(),
  imapPort: integer("imap_port").notNull(),
  smtpHost: varchar("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  // TODO SECURITY: Password stored in plaintext for MVP - MUST implement encryption at rest
  // or external secret management (Replit Secrets, AWS Secrets Manager) before production
  username: varchar("username").notNull(),
  password: text("password").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  scanFrequency: integer("scan_frequency").notNull().default(15), // minutes
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

// Emails table
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Alerts
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // devis_sans_reponse, facture_impayee, email_non_traite, rdv_a_venir
  severity: varchar("severity").notNull().default("info"), // critical, warning, info
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedEntityType: varchar("related_entity_type"), // email, document, appointment
  relatedEntityId: varchar("related_entity_id"),
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

// Configuration settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  emailAccounts: many(emailAccounts),
  assignedEmails: many(emails),
  createdAppointments: many(appointments),
  resolvedAlerts: many(alerts),
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

export const alertsRelations = relations(alerts, ({ one }) => ({
  resolvedBy: one(users, {
    fields: [alerts.resolvedById],
    references: [users.id],
  }),
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

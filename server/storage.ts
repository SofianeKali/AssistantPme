import {
  users,
  emailAccounts,
  emails,
  documents,
  appointments,
  alerts,
  tags,
  settings,
  emailResponses,
  emailTags,
  documentTags,
  appointmentTags,
  type User,
  type UpsertUser,
  type EmailAccount,
  type InsertEmailAccount,
  type Email,
  type InsertEmail,
  type Document,
  type InsertDocument,
  type Appointment,
  type InsertAppointment,
  type Alert,
  type InsertAlert,
  type Tag,
  type InsertTag,
  type Setting,
  type InsertSetting,
  type EmailResponse,
  type InsertEmailResponse,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, like, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Email accounts
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  getEmailAccounts(userId?: string): Promise<EmailAccount[]>;
  getAllEmailAccounts(): Promise<EmailAccount[]>;
  deleteEmailAccount(id: string): Promise<void>;
  
  // Emails
  createEmail(email: InsertEmail): Promise<Email>;
  getEmails(filters?: { type?: string; search?: string; limit?: number }): Promise<Email[]>;
  getEmailById(id: string): Promise<Email | undefined>;
  getEmailByMessageId(messageId: string): Promise<Email | undefined>;
  updateEmail(id: string, data: Partial<Email>): Promise<Email>;
  
  // Documents
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocuments(filters?: { type?: string; search?: string }): Promise<Document[]>;
  
  // Appointments
  createAppointment(apt: InsertAppointment): Promise<Appointment>;
  getAppointments(filters?: { start?: string; end?: string }): Promise<Appointment[]>;
  
  // Alerts
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlerts(filters?: { resolved?: boolean; limit?: number }): Promise<Alert[]>;
  resolveAlert(id: string, userId: string): Promise<Alert>;
  
  // Tags
  createTag(tag: InsertTag): Promise<Tag>;
  getAllTags(): Promise<Tag[]>;
  deleteTag(id: string): Promise<void>;
  addEmailTag(emailId: string, tagId: string): Promise<void>;
  addDocumentTag(documentId: string, tagId: string): Promise<void>;
  addAppointmentTag(appointmentId: string, tagId: string): Promise<void>;
  
  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;
  getAllSettings(): Promise<Record<string, any>>;
  
  // Email responses
  createEmailResponse(response: InsertEmailResponse): Promise<EmailResponse>;
  getEmailResponses(emailId: string): Promise<EmailResponse[]>;
  getEmailResponseById(id: string): Promise<EmailResponse | undefined>;
  updateEmailResponse(id: string, data: Partial<EmailResponse>): Promise<EmailResponse>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Email accounts
  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [result] = await db.insert(emailAccounts).values(account).returning();
    return result;
  }

  async getEmailAccounts(userId?: string): Promise<EmailAccount[]> {
    if (userId) {
      return await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId));
    }
    return await db.select().from(emailAccounts);
  }

  async getAllEmailAccounts(): Promise<EmailAccount[]> {
    return await db.select().from(emailAccounts);
  }

  async deleteEmailAccount(id: string): Promise<void> {
    await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
  }

  // Emails
  async createEmail(email: InsertEmail): Promise<Email> {
    const [result] = await db.insert(emails).values(email).returning();
    return result;
  }

  async getEmails(filters?: { type?: string; search?: string; limit?: number }): Promise<Email[]> {
    let query = db.select().from(emails);
    
    const conditions = [];
    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(emails.emailType, filters.type));
    }
    if (filters?.search) {
      conditions.push(
        or(
          like(emails.subject, `%${filters.search}%`),
          like(emails.body, `%${filters.search}%`),
          like(emails.from, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(emails.receivedAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async getEmailById(id: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email;
  }

  async getEmailByMessageId(messageId: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.messageId, messageId));
    return email;
  }

  async updateEmail(id: string, data: Partial<Email>): Promise<Email> {
    const [updated] = await db
      .update(emails)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emails.id, id))
      .returning();
    return updated;
  }

  // Documents
  async createDocument(doc: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(doc).returning();
    return result;
  }

  async getDocuments(filters?: { type?: string; search?: string }): Promise<Document[]> {
    let query = db.select().from(documents);
    
    const conditions = [];
    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(documents.documentType, filters.type));
    }
    if (filters?.search) {
      conditions.push(like(documents.filename, `%${filters.search}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(documents.createdAt)) as any;
    
    return await query;
  }

  // Appointments
  async createAppointment(apt: InsertAppointment): Promise<Appointment> {
    const [result] = await db.insert(appointments).values(apt).returning();
    return result;
  }

  async getAppointments(filters?: { start?: string; end?: string }): Promise<Appointment[]> {
    let query = db.select().from(appointments);
    
    const conditions = [];
    if (filters?.start) {
      conditions.push(gte(appointments.startTime, new Date(filters.start)));
    }
    if (filters?.end) {
      conditions.push(lte(appointments.startTime, new Date(filters.end)));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(appointments.startTime) as any;
    
    return await query;
  }

  // Alerts
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [result] = await db.insert(alerts).values(alert).returning();
    return result;
  }

  async getAlerts(filters?: { resolved?: boolean; limit?: number }): Promise<Alert[]> {
    let query = db.select().from(alerts);
    
    if (filters?.resolved !== undefined) {
      query = query.where(eq(alerts.isResolved, filters.resolved)) as any;
    }
    
    query = query.orderBy(desc(alerts.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async resolveAlert(id: string, userId: string): Promise<Alert> {
    const [updated] = await db
      .update(alerts)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolvedById: userId,
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  // Tags
  async createTag(tag: InsertTag): Promise<Tag> {
    const [result] = await db.insert(tags).values(tag).returning();
    return result;
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async deleteTag(id: string): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }

  async addEmailTag(emailId: string, tagId: string): Promise<void> {
    await db.insert(emailTags).values({ emailId, tagId });
  }

  async addDocumentTag(documentId: string, tagId: string): Promise<void> {
    await db.insert(documentTags).values({ documentId, tagId });
  }

  async addAppointmentTag(appointmentId: string, tagId: string): Promise<void> {
    await db.insert(appointmentTags).values({ appointmentId, tagId });
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async upsertSetting(setting: InsertSetting): Promise<Setting> {
    const [result] = await db
      .insert(settings)
      .values(setting)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const allSettings = await db.select().from(settings);
    return allSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }

  // Email responses
  async createEmailResponse(response: InsertEmailResponse): Promise<EmailResponse> {
    const [result] = await db.insert(emailResponses).values(response).returning();
    return result;
  }

  async getEmailResponses(emailId: string): Promise<EmailResponse[]> {
    return await db.select().from(emailResponses).where(eq(emailResponses.emailId, emailId));
  }

  async getEmailResponseById(id: string): Promise<EmailResponse | undefined> {
    const [response] = await db.select().from(emailResponses).where(eq(emailResponses.id, id));
    return response;
  }

  async updateEmailResponse(id: string, data: Partial<EmailResponse>): Promise<EmailResponse> {
    const [updated] = await db
      .update(emailResponses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailResponses.id, id))
      .returning();
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Count quotes without response (emails with type 'devis' and no response)
    const [quotesNoResponse] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          eq(emails.emailType, 'devis'),
          eq(emails.status, 'nouveau')
        )
      );
    
    // Count unpaid invoices
    const [unpaidInvoices] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          eq(emails.emailType, 'facture'),
          eq(emails.status, 'nouveau')
        )
      );
    
    // Count appointments today
    const [appointmentsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          gte(appointments.startTime, startOfDay),
          lte(appointments.startTime, new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
        )
      );
    
    // Count unprocessed emails
    const [unprocessedEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(eq(emails.status, 'nouveau'));
    
    // Monthly stats
    const [monthlyEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(gte(emails.receivedAt, startOfMonth));
    
    const [monthlyAppointments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(gte(appointments.createdAt, startOfMonth));
    
    const [monthlyDocuments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(gte(documents.createdAt, startOfMonth));
    
    const [activeAlerts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(eq(alerts.isResolved, false));
    
    return {
      quotesNoResponse: Number(quotesNoResponse?.count || 0),
      unpaidInvoices: Number(unpaidInvoices?.count || 0),
      appointmentsToday: Number(appointmentsToday?.count || 0),
      unprocessedEmails: Number(unprocessedEmails?.count || 0),
      monthlyEmailsProcessed: Number(monthlyEmails?.count || 0),
      monthlyAppointments: Number(monthlyAppointments?.count || 0),
      monthlyDocuments: Number(monthlyDocuments?.count || 0),
      activeAlerts: Number(activeAlerts?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();

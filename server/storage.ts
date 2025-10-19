import {
  users,
  emailAccounts,
  emails,
  documents,
  appointments,
  alerts,
  alertRules,
  tags,
  settings,
  emailResponses,
  reminders,
  emailTags,
  documentTags,
  appointmentTags,
  emailCategories,
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
  type AlertRule,
  type InsertAlertRule,
  type Tag,
  type InsertTag,
  type Setting,
  type InsertSetting,
  type EmailResponse,
  type InsertEmailResponse,
  type Reminder,
  type InsertReminder,
  type EmailCategory,
  type InsertEmailCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, like, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  
  // Email accounts
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  getEmailAccounts(userId?: string): Promise<EmailAccount[]>;
  getEmailAccountById(id: string): Promise<EmailAccount | undefined>;
  getAllEmailAccounts(): Promise<EmailAccount[]>;
  deleteEmailAccount(id: string): Promise<void>;
  
  // Emails
  createEmail(email: InsertEmail): Promise<Email>;
  getEmails(userId: string, filters?: { type?: string; status?: string; search?: string; limit?: number }): Promise<Email[]>;
  getAllEmails(filters?: { type?: string; status?: string; priority?: string; search?: string; olderThanHours?: number; limit?: number }): Promise<Email[]>; // For backend services
  getEmailById(id: string, userId: string): Promise<Email | undefined>;
  getEmailByMessageId(messageId: string): Promise<Email | undefined>;
  updateEmail(id: string, userId: string, data: Partial<Email>): Promise<Email>;
  
  // Documents
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocuments(filters?: { type?: string; search?: string }): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  updateDocument(id: string, data: Partial<Document>): Promise<Document>;
  
  // Appointments
  createAppointment(apt: InsertAppointment): Promise<Appointment>;
  getAppointments(filters?: { start?: string; end?: string }): Promise<Appointment[]>;
  
  // Alerts
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlerts(filters?: { resolved?: boolean; type?: string; relatedEntityType?: string; relatedEntityId?: string; limit?: number }): Promise<Alert[]>;
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
  
  // Reminders (relances)
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getReminders(emailId?: string): Promise<Reminder[]>;
  getReminderById(id: string): Promise<Reminder | undefined>;
  updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder>;
  
  // Alert rules (règles d'alertes personnalisées)
  createAlertRule(rule: InsertAlertRule): Promise<AlertRule>;
  getAlertRules(filters?: { isActive?: boolean }): Promise<AlertRule[]>;
  getAlertRuleById(id: string): Promise<AlertRule | undefined>;
  updateAlertRule(id: string, data: Partial<AlertRule>): Promise<AlertRule>;
  deleteAlertRule(id: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
  getAdvancedKPIs(): Promise<any>;
  getEmailStatsByCategory(userId: string): Promise<Record<string, number>>;
  
  // Email categories
  createEmailCategory(category: InsertEmailCategory): Promise<EmailCategory>;
  getAllEmailCategories(): Promise<EmailCategory[]>;
  getEmailCategoriesForAccount(emailAccountId: string): Promise<EmailCategory[]>;
  getEmailCategoryByKey(key: string, emailAccountId?: string | null): Promise<EmailCategory | undefined>;
  updateEmailCategory(id: string, data: Partial<EmailCategory>): Promise<EmailCategory>;
  deleteEmailCategory(id: string): Promise<void>;
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

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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

  async getEmailAccountById(id: string): Promise<EmailAccount | undefined> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    return account;
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

  async getEmails(userId: string, filters?: { type?: string; status?: string; search?: string; limit?: number }): Promise<Email[]> {
    let query = db.select().from(emails);
    
    const conditions = [eq(emails.userId, userId)];
    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(emails.emailType, filters.type));
    }
    if (filters?.status && filters.status !== 'all') {
      // Handle grouped statuses
      if (filters.status === 'non_traite') {
        conditions.push(or(
          eq(emails.status, 'nouveau'),
          eq(emails.status, 'en_cours')
        )!);
      } else if (filters.status === 'traite') {
        conditions.push(or(
          eq(emails.status, 'traite'),
          eq(emails.status, 'archive')
        )!);
      } else {
        // Individual status filter
        conditions.push(eq(emails.status, filters.status));
      }
    }
    if (filters?.search) {
      conditions.push(
        or(
          like(emails.subject, `%${filters.search}%`),
          like(emails.body, `%${filters.search}%`),
          like(emails.from, `%${filters.search}%`)
        )!
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

  async getAllEmails(filters?: { type?: string; status?: string; priority?: string; search?: string; olderThanHours?: number; limit?: number }): Promise<Email[]> {
    let query = db.select().from(emails);
    
    const conditions = [];
    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(emails.emailType, filters.type));
    }
    if (filters?.status && filters.status !== 'all') {
      // Handle grouped statuses
      if (filters.status === 'non_traite') {
        conditions.push(or(
          eq(emails.status, 'nouveau'),
          eq(emails.status, 'en_cours')
        )!);
      } else if (filters.status === 'traite') {
        conditions.push(or(
          eq(emails.status, 'traite'),
          eq(emails.status, 'archive')
        )!);
      } else {
        // Individual status filter
        conditions.push(eq(emails.status, filters.status));
      }
    }
    if (filters?.priority) {
      conditions.push(eq(emails.priority, filters.priority));
    }
    if (filters?.olderThanHours !== undefined) {
      const ageThreshold = new Date(Date.now() - filters.olderThanHours * 60 * 60 * 1000);
      conditions.push(lte(emails.receivedAt, ageThreshold));
    }
    if (filters?.search) {
      conditions.push(
        or(
          like(emails.subject, `%${filters.search}%`),
          like(emails.body, `%${filters.search}%`),
          like(emails.from, `%${filters.search}%`)
        )!
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

  async getEmailById(id: string, userId: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(and(eq(emails.id, id), eq(emails.userId, userId)));
    return email;
  }

  async getEmailByMessageId(messageId: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.messageId, messageId));
    return email;
  }

  async updateEmail(id: string, userId: string, data: Partial<Email>): Promise<Email> {
    const [updated] = await db
      .update(emails)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(emails.id, id), eq(emails.userId, userId)))
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
      conditions.push(
        or(
          like(documents.filename, `%${filters.search}%`),
          like(documents.ocrText, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(documents.createdAt)) as any;
    
    return await query;
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const [result] = await db.select().from(documents).where(eq(documents.id, id));
    return result;
  }

  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    const [result] = await db
      .update(documents)
      .set(data)
      .where(eq(documents.id, id))
      .returning();
    return result;
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

  async getAlerts(filters?: { resolved?: boolean; type?: string; relatedEntityType?: string; relatedEntityId?: string; limit?: number }): Promise<Alert[]> {
    let query = db.select().from(alerts);
    
    const conditions = [];
    if (filters?.resolved !== undefined) {
      conditions.push(eq(alerts.isResolved, filters.resolved));
    }
    if (filters?.type) {
      conditions.push(eq(alerts.type, filters.type));
    }
    if (filters?.relatedEntityType) {
      conditions.push(eq(alerts.relatedEntityType, filters.relatedEntityType));
    }
    if (filters?.relatedEntityId) {
      conditions.push(eq(alerts.relatedEntityId, filters.relatedEntityId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
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

  // Reminders (relances)
  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [result] = await db.insert(reminders).values(reminder).returning();
    return result;
  }

  async getReminders(emailId?: string): Promise<Reminder[]> {
    if (emailId) {
      return await db
        .select()
        .from(reminders)
        .where(eq(reminders.emailId, emailId))
        .orderBy(desc(reminders.createdAt));
    }
    return await db.select().from(reminders).orderBy(desc(reminders.createdAt));
  }

  async getReminderById(id: string): Promise<Reminder | undefined> {
    const [result] = await db.select().from(reminders).where(eq(reminders.id, id));
    return result;
  }

  async updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder> {
    const [result] = await db
      .update(reminders)
      .set(data)
      .where(eq(reminders.id, id))
      .returning();
    return result;
  }

  // Alert rules
  async createAlertRule(rule: InsertAlertRule): Promise<AlertRule> {
    const [result] = await db.insert(alertRules).values(rule).returning();
    return result;
  }

  async getAlertRules(filters?: { isActive?: boolean }): Promise<AlertRule[]> {
    let query = db.select().from(alertRules);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(alertRules.isActive, filters.isActive)) as any;
    }
    
    query = query.orderBy(desc(alertRules.createdAt)) as any;
    
    return await query;
  }

  async getAlertRuleById(id: string): Promise<AlertRule | undefined> {
    const [rule] = await db.select().from(alertRules).where(eq(alertRules.id, id));
    return rule;
  }

  async updateAlertRule(id: string, data: Partial<AlertRule>): Promise<AlertRule> {
    const [result] = await db
      .update(alertRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(alertRules.id, id))
      .returning();
    return result;
  }

  async deleteAlertRule(id: string): Promise<void> {
    await db.delete(alertRules).where(eq(alertRules.id, id));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Count quotes without response (emails with type 'devis' and status 'nouveau')
    const [quotesNoResponse] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          eq(emails.emailType, 'devis'),
          eq(emails.status, 'nouveau')
        )
      );
    
    // Count unpaid invoices (emails with type 'facture' and status 'nouveau')
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
          lte(appointments.startTime, endOfDay)
        )
      );
    
    // Count unprocessed emails (status 'nouveau')
    const [unprocessedEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(eq(emails.status, 'nouveau'));
    
    // Count active alerts (not resolved)
    const [activeAlerts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(eq(alerts.isResolved, false));
    
    // Monthly stats
    const [monthlyEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(gte(emails.receivedAt, startOfMonth));
    
    const [monthlyEmailsProcessed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          gte(emails.receivedAt, startOfMonth),
          or(
            eq(emails.status, 'traite'),
            eq(emails.status, 'archive')
          )
        )
      );
    
    const [monthlyAppointments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(gte(appointments.createdAt, startOfMonth));
    
    const [monthlyDocuments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(gte(documents.createdAt, startOfMonth));
    
    // Weekly stats
    const [weeklyEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(gte(emails.receivedAt, startOfWeek));
    
    // Email type breakdown (this month)
    const emailTypeBreakdown = await db
      .select({
        type: emails.emailType,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(gte(emails.receivedAt, startOfMonth))
      .groupBy(emails.emailType);
    
    // Priority breakdown (unprocessed emails)
    const priorityBreakdown = await db
      .select({
        priority: emails.priority,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(eq(emails.status, 'nouveau'))
      .groupBy(emails.priority);
    
    // Processing rate calculation
    const totalMonthlyEmails = Number(monthlyEmails?.count || 0);
    const processedMonthlyEmails = Number(monthlyEmailsProcessed?.count || 0);
    const processingRate = totalMonthlyEmails > 0 
      ? Math.round((processedMonthlyEmails / totalMonthlyEmails) * 100) 
      : 0;
    
    return {
      // Critical metrics
      quotesNoResponse: Number(quotesNoResponse?.count || 0),
      unpaidInvoices: Number(unpaidInvoices?.count || 0),
      appointmentsToday: Number(appointmentsToday?.count || 0),
      unprocessedEmails: Number(unprocessedEmails?.count || 0),
      activeAlerts: Number(activeAlerts?.count || 0),
      
      // Monthly metrics
      monthlyEmailsReceived: totalMonthlyEmails,
      monthlyEmailsProcessed: processedMonthlyEmails,
      monthlyAppointments: Number(monthlyAppointments?.count || 0),
      monthlyDocuments: Number(monthlyDocuments?.count || 0),
      
      // Weekly metrics
      weeklyEmails: Number(weeklyEmails?.count || 0),
      
      // Performance metrics
      processingRate: processingRate,
      
      // Breakdowns
      emailTypeBreakdown: emailTypeBreakdown.map(item => ({
        type: item.type || 'general',
        count: Number(item.count),
      })),
      priorityBreakdown: priorityBreakdown.map(item => ({
        priority: item.priority || 'normal',
        count: Number(item.count),
      })),
    };
  }

  // Advanced KPIs
  async getAdvancedKPIs(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // 1. RESPONSE RATE - Percentage of emails that received a response
    const [totalEmailsRequiringResponse] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(eq(emails.requiresResponse, true));
    
    const totalRequiringResponse = Number(totalEmailsRequiringResponse?.count || 0);
    
    // Count emails that REQUIRE response AND have at least one response (approved or sent)
    // Use COUNT DISTINCT with subquery to ensure accurate count (no duplicates)
    const [emailsWithResponses] = await db
      .select({ 
        count: sql<number>`count(DISTINCT ${emails.id})` 
      })
      .from(emails)
      .innerJoin(emailResponses, eq(emails.id, emailResponses.emailId))
      .where(
        and(
          eq(emails.requiresResponse, true),
          or(
            eq(emailResponses.isApproved, true),
            eq(emailResponses.isSent, true)
          )
        )
      );
    
    const emailsWithResponseCount = Number(emailsWithResponses?.count || 0);
    const responseRate = totalRequiringResponse > 0 
      ? Math.round((emailsWithResponseCount / totalRequiringResponse) * 100) 
      : 0;
    
    // 2. AVERAGE PROCESSING TIME - Average time from received to processed (in hours)
    const processedEmails = await db
      .select({
        receivedAt: emails.receivedAt,
        updatedAt: emails.updatedAt,
      })
      .from(emails)
      .where(
        or(
          eq(emails.status, 'traite'),
          eq(emails.status, 'archive')
        )
      );
    
    let totalProcessingTime = 0;
    let processedCount = 0;
    
    for (const email of processedEmails) {
      if (email.updatedAt) {
        const processingTime = (email.updatedAt.getTime() - email.receivedAt.getTime()) / (1000 * 60 * 60); // hours
        if (processingTime >= 0 && processingTime < 720) { // Exclude outliers (30 days max)
          totalProcessingTime += processingTime;
          processedCount++;
        }
      }
    }
    
    const avgProcessingTimeHours = processedCount > 0 
      ? Math.round(totalProcessingTime / processedCount) 
      : 0;
    
    // 3. EXPECTED REVENUE - Sum of amounts from quotes (devis)
    const allQuotes = await db
      .select({ aiAnalysis: emails.aiAnalysis })
      .from(emails)
      .where(eq(emails.emailType, 'devis'));
    
    let expectedRevenue = 0;
    let quotesWithAmount = 0;
    
    for (const quote of allQuotes) {
      const analysis = quote.aiAnalysis as any;
      const amount = analysis?.extractedData?.amount;
      if (amount && typeof amount === 'number' && amount > 0) {
        expectedRevenue += amount;
        quotesWithAmount++;
      }
    }
    
    // 4. MONTHLY EVOLUTION - Compare current month vs last month
    
    // Current month
    const [currentMonthEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(gte(emails.receivedAt, startOfMonth));
    
    const [currentMonthProcessed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          gte(emails.receivedAt, startOfMonth),
          or(
            eq(emails.status, 'traite'),
            eq(emails.status, 'archive')
          )
        )
      );
    
    const [currentMonthAppointments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(gte(appointments.createdAt, startOfMonth));
    
    // Last month
    const [lastMonthEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          gte(emails.receivedAt, startOfLastMonth),
          lte(emails.receivedAt, endOfLastMonth)
        )
      );
    
    const [lastMonthProcessed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          gte(emails.receivedAt, startOfLastMonth),
          lte(emails.receivedAt, endOfLastMonth),
          or(
            eq(emails.status, 'traite'),
            eq(emails.status, 'archive')
          )
        )
      );
    
    const [lastMonthAppointments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          gte(appointments.createdAt, startOfLastMonth),
          lte(appointments.createdAt, endOfLastMonth)
        )
      );
    
    const currentEmails = Number(currentMonthEmails?.count || 0);
    const lastEmails = Number(lastMonthEmails?.count || 0);
    const emailEvolution = lastEmails > 0 
      ? Math.round(((currentEmails - lastEmails) / lastEmails) * 100) 
      : 0;
    
    const currentProcessed = Number(currentMonthProcessed?.count || 0);
    const lastProcessed = Number(lastMonthProcessed?.count || 0);
    const processedEvolution = lastProcessed > 0 
      ? Math.round(((currentProcessed - lastProcessed) / lastProcessed) * 100) 
      : 0;
    
    const currentApts = Number(currentMonthAppointments?.count || 0);
    const lastApts = Number(lastMonthAppointments?.count || 0);
    const appointmentEvolution = lastApts > 0 
      ? Math.round(((currentApts - lastApts) / lastApts) * 100) 
      : 0;
    
    return {
      // Response metrics
      responseRate: responseRate,
      totalRequiringResponse: totalRequiringResponse,
      emailsWithResponse: emailsWithResponseCount,
      
      // Processing time
      avgProcessingTimeHours: avgProcessingTimeHours,
      processedEmailsCount: processedCount,
      
      // Revenue
      expectedRevenue: Math.round(expectedRevenue),
      quotesWithAmount: quotesWithAmount,
      totalQuotes: allQuotes.length,
      
      // Monthly evolution (% change from last month)
      evolution: {
        emails: emailEvolution,
        processed: processedEvolution,
        appointments: appointmentEvolution,
      },
      
      // Month comparison data
      currentMonth: {
        emails: currentEmails,
        processed: currentProcessed,
        appointments: currentApts,
      },
      lastMonth: {
        emails: lastEmails,
        processed: lastProcessed,
        appointments: lastApts,
      },
    };
  }

  // Email stats by category (optimized with SQL aggregation, dynamic categories)
  // Only counts unprocessed emails (status = 'nouveau')
  async getEmailStatsByCategory(userId: string): Promise<Record<string, number>> {
    // Get all categories first to ensure all are represented in the result
    const categories = await this.getAllEmailCategories();
    
    // Get email counts grouped by type - only unprocessed emails
    const results = await db
      .select({
        emailType: emails.emailType,
        count: sql<number>`count(*)`
      })
      .from(emails)
      .where(and(
        eq(emails.userId, userId),
        eq(emails.status, 'nouveau') // Only count unprocessed emails
      ))
      .groupBy(emails.emailType);
    
    // Build a map with all categories (starting at 0)
    const statsMap: Record<string, number> = {};
    categories.forEach(cat => {
      statsMap[cat.key] = 0;
    });
    
    // Fill in actual counts
    results.forEach(result => {
      if (result.emailType) {
        statsMap[result.emailType] = Number(result.count || 0);
      }
    });
    
    return statsMap;
  }

  // Email categories
  async createEmailCategory(category: InsertEmailCategory): Promise<EmailCategory> {
    const [result] = await db.insert(emailCategories).values(category).returning();
    return result;
  }

  async getAllEmailCategories(): Promise<EmailCategory[]> {
    return await db.select().from(emailCategories).orderBy(emailCategories.createdAt);
  }

  async getEmailCategoriesForAccount(emailAccountId: string): Promise<EmailCategory[]> {
    // Return system categories (emailAccountId IS NULL) + custom categories for this account
    return await db
      .select()
      .from(emailCategories)
      .where(
        or(
          isNull(emailCategories.emailAccountId),
          eq(emailCategories.emailAccountId, emailAccountId)
        )
      )
      .orderBy(emailCategories.isSystem, emailCategories.createdAt);
  }

  async getEmailCategoryByKey(key: string, emailAccountId?: string | null): Promise<EmailCategory | undefined> {
    // If emailAccountId is provided, look for account-specific or system category
    // If not provided, look for system category only
    if (emailAccountId) {
      const [category] = await db
        .select()
        .from(emailCategories)
        .where(
          and(
            eq(emailCategories.key, key),
            or(
              isNull(emailCategories.emailAccountId),
              eq(emailCategories.emailAccountId, emailAccountId)
            )
          )
        );
      return category;
    } else {
      const [category] = await db
        .select()
        .from(emailCategories)
        .where(
          and(
            eq(emailCategories.key, key),
            isNull(emailCategories.emailAccountId)
          )
        );
      return category;
    }
  }

  async updateEmailCategory(id: string, data: Partial<EmailCategory>): Promise<EmailCategory> {
    const [updated] = await db
      .update(emailCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailCategories.id, id))
      .returning();
    return updated;
  }

  async deleteEmailCategory(id: string): Promise<void> {
    await db.delete(emailCategories).where(eq(emailCategories.id, id));
  }
}

export const storage = new DatabaseStorage();

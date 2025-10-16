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
  reminders,
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
  type Reminder,
  type InsertReminder,
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
  getEmailAccountById(id: string): Promise<EmailAccount | undefined>;
  getAllEmailAccounts(): Promise<EmailAccount[]>;
  deleteEmailAccount(id: string): Promise<void>;
  
  // Emails
  createEmail(email: InsertEmail): Promise<Email>;
  getEmails(userId: string, filters?: { type?: string; status?: string; search?: string; limit?: number }): Promise<Email[]>;
  getAllEmails(filters?: { type?: string; status?: string; search?: string; limit?: number }): Promise<Email[]>; // For backend services
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
  
  // Reminders (relances)
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getReminders(emailId?: string): Promise<Reminder[]>;
  getReminderById(id: string): Promise<Reminder | undefined>;
  updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
  getAdvancedKPIs(): Promise<any>;
  getEmailStatsByCategory(userId: string): Promise<{ devis: number; facture: number; rdv: number; autre: number }>;
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

  async getAllEmails(filters?: { type?: string; status?: string; search?: string; limit?: number }): Promise<Email[]> {
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

  // Email stats by category (optimized with SQL aggregation)
  async getEmailStatsByCategory(userId: string): Promise<{ devis: number; facture: number; rdv: number; autre: number }> {
    const [devisCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.emailType, 'devis')));
    
    const [factureCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.emailType, 'facture')));
    
    const [rdvCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.emailType, 'rdv')));
    
    const [autreCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(eq(emails.userId, userId), or(eq(emails.emailType, 'autre'), isNull(emails.emailType))));
    
    return {
      devis: Number(devisCount?.count || 0),
      facture: Number(factureCount?.count || 0),
      rdv: Number(rdvCount?.count || 0),
      autre: Number(autreCount?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();

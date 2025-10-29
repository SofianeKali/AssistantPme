import {
  users,
  emailAccounts,
  emails,
  documents,
  appointments,
  alerts,
  alertRules,
  alertEmails,
  tags,
  settings,
  emailResponses,
  reminders,
  emailTags,
  documentTags,
  appointmentTags,
  emailCategories,
  tasks,
  userDashboardLayout,
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
  type Task,
  type InsertTask,
  type UserDashboardLayout,
  type InsertUserDashboardLayout,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, like, or, isNull, sql, ne, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  getEmailById(id: string, userId?: string): Promise<Email | undefined>;
  getEmailByMessageId(messageId: string): Promise<Email | undefined>;
  updateEmail(id: string, userId: string | undefined, data: Partial<Email>): Promise<Email>;
  
  // Documents
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocuments(filters?: { type?: string; search?: string }): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  updateDocument(id: string, data: Partial<Document>): Promise<Document>;
  
  // Appointments
  createAppointment(apt: InsertAppointment): Promise<Appointment>;
  getAppointments(filters?: { start?: string; end?: string }): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;
  
  // Alerts
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlerts(filters?: { resolved?: boolean; type?: string; relatedEntityType?: string; relatedEntityId?: string; ruleId?: string; limit?: number }): Promise<Alert[]>;
  resolveAlert(id: string, userId: string): Promise<Alert>;
  linkEmailsToAlert(alertId: string, emailIds: string[]): Promise<void>;
  getAlertEmails(alertId: string): Promise<string[]>;
  updateAlertEmailCount(alertId: string, count: number): Promise<void>;
  
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
  getDashboardCharts(): Promise<any>;
  getAdvancedKPIs(): Promise<any>;
  getEmailStatsByCategory(userId?: string): Promise<Record<string, number>>;
  getSidebarCounts(): Promise<{
    unprocessedEmails: number;
    unresolvedAlerts: number;
    tasksNew: number;
    tasksInProgress: number;
    upcomingAppointments: number;
    documentsInUnprocessedEmails: number;
  }>;
  
  // Email categories
  createEmailCategory(category: InsertEmailCategory): Promise<EmailCategory>;
  getAllEmailCategories(): Promise<EmailCategory[]>;
  getEmailCategoriesForAccount(emailAccountId: string): Promise<EmailCategory[]>;
  getEmailCategoryByKey(key: string, emailAccountId?: string | null): Promise<EmailCategory | undefined>;
  updateEmailCategory(id: string, data: Partial<EmailCategory>): Promise<EmailCategory>;
  deleteEmailCategory(id: string): Promise<void>;
  
  // Email account categories (junction table operations)
  assignCategoriesToAccount(emailAccountId: string, categoryIds: string[]): Promise<void>;
  getAccountCategories(emailAccountId: string): Promise<EmailCategory[]>;
  removeAccountCategory(emailAccountId: string, categoryId: string): Promise<void>;
  
  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  getTasks(filters?: { status?: string; emailId?: string }): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  updateTaskStatus(id: string, status: string): Promise<Task>;
  updateTaskAssignment(id: string, assignedToId: string | null): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Weekly evolution charts
  getTaskEvolutionByWeek(weekOffset?: number): Promise<any>;
  getAlertEvolutionByWeek(weekOffset?: number): Promise<any>;
  getAppointmentsByWeek(weekOffset?: number): Promise<any>;
  
  // User Dashboard Layout
  getUserDashboardLayout(userId: string): Promise<UserDashboardLayout | undefined>;
  upsertUserDashboardLayout(userId: string, layout: string[]): Promise<UserDashboardLayout>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Exclude id from update to prevent foreign key constraint violations
    const { id, ...updateData } = userData;
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...updateData,
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

  async getAllEmails(filters?: { type?: string; status?: string; priority?: string; search?: string; olderThanHours?: number; limit?: number; offset?: number }): Promise<Email[]> {
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
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  async getEmailsCount(filters?: { type?: string; status?: string; priority?: string; search?: string; olderThanHours?: number }): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(emails);
    
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
    
    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async searchEmailsWithAI(criteria: {
    from?: string;
    subject?: string;
    keywords?: string[];
    dateFrom?: string;
    dateTo?: string;
    categories?: string[];
    priority?: string;
    sentiment?: string;
    status?: string;
    hasAttachments?: boolean;
    isRead?: boolean;
    requiresResponse?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ emails: Email[]; total: number }> {
    const conditions = [];

    // From field (name or email)
    if (criteria.from) {
      conditions.push(like(emails.from, `%${criteria.from}%`));
    }

    // Subject keywords
    if (criteria.subject) {
      conditions.push(like(emails.subject, `%${criteria.subject}%`));
    }

    // Body keywords
    if (criteria.keywords && criteria.keywords.length > 0) {
      const keywordConditions = criteria.keywords.map(keyword =>
        like(emails.body, `%${keyword}%`)
      );
      conditions.push(or(...keywordConditions)!);
    }

    // Date range
    if (criteria.dateFrom) {
      const dateFrom = new Date(criteria.dateFrom);
      dateFrom.setHours(0, 0, 0, 0);
      conditions.push(gte(emails.receivedAt, dateFrom));
    }
    if (criteria.dateTo) {
      const dateTo = new Date(criteria.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      conditions.push(lte(emails.receivedAt, dateTo));
    }

    // Categories
    if (criteria.categories && criteria.categories.length > 0) {
      if (criteria.categories.length === 1) {
        conditions.push(eq(emails.emailType, criteria.categories[0]));
      } else {
        const categoryConditions = criteria.categories.map(cat =>
          eq(emails.emailType, cat)
        );
        conditions.push(or(...categoryConditions)!);
      }
    }

    // Priority
    if (criteria.priority) {
      conditions.push(eq(emails.priority, criteria.priority));
    }

    // Sentiment
    if (criteria.sentiment) {
      conditions.push(eq(emails.sentiment, criteria.sentiment));
    }

    // Status
    if (criteria.status) {
      conditions.push(eq(emails.status, criteria.status));
    }

    // Boolean filters
    if (criteria.hasAttachments !== undefined) {
      conditions.push(eq(emails.hasAttachments, criteria.hasAttachments));
    }
    if (criteria.isRead !== undefined) {
      conditions.push(eq(emails.isRead, criteria.isRead));
    }
    if (criteria.requiresResponse !== undefined) {
      conditions.push(eq(emails.requiresResponse, criteria.requiresResponse));
    }

    // Build query
    let query = db.select().from(emails);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    query = query.orderBy(desc(emails.receivedAt)) as any;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(emails);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    
    const [emailResults, countResults] = await Promise.all([
      (criteria.limit ? query.limit(criteria.limit).offset(criteria.offset || 0) : query) as Promise<Email[]>,
      countQuery
    ]);

    return {
      emails: emailResults,
      total: Number(countResults[0]?.count || 0)
    };
  }

  async getEmailById(id: string, userId?: string): Promise<Email | undefined> {
    // If userId is provided, filter by it (legacy behavior)
    // Otherwise, return email regardless of owner (shared inbox)
    const conditions = [eq(emails.id, id)];
    if (userId) {
      conditions.push(eq(emails.userId, userId));
    }
    const [email] = await db.select().from(emails).where(and(...conditions));
    return email;
  }

  async getEmailByMessageId(messageId: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.messageId, messageId));
    return email;
  }

  async updateEmail(id: string, userId: string | undefined, data: Partial<Email>): Promise<Email> {
    // If userId is provided, filter by it (legacy behavior)
    // Otherwise, update email regardless of owner (shared inbox)
    const conditions = [eq(emails.id, id)];
    if (userId) {
      conditions.push(eq(emails.userId, userId));
    }
    const [updated] = await db
      .update(emails)
      .set({ ...data, updatedAt: new Date() })
      .where(and(...conditions))
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

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const [result] = await db.select().from(appointments).where(eq(appointments.id, id));
    return result;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [result] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return result;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  // Alerts
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [result] = await db.insert(alerts).values(alert).returning();
    return result;
  }

  async getAlerts(filters?: { userId?: string; adminUserIds?: string[]; resolved?: boolean; type?: string; relatedEntityType?: string; relatedEntityId?: string; ruleId?: string; limit?: number }): Promise<Alert[]> {
    let query = db.select({
      id: alerts.id,
      type: alerts.type,
      severity: alerts.severity,
      title: alerts.title,
      message: alerts.message,
      relatedEntityType: alerts.relatedEntityType,
      relatedEntityId: alerts.relatedEntityId,
      ruleId: alerts.ruleId,
      emailCount: alerts.emailCount,
      isResolved: alerts.isResolved,
      resolvedAt: alerts.resolvedAt,
      resolvedById: alerts.resolvedById,
      createdAt: alerts.createdAt,
    })
    .from(alerts)
    .leftJoin(alertRules, eq(alerts.ruleId, alertRules.id));
    
    const conditions = [];
    
    // Filter by user access:
    // - Show alerts for rules created by this user
    // - Show alerts for rules created by any admin (if adminUserIds is provided)
    if (filters?.userId) {
      const userAccessConditions = [eq(alertRules.createdById, filters.userId)];
      
      // Add admin-created alerts if adminUserIds is provided
      if (filters.adminUserIds && filters.adminUserIds.length > 0) {
        filters.adminUserIds.forEach(adminId => {
          userAccessConditions.push(eq(alertRules.createdById, adminId));
        });
      }
      
      conditions.push(or(...userAccessConditions));
    }
    
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
    if (filters?.ruleId) {
      conditions.push(eq(alerts.ruleId, filters.ruleId));
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

  async linkEmailsToAlert(alertId: string, emailIds: string[]): Promise<void> {
    if (emailIds.length === 0) return;
    
    const values = emailIds.map(emailId => ({ alertId, emailId }));
    await db.insert(alertEmails).values(values).onConflictDoNothing();
  }

  async getAlertEmails(alertId: string): Promise<string[]> {
    const results = await db
      .select({ emailId: alertEmails.emailId })
      .from(alertEmails)
      .where(eq(alertEmails.alertId, alertId));
    return results.map(r => r.emailId);
  }

  async updateAlertEmailCount(alertId: string, count: number): Promise<void> {
    await db
      .update(alerts)
      .set({ emailCount: count })
      .where(eq(alerts.id, alertId));
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
  async getDashboardStats(emailAccountId?: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Count quotes without response (emails with type 'devis' and status 'nouveau')
    const quotesConditions = [
      eq(emails.emailType, 'devis'),
      eq(emails.status, 'nouveau')
    ];
    if (emailAccountId) {
      quotesConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const [quotesNoResponse] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...quotesConditions));
    
    // Count unpaid invoices (emails with type 'facture' and status 'nouveau')
    const invoicesConditions = [
      eq(emails.emailType, 'facture'),
      eq(emails.status, 'nouveau')
    ];
    if (emailAccountId) {
      invoicesConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const [unpaidInvoices] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...invoicesConditions));
    
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
    const unprocessedConditions = [eq(emails.status, 'nouveau')];
    if (emailAccountId) {
      unprocessedConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const [unprocessedEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...unprocessedConditions));
    
    // Count active alerts (not resolved)
    const [activeAlerts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(eq(alerts.isResolved, false));
    
    // Monthly stats
    const monthlyConditions = [gte(emails.receivedAt, startOfMonth)];
    if (emailAccountId) {
      monthlyConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const [monthlyEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...monthlyConditions));
    
    const monthlyProcessedConditions = [
      gte(emails.receivedAt, startOfMonth),
      or(
        eq(emails.status, 'traite'),
        eq(emails.status, 'archive')
      )
    ];
    if (emailAccountId) {
      monthlyProcessedConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const [monthlyEmailsProcessed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...monthlyProcessedConditions));
    
    const [monthlyAppointments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(gte(appointments.createdAt, startOfMonth));
    
    const [monthlyDocuments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(gte(documents.createdAt, startOfMonth));
    
    // Weekly stats
    const weeklyConditions = [gte(emails.receivedAt, startOfWeek)];
    if (emailAccountId) {
      weeklyConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const [weeklyEmails] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...weeklyConditions));
    
    // Email type breakdown (this month)
    const typeBreakdownConditions = [gte(emails.receivedAt, startOfMonth)];
    if (emailAccountId) {
      typeBreakdownConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const emailTypeBreakdown = await db
      .select({
        type: emails.emailType,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(and(...typeBreakdownConditions))
      .groupBy(emails.emailType);
    
    // Priority breakdown (unprocessed emails)
    const priorityConditions = [eq(emails.status, 'nouveau')];
    if (emailAccountId) {
      priorityConditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    const priorityBreakdown = await db
      .select({
        priority: emails.priority,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(and(...priorityConditions))
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

  // Dashboard charts data
  async getDashboardCharts(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Récupérer les catégories d'emails avec leurs couleurs
    const categoriesData = await db.select().from(emailCategories);
    const categoryColorMap = new Map(categoriesData.map(cat => [cat.key, cat.color]));
    
    // Evolution des emails traités (last 7 days)
    const emailEvolution = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const [processed] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(
          and(
            gte(emails.receivedAt, dayStart),
            lte(emails.receivedAt, dayEnd),
            or(
              eq(emails.status, 'traite'),
              eq(emails.status, 'archive')
            )
          )
        );
      
      const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      emailEvolution.push({
        day: dayNames[dayStart.getDay()],
        count: Number(processed?.count || 0)
      });
    }
    
    // RDV planifiés par semaine (last 4 weeks)
    const appointmentsByWeek = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const [count] = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            gte(appointments.startTime, weekStart),
            lte(appointments.startTime, weekEnd)
          )
        );
      
      appointmentsByWeek.push({
        week: `${4 - i}`,
        count: Number(count?.count || 0)
      });
    }
    
    // Répartition des emails reçus par catégorie (avec couleurs)
    const emailDistribution = await db
      .select({
        type: emails.emailType,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(gte(emails.receivedAt, startOfMonth))
      .groupBy(emails.emailType);
    
    // Taux de traitement par catégorie (avec couleurs)
    const categoryProcessing = [];
    const categoryKeys = Array.from(new Set(categoriesData.map(cat => cat.key)));
    
    for (const categoryKey of categoryKeys) {
      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(eq(emails.emailType, categoryKey));
      
      const [processed] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(
          and(
            eq(emails.emailType, categoryKey),
            or(
              eq(emails.status, 'traite'),
              eq(emails.status, 'archive')
            )
          )
        );
      
      const totalCount = Number(total?.count || 0);
      const processedCount = Number(processed?.count || 0);
      const rate = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;
      
      const categoryInfo = categoriesData.find(cat => cat.key === categoryKey);
      
      categoryProcessing.push({
        category: categoryInfo?.label || categoryKey,
        rate,
        color: categoryColorMap.get(categoryKey) || '#6B7280'
      });
    }
    
    // Funnel de traitement des emails
    const [received] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails);
    
    const [sorted] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(ne(emails.status, 'nouveau'));
    
    const [assigned] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(sql`${emails.assignedToId} IS NOT NULL`);
    
    const [processed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        or(
          eq(emails.status, 'traite'),
          eq(emails.status, 'archive')
        )
      );
    
    return {
      emailEvolution,
      appointmentsByWeek,
      emailDistribution: emailDistribution.map(item => {
        const categoryInfo = categoriesData.find(cat => cat.key === item.type);
        return {
          name: categoryInfo?.label || item.type || 'Autre',
          value: Number(item.count),
          color: categoryColorMap.get(item.type || '') || '#6B7280'
        };
      }),
      categoryProcessing,
      emailFunnel: [
        { name: 'Reçus', count: Number(received?.count || 0) },
        { name: 'Triés', count: Number(sorted?.count || 0) },
        { name: 'Assignés', count: Number(assigned?.count || 0) },
        { name: 'Traités', count: Number(processed?.count || 0) }
      ]
    };
  }

  // Helper to calculate period start and end dates
  private getPeriodDates(periodType: 'week' | 'month', offset: number): { start: Date; end: Date; periods: Date[] } {
    const now = new Date();
    let start: Date, end: Date;
    const periods: Date[] = [];
    
    if (periodType === 'week') {
      const weekStart = new Date(now.getTime() - offset * 7 * 24 * 60 * 60 * 1000);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      start = weekStart;
      end = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      for (let i = 0; i < 7; i++) {
        periods.push(new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000));
      }
    } else {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);
      
      const daysInMonth = end.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        periods.push(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i));
      }
    }
    
    return { start, end, periods };
  }

  // Helper to format day/date labels
  private getPeriodLabel(date: Date, periodType: 'week' | 'month'): string {
    if (periodType === 'week') {
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return dayNames[date.getDay()];
    } else {
      return date.getDate().toString();
    }
  }

  // Get task evolution for a specific period
  async getTaskEvolutionByWeek(weekOffset: number = 0, periodType: 'week' | 'month' = 'week'): Promise<any> {
    const { periods } = this.getPeriodDates(periodType, weekOffset);
    const evolution = [];
    
    for (const periodDate of periods) {
      const dayStart = new Date(periodDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const [nouveau] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            gte(tasks.createdAt, dayStart),
            lte(tasks.createdAt, dayEnd),
            eq(tasks.status, 'nouveau')
          )
        );
      
      const [enCours] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            gte(tasks.createdAt, dayStart),
            lte(tasks.createdAt, dayEnd),
            eq(tasks.status, 'en_cours')
          )
        );
      
      const [termine] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            gte(tasks.createdAt, dayStart),
            lte(tasks.createdAt, dayEnd),
            eq(tasks.status, 'termine')
          )
        );
      
      evolution.push({
        day: this.getPeriodLabel(periodDate, periodType),
        nouveau: Number(nouveau?.count || 0),
        enCours: Number(enCours?.count || 0),
        termine: Number(termine?.count || 0)
      });
    }
    
    return evolution;
  }

  // Get alert evolution for a specific period
  async getAlertEvolutionByWeek(weekOffset: number = 0, periodType: 'week' | 'month' = 'week'): Promise<any> {
    const { periods } = this.getPeriodDates(periodType, weekOffset);
    const evolution = [];
    
    for (const periodDate of periods) {
      const dayStart = new Date(periodDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const [active] = await db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(
          and(
            gte(alerts.createdAt, dayStart),
            lte(alerts.createdAt, dayEnd),
            isNull(alerts.resolvedAt)
          )
        );
      
      const [resolved] = await db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(
          and(
            gte(alerts.createdAt, dayStart),
            lte(alerts.createdAt, dayEnd),
            sql`${alerts.resolvedAt} IS NOT NULL`
          )
        );
      
      evolution.push({
        day: this.getPeriodLabel(periodDate, periodType),
        active: Number(active?.count || 0),
        resolved: Number(resolved?.count || 0)
      });
    }
    
    return evolution;
  }

  // Get appointments for a specific period
  async getAppointmentsByWeek(weekOffset: number = 0, periodType: 'week' | 'month' = 'week'): Promise<any> {
    const { periods } = this.getPeriodDates(periodType, weekOffset);
    const appointmentsData = [];
    
    for (const periodDate of periods) {
      const dayStart = new Date(periodDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const [count] = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            gte(appointments.startTime, dayStart),
            lte(appointments.startTime, dayEnd)
          )
        );
      
      appointmentsData.push({
        day: this.getPeriodLabel(periodDate, periodType),
        count: Number(count?.count || 0)
      });
    }
    
    return appointmentsData;
  }

  // Get email distribution for a specific period
  async getEmailDistribution(offset: number = 0, periodType: 'week' | 'month' = 'week', emailAccountId?: string): Promise<any> {
    const { start, end } = this.getPeriodDates(periodType, offset);
    
    const categoriesData = await db.select().from(emailCategories);
    const categoryColorMap = new Map(categoriesData.map(cat => [cat.key, cat.color]));
    
    const conditions = [
      gte(emails.receivedAt, start),
      lte(emails.receivedAt, end)
    ];
    if (emailAccountId) {
      conditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    
    const emailDistribution = await db
      .select({
        type: emails.emailType,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(and(...conditions))
      .groupBy(emails.emailType);
    
    return emailDistribution.map(item => {
      const categoryInfo = categoriesData.find(cat => cat.key === item.type);
      return {
        name: categoryInfo?.label || item.type || 'Autre',
        value: Number(item.count),
        color: categoryColorMap.get(item.type || '') || '#6B7280'
      };
    });
  }

  // Get email evolution for a specific period
  async getEmailEvolution(offset: number = 0, periodType: 'week' | 'month' = 'week', emailAccountId?: string): Promise<any> {
    const { periods } = this.getPeriodDates(periodType, offset);
    const evolution = [];
    
    for (const periodDate of periods) {
      const dayStart = new Date(periodDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const conditions = [
        gte(emails.receivedAt, dayStart),
        lte(emails.receivedAt, dayEnd),
        or(
          eq(emails.status, 'traite'),
          eq(emails.status, 'archive')
        )
      ];
      if (emailAccountId) {
        conditions.push(eq(emails.emailAccountId, emailAccountId));
      }
      
      const [processed] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(and(...conditions));
      
      evolution.push({
        day: this.getPeriodLabel(periodDate, periodType),
        count: Number(processed?.count || 0)
      });
    }
    
    return evolution;
  }

  // Get category processing rate for a specific period
  async getCategoryProcessing(offset: number = 0, periodType: 'week' | 'month' = 'week', emailAccountId?: string): Promise<any> {
    const { start, end } = this.getPeriodDates(periodType, offset);
    
    const categoriesData = await db.select().from(emailCategories);
    const categoryColorMap = new Map(categoriesData.map(cat => [cat.key, cat.color]));
    const categoryKeys = Array.from(new Set(categoriesData.map(cat => cat.key)));
    
    const categoryProcessing = [];
    
    for (const categoryKey of categoryKeys) {
      const totalConditions = [
        eq(emails.emailType, categoryKey),
        gte(emails.receivedAt, start),
        lte(emails.receivedAt, end)
      ];
      if (emailAccountId) {
        totalConditions.push(eq(emails.emailAccountId, emailAccountId));
      }
      
      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(and(...totalConditions));
      
      const processedConditions = [
        eq(emails.emailType, categoryKey),
        gte(emails.receivedAt, start),
        lte(emails.receivedAt, end),
        or(
          eq(emails.status, 'traite'),
          eq(emails.status, 'archive')
        )
      ];
      if (emailAccountId) {
        processedConditions.push(eq(emails.emailAccountId, emailAccountId));
      }
      
      const [processed] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(and(...processedConditions));
      
      const totalCount = Number(total?.count || 0);
      const processedCount = Number(processed?.count || 0);
      const rate = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;
      
      const categoryInfo = categoriesData.find(cat => cat.key === categoryKey);
      
      if (totalCount > 0) {
        categoryProcessing.push({
          category: categoryInfo?.label || categoryKey,
          rate,
          color: categoryColorMap.get(categoryKey) || '#6B7280'
        });
      }
    }
    
    return categoryProcessing;
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
  async getEmailStatsByCategory(userId?: string, emailAccountId?: string): Promise<Record<string, number>> {
    // Get all categories first to ensure all are represented in the result
    const categories = await this.getAllEmailCategories();
    
    // Get email counts grouped by type - only unprocessed emails
    const conditions = [eq(emails.status, 'nouveau')];
    
    // If userId is provided, filter by user, otherwise show all emails
    if (userId) {
      conditions.push(eq(emails.userId, userId));
    }
    
    // If emailAccountId is provided, filter by email account
    if (emailAccountId) {
      conditions.push(eq(emails.emailAccountId, emailAccountId));
    }
    
    const results = await db
      .select({
        emailType: emails.emailType,
        count: sql<number>`count(*)`
      })
      .from(emails)
      .where(and(...conditions))
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

  // Sidebar counts for navigation menu
  async getSidebarCounts(userId?: string, adminUserIds?: string[]): Promise<{
    unprocessedEmails: number;
    unresolvedAlerts: number;
    tasksNew: number;
    tasksInProgress: number;
    upcomingAppointments: number;
    documentsInUnprocessedEmails: number;
  }> {
    const now = new Date();

    // Count unprocessed emails (nouveau + en_cours) - filtered by user
    const emailConditions = [
      or(
        eq(emails.status, 'nouveau'),
        eq(emails.status, 'en_cours')
      )
    ];
    if (userId) {
      emailConditions.push(eq(emails.userId, userId));
    }
    const [unprocessedEmailsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...emailConditions));
    const unprocessedEmails = Number(unprocessedEmailsResult?.count || 0);

    // Count unresolved alerts - filtered by user (via alert_rules join)
    // Include alerts created by user + alerts created by admins
    let alertQuery = db
      .select({ count: sql<number>`count(DISTINCT ${alerts.id})` })
      .from(alerts)
      .leftJoin(alertRules, eq(alerts.ruleId, alertRules.id));
    
    const alertConditions = [eq(alerts.isResolved, false)];
    if (userId) {
      const allowedUserIds = [userId];
      if (adminUserIds && adminUserIds.length > 0) {
        allowedUserIds.push(...adminUserIds);
      }
      alertConditions.push(inArray(alertRules.createdById, allowedUserIds));
    }
    
    alertQuery = alertQuery.where(and(...alertConditions)) as any;
    const [unresolvedAlertsResult] = await alertQuery;
    const unresolvedAlerts = Number(unresolvedAlertsResult?.count || 0);

    // Count tasks with status "nouveau" - filtered by user (creator or assignee + admin-created)
    let tasksNewConditions: any[] = [eq(tasks.status, 'nouveau')];
    if (userId) {
      const allowedCreatorIds = [userId];
      if (adminUserIds && adminUserIds.length > 0) {
        allowedCreatorIds.push(...adminUserIds);
      }
      const userCondition = or(
        inArray(tasks.createdById, allowedCreatorIds),
        eq(tasks.assignedToId, userId)
      );
      if (userCondition) {
        tasksNewConditions.push(userCondition);
      }
    }
    const [tasksNewResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(...tasksNewConditions));
    const tasksNew = Number(tasksNewResult?.count || 0);

    // Count tasks with status "en_cours" - filtered by user (creator or assignee + admin-created)
    let tasksInProgressConditions: any[] = [eq(tasks.status, 'en_cours')];
    if (userId) {
      const allowedCreatorIds = [userId];
      if (adminUserIds && adminUserIds.length > 0) {
        allowedCreatorIds.push(...adminUserIds);
      }
      const userCondition = or(
        inArray(tasks.createdById, allowedCreatorIds),
        eq(tasks.assignedToId, userId)
      );
      if (userCondition) {
        tasksInProgressConditions.push(userCondition);
      }
    }
    const [tasksInProgressResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(...tasksInProgressConditions));
    const tasksInProgress = Number(tasksInProgressResult?.count || 0);

    // Count upcoming appointments (startTime >= now) - filtered by user
    const appointmentConditions = [gte(appointments.startTime, now)];
    if (userId) {
      appointmentConditions.push(eq(appointments.createdById, userId));
    }
    const [upcomingAppointmentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(...appointmentConditions));
    const upcomingAppointments = Number(upcomingAppointmentsResult?.count || 0);

    // Count documents attached to unprocessed emails - filtered by user via emails
    const documentEmailConditions = [
      or(
        eq(emails.status, 'nouveau'),
        eq(emails.status, 'en_cours')
      )
    ];
    if (userId) {
      documentEmailConditions.push(eq(emails.userId, userId));
    }
    const [documentsInUnprocessedResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${documents.id})` })
      .from(documents)
      .innerJoin(emails, eq(documents.emailId, emails.id))
      .where(and(...documentEmailConditions));
    const documentsInUnprocessedEmails = Number(documentsInUnprocessedResult?.count || 0);

    return {
      unprocessedEmails,
      unresolvedAlerts,
      tasksNew,
      tasksInProgress,
      upcomingAppointments,
      documentsInUnprocessedEmails,
    };
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
    // Since categories are now global, this method returns all categories
    // It's kept for backward compatibility but could be replaced with getAllEmailCategories
    return await db.select().from(emailCategories).orderBy(emailCategories.isSystem, emailCategories.createdAt);
  }

  async getEmailCategoryByKey(key: string, emailAccountId?: string | null): Promise<EmailCategory | undefined> {
    // Categories are now global, so we just search by key
    const [category] = await db
      .select()
      .from(emailCategories)
      .where(eq(emailCategories.key, key));
    return category;
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
    // First, get the category to be deleted to retrieve its key
    const [categoryToDelete] = await db
      .select()
      .from(emailCategories)
      .where(eq(emailCategories.id, id));
    
    if (!categoryToDelete) {
      throw new Error("Category not found");
    }
    
    // Don't allow deleting the 'autre' category as it's the fallback category
    if (categoryToDelete.key === 'autre') {
      throw new Error("Cannot delete the 'autre' category - it is required as a fallback");
    }
    
    // Update all emails with this emailType to use 'autre' instead
    const { emails } = await import("@shared/schema");
    await db
      .update(emails)
      .set({ emailType: 'autre', updatedAt: new Date() })
      .where(eq(emails.emailType, categoryToDelete.key));
    
    console.log(`[Categories] Transferred emails from '${categoryToDelete.key}' to 'autre' before deletion`);
    
    // Now delete the category
    await db.delete(emailCategories).where(eq(emailCategories.id, id));
  }
  
  // Email account categories (junction table operations)
  async assignCategoriesToAccount(emailAccountId: string, categoryIds: string[]): Promise<void> {
    const { emailAccountCategories } = await import("@shared/schema");
    
    // First, remove all existing associations
    await db.delete(emailAccountCategories).where(eq(emailAccountCategories.emailAccountId, emailAccountId));
    
    // Then add the new ones
    if (categoryIds.length > 0) {
      const values = categoryIds.map(categoryId => ({
        emailAccountId,
        categoryId,
      }));
      await db.insert(emailAccountCategories).values(values);
    }
  }
  
  async getAccountCategories(emailAccountId: string): Promise<EmailCategory[]> {
    const { emailAccountCategories } = await import("@shared/schema");
    
    const results = await db
      .select({
        id: emailCategories.id,
        key: emailCategories.key,
        label: emailCategories.label,
        color: emailCategories.color,
        icon: emailCategories.icon,
        isSystem: emailCategories.isSystem,
        generateAutoResponse: emailCategories.generateAutoResponse,
        autoCreateTask: emailCategories.autoCreateTask,
        autoMarkAsProcessed: emailCategories.autoMarkAsProcessed,
        createdAt: emailCategories.createdAt,
        updatedAt: emailCategories.updatedAt,
      })
      .from(emailAccountCategories)
      .innerJoin(emailCategories, eq(emailAccountCategories.categoryId, emailCategories.id))
      .where(eq(emailAccountCategories.emailAccountId, emailAccountId));
    
    return results;
  }
  
  async removeAccountCategory(emailAccountId: string, categoryId: string): Promise<void> {
    const { emailAccountCategories } = await import("@shared/schema");
    
    await db
      .delete(emailAccountCategories)
      .where(
        and(
          eq(emailAccountCategories.emailAccountId, emailAccountId),
          eq(emailAccountCategories.categoryId, categoryId)
        )
      );
  }
  
  // Tasks operations
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }
  
  async getTasks(filters?: { status?: string; emailId?: string; userId?: string; adminUserIds?: string[] }): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    const conditions = [];
    
    // Filter by user access:
    // - Show tasks created by OR assigned to the user
    // - Show tasks created by any admin (if adminUserIds is provided)
    if (filters?.userId) {
      const userAccessConditions = [
        eq(tasks.createdById, filters.userId),
        eq(tasks.assignedToId, filters.userId)
      ];
      
      // Add admin-created tasks if adminUserIds is provided
      if (filters.adminUserIds && filters.adminUserIds.length > 0) {
        filters.adminUserIds.forEach(adminId => {
          userAccessConditions.push(eq(tasks.createdById, adminId));
        });
      }
      
      conditions.push(or(...userAccessConditions));
    }
    
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    if (filters?.emailId) {
      conditions.push(eq(tasks.emailId, filters.emailId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.orderBy(desc(tasks.createdAt));
    return result;
  }
  
  async getTaskById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async updateTaskStatus(id: string, status: string): Promise<Task> {
    const [updated] = await db
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }
  
  async updateTaskAssignment(id: string, assignedToId: string | null): Promise<Task> {
    const [updated] = await db
      .update(tasks)
      .set({ assignedToId, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }
  
  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async completeTasksForProcessedEmail(emailId: string): Promise<number> {
    const relatedTasks = await this.getTasks({ emailId });
    
    if (relatedTasks.length === 0) {
      return 0;
    }

    let completedCount = 0;
    for (const task of relatedTasks) {
      if (task.status !== 'termine') {
        await this.updateTaskStatus(task.id, 'termine');
        completedCount++;
      }
    }

    return completedCount;
  }

  // User Dashboard Layout
  async getUserDashboardLayout(userId: string): Promise<UserDashboardLayout | undefined> {
    const [layout] = await db
      .select()
      .from(userDashboardLayout)
      .where(eq(userDashboardLayout.userId, userId));
    return layout;
  }

  async upsertUserDashboardLayout(userId: string, layout: string[]): Promise<UserDashboardLayout> {
    // Try to get existing layout
    const existing = await this.getUserDashboardLayout(userId);
    
    if (existing) {
      // Update existing
      const [updated] = await db
        .update(userDashboardLayout)
        .set({ layout, updatedAt: new Date() })
        .where(eq(userDashboardLayout.userId, userId))
        .returning();
      return updated;
    } else {
      // Insert new
      const [created] = await db
        .insert(userDashboardLayout)
        .values({ userId, layout })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();

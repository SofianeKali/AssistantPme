import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, hashPassword } from "./localAuth";
import { isAdmin } from "./middleware";
import { analyzeEmail, generateEmailResponse, generateAppointmentSuggestions, analyzeSearchPrompt } from "./openai";
import { insertEmailAccountSchema, insertTagSchema, insertEmailSchema, insertAlertSchema, insertUserSchema } from "@shared/schema";
import { EmailScanner } from "./emailScanner";
import { processDocument } from "./ocrService";
import { downloadFileFromDrive } from "./googleDrive";
import { sendEmailResponse } from "./emailSender";
import multer from "multer";
import Stripe from "stripe";
import crypto from "crypto";

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept most common file types
    const allowedMimeTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Others
      'application/json',
      'application/xml',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  setupLocalAuth(app);
  
  // Initialize email scanner
  const emailScanner = new EmailScanner(storage);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      // req.user is now the full User object from database (hydrated in session deserialization)
      // Remove sensitive fields before sending response
      const user = req.user as any;
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const emailAccountId = req.query.emailAccountId as string | undefined;
      const stats = await storage.getDashboardStats(emailAccountId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Dashboard charts
  app.get('/api/dashboard/charts', isAuthenticated, async (req, res) => {
    try {
      const charts = await storage.getDashboardCharts();
      res.json(charts);
    } catch (error) {
      console.error("Error fetching dashboard charts:", error);
      res.status(500).json({ message: "Failed to fetch charts data" });
    }
  });

  // Task evolution by period
  app.get('/api/dashboard/tasks-evolution', isAuthenticated, async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const periodType = (req.query.periodType as string) || 'week';
      const evolution = await storage.getTaskEvolutionByWeek(offset, periodType as 'week' | 'month');
      res.json(evolution);
    } catch (error) {
      console.error("Error fetching task evolution:", error);
      res.status(500).json({ message: "Failed to fetch task evolution data" });
    }
  });

  // Alert evolution by period
  app.get('/api/dashboard/alerts-evolution', isAuthenticated, async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const periodType = (req.query.periodType as string) || 'week';
      const evolution = await storage.getAlertEvolutionByWeek(offset, periodType as 'week' | 'month');
      res.json(evolution);
    } catch (error) {
      console.error("Error fetching alert evolution:", error);
      res.status(500).json({ message: "Failed to fetch alert evolution data" });
    }
  });

  // Appointments by period
  app.get('/api/dashboard/appointments-week', isAuthenticated, async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const periodType = (req.query.periodType as string) || 'week';
      const appointments = await storage.getAppointmentsByWeek(offset, periodType as 'week' | 'month');
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments by week:", error);
      res.status(500).json({ message: "Failed to fetch appointments data" });
    }
  });

  // Email distribution by period
  app.get('/api/dashboard/email-distribution', isAuthenticated, async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const periodType = (req.query.periodType as string) || 'week';
      const emailAccountId = req.query.emailAccountId as string | undefined;
      const distribution = await storage.getEmailDistribution(offset, periodType as 'week' | 'month', emailAccountId);
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching email distribution:", error);
      res.status(500).json({ message: "Failed to fetch email distribution data" });
    }
  });

  // Email evolution by period
  app.get('/api/dashboard/email-evolution', isAuthenticated, async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const periodType = (req.query.periodType as string) || 'week';
      const emailAccountId = req.query.emailAccountId as string | undefined;
      const evolution = await storage.getEmailEvolution(offset, periodType as 'week' | 'month', emailAccountId);
      res.json(evolution);
    } catch (error) {
      console.error("Error fetching email evolution:", error);
      res.status(500).json({ message: "Failed to fetch email evolution data" });
    }
  });

  // Category processing by period
  app.get('/api/dashboard/category-processing', isAuthenticated, async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const periodType = (req.query.periodType as string) || 'week';
      const emailAccountId = req.query.emailAccountId as string | undefined;
      const processing = await storage.getCategoryProcessing(offset, periodType as 'week' | 'month', emailAccountId);
      res.json(processing);
    } catch (error) {
      console.error("Error fetching category processing:", error);
      res.status(500).json({ message: "Failed to fetch category processing data" });
    }
  });

  // Advanced KPIs
  app.get('/api/dashboard/kpis', isAuthenticated, async (req, res) => {
    try {
      const kpis = await storage.getAdvancedKPIs();
      res.json(kpis);
    } catch (error) {
      console.error("Error fetching advanced KPIs:", error);
      res.status(500).json({ message: "Failed to fetch advanced KPIs" });
    }
  });

  // Dashboard layout preferences
  app.get('/api/dashboard/layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const layout = await storage.getUserDashboardLayout(userId);
      res.json(layout || { layout: [] });
    } catch (error) {
      console.error("Error fetching dashboard layout:", error);
      res.status(500).json({ message: "Failed to fetch dashboard layout" });
    }
  });

  app.post('/api/dashboard/layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { layout } = req.body;
      
      if (!Array.isArray(layout)) {
        return res.status(400).json({ message: "Layout must be an array" });
      }
      
      const savedLayout = await storage.upsertUserDashboardLayout(userId, layout);
      res.json(savedLayout);
    } catch (error) {
      console.error("Error saving dashboard layout:", error);
      res.status(500).json({ message: "Failed to save dashboard layout" });
    }
  });

  // Sidebar counts
  app.get('/api/sidebar/counts', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const isAdmin = user.role === 'admin';
      
      let adminUserIds: string[] | undefined = undefined;
      
      if (!isAdmin) {
        // Regular users need to include admin-created items in their counts
        const allUsers = await storage.getAllUsers();
        adminUserIds = allUsers
          .filter(u => u.role === 'admin')
          .map(u => u.id);
      }
      
      const counts = await storage.getSidebarCounts(
        isAdmin ? undefined : user.id,
        adminUserIds
      );
      res.json(counts);
    } catch (error) {
      console.error("Error fetching sidebar counts:", error);
      res.status(500).json({ message: "Failed to fetch sidebar counts" });
    }
  });

  // Email accounts
  app.get('/api/email-accounts', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const accounts = await storage.getEmailAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching email accounts:", error);
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  app.post('/api/email-accounts', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertEmailAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createEmailAccount(validatedData);
      res.json(account);
    } catch (error) {
      console.error("Error creating email account:", error);
      res.status(400).json({ message: "Invalid email account data" });
    }
  });

  app.patch('/api/email-accounts/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updated = await storage.updateEmailAccount(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating email account:", error);
      res.status(500).json({ message: "Failed to update email account" });
    }
  });

  app.delete('/api/email-accounts/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteEmailAccount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email account:", error);
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  // Manual scan for a specific email account
  app.post('/api/email-accounts/:id/scan', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const accountId = req.params.id;
      const account = await storage.getEmailAccountById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Compte email introuvable" });
      }

      console.log(`[Manual Scan] Starting scan for account: ${account.email}`);
      const result = await emailScanner.scanAccount(account);
      
      console.log(`[Manual Scan] Scan complete - Scanned: ${result.scanned}, Created: ${result.created}, Errors: ${result.errors}`);
      
      res.json({
        success: true,
        scanned: result.scanned,
        created: result.created,
        errors: result.errors,
        message: `Scan terminé : ${result.created} nouveau(x) email(s) importé(s)`
      });
    } catch (error: any) {
      console.error("Error scanning email account:", error);
      res.status(500).json({ 
        message: "Erreur lors du scan",
        details: error.message 
      });
    }
  });

  // Get categories for a specific email account
  app.get('/api/email-accounts/:id/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAccountCategories(req.params.id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching account categories:", error);
      res.status(500).json({ message: "Failed to fetch account categories" });
    }
  });

  // Update categories for a specific email account
  app.put('/api/email-accounts/:id/categories', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { categoryIds } = req.body;
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "categoryIds must be an array" });
      }
      await storage.assignCategoriesToAccount(req.params.id, categoryIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating account categories:", error);
      res.status(500).json({ message: "Failed to update account categories" });
    }
  });

  // Emails
  // All authenticated users can see all emails (PME shared inbox)
  app.get('/api/emails', isAuthenticated, async (req, res) => {
    try {
      const { type, status, search, limit, offset } = req.query;
      
      const filters = {
        type: type as string,
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      
      const [emails, total] = await Promise.all([
        storage.getAllEmails(filters),
        storage.getEmailsCount({
          type: filters.type,
          status: filters.status,
          search: filters.search,
        }),
      ]);
      
      res.json({
        emails,
        total,
        limit: filters.limit || total,
        offset: filters.offset || 0,
      });
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.get('/api/emails/stats/by-category', isAuthenticated, async (req, res) => {
    try {
      // All users see stats for all emails (PME shared inbox)
      const emailAccountId = req.query.emailAccountId as string | undefined;
      const categoryCounts = await storage.getEmailStatsByCategory(undefined, emailAccountId);
      res.json(categoryCounts);
    } catch (error) {
      console.error("Error fetching email category stats:", error);
      res.status(500).json({ message: "Failed to fetch email category stats" });
    }
  });

  // Analyze AI search prompt (separate from search execution)
  app.post('/api/emails/ai-search/analyze', isAuthenticated, async (req, res) => {
    try {
      const { prompt, deepSearch = false } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Get available categories for the AI analysis
      const categories = await storage.getAllEmailCategories();
      const availableCategories = categories.map(cat => ({
        key: cat.key,
        label: cat.label
      }));

      // Analyze the search prompt with AI (only once)
      const criteria = await analyzeSearchPrompt(prompt, availableCategories);
      
      console.log(`[AI Search] Analyzed prompt: "${prompt}" (deep: ${deepSearch}) →`, criteria);

      res.json({
        criteria,
        prompt,
        deepSearch
      });
    } catch (error) {
      console.error("Error analyzing search prompt:", error);
      res.status(500).json({ message: "Failed to analyze search prompt" });
    }
  });

  // Execute AI search with already-analyzed criteria
  app.post('/api/emails/ai-search', isAuthenticated, async (req, res) => {
    try {
      const { criteria, limit = 20, offset = 0, prompt, deepSearch = false } = req.body;
      
      if (!criteria || typeof criteria !== 'object') {
        return res.status(400).json({ message: "Search criteria are required" });
      }

      // Perform the search with provided criteria AND original prompt for semantic analysis
      const result = await storage.searchEmailsWithAI({
        ...criteria,
        limit,
        offset,
        prompt, // Pass the original prompt for semantic content analysis
        deepSearch // Pass deep search flag to control attachment search
      });

      console.log(`[AI Search] Executed search with ${Object.keys(criteria).length} criteria (deep: ${deepSearch}) → ${result.total} results`);

      res.json({
        emails: result.emails,
        total: result.total,
        limit,
        offset,
        criteria,
        prompt,
        deepSearch
      });
    } catch (error) {
      console.error("Error performing AI search:", error);
      res.status(500).json({ message: "Failed to perform AI search" });
    }
  });

  app.post('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const emailData = req.body;
      
      // Get available email categories
      const categories = await storage.getAllEmailCategories();
      const availableCategories = categories.map(c => ({ key: c.key, label: c.label }));
      
      // Analyze email with GPT (with advanced sentiment analysis)
      const analysis = await analyzeEmail({
        subject: emailData.subject,
        body: emailData.body,
        from: emailData.from,
      }, availableCategories);
      
      const validatedData = insertEmailSchema.parse({
        ...emailData,
        emailType: analysis.emailType,
        priority: analysis.priority,
        sentiment: analysis.sentiment,
        aiAnalysis: {
          summary: analysis.summary,
          extractedData: analysis.extractedData,
          suggestedTags: analysis.suggestedTags,
          // Advanced sentiment analysis fields
          riskLevel: analysis.riskLevel || 'none',
          riskFactors: analysis.riskFactors || [],
          urgencyType: analysis.urgencyType || 'none',
          conflictIndicators: analysis.conflictIndicators || [],
          actionRecommendations: analysis.actionRecommendations || [],
        },
      });
      
      const email = await storage.createEmail(validatedData);
      res.json(email);
    } catch (error) {
      console.error("Error creating email:", error);
      res.status(400).json({ message: "Invalid email data" });
    }
  });

  app.post('/api/emails/:id/generate-response', isAuthenticated, async (req: any, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      const responseBody = await generateEmailResponse({
        subject: email.subject || "",
        body: email.body || "",
        from: email.from,
        context: req.body.context,
        customPrompt: req.body.customPrompt, // Accept custom prompt from frontend
      });
      
      // Update the email with the suggested response
      const updatedEmail = await storage.updateEmail(email.id, undefined, {
        suggestedResponse: responseBody,
      });
      
      res.json({ response: responseBody, email: updatedEmail });
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  app.post('/api/emails/:id/send-response', isAuthenticated, (req: any, res, next) => {
    upload.array('attachments', 10)(req, res, (err) => {
      if (err) {
        // Handle Multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ 
              message: "Fichier trop volumineux",
              error: "Un ou plusieurs fichiers dépassent la taille maximale de 15 MB"
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
              message: "Trop de fichiers",
              error: "Vous ne pouvez joindre que 10 fichiers maximum"
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
              message: "Fichier inattendu",
              error: "Nom de champ invalide pour les fichiers"
            });
          }
          return res.status(400).json({ 
            message: "Erreur de téléchargement",
            error: err.message
          });
        }
        // Handle other errors (e.g., file type validation)
        return res.status(400).json({ 
          message: "Type de fichier non autorisé",
          error: err.message
        });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const { responseText } = req.body;
      const files = req.files as Express.Multer.File[] | undefined;

      // Validate response text
      if (!responseText || responseText.trim().length === 0) {
        return res.status(400).json({ message: "Response text is required" });
      }

      // Get email (shared inbox - no ownership check)
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Get email account for SMTP credentials
      const emailAccount = await storage.getEmailAccountById(email.emailAccountId);
      if (!emailAccount) {
        return res.status(404).json({ message: "Email account not found" });
      }

      // Prepare attachments if any
      const attachments = files?.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      })) || [];

      console.log(`[Email Response] Sending response with ${attachments.length} attachment(s)`);

      // Send email via SMTP
      const sendResult = await sendEmailResponse(emailAccount, {
        to: email.from,
        subject: email.subject || "Re: (no subject)",
        body: responseText,
        inReplyTo: email.messageId,
        references: email.messageId,
        attachments,
      });

      if (!sendResult.success) {
        return res.status(500).json({ 
          message: "Failed to send email", 
          error: sendResult.error 
        });
      }

      // Update email record
      const updatedEmail = await storage.updateEmail(email.id, undefined, {
        sentResponse: responseText,
        respondedAt: new Date(),
        status: "traite",
      });

      // Automatically complete associated tasks
      await storage.completeTasksForProcessedEmail(email.id);

      res.json({ 
        success: true, 
        email: updatedEmail,
        messageId: sendResult.messageId 
      });
    } catch (error) {
      console.error("Error sending response:", error);
      res.status(500).json({ message: "Failed to send response" });
    }
  });

  // Bulk update status - generic route for any status change
  app.patch('/api/emails/bulk/update-status', isAuthenticated, async (req: any, res) => {
    try {
      const { emailIds, status } = req.body;

      // Validate request
      if (!Array.isArray(emailIds) || emailIds.length === 0) {
        return res.status(400).json({ message: "Email IDs array is required" });
      }

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Validate status value
      const validStatuses = ['nouveau', 'en_cours', 'traite', 'archive'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Update all emails (shared inbox - no ownership check)
      const updateResults = await Promise.allSettled(
        emailIds.map(async (emailId: string, index: number) => {
          const email = await storage.getEmailById(emailId);
          if (!email) {
            throw new Error(`Email ${emailId} not found`);
          }
          await storage.updateEmail(emailId, undefined, { status });
          
          // If status is "traite", automatically complete associated tasks
          if (status === 'traite') {
            await storage.completeTasksForProcessedEmail(emailId);
          }
          
          return { emailId, index };
        })
      );

      const successCount = updateResults.filter(r => r.status === 'fulfilled').length;
      const failureCount = updateResults.filter(r => r.status === 'rejected').length;
      
      // Extract failed email IDs using their preserved indices
      const failedIds = updateResults
        .map((result, originalIndex) => 
          result.status === 'rejected' ? emailIds[originalIndex] : null
        )
        .filter((id): id is string => id !== null);

      res.json({ 
        success: true,
        updated: successCount,
        failed: failureCount,
        total: emailIds.length,
        failedIds: failedIds,
        status: status
      });
    } catch (error) {
      console.error("Error bulk updating email status:", error);
      res.status(500).json({ message: "Failed to update email status" });
    }
  });

  // Bulk route MUST come before the parameterized :id route to avoid conflicts
  app.patch('/api/emails/bulk/mark-processed', isAuthenticated, async (req: any, res) => {
    try {
      const { emailIds } = req.body;

      // Validate request
      if (!Array.isArray(emailIds) || emailIds.length === 0) {
        return res.status(400).json({ message: "Email IDs array is required" });
      }

      // Update all emails (shared inbox - no ownership check)
      // Map with index to track which email failed
      const updateResults = await Promise.allSettled(
        emailIds.map(async (emailId: string, index: number) => {
          const email = await storage.getEmailById(emailId);
          if (!email) {
            throw new Error(`Email ${emailId} not found`);
          }
          await storage.updateEmail(emailId, undefined, { status: "traite" });
          
          // Automatically complete associated tasks
          await storage.completeTasksForProcessedEmail(emailId);
          
          return { emailId, index };
        })
      );

      const successCount = updateResults.filter(r => r.status === 'fulfilled').length;
      const failureCount = updateResults.filter(r => r.status === 'rejected').length;
      
      // Extract failed email IDs using their preserved indices
      const failedIds = updateResults
        .map((result, originalIndex) => 
          result.status === 'rejected' ? emailIds[originalIndex] : null
        )
        .filter((id): id is string => id !== null);

      res.json({ 
        success: true,
        processed: successCount,
        failed: failureCount,
        total: emailIds.length,
        failedIds: failedIds
      });
    } catch (error) {
      console.error("Error bulk marking emails as processed:", error);
      res.status(500).json({ message: "Failed to mark emails as processed" });
    }
  });

  app.patch('/api/emails/:id/mark-processed', isAuthenticated, async (req: any, res) => {
    try {
      // Get email (shared inbox - no ownership check)
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Update email status to processed without sending a response
      const updatedEmail = await storage.updateEmail(email.id, undefined, {
        status: "traite",
      });

      // Automatically complete associated tasks
      await storage.completeTasksForProcessedEmail(email.id);

      res.json({ 
        success: true, 
        email: updatedEmail 
      });
    } catch (error) {
      console.error("Error marking email as processed:", error);
      res.status(500).json({ message: "Failed to mark email as processed" });
    }
  });

  app.patch('/api/emails/:id/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      // Get email (shared inbox - no ownership check)
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Mark email as read
      const updatedEmail = await storage.updateEmail(email.id, undefined, {
        isRead: true,
      });

      res.json({ 
        success: true, 
        email: updatedEmail 
      });
    } catch (error) {
      console.error("Error marking email as read:", error);
      res.status(500).json({ message: "Failed to mark email as read" });
    }
  });

  app.get('/api/emails/:id/responses', isAuthenticated, async (req, res) => {
    try {
      const responses = await storage.getEmailResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching email responses:", error);
      res.status(500).json({ message: "Failed to fetch email responses" });
    }
  });

  app.patch('/api/email-responses/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const response = await storage.updateEmailResponse(req.params.id, {
        isApproved: true,
        approvedById: userId,
      });
      res.json(response);
    } catch (error) {
      console.error("Error approving response:", error);
      res.status(500).json({ message: "Failed to approve response" });
    }
  });

  app.post('/api/email-responses/:id/send', isAuthenticated, async (req, res) => {
    try {
      const response = await storage.getEmailResponseById(req.params.id);
      if (!response) {
        return res.status(404).json({ message: "Email response not found" });
      }
      
      if (!response.isApproved) {
        return res.status(400).json({ message: "Response must be approved before sending" });
      }
      
      // TODO: Implement actual email sending via SMTP
      // For now, just mark as sent
      const updatedResponse = await storage.updateEmailResponse(req.params.id, {
        isSent: true,
        sentAt: new Date(),
      });
      
      res.json(updatedResponse);
    } catch (error) {
      console.error("Error sending response:", error);
      res.status(500).json({ message: "Failed to send response" });
    }
  });

  // Advanced sentiment analysis routes
  app.get('/api/emails/high-risk', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const allEmails = await storage.getEmails(userId, {});
      
      // Filter emails with high or critical risk levels
      const highRiskEmails = allEmails.filter(email => {
        const aiAnalysis = email.aiAnalysis as any;
        return aiAnalysis?.riskLevel === 'high' || aiAnalysis?.riskLevel === 'critical';
      });
      
      // Sort by risk level (critical first) and receivedAt (most recent first)
      highRiskEmails.sort((a, b) => {
        const aAnalysis = a.aiAnalysis as any;
        const bAnalysis = b.aiAnalysis as any;
        const aRisk = aAnalysis?.riskLevel || 'none';
        const bRisk = bAnalysis?.riskLevel || 'none';
        
        // Critical > High
        if (aRisk === 'critical' && bRisk !== 'critical') return -1;
        if (bRisk === 'critical' && aRisk !== 'critical') return 1;
        
        // Sort by date if same risk level
        return b.receivedAt.getTime() - a.receivedAt.getTime();
      });
      
      res.json(highRiskEmails);
    } catch (error) {
      console.error("Error fetching high-risk emails:", error);
      res.status(500).json({ message: "Failed to fetch high-risk emails" });
    }
  });

  app.get('/api/emails/action-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const allEmails = await storage.getEmails(userId, {});
      
      // Extract all action recommendations from emails
      const recommendations = allEmails
        .filter(email => {
          const aiAnalysis = email.aiAnalysis as any;
          return aiAnalysis?.actionRecommendations && aiAnalysis.actionRecommendations.length > 0;
        })
        .map(email => {
          const aiAnalysis = email.aiAnalysis as any;
          return {
            emailId: email.id,
            emailSubject: email.subject,
            emailFrom: email.from,
            receivedAt: email.receivedAt,
            riskLevel: aiAnalysis.riskLevel,
            recommendations: aiAnalysis.actionRecommendations,
          };
        });
      
      // Priority ranking map: immediate > high > normal
      const priorityRank = {
        immediate: 3,
        high: 2,
        normal: 1,
      };
      
      // Sort by priority (immediate > high > normal) and date
      recommendations.sort((a, b) => {
        // Get highest priority from each email's recommendations
        const aMaxPriority = Math.max(
          ...a.recommendations.map((r: any) => priorityRank[r.priority as keyof typeof priorityRank] || 0)
        );
        const bMaxPriority = Math.max(
          ...b.recommendations.map((r: any) => priorityRank[r.priority as keyof typeof priorityRank] || 0)
        );
        
        // Sort by priority first
        if (aMaxPriority !== bMaxPriority) {
          return bMaxPriority - aMaxPriority; // Higher priority first
        }
        
        // If same priority, sort by date (most recent first)
        return b.receivedAt.getTime() - a.receivedAt.getTime();
      });
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching action recommendations:", error);
      res.status(500).json({ message: "Failed to fetch action recommendations" });
    }
  });

  // Reminders (relances)
  app.get('/api/reminders', isAuthenticated, async (req, res) => {
    try {
      const { emailId } = req.query;
      const reminders = await storage.getReminders(emailId as string);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.get('/api/emails/:id/reminders', isAuthenticated, async (req, res) => {
    try {
      const reminders = await storage.getReminders(req.params.id);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching email reminders:", error);
      res.status(500).json({ message: "Failed to fetch email reminders" });
    }
  });

  app.patch('/api/reminders/:id/send', isAuthenticated, async (req, res) => {
    try {
      const reminder = await storage.getReminderById(req.params.id);
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }

      // TODO: Implement actual email sending via SMTP
      // For now, just mark as sent
      const updatedReminder = await storage.updateReminder(req.params.id, {
        isSent: true,
        sentAt: new Date(),
      });

      res.json(updatedReminder);
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  app.patch('/api/reminders/:id/mark-response-received', isAuthenticated, async (req, res) => {
    try {
      const updatedReminder = await storage.updateReminder(req.params.id, {
        responseReceived: true,
        responseReceivedAt: new Date(),
      });
      res.json(updatedReminder);
    } catch (error) {
      console.error("Error marking reminder response:", error);
      res.status(500).json({ message: "Failed to mark reminder response" });
    }
  });

  // Get documents for a specific email
  app.get('/api/emails/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      // Verify the email exists and user has access to it
      const email = await storage.getEmailById(req.params.id, req.session.user?.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found or access denied" });
      }
      
      const documents = await storage.getDocumentsByEmailId(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching email documents:", error);
      res.status(500).json({ message: "Failed to fetch email documents" });
    }
  });

  // Documents
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const { type, search } = req.query;
      const documents = await storage.getDocuments({
        type: type as string,
        search: search as string,
      });
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Download document from Google Drive
  app.get('/api/documents/:id/download', isAuthenticated, async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify document is associated with an email (shared inbox - no ownership check)
      if (!document.emailId) {
        return res.status(400).json({ message: "Document not associated with any email" });
      }
      const email = await storage.getEmailById(document.emailId);
      if (!email) {
        return res.status(404).json({ message: "Associated email not found" });
      }

      if (!document.driveFileId) {
        return res.status(400).json({ message: "Document not in Google Drive" });
      }

      console.log(`[Download] Downloading document: ${document.filename} from Drive`);
      const fileBuffer = await downloadFileFromDrive(document.driveFileId);
      
      // Sanitize filename to prevent header injection
      const safeFilename = document.filename
        .replace(/["\r\n]/g, '') // Remove quotes and newlines
        .replace(/[^\w\s.-]/g, '_'); // Replace special chars with underscore
      
      // Set appropriate headers for download
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // OCR processing for documents
  app.post('/api/documents/:id/ocr', isAuthenticated, async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if already processed
      if (document.ocrProcessed) {
        return res.json({ 
          message: "Document already processed", 
          text: document.ocrText 
        });
      }

      // Download file from Google Drive
      if (!document.driveFileId) {
        return res.status(400).json({ message: "Document not in Google Drive" });
      }

      console.log(`[OCR] Processing document: ${document.filename}`);
      const fileBuffer = await downloadFileFromDrive(document.driveFileId);
      
      // Process with OCR
      const result = await processDocument(fileBuffer, document.mimeType);
      
      // Update document with OCR results
      const updatedDocument = await storage.updateDocument(req.params.id, {
        ocrText: result.text,
        ocrProcessed: true,
      });

      console.log(`[OCR] Processed document ${document.id}: ${result.text.length} chars extracted via ${result.method}`);
      
      res.json({
        text: result.text,
        method: result.method,
        charsExtracted: result.text.length,
        warning: result.warning,
        document: updatedDocument,
      });
    } catch (error) {
      console.error("Error processing OCR:", error);
      res.status(500).json({ message: "Failed to process OCR" });
    }
  });

  // Appointments
  app.get('/api/appointments', isAuthenticated, async (req, res) => {
    try {
      const { start, end } = req.query;
      const appointments = await storage.getAppointments({
        start: start as string,
        end: end as string,
      });
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const aptData = { ...req.body, createdById: userId };
      
      // Convert and validate ISO date strings to Date objects
      if (aptData.startTime) {
        aptData.startTime = new Date(aptData.startTime);
        if (isNaN(aptData.startTime.getTime())) {
          return res.status(400).json({ message: "Invalid start time" });
        }
      }
      if (aptData.endTime) {
        aptData.endTime = new Date(aptData.endTime);
        if (isNaN(aptData.endTime.getTime())) {
          return res.status(400).json({ message: "Invalid end time" });
        }
      }
      
      // Generate AI suggestions
      if (aptData.title) {
        const suggestions = await generateAppointmentSuggestions({
          title: aptData.title,
          description: aptData.description,
          attendees: aptData.attendees,
        });
        aptData.aiSuggestions = suggestions;
      }
      
      const appointment = await storage.createAppointment(aptData);
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ message: "Invalid appointment data" });
    }
  });

  app.patch('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Convert and validate ISO date strings to Date objects
      if (updates.startTime) {
        updates.startTime = new Date(updates.startTime);
        if (isNaN(updates.startTime.getTime())) {
          return res.status(400).json({ message: "Invalid start time" });
        }
      }
      if (updates.endTime) {
        updates.endTime = new Date(updates.endTime);
        if (isNaN(updates.endTime.getTime())) {
          return res.status(400).json({ message: "Invalid end time" });
        }
      }
      
      // Regenerate AI suggestions if title or description changed
      if (updates.title || updates.description) {
        const appointment = await storage.getAppointmentById(id);
        if (appointment) {
          const suggestions = await generateAppointmentSuggestions({
            title: updates.title || appointment.title,
            description: updates.description || appointment.description,
            attendees: updates.attendees || appointment.attendees,
          });
          updates.aiSuggestions = suggestions;
        }
      }
      
      const updatedAppointment = await storage.updateAppointment(id, updates);
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Rendez-vous introuvable" });
      }
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ message: "Erreur lors de la modification du rendez-vous" });
    }
  });

  app.delete('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAppointment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Rendez-vous introuvable" });
      }
      res.json({ message: "Rendez-vous annulé avec succès" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Erreur lors de l'annulation du rendez-vous" });
    }
  });

  // Alerts
  app.get('/api/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const isAdmin = user.role === 'admin';
      const { resolved, limit } = req.query;
      
      let filters: any = {
        resolved: resolved === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
      };
      
      if (isAdmin) {
        // Admins see all alerts - no userId filter
        filters.userId = undefined;
      } else {
        // Regular users see their own alerts + alerts created by admins
        const adminUsers = await storage.getAllUsers();
        const adminUserIds = adminUsers
          .filter(u => u.role === 'admin')
          .map(u => u.id);
        
        filters.userId = user.id;
        filters.adminUserIds = adminUserIds;
      }
      
      const alerts = await storage.getAlerts(filters);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post('/api/alerts', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(400).json({ message: "Invalid alert data" });
    }
  });

  app.get('/api/alerts/:id/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const emailIds = await storage.getAlertEmails(req.params.id);
      const emails = [];
      
      // Only return emails that belong to the authenticated user
      for (const emailId of emailIds) {
        const email = await storage.getEmailById(emailId);
        if (email && email.userId === userId) {
          emails.push(email);
        }
      }
      
      // If no emails were found for this user, either the alert doesn't exist
      // or the user doesn't have permission to view it
      if (emailIds.length > 0 && emails.length === 0) {
        return res.status(403).json({ message: "Accès non autorisé à cette alerte" });
      }
      
      res.json(emails);
    } catch (error) {
      console.error("Error fetching alert emails:", error);
      res.status(500).json({ message: "Failed to fetch alert emails" });
    }
  });

  app.post('/api/alerts/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const alert = await storage.resolveAlert(req.params.id, userId);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  app.post('/api/alerts/bulk-resolve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { alertIds } = req.body;

      if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({ message: "Alert IDs are required" });
      }

      const count = await storage.resolveBulkAlerts(alertIds, userId);
      res.json({ count, message: `${count} alerte(s) résolue(s)` });
    } catch (error) {
      console.error("Error resolving alerts in bulk:", error);
      res.status(500).json({ message: "Failed to resolve alerts" });
    }
  });

  app.post('/api/alerts/generate', isAuthenticated, async (req, res) => {
    try {
      const { AlertService } = await import('./alertService');
      const alertService = new AlertService(storage);
      const result = await alertService.generateAlerts();
      res.json(result);
    } catch (error) {
      console.error("Error generating alerts:", error);
      res.status(500).json({ message: "Failed to generate alerts" });
    }
  });

  // Alert Rules (règles d'alertes personnalisées)
  app.post('/api/alert-rules', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Le prompt est requis" });
      }

      // Import the function dynamically to avoid circular dependencies
      const { interpretAlertPrompt } = await import('./openai');
      
      // Use AI to interpret the prompt and generate the rule structure
      const { name, ruleData, severity } = await interpretAlertPrompt(prompt);
      
      // Import schema dynamically
      const { insertAlertRuleSchema } = await import("@shared/schema");
      
      // Create the alert rule
      const alertRuleData = {
        name,
        prompt,
        ruleData,
        severity,
        createdById: (req.user as any).id,
        isActive: true,
      };
      
      const validatedData = insertAlertRuleSchema.parse(alertRuleData);
      const rule = await storage.createAlertRule(validatedData);
      
      res.json(rule);
    } catch (error: any) {
      console.error("Error creating alert rule:", error);
      res.status(400).json({ message: error.message || "Impossible de créer la règle d'alerte" });
    }
  });

  app.get('/api/alert-rules', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isActive } = req.query;
      const rules = await storage.getAlertRules({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });
      res.json(rules);
    } catch (error) {
      console.error("Error fetching alert rules:", error);
      res.status(500).json({ message: "Failed to fetch alert rules" });
    }
  });

  app.get('/api/alert-rules/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const rule = await storage.getAlertRuleById(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: "Règle d'alerte non trouvée" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error fetching alert rule:", error);
      res.status(500).json({ message: "Failed to fetch alert rule" });
    }
  });

  app.patch('/api/alert-rules/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // If prompt is updated, re-interpret it
      if (updateData.prompt) {
        const { interpretAlertPrompt } = await import('./openai');
        const { name, ruleData, severity } = await interpretAlertPrompt(updateData.prompt);
        updateData.name = name;
        updateData.ruleData = ruleData;
        updateData.severity = severity;
      }
      
      const rule = await storage.updateAlertRule(id, updateData);
      res.json(rule);
    } catch (error: any) {
      console.error("Error updating alert rule:", error);
      res.status(400).json({ message: error.message || "Failed to update alert rule" });
    }
  });

  app.delete('/api/alert-rules/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAlertRule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting alert rule:", error);
      res.status(500).json({ message: "Failed to delete alert rule" });
    }
  });

  // Tasks (Tâches à réaliser)
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { status, emailId } = req.query;
      const user = req.user as any;
      const isAdmin = user.role === 'admin';
      
      let filters: any = {
        status: status as string | undefined,
        emailId: emailId as string | undefined,
      };
      
      if (isAdmin) {
        // Admins see all tasks - no userId filter
        filters.userId = undefined;
      } else {
        // Regular users see their own tasks + tasks created by admins
        const adminUsers = await storage.getAllUsers();
        const adminUserIds = adminUsers
          .filter(u => u.role === 'admin')
          .map(u => u.id);
        
        filters.userId = user.id;
        filters.adminUserIds = adminUserIds;
      }
      
      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { insertTaskSchema } = await import("@shared/schema");
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        createdById: (req.user as any).id,
      });
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.patch('/api/tasks/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['nouveau', 'en_cours', 'termine'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const task = await storage.updateTaskStatus(id, status);
      res.json(task);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  app.patch('/api/tasks/:id/assign', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { assignedToId } = req.body;
      
      // assignedToId peut être null pour désassigner
      const task = await storage.updateTaskAssignment(id, assignedToId);
      res.json(task);
    } catch (error) {
      console.error("Error updating task assignment:", error);
      res.status(500).json({ message: "Failed to update task assignment" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Tags
  // GET is accessible to all authenticated users (tags are used throughout the app)
  app.get('/api/tags', isAuthenticated, async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post('/api/tags', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.delete('/api/tags/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteTag(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Email Categories
  // GET is accessible to all authenticated users (read-only)
  app.get('/api/email-categories', isAuthenticated, async (req, res) => {
    try {
      const { emailAccountId } = req.query;
      
      // If emailAccountId is provided, return categories for that account (system + custom)
      // Otherwise, return all categories
      const categories = emailAccountId 
        ? await storage.getEmailCategoriesForAccount(emailAccountId as string)
        : await storage.getAllEmailCategories();
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching email categories:", error);
      res.status(500).json({ message: "Failed to fetch email categories" });
    }
  });

  app.post('/api/email-categories', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertEmailCategorySchema } = await import("@shared/schema");
      const validatedData = insertEmailCategorySchema.parse(req.body);
      const category = await storage.createEmailCategory(validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating email category:", error);
      res.status(400).json({ message: "Invalid email category data" });
    }
  });

  app.patch('/api/email-categories/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updated = await storage.updateEmailCategory(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating email category:", error);
      res.status(500).json({ message: "Failed to update email category" });
    }
  });

  app.delete('/api/email-categories/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Check if category is system category
      const category = await storage.getAllEmailCategories();
      const toDelete = category.find(c => c.id === req.params.id);
      if (toDelete?.isSystem) {
        return res.status(400).json({ message: "Cannot delete system category" });
      }
      // Check if it's the 'autre' category (required as fallback)
      if (toDelete?.key === 'autre') {
        return res.status(400).json({ message: "Cannot delete the 'autre' category - it is required as a fallback" });
      }
      await storage.deleteEmailCategory(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting email category:", error);
      // Return specific error message if available
      if (error.message && error.message.includes("autre")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete email category" });
    }
  });

  // Settings
  app.get('/api/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings/:key', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await storage.upsertSetting({ key, value });
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Cloud Storage Configurations - Users can manage their own configurations
  app.get('/api/cloud-storage-configs', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const configs = await storage.getAllCloudStorageConfigs(userId);
      res.json(configs);
    } catch (error) {
      console.error("Error fetching cloud storage configs:", error);
      res.status(500).json({ message: "Failed to fetch cloud storage configurations" });
    }
  });

  app.post('/api/cloud-storage-configs', isAuthenticated, async (req, res) => {
    try {
      const { insertCloudStorageConfigSchema } = await import("@shared/schema");
      const userId = req.user!.id;
      
      // Validate and ensure userId matches authenticated user
      const validatedData = insertCloudStorageConfigSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if config already exists for this provider
      const existingConfig = await storage.getCloudStorageConfig(userId, validatedData.provider);
      if (existingConfig) {
        return res.status(400).json({ 
          message: `Configuration already exists for ${validatedData.provider}. Please update the existing configuration.` 
        });
      }
      
      const config = await storage.createCloudStorageConfig(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error creating cloud storage config:", error);
      res.status(400).json({ message: "Invalid cloud storage configuration data" });
    }
  });

  app.patch('/api/cloud-storage-configs/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const configId = req.params.id;
      
      // Verify ownership - get all configs for this user
      const userConfigs = await storage.getAllCloudStorageConfigs(userId);
      const configToUpdate = userConfigs.find(c => c.id === configId);
      
      if (!configToUpdate) {
        return res.status(404).json({ message: "Cloud storage configuration not found" });
      }
      
      const updated = await storage.updateCloudStorageConfig(configId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating cloud storage config:", error);
      res.status(500).json({ message: "Failed to update cloud storage configuration" });
    }
  });

  app.delete('/api/cloud-storage-configs/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const configId = req.params.id;
      
      // Verify ownership
      const userConfigs = await storage.getAllCloudStorageConfigs(userId);
      const configToDelete = userConfigs.find(c => c.id === configId);
      
      if (!configToDelete) {
        return res.status(404).json({ message: "Cloud storage configuration not found" });
      }
      
      await storage.deleteCloudStorageConfig(configId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cloud storage config:", error);
      res.status(500).json({ message: "Failed to delete cloud storage configuration" });
    }
  });

  // Email scanning endpoints
  app.post('/api/email-scan', isAuthenticated, async (req, res) => {
    try {
      console.log('[API] Starting email scan for all accounts...');
      const results = await emailScanner.scanAllAccounts();
      res.json({
        success: true,
        results,
        summary: {
          totalScanned: Object.values(results).reduce((sum, r) => sum + r.scanned, 0),
          totalCreated: Object.values(results).reduce((sum, r) => sum + r.created, 0),
          totalErrors: Object.values(results).reduce((sum, r) => sum + r.errors, 0),
        }
      });
    } catch (error) {
      console.error("Error scanning emails:", error);
      res.status(500).json({ message: "Failed to scan emails", error: String(error) });
    }
  });

  app.post('/api/email-scan/:accountId', isAuthenticated, async (req, res) => {
    try {
      const { accountId } = req.params;
      const accounts = await storage.getAllEmailAccounts();
      const account = accounts.find(a => a.id === accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }

      console.log(`[API] Starting email scan for account: ${account.email}`);
      const result = await emailScanner.scanAccount(account);
      res.json({ success: true, result });
    } catch (error) {
      console.error("Error scanning email account:", error);
      res.status(500).json({ message: "Failed to scan email account", error: String(error) });
    }
  });

  // User management
  // GET /api/users - accessible to all authenticated users (for task assignment)
  // Only returns safe user fields (no passwordHash)
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove sensitive fields before sending response
      const safeUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { sendWelcomeEmail: sendEmail, generateTemporaryPassword } = await import('./emailService');
      
      const validatedData = insertUserSchema.parse(req.body);
      
      // Normalize email: trim and lowercase
      const normalizedEmail = validatedData.email?.trim().toLowerCase();
      
      // Generate a temporary password for the new user
      const temporaryPassword = generateTemporaryPassword();
      
      console.log(`[API] Generated temporary password for ${normalizedEmail} (length: ${temporaryPassword.length})`);
      console.log(`[API] Password preview (first 4 chars): ${temporaryPassword.substring(0, 4)}...`);
      
      // Hash the password for secure storage
      const passwordHash = await hashPassword(temporaryPassword);
      
      console.log(`[API] Password hashed successfully`);
      
      // Create the user with hashed password (using normalized email)
      const user = await storage.upsertUser({
        ...validatedData,
        email: normalizedEmail,
        passwordHash,
      });
      
      // Send welcome email with temporary password via admin's email account
      try {
        // Get admin's active email account
        const adminId = (req.user as any).id;
        const adminEmailAccounts = await storage.getEmailAccounts(adminId);
        const activeAccount = adminEmailAccounts.find(acc => acc.isActive);
        
        if (!activeAccount) {
          console.warn('[API] No active email account found for admin - skipping welcome email');
        } else {
          await sendEmail({
            to: user.email!,
            firstName: user.firstName || 'Utilisateur',
            lastName: user.lastName || '',
            temporaryPassword,
            adminEmailAccount: activeAccount,
          });
          console.log(`[API] Welcome email sent to ${user.email} via SMTP (${activeAccount.email})`);
        }
      } catch (emailError) {
        console.error('[API] Failed to send welcome email:', emailError);
        // Don't fail the user creation if email sending fails
      }
      
      // Don't return passwordHash in response
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;

      // Prevent self-deletion
      if (id === currentUserId) {
        return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
      }

      // Get the user to be deleted
      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // If deleting an admin, ensure at least one admin remains
      if (userToDelete.role === 'admin') {
        const allUsers = await storage.getAllUsers();
        const adminCount = allUsers.filter(u => u.role === 'admin').length;
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: "Impossible de supprimer le dernier administrateur. Il doit y avoir au moins un administrateur dans le système." 
          });
        }
      }

      // Delete the user (cascade will delete related data)
      await storage.deleteUser(id);
      
      console.log(`[API] User ${userToDelete.email} deleted by ${req.user.email}`);
      res.json({ success: true, message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Impossible de supprimer l'utilisateur" });
    }
  });

  // Stripe integration - Create subscription
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe] Missing STRIPE_SECRET_KEY - payment routes will not be available');
  }
  
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
  }) : null;

  // Pricing configuration
  const PRICING_PLANS = {
    starter: {
      priceMonthly: 5900, // €59.00 in cents
      name: 'Starter',
      users: '1-5',
      emailsPerMonth: 500,
    },
    professional: {
      priceMonthly: 14900, // €149.00 in cents
      name: 'Professional',
      users: '5-20',
      emailsPerMonth: 2000,
    },
    enterprise: {
      priceMonthly: 39900, // €399.00 in cents
      name: 'Enterprise',
      users: '20-100',
      emailsPerMonth: 'Illimité',
    },
  };

  app.post('/api/create-subscription', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: 'Service de paiement non configuré' });
    }

    try {
      const { plan, email, firstName, lastName } = req.body;

      if (!plan || !email || !firstName || !lastName) {
        return res.status(400).json({ message: 'Données manquantes (plan, email, firstName, lastName requis)' });
      }

      if (!['starter', 'professional', 'enterprise'].includes(plan)) {
        return res.status(400).json({ message: 'Plan invalide' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Un compte existe déjà avec cet email' });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        metadata: {
          plan,
        },
      });

      // Create subscription with 5th of month billing
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `IzyInbox ${PRICING_PLANS[plan as keyof typeof PRICING_PLANS].name}`,
              description: `Plan ${PRICING_PLANS[plan as keyof typeof PRICING_PLANS].name} - ${PRICING_PLANS[plan as keyof typeof PRICING_PLANS].users} utilisateurs`,
            },
            unit_amount: PRICING_PLANS[plan as keyof typeof PRICING_PLANS].priceMonthly,
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        billing_cycle_anchor_config: {
          day_of_month: 5, // Bill on the 5th of each month
        },
        metadata: {
          email,
          firstName,
          lastName,
          plan,
        },
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        customerId: customer.id,
        clientSecret: paymentIntent.client_secret,
        plan,
      });
    } catch (error: any) {
      console.error('[Stripe] Error creating subscription:', error);
      res.status(500).json({ message: 'Erreur lors de la création de l\'abonnement', error: error.message });
    }
  });

  // Stripe webhook to handle payment confirmations
  app.post('/api/stripe-webhook', async (req, res) => {
    if (!stripe) {
      return res.status(503).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Stripe] Missing STRIPE_WEBHOOK_SECRET');
      return res.status(500).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe] Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe] Received event: ${event.type}`);

    try {
      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        
        // Check if this is the first payment (create user)
        if (invoice.billing_reason === 'subscription_create') {
          const metadata = subscription.metadata;
          const { email, firstName, lastName, plan } = metadata;

          // Generate temporary password
          const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);

          // Create admin user with password
          const user = await storage.createUserWithPassword(
            email,
            tempPassword,
            firstName,
            lastName,
            plan,
            subscription.customer as string,
            subscription.id
          );

          console.log(`[Stripe] Created new admin user: ${email} for plan ${plan}`);

          // Send welcome email with credentials (using Resend)
          try {
            const { Resend } = require('resend');
            const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
            
            if (resend) {
              await resend.emails.send({
                from: 'IzyInbox <onboarding@izyinbox.com>',
                to: email,
                subject: 'Bienvenue sur IzyInbox - Vos identifiants de connexion',
                html: `
                  <h1>Bienvenue sur IzyInbox !</h1>
                  <p>Bonjour ${firstName},</p>
                  <p>Votre souscription au plan <strong>${PRICING_PLANS[plan as keyof typeof PRICING_PLANS].name}</strong> a été confirmée avec succès.</p>
                  
                  <h2>Vos identifiants de connexion :</h2>
                  <ul>
                    <li><strong>Email :</strong> ${email}</li>
                    <li><strong>Mot de passe temporaire :</strong> ${tempPassword}</li>
                  </ul>
                  
                  <p><strong>Important :</strong> Nous vous recommandons de changer ce mot de passe lors de votre première connexion.</p>
                  
                  <p>Vous serez prélevé automatiquement le 5 de chaque mois pour un montant de ${(PRICING_PLANS[plan as keyof typeof PRICING_PLANS].priceMonthly / 100).toFixed(2)}€.</p>
                  
                  <p>Connectez-vous dès maintenant : <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/login">Accéder à IzyInbox</a></p>
                  
                  <p>À bientôt,<br>L'équipe IzyInbox</p>
                `,
              });
              console.log(`[Resend] Welcome email sent to ${email}`);
            } else {
              console.warn('[Resend] API key not configured - skipping welcome email');
            }
          } catch (emailError) {
            console.error('[Resend] Error sending welcome email:', emailError);
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[Stripe] Error processing webhook:', error);
      res.status(500).json({ message: 'Error processing webhook' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

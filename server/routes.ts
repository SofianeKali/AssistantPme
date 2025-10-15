import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { isAdmin } from "./middleware";
import { analyzeEmail, generateEmailResponse, generateAppointmentSuggestions } from "./openai";
import { insertEmailAccountSchema, insertTagSchema, insertEmailSchema, insertAlertSchema, insertUserSchema } from "@shared/schema";
import { EmailScanner } from "./emailScanner";
import { processDocument } from "./ocrService";
import { downloadFileFromDrive } from "./googleDrive";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Initialize email scanner
  const emailScanner = new EmailScanner(storage);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
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

  // Email accounts
  app.get('/api/email-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getEmailAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching email accounts:", error);
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  app.post('/api/email-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmailAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createEmailAccount(validatedData);
      res.json(account);
    } catch (error) {
      console.error("Error creating email account:", error);
      res.status(400).json({ message: "Invalid email account data" });
    }
  });

  app.delete('/api/email-accounts/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteEmailAccount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email account:", error);
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  // Emails
  app.get('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, status, search } = req.query;
      const emails = await storage.getEmails(userId, {
        type: type as string,
        status: status as string,
        search: search as string,
      });
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.post('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const emailData = req.body;
      
      // Analyze email with GPT (with advanced sentiment analysis)
      const analysis = await analyzeEmail({
        subject: emailData.subject,
        body: emailData.body,
        from: emailData.from,
      });
      
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
      const userId = req.user.claims.sub;
      const email = await storage.getEmailById(req.params.id, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      const responseBody = await generateEmailResponse({
        subject: email.subject || "",
        body: email.body || "",
        from: email.from,
        context: req.body.context,
      });
      
      const emailResponse = await storage.createEmailResponse({
        emailId: email.id,
        generatedBy: "ai",
        subject: `Re: ${email.subject}`,
        body: responseBody,
        isApproved: false,
        isSent: false,
      });
      
      res.json(emailResponse);
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ message: "Failed to generate response" });
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const aptData = { ...req.body, createdById: userId };
      
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

  // Alerts
  app.get('/api/alerts', isAuthenticated, async (req, res) => {
    try {
      const { resolved, limit } = req.query;
      const alerts = await storage.getAlerts({
        resolved: resolved === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
      });
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

  app.post('/api/alerts/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alert = await storage.resolveAlert(req.params.id, userId);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // Tags
  app.get('/api/tags', isAuthenticated, async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post('/api/tags', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.delete('/api/tags/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTag(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Users
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Settings
  app.get('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings/:key', isAuthenticated, async (req, res) => {
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

  // User management (admin only)
  app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { sendWelcomeEmail: sendEmail, generateTemporaryPassword } = await import('./emailService');
      
      const validatedData = insertUserSchema.parse(req.body);
      
      // Generate a temporary password for the new user
      const temporaryPassword = generateTemporaryPassword();
      
      // Create the user (password will be set via Replit Auth on first login)
      const user = await storage.upsertUser(validatedData);
      
      // Send welcome email with temporary password
      // Note: In a real system, we'd hash and store this password
      // For now, we're using Replit Auth which handles authentication differently
      try {
        await sendEmail({
          to: user.email!,
          firstName: user.firstName || 'Utilisateur',
          lastName: user.lastName || '',
          temporaryPassword,
        });
        console.log(`[API] Welcome email sent to ${user.email}`);
      } catch (emailError) {
        console.error('[API] Failed to send welcome email:', emailError);
        // Don't fail the user creation if email sending fails
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

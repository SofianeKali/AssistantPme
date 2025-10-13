import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeEmail, generateEmailResponse, generateAppointmentSuggestions } from "./openai";
import { insertEmailAccountSchema, insertTagSchema, insertEmailSchema, insertAlertSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
  app.get('/api/emails', isAuthenticated, async (req, res) => {
    try {
      const { type, search } = req.query;
      const emails = await storage.getEmails({
        type: type as string,
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
      
      // Analyze email with GPT
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
        },
      });
      
      const email = await storage.createEmail(validatedData);
      res.json(email);
    } catch (error) {
      console.error("Error creating email:", error);
      res.status(400).json({ message: "Invalid email data" });
    }
  });

  app.post('/api/emails/:id/generate-response', isAuthenticated, async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      const response = await generateEmailResponse({
        subject: email.subject || "",
        body: email.body || "",
        from: email.from,
      });
      
      await storage.createEmailResponse({
        emailId: email.id,
        generatedBy: "ai",
        body: response,
        isApproved: false,
        isSent: false,
      });
      
      res.json({ response });
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ message: "Failed to generate response" });
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

  const httpServer = createServer(app);
  return httpServer;
}

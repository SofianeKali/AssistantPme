import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { EmailScheduler } from "./scheduler";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize default email categories for a specific company
export async function createDefaultCategoriesForCompany(companyId: string) {
  const defaultCategories = [
    {
      key: 'autre',
      label: 'Autres',
      color: '#9ca3af', // gray
      icon: 'Mail',
      isSystem: true,
      generateAutoResponse: false, // Don't auto-respond to "other" emails
      autoCreateTask: false,
      autoMarkAsProcessed: false,
      companyId,
    },
    {
      key: 'devis',
      label: 'Devis',
      color: '#3b82f6', // blue
      icon: 'FileText',
      isSystem: true,
      generateAutoResponse: true,
      autoCreateTask: true,
      autoMarkAsProcessed: false,
      companyId,
    },
    {
      key: 'facture',
      label: 'Factures',
      color: '#f59e0b', // amber
      icon: 'DollarSign',
      isSystem: true,
      generateAutoResponse: true,
      autoCreateTask: true,
      autoMarkAsProcessed: false,
      companyId,
    },
    {
      key: 'rdv',
      label: 'Rendez-vous',
      color: '#10b981', // emerald
      icon: 'Calendar',
      isSystem: true,
      generateAutoResponse: true,
      autoCreateTask: false,
      autoMarkAsProcessed: false,
      companyId,
    },
  ];

  for (const category of defaultCategories) {
    await storage.createEmailCategory(category);
    console.log(`[Init] Created default category for company ${companyId}: ${category.key}`);
  }
}

// Initialize default settings for document storage for a specific company
export async function createDefaultSettingsForCompany(companyId: string) {
  const defaultSettings = [
    {
      key: 'documentStorageProvider',
      value: 'disabled', // disabled, google_drive, onedrive
      description: 'Provider for document storage (disabled by default)',
      companyId,
    },
    {
      key: 'documentExtractionEnabled',
      value: false,
      description: 'Enable/disable automatic document extraction from email attachments',
      companyId,
    },
  ];

  for (const setting of defaultSettings) {
    await storage.upsertSetting({ key: setting.key, value: setting.value, description: setting.description, companyId });
    console.log(`[Init] Created default setting for company ${companyId}: ${setting.key}`);
  }
}

(async () => {
  const server = await registerRoutes(app);

  // Note: Default categories and settings are now created per-company when companies are created
  // See: replitAuth.ts, routes.ts (trial signup, stripe webhook)

  // Start email scheduler for automatic email scanning
  const emailScheduler = new EmailScheduler(storage);
  emailScheduler.start(15); // Scan every 15 minutes
  console.log('[App] Email scheduler started');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Detect environment: Replit requires 0.0.0.0, but Windows/local dev needs localhost
  // Allow explicit override via HOST env var, or detect Replit presence
  const isReplit = process.env.REPL_ID !== undefined && process.env.REPLIT_DOMAINS !== undefined;
  const host = process.env.HOST || (isReplit ? "0.0.0.0" : "localhost");
  
  server.listen({
    port,
    host,
    reusePort: isReplit, // Only use reusePort on Replit
  }, () => {
    log(`serving on port ${port} (host: ${host})`);
  });
})();

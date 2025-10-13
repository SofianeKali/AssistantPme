import { EmailScanner } from './emailScanner';
import { AlertService } from './alertService';
import type { IStorage } from './storage';

export class EmailScheduler {
  private scanner: EmailScanner;
  private alertService: AlertService;
  private storage: IStorage;
  private emailIntervalId: NodeJS.Timeout | null = null;
  private alertIntervalId: NodeJS.Timeout | null = null;
  private isScanning: boolean = false;
  private isGeneratingAlerts: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.scanner = new EmailScanner(storage);
    this.alertService = new AlertService(storage);
  }

  start(emailIntervalMinutes: number = 15, alertIntervalMinutes: number = 60) {
    if (this.emailIntervalId) {
      console.log('[Scheduler] Email scheduler is already running');
      return;
    }

    console.log(`[Scheduler] Starting email scheduler (interval: ${emailIntervalMinutes} minutes)`);
    console.log(`[Scheduler] Starting alert scheduler (interval: ${alertIntervalMinutes} minutes)`);
    
    // Run email scan immediately on start
    this.scanAllAccounts();
    
    // Run alert generation immediately on start
    this.generateAlerts();

    // Then run email scan periodically
    this.emailIntervalId = setInterval(() => {
      this.scanAllAccounts();
    }, emailIntervalMinutes * 60 * 1000);

    // And run alert generation periodically
    this.alertIntervalId = setInterval(() => {
      this.generateAlerts();
    }, alertIntervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.emailIntervalId) {
      clearInterval(this.emailIntervalId);
      this.emailIntervalId = null;
      console.log('[Scheduler] Email scheduler stopped');
    }
    if (this.alertIntervalId) {
      clearInterval(this.alertIntervalId);
      this.alertIntervalId = null;
      console.log('[Scheduler] Alert scheduler stopped');
    }
  }

  private async scanAllAccounts() {
    if (this.isScanning) {
      console.log('[Scheduler] Scan already in progress, skipping...');
      return;
    }

    this.isScanning = true;
    try {
      console.log('[Scheduler] Starting scheduled email scan...');
      const results = await this.scanner.scanAllAccounts();
      
      const summary = {
        totalScanned: Object.values(results).reduce((sum, r) => sum + r.scanned, 0),
        totalCreated: Object.values(results).reduce((sum, r) => sum + r.created, 0),
        totalErrors: Object.values(results).reduce((sum, r) => sum + r.errors, 0),
      };

      console.log(`[Scheduler] Scan complete - Scanned: ${summary.totalScanned}, Created: ${summary.totalCreated}, Errors: ${summary.totalErrors}`);
    } catch (error) {
      console.error('[Scheduler] Error during scheduled scan:', error);
    } finally {
      this.isScanning = false;
    }
  }

  private async generateAlerts() {
    if (this.isGeneratingAlerts) {
      console.log('[Scheduler] Alert generation already in progress, skipping...');
      return;
    }

    this.isGeneratingAlerts = true;
    try {
      console.log('[Scheduler] Starting scheduled alert generation...');
      const result = await this.alertService.generateAlerts();
      
      console.log(`[Scheduler] Alert generation complete - Created: ${result.created}, Errors: ${result.errors}`);
    } catch (error) {
      console.error('[Scheduler] Error during alert generation:', error);
    } finally {
      this.isGeneratingAlerts = false;
    }
  }
}

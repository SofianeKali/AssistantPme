import { EmailScanner } from './emailScanner';
import type { IStorage } from './storage';

export class EmailScheduler {
  private scanner: EmailScanner;
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isScanning: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.scanner = new EmailScanner(storage);
  }

  start(intervalMinutes: number = 15) {
    if (this.intervalId) {
      console.log('[Scheduler] Email scheduler is already running');
      return;
    }

    console.log(`[Scheduler] Starting email scheduler (interval: ${intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.scanAllAccounts();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.scanAllAccounts();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Scheduler] Email scheduler stopped');
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
}

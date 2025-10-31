import { db } from "./db";
import { emails, emailAccounts } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

/**
 * Backfill script to populate companyId in emails table
 * This script reads emailAccountId from each email and sets companyId from the associated email account
 */
async function backfillEmailsCompanyId() {
  console.log('[Backfill] Starting backfill of emails.companyId...');
  
  try {
    // Update emails.companyId by joining with email_accounts
    // This SQL will update all emails that don't have a companyId yet
    const result = await db.execute(sql`
      UPDATE emails
      SET company_id = email_accounts.company_id
      FROM email_accounts
      WHERE emails.email_account_id = email_accounts.id
        AND emails.company_id IS NULL
    `);
    
    console.log(`[Backfill] Updated ${result.rowCount || 0} emails with companyId`);
    
    // Verify: count emails without companyId
    const [remaining] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(sql`${emails.companyId} IS NULL`);
    
    console.log(`[Backfill] Emails without companyId: ${remaining?.count || 0}`);
    
    if (Number(remaining?.count || 0) === 0) {
      console.log('[Backfill] ✅ All emails now have companyId - ready to make column NOT NULL');
    } else {
      console.error('[Backfill] ⚠️ Some emails still missing companyId - investigate before making column NOT NULL');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[Backfill] Error during backfill:', error);
    process.exit(1);
  }
}

// Run backfill
backfillEmailsCompanyId();

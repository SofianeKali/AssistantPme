import { generateInvoiceHTML } from "./invoiceGenerator";

export interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  currency: string;
  plan: string;
  firstName: string;
  lastName: string;
  email: string;
  invoiceDate: Date;
  dueDate: Date;
}

/**
 * Generate invoice as a downloadable file
 * Returns HTML that can be printed/saved as PDF by browser
 */
export function generateInvoicePDF(data: InvoiceData): Buffer {
  const html = generateInvoiceHTML(data);
  // Convert HTML to Buffer - clients will download and can print to PDF
  return Buffer.from(html, 'utf-8');
}

/**
 * Generate CSV export for multiple invoices
 */
export function generateInvoicesCSV(invoices: any[]): string {
  const headers = ['Numéro', 'Montant (€)', 'Plan', 'Date', 'Statut'];
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    (inv.amount / 100).toFixed(2),
    inv.plan,
    new Date(inv.createdAt).toLocaleDateString('fr-FR'),
    inv.paidAt ? 'Payée' : 'En attente'
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csv;
}

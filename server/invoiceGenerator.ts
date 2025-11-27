// Simple HTML-to-text invoice generator, stored as a text file in memory
// For PDF generation, we'll create a simple downloadable text representation
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

export function generateInvoiceHTML(data: InvoiceData): string {
  const formattedAmount = (data.amount / 100).toFixed(2);
  const invoiceDate = data.invoiceDate.toLocaleDateString('fr-FR');
  const dueDate = data.dueDate.toLocaleDateString('fr-FR');

  const planNames: Record<string, string> = {
    starter: 'Starter - €19/mois',
    professional: 'Professional - €39/mois',
    enterprise: 'Enterprise - €79/mois',
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #003366;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #003366;
      margin-bottom: 10px;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .label {
      font-weight: bold;
      width: 150px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #003366;
      color: white;
    }
    .amount-row {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      color: #003366;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">IzyInbox</div>
    <div>Plateforme d'automatisation administrative intelligente</div>
  </div>

  <div class="invoice-title">FACTURE</div>

  <div class="info-row">
    <div><div class="label">Numéro:</div>${data.invoiceNumber}</div>
    <div><div class="label">Date:</div>${invoiceDate}</div>
  </div>

  <div class="info-row">
    <div><div class="label">Échéance:</div>${dueDate}</div>
  </div>

  <h3>Facturé à:</h3>
  <div>${data.firstName} ${data.lastName}</div>
  <div>${data.email}</div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right; width: 150px;">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Abonnement ${planNames[data.plan] || data.plan}</td>
        <td style="text-align: right;">${formattedAmount} €</td>
      </tr>
      <tr class="amount-row">
        <td>Total</td>
        <td style="text-align: right;" class="total">${formattedAmount} €</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Merci d'avoir choisi IzyInbox</strong></p>
    <p>Cette facture a été automatiquement générée. Pour toute question, veuillez contacter notre support.</p>
    <p>IzyInbox - Plateforme d'automatisation administrative pour PME</p>
  </div>
</body>
</html>
  `;
}

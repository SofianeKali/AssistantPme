import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeEmail(emailContent: {
  subject: string;
  body: string;
  from: string;
}, availableCategories: Array<{ key: string; label: string }> = [
  { key: 'devis', label: 'Devis' },
  { key: 'facture', label: 'Factures' },
  { key: 'rdv', label: 'Rendez-vous' },
  { key: 'autre', label: 'Autres' }
]): Promise<{
  emailType: string;
  priority: string;
  sentiment: string;
  summary: string;
  extractedData: any;
  suggestedTags: string[];
  riskLevel?: string;
  riskFactors?: string[];
  urgencyType?: string;
  conflictIndicators?: string[];
  actionRecommendations?: Array<{ action: string; priority: string; reason: string }>;
}> {
  try {
    // Build category descriptions for the prompt
    const categoryDescriptions = availableCategories
      .filter(cat => cat.key !== 'autre')
      .map(cat => `"${cat.key}" (${cat.label})`)
      .join(', ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in analyzing business emails for a French SME management system with advanced risk detection.
          
Analyze the email and extract:

BASIC CLASSIFICATION:
1. emailType: one of ${categoryDescriptions}, or "autre" (other) if none match
2. priority: one of "urgent", "high", "normal", "low"
3. sentiment: one of "positive", "neutral", "negative"
4. summary: brief summary in French (max 150 chars)
5. extractedData: any relevant data (amounts, dates, contacts)
6. suggestedTags: array of relevant tag suggestions

ADVANCED SENTIMENT ANALYSIS:
7. riskLevel: one of "none", "low", "medium", "high", "critical"
   - "critical": Client threatens legal action, contract termination, public complaints
   - "high": Strong dissatisfaction, mentions competitors, delays causing damages
   - "medium": Complaints, frustrations, unmet expectations
   - "low": Minor concerns, questions about details
   - "none": No risk detected

8. riskFactors: array of specific risk indicators detected (in French)
   Examples: ["Client mécontent du délai", "Menace de résilier le contrat", "Demande un geste commercial"]

9. urgencyType: classification of urgency
   - "real": Actual deadline, legal requirement, critical business impact
   - "perceived": Client feels it's urgent but no concrete deadline
   - "none": No urgency expressed

10. conflictIndicators: array of conflict signals (in French)
    Examples: ["Ton agressif", "Remet en question la qualité", "Compare avec concurrent", "Demande un responsable"]

11. actionRecommendations: array of recommended actions with priority
    Format: [{"action": "Action description in French", "priority": "immediate|high|normal", "reason": "Why this action"}]
    Examples:
    - {"action": "Appeler le client dans l'heure", "priority": "immediate", "reason": "Risque de perte du client"}
    - {"action": "Préparer un geste commercial", "priority": "high", "reason": "Client insatisfait mais récupérable"}

Respond with JSON in this format:
{
  "emailType": "string",
  "priority": "string",
  "sentiment": "string",
  "summary": "string",
  "extractedData": {
    "amount": "number or null",
    "dueDate": "ISO date or null",
    "appointmentDate": "ISO date or null",
    "contact": "string or null"
  },
  "suggestedTags": ["tag1", "tag2"],
  "riskLevel": "string",
  "riskFactors": ["factor1", "factor2"],
  "urgencyType": "string",
  "conflictIndicators": ["indicator1", "indicator2"],
  "actionRecommendations": [
    {"action": "string", "priority": "string", "reason": "string"}
  ]
}`
        },
        {
          role: "user",
          content: `Subject: ${emailContent.subject}\nFrom: ${emailContent.from}\n\nBody:\n${emailContent.body}`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing email:", error);
    return {
      emailType: "general",
      priority: "normal",
      sentiment: "neutral",
      summary: "Analyse non disponible",
      extractedData: {},
      suggestedTags: [],
      riskLevel: "none",
      riskFactors: [],
      urgencyType: "none",
      conflictIndicators: [],
      actionRecommendations: [],
    };
  }
}

export async function generateEmailResponse(emailContent: {
  subject: string;
  body: string;
  from: string;
  context?: string;
  customPrompt?: string;
}): Promise<string> {
  try {
    // Use custom prompt if provided, otherwise use default instructions
    const systemContent = emailContent.customPrompt 
      ? `You are a professional email assistant for a French SME. Generate a response based on the user's specific instructions.
          
Rules:
- Follow the user's instructions carefully
- Use formal French ("vous" form) unless instructed otherwise
- Be professional and polite
- End with appropriate salutations`
      : `You are a professional email assistant for a French SME. Generate polite, professional responses in French.
          
Rules:
- Be concise and professional
- Use formal French ("vous" form)
- Match the tone of the original email
- Include relevant context if provided
- End with appropriate salutations`;

    const userContent = emailContent.customPrompt
      ? `Email to respond to:

Subject: ${emailContent.subject}
From: ${emailContent.from}

${emailContent.body}

${emailContent.context ? `Context: ${emailContent.context}\n\n` : ""}User instructions: ${emailContent.customPrompt}`
      : `Generate a professional response to this email:

Subject: ${emailContent.subject}
From: ${emailContent.from}

${emailContent.body}

${emailContent.context ? `Context: ${emailContent.context}` : ""}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemContent
        },
        {
          role: "user",
          content: userContent
        }
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating response:", error);
    return "Une erreur est survenue lors de la génération de la réponse.";
  }
}

export async function generateAppointmentSuggestions(appointmentInfo: {
  title: string;
  description?: string;
  attendees?: string[];
}): Promise<{
  prepTasks: string[];
  documents: string[];
  notes: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping prepare for business appointments. Provide practical suggestions in French.
          
Respond with JSON:
{
  "prepTasks": ["task1", "task2", ...],
  "documents": ["doc1", "doc2", ...],
  "notes": ["note1", "note2", ...]
}`
        },
        {
          role: "user",
          content: `Appointment: ${appointmentInfo.title}
${appointmentInfo.description ? `Description: ${appointmentInfo.description}` : ""}
${appointmentInfo.attendees?.length ? `Attendees: ${appointmentInfo.attendees.join(", ")}` : ""}

Suggest preparation tasks, required documents, and important notes.`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return {
      prepTasks: [],
      documents: [],
      notes: [],
    };
  }
}

export async function generateReminderEmail(reminderInfo: {
  emailSubject: string;
  emailBody: string;
  recipientEmail: string;
  reminderType: 'devis_sans_reponse' | 'facture_impayee';
  reminderNumber: number;
}): Promise<{
  subject: string;
  body: string;
}> {
  try {
    const reminderContext = reminderInfo.reminderType === 'devis_sans_reponse'
      ? `Il s'agit d'une relance pour un devis qui n'a pas reçu de réponse. C'est la ${reminderInfo.reminderNumber}ème relance.`
      : `Il s'agit d'une relance pour une facture impayée. C'est la ${reminderInfo.reminderNumber}ème relance.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a professional email assistant for a French SME. Generate polite but firm reminder emails in French.

Rules:
- Be professional and courteous but increasingly firm with each reminder number
- Use formal French ("vous" form)
- For 1st reminder: gentle and friendly
- For 2nd reminder: more direct, mention the importance
- For 3rd reminder: firm, mention potential consequences or next steps
- Include the original subject reference
- End with appropriate salutations

Respond with JSON:
{
  "subject": "string - Email subject line",
  "body": "string - Email body content"
}`
        },
        {
          role: "user",
          content: `Generate a ${reminderInfo.reminderNumber === 1 ? 'première' : reminderInfo.reminderNumber === 2 ? 'deuxième' : 'troisième'} relance professionnelle.

Context: ${reminderContext}

Email original:
Objet: ${reminderInfo.emailSubject}
Destinataire: ${reminderInfo.recipientEmail}

Corps:
${reminderInfo.emailBody.substring(0, 500)}...

Générez un email de relance approprié.`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating reminder email:", error);
    
    // Fallback reminder
    const fallbackSubject = reminderInfo.reminderType === 'devis_sans_reponse'
      ? `Relance ${reminderInfo.reminderNumber}: ${reminderInfo.emailSubject}`
      : `Relance facture ${reminderInfo.reminderNumber}: ${reminderInfo.emailSubject}`;
    
    const fallbackBody = reminderInfo.reminderType === 'devis_sans_reponse'
      ? `Bonjour,\n\nNous souhaitons relancer notre demande de devis concernant: ${reminderInfo.emailSubject}\n\nNous attendons votre retour.\n\nCordialement`
      : `Bonjour,\n\nNous souhaitons vous rappeler que la facture concernant: ${reminderInfo.emailSubject} reste impayée.\n\nMerci de régulariser votre situation.\n\nCordialement`;
    
    return {
      subject: fallbackSubject,
      body: fallbackBody,
    };
  }
}

// Zod schema for strict validation of alert rule structure
const alertRuleFiltersSchema = z.object({
  // Email filters
  category: z.enum(["devis", "facture", "rdv", "autre"]).optional(),
  status: z.enum(["nouveau", "en_cours", "traite", "archive"]).optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
  ageInHours: z.number().positive().optional(),
  // Appointment filters
  appointmentStatus: z.enum(["planifie", "confirme", "annule", "termine"]).optional(),
  timeUntilStartInHours: z.number().nonnegative().optional(),
  timeAfterEndInHours: z.number().nonnegative().optional(),
}).strict();

const alertRuleDataSchema = z.object({
  entityType: z.enum(["email", "appointment"]),
  filters: alertRuleFiltersSchema,
  message: z.string().min(1).max(500),
}).strict();

const interpretAlertPromptResponseSchema = z.object({
  name: z.string().min(1).max(100),
  ruleData: alertRuleDataSchema,
  severity: z.enum(["critical", "warning", "info"]),
}).strict();

// Type definition for alert rule structure
export interface AlertRuleData {
  entityType: "email" | "appointment";
  filters: {
    // For emails
    category?: string; // devis, facture, rdv, autre
    status?: string; // nouveau, en_cours, traite, archive
    priority?: string; // urgent, high, normal, low
    ageInHours?: number; // Age threshold in hours
    // For appointments
    appointmentStatus?: string; // planifie, confirme, annule, termine
    timeUntilStartInHours?: number; // Hours until appointment start
    timeAfterEndInHours?: number; // Hours after appointment end
  };
  message: string; // Template message for the alert
}

export async function interpretAlertPrompt(prompt: string): Promise<{
  name: string;
  ruleData: AlertRuleData;
  severity: "critical" | "warning" | "info";
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in converting natural language alert rules into structured data for a French SME administrative system.

The system manages two types of entities:
1. EMAILS: Can be filtered by category (devis, facture, rdv, autre), status (nouveau, en_cours, traite, archive), priority (urgent, high, normal, low), and age in hours
2. APPOINTMENTS (RENDEZ-VOUS): Can be filtered by status (planifie, confirme, annule, termine), time until start (hours), or time after end (hours)

Analyze the user's prompt and extract:
1. **entityType**: "email" or "appointment" based on what the rule targets
2. **filters**: Specific conditions to match entities
   - For emails: category, status, priority, ageInHours (e.g., "> 24h" becomes 24)
   - For appointments: appointmentStatus, timeUntilStartInHours, timeAfterEndInHours
3. **message**: A template message in French that will be displayed in the alert (keep it concise and professional)
4. **severity**: "critical" (red/urgent), "warning" (yellow/important), or "info" (blue/informational)
5. **name**: A short descriptive name for the rule (max 50 chars)

EXAMPLES:

Prompt: "Alerte rouge sur les emails de factures non traitées depuis plus de 24 heures"
Output:
{
  "name": "Factures non traitées 24h",
  "ruleData": {
    "entityType": "email",
    "filters": {
      "category": "facture",
      "status": "nouveau",
      "ageInHours": 24
    },
    "message": "Des factures non traitées depuis plus de 24h ont été détectées"
  },
  "severity": "critical"
}

Prompt: "Avertissement pour les devis urgents sans réponse depuis 48h"
Output:
{
  "name": "Devis urgents 48h",
  "ruleData": {
    "entityType": "email",
    "filters": {
      "category": "devis",
      "priority": "urgent",
      "ageInHours": 48
    },
    "message": "Des devis urgents attendent une réponse depuis plus de 48h"
  },
  "severity": "warning"
}

Prompt: "Rappel pour les rendez-vous confirmés qui commencent dans moins de 2 heures"
Output:
{
  "name": "RDV dans 2h",
  "ruleData": {
    "entityType": "appointment",
    "filters": {
      "appointmentStatus": "confirme",
      "timeUntilStartInHours": 2
    },
    "message": "Des rendez-vous confirmés débutent dans moins de 2 heures"
  },
  "severity": "info"
}

Prompt: "Alerte critique pour les rendez-vous planifiés qui n'ont pas été confirmés et qui commencent dans 4 heures"
Output:
{
  "name": "RDV non confirmés 4h",
  "ruleData": {
    "entityType": "appointment",
    "filters": {
      "appointmentStatus": "planifie",
      "timeUntilStartInHours": 4
    },
    "message": "Des rendez-vous non confirmés débutent dans moins de 4 heures"
  },
  "severity": "critical"
}

IMPORTANT RULES:
- Always use French for the message and name
- Be precise about time thresholds
- Match severity to the urgency: critical for immediate action, warning for important but not urgent, info for notifications
- Keep filters simple and relevant
- The message should explain what triggered the alert

Respond ONLY with valid JSON matching this exact structure:
{
  "name": "string",
  "ruleData": {
    "entityType": "email" | "appointment",
    "filters": { /* appropriate filters */ },
    "message": "string"
  },
  "severity": "critical" | "warning" | "info"
}`
        },
        {
          role: "user",
          content: `Analyze this alert rule prompt and convert it to structured data:\n\n${prompt}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const rawResult = JSON.parse(response.choices[0].message.content || "{}");
    
    // Strict validation using Zod schema
    const validationResult = interpretAlertPromptResponseSchema.safeParse(rawResult);
    
    if (!validationResult.success) {
      console.error("Invalid AI response structure:", validationResult.error.issues);
      throw new Error("La structure de réponse de l'IA est invalide");
    }

    return validationResult.data;
  } catch (error) {
    console.error("Error interpreting alert prompt:", error);
    throw new Error("Impossible d'interpréter le prompt d'alerte. Veuillez reformuler votre demande.");
  }
}

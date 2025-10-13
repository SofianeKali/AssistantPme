import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeEmail(emailContent: {
  subject: string;
  body: string;
  from: string;
}): Promise<{
  emailType: string;
  priority: string;
  sentiment: string;
  summary: string;
  extractedData: any;
  suggestedTags: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in analyzing business emails for a French SME management system.
          
Analyze the email and extract:
1. emailType: one of "devis" (quote request), "facture" (invoice), "rdv" (appointment), or "general"
2. priority: one of "urgent", "high", "normal", "low"
3. sentiment: one of "positive", "neutral", "negative"
4. summary: brief summary in French (max 150 chars)
5. extractedData: any relevant data (amounts, dates, contacts)
6. suggestedTags: array of relevant tag suggestions

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
  "suggestedTags": ["tag1", "tag2"]
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
    };
  }
}

export async function generateEmailResponse(emailContent: {
  subject: string;
  body: string;
  from: string;
  context?: string;
}): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a professional email assistant for a French SME. Generate polite, professional responses in French.
          
Rules:
- Be concise and professional
- Use formal French ("vous" form)
- Match the tone of the original email
- Include relevant context if provided
- End with appropriate salutations`
        },
        {
          role: "user",
          content: `Generate a professional response to this email:

Subject: ${emailContent.subject}
From: ${emailContent.from}

${emailContent.body}

${emailContent.context ? `Context: ${emailContent.context}` : ""}`
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

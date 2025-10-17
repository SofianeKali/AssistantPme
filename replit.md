# Assistant Administratif Intelligent pour PME

## Overview
This project is an intelligent web application designed to automate administrative tasks for SMEs. It leverages AI (GPT) for email analysis, and automates the management of quotes, invoices, appointments, and documents. The core purpose is to streamline administrative workflows, enhance efficiency, and provide actionable insights for small and medium-sized businesses.

## User Preferences
I prefer detailed explanations.
I want to be asked before major changes are made to the codebase.
I like an iterative development approach.
I want the agent to prioritize robust error handling and logging.
I prefer to see a clear plan before implementation.

## System Architecture
The application uses a modern web stack:
- **Frontend**: React, TypeScript, Tailwind CSS, and Shadcn UI for a responsive and aesthetically pleasing user interface. The design system incorporates a professional blue color scheme, Inter typography for UI, and JetBrains Mono for code/data, supporting both dark and light modes.
- **Backend**: Express.js with Node.js, providing a robust API layer for business logic and data handling.
- **Database**: PostgreSQL, hosted on Neon, for persistent storage of all application data.
- **AI Integration**: OpenAI's GPT-5 is central to intelligent email analysis, response generation, and appointment suggestions.
- **Authentication**: Replit Auth (OpenID Connect) handles user authentication and role-based access control.
- **Document Storage**: Google Drive is integrated for secure and organized storage of extracted documents.

**Key Features**:
- **Dashboard**: Provides a high-level overview of critical alerts (unanswered quotes, unpaid invoices, upcoming appointments), monthly statistics, and activity summaries.
- **Email Management**: Intelligent analysis of emails by GPT to categorize them (quote, invoice, appointment), detect priority and sentiment, generate auto-responses, assign tasks, and trigger alerts for unaddressed emails.
- **Calendar**: Monthly visualization and automated scheduling of appointments from emails, including AI-driven preparation suggestions.
- **Document Management**: Automatic extraction and classification of email attachments, stored on Google Drive with full-text search capabilities using OCR for images and text-based PDFs.
- **Alert System**: Configurable alerts for critical business events like unanswered quotes, unpaid invoices, and untriaged urgent emails.
- **Configuration**: Manages email account integration (IMAP/SMTP), intelligent tag creation, AI feature toggles, and automation settings.
- **User Management**: Role-based access control (Manager, Administrator, Collaborator) with task assignment and granular permissions.
- **Advanced Sentiment Analysis**: Detects risk levels (critical, high, medium, low) and conflict indicators, providing actionable recommendations.
- **Advanced KPIs**: Tracks key performance indicators like response rates, average processing time, projected revenue from quotes, and monthly evolution.
- **Automated Reminders**: System for generating and escalating reminders for quotes and unpaid invoices based on configurable timings and escalating tones.

## External Dependencies
- **OpenAI**: Utilized for GPT-5 model access for intelligent email analysis, response generation, and content creation.
- **Google Drive**: Integrated for cloud storage of documents and email attachments.
- **Replit Auth**: Provides user authentication and authorization services.
- **PostgreSQL (Neon)**: The primary relational database used for all application data.
- **Tesseract.js**: For Optical Character Recognition (OCR) on image documents and scanned PDFs.
- **pdf-parse**: For extracting text from PDF documents.
- **imap-simple**: For IMAP email scanning.
- **mailparser**: For parsing email content.

## Recent Updates
### ✅ Catégories d'Emails Personnalisables (Octobre 2025)
- **Système de Catégories Dynamiques**: Les administrateurs peuvent maintenant créer et gérer des catégories d'emails personnalisées
  - Nouvelle table `email_categories` avec champs: key, label, icon, color, generateAutoResponse, isSystemCategory
  - 4 catégories système par défaut: devis, facture, rdv, autre (ne peuvent pas être supprimées)
  - Les admins peuvent créer des catégories illimitées avec labels, icônes et couleurs personnalisés
  - Chaque catégorie peut activer/désactiver la génération automatique de réponses
- **Interface de Gestion**: Nouvel onglet "Catégories" dans Settings (admin uniquement)
  - Formulaire de création avec sélection d'icône Lucide (FileText, Calendar, Mail, MessageSquare, etc.)
  - Sélecteur de couleur avec prévisualisation
  - Option pour activer/désactiver l'auto-réponse par catégorie
  - Suppression de catégories personnalisées (catégories système protégées)
- **Classification AI Dynamique**: L'analyse GPT utilise les catégories configurées
  - `analyzeEmail()` reçoit la liste des catégories disponibles depuis la base de données
  - L'IA classe les emails selon les catégories configurées
  - Fallback vers "autre" pour les emails non classifiés
  - Exclusion automatique de la génération de réponse pour catégories avec `generateAutoResponse=false`
- **Dashboard Dynamique**: Affichage intelligent des catégories
  - Chargement automatique des catégories depuis `/api/email-categories`
  - Résolution d'icônes via `getIconComponent()` pour afficher les icônes Lucide configurées
  - Chaque bloc affiche: label personnalisé, icône configurée avec couleur, nombre d'emails
  - Redirection vers `/emails?category={key}` au clic sur un bloc
- **Stats Dynamiques**: Endpoint `/api/emails/stats/by-category` retourne les counts pour toutes les catégories
  - Utilise SQL GROUP BY pour optimisation
  - Inclut toutes les catégories configurées (même avec count=0)
  - Format: `Record<string, number>` au lieu d'objet hard-codé

### ✅ Filtrage d'Emails par Catégories Configurables (Octobre 2025)
- **Configuration des Catégories à Retenir**: Les utilisateurs peuvent maintenant configurer quelles catégories d'emails sont importées lors du scan
  - Nouveau champ `emailCategoriesToRetain` dans la table email_accounts (array de texte)
  - Valeur par défaut: ['devis', 'facture', 'rdv', 'autre'] (toutes les catégories)
  - Interface de sélection avec checkboxes dans la page Settings
  - Chaque compte email peut avoir sa propre configuration de catégories
- **Scanner d'Emails Intelligent**: Le scanner filtre automatiquement les emails
  - Vérifie le type détecté par l'IA (analysis.emailType) contre emailCategoriesToRetain
  - Skip automatiquement les emails qui ne correspondent pas aux catégories configurées
  - Log: "[IMAP] Email type 'X' not in categories to retain, skipping"
- **Filtrage Dynamique sur Page Emails**: Navigation fluide entre dashboard et emails
  - Lecture automatique du paramètre URL `category` pour filtrer les emails
  - useEffect pour initialiser le filtre typeFilter depuis l'URL
  - Compatible avec les filtres existants (status, search)

### ✅ Bulk Email Selection and Processing (October 2025)
- **Multi-Select Functionality**: Users can now select multiple emails for batch operations
  - Individual checkboxes for each email row (data-testid="checkbox-email-{id}")
  - "Select All" checkbox in list header to toggle all visible emails
  - Checkboxes use stopPropagation to prevent conflicts with row clicks
  - selectedEmailIds state tracks all checked emails
- **Batch Processing**: New endpoint `PATCH /api/emails/bulk/mark-processed` for bulk operations
  - Accepts array of email IDs: `{emailIds: string[]}`
  - Returns detailed results: `{processed, failed, total, failedIds}`
  - Verifies ownership for each email using Promise.allSettled for partial failure resilience
  - Preserves original indices to accurately identify which emails failed
- **Smart Partial Failure Handling**:
  - Full success: Clears all selections, shows success toast
  - Partial failure: Keeps only failed email IDs selected for easy retry
  - Differentiated messaging: Success vs. partial failure toasts with counts
  - Example: "3 email(s) traité(s), 2 échoué(s). Les emails non traités restent sélectionnés."
- **Bulk Actions UI**:
  - Action bar appears when emails are selected
  - Shows count: "X emails sélectionnés"
  - "Désélectionner" button to clear all selections
  - "Marquer comme traités" button (data-testid="button-bulk-mark-processed")
  - Loading states and proper error handling
- **Testing**: End-to-end tests verify complete bulk workflow including partial failures

### ✅ Mark Email as Processed Without Sending (October 2025)
- **Manual Processing Option**: Users can now mark emails as "traité" without sending a response
  - New endpoint `PATCH /api/emails/:id/mark-processed` for manual status updates
  - Useful for emails handled via phone, in person, or requiring no response
  - UI includes "Marquer comme traité" button in email detail dialog
  - Alternative "Marquer traité sans envoyer" option in response dialog
- **UI Integration**:
  - Button only appears when email status is not already "traité"
  - Provides clear success/error feedback via toast notifications
  - Automatically refreshes email list after status update
  - Maintains seamless integration with existing response workflow
- **Testing**: End-to-end tests confirm correct status transitions and UI behavior

### ✅ Email Response Sending via SMTP (October 2025)
- **Complete Email Response Workflow**: Production-ready implementation for sending AI-generated responses
  - Added `sentResponse` and `respondedAt` fields to emails table for response tracking
  - Created `server/emailSender.ts` service using nodemailer for SMTP email sending
  - Email threading support with In-Reply-To and References headers for proper conversation threading
  - Added `getEmailAccountById()` method to storage layer for SMTP credential retrieval
  - Endpoint `POST /api/emails/:id/send-response` handles complete send workflow
  - Automatic status update to "traite" when response is sent
- **Security**: TLS certificate validation enabled by default
  - Dev-only TLS relaxation for Replit environment (NODE_ENV=development + REPL_ID check)
  - Production deployments maintain strict TLS certificate verification
  - Clear warning logs when TLS validation is disabled in development
- **UI Enhancements**:
  - "Approuver et envoyer" button with loading states and error handling
  - "Répondu" badge displayed on emails that have been responded to
  - Success/error toasts for user feedback
  - Email list auto-refreshes after sending response

### ✅ Automatic Email Response Generation with GPT (October 2025)
- **Google Drive Document Storage**: Complete integration for automatic attachment upload
  - Fixed Buffer-to-stream conversion for reliable file uploads
  - Complete document schema with originalFilename, mimeType, size, storageProvider, storagePath
  - Automatic extraction and storage of email attachments during scan
- **GPT-Powered Auto-Response Generation**: Production-ready implementation
  - Automatic response generation during email scan with 15-second timeout
  - Robust error handling with proper timeout cleanup to prevent unhandled rejections
  - Added `suggestedResponse` field to emails table for persistent storage
  - Unified manual and automatic generation systems using single database field
  - UI displays AI-generated responses with edit capability before sending
  - Safe timeout implementation with clearTimeout() to prevent Node.js process issues
- **TypeScript Improvements**: Added utility functions for safe AddressObject handling

### ✅ Multi-User Role-Based Access Control (October 2025)
- Implemented complete role-based access control system
- Two user types: Admin (creates workspace, manages users) and Simple (standard users with isolated email access)
- Database schema updated: added userId to emails table for data isolation
- Storage layer refactored: getEmails() filters by userId, getAllEmails() for backend services
- Admin middleware created to protect admin-only routes (GET/POST /api/users)
- Resend email integration configured for onboarding emails with temporary passwords
- First user auto-promoted to admin role on workspace creation
- Session management updated to hydrate full user object with role from database
- Users page created for admin UI to create and manage simple users

### ✅ Yahoo Email Support (October 2025)
- Added Yahoo as a third email provider option alongside Gmail and Outlook
- Automatic IMAP/SMTP configuration for Yahoo accounts:
  - IMAP: imap.mail.yahoo.com:993
  - SMTP: smtp.mail.yahoo.com:465
- Fixed port conversion bug (string to integer) for all providers
- Updated Settings UI to support all three providers seamlessly

### 🔧 Technical Improvements (October 2025)
- **Session Management Refactored**: Session now properly hydrates full user object with role from database
  - Graceful handling of both old and new session formats
  - First user is automatically promoted to admin role
  - Session deserializer extracts userId correctly for both legacy and new sessions
- **API Routes Updated**: All routes now use `req.user.id` instead of `req.user.claims.sub`
- **Admin-Only Pages**: Users page is now hidden from non-admin users
  - Sidebar link filtered based on user role
  - Frontend route protection with proper React hooks usage
  - Backend routes protected with `isAdmin` middleware
- **Database Roles Corrected**: Legacy "collaborateur" role updated to "admin" or "simple"

### ⚠️ Known Issues
- Users with old sessions should log out and log back in for proper session hydration
- Email passwords are stored in plaintext - encryption should be implemented before production
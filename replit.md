# IzyInbox - Assistant Administratif Intelligent pour PME

## Overview
IzyInbox is an intelligent web application designed to automate administrative tasks for SMEs. It leverages AI for email analysis and automates the management of quotes, invoices, appointments, and documents. The core purpose is to streamline administrative workflows, enhance efficiency, and provide actionable insights for small and medium-sized businesses. The project aims to become a leading solution for smart automation for busy managers, with ambitions for broad market adoption.

## Recent Changes (October 29, 2025)
- **Category Deletion with Email Transfer**:
  - Enhanced category deletion to automatically transfer affected emails to "autre" category before deletion
  - Protected "autre" category from deletion (required fallback for email reassignment)
  - Added system category initialization on server startup (autre, devis, facture, rdv)
  - Fixed bug: user-created categories now correctly marked as isSystem: false (deletable)
  - DELETE /api/email-categories/:id returns 400 when attempting to delete "autre"
  - Storage method prevents data loss by reassigning all emails before category removal
  - End-to-end tested: category deletion, email transfer, and protection of "autre"
  - Architect validated with suggestions for future DB transaction wrapper

- **Category Colors in Email Badges**:
  - Email type badges now use the configured category colors instead of hardcoded colors
  - Badges display category labels (e.g., "Factures") instead of raw keys (e.g., "facture")
  - Colors update dynamically when category settings are changed
  - Implemented via inline styles using category.color from emailCategories
  - Applied to both mobile and desktop views in Emails page
  - End-to-end tested and validated by architect

- **Category Icon Display Fixes**:
  - **Dashboard**: Fixed bug where category icons weren't displaying correctly
    - Updated getIconComponent function to support all 35+ available icons
    - Previously only 11 icons were supported, causing fallback to Mail icon
  - **Settings Category List**: Fixed hardcoded Tag icon in category list
    - Now displays the configured icon for each category (Gift, Truck, Package, etc.)
    - Uses same dynamic icon resolution as edit dialog
  - All icons display correctly across Dashboard and Settings pages
  - End-to-end tested and validated by architect

- **Visual Icon and Color Pickers for Categories**:
  - Replaced text input fields with interactive visual pickers using Shadcn Popover components
  - **Color Picker Features**:
    - Grid of 16 preset colors with visual preview and hover effects
    - HTML5 color picker for custom color selection
    - Hex text input for manual entry
    - Live preview of selected color in trigger button
  - **Icon Picker Features**:
    - Grid display of 35+ Lucide icons (Mail, FileText, Calendar, DollarSign, Package, etc.)
    - Visual selection with highlight of currently selected icon
    - Live preview of selected icon in trigger button
  - Both pickers integrated in category creation form and edit dialog
  - Improved UX: users can now visually select colors and icons instead of typing names
  - End-to-end tested and validated by architect
  - Fixed duplicate color in PRESET_COLORS array to eliminate React warnings

- **Category Edit Feature**:
  - Added "Modifier" button next to "Supprimer" button in category list
  - Created edit dialog to modify existing category settings:
    - Update label, color, icon, and key
    - Toggle automation flags: auto-response, auto-task creation, auto-mark as processed
  - PATCH /api/email-categories/:id endpoint used for updates
  - Dialog properly resets on cancel and closes on successful save
  - Cache invalidation ensures UI reflects changes immediately
  - End-to-end tested and validated by architect
  - Provides complete category management workflow (create, read, update, delete)

- **Auto-Mark Scanned Emails as Processed (Category-Based)**:
  - Added `autoMarkAsProcessed` boolean field to emailCategories schema with default false value
  - Enhanced Settings > Catégories UI with new checkbox: "Marquer automatiquement les emails scannés comme traités"
  - Category list displays auto-mark status: "Traités auto ✓" or "Traités auto ✗"
  - Email scanner now checks category setting and automatically sets email status to "traité" instead of "nouveau" when enabled
  - Scanner logs indicate auto-mark status for transparency during email processing
  - Useful for low-priority categories (e.g., newsletters, notifications) that don't require manual review
  - End-to-end tested and validated by architect
  - Feature allows granular control over email workflow automation on a per-category basis

## Previous Changes (October 28, 2025)
- **Dashboard Task Management Card**:
  - Added "Tâches en cours" card to dashboard, displayed alongside alerts card in a grid layout
  - Card shows tasks with status "nouveau" or "en_cours" (up to 5 most recent)
  - Visual differentiation between task statuses:
    - "Nouveau" tasks: Circle icon (yellow/chart-3 color), secondary badge variant
    - "En cours" tasks: Clock icon (blue/primary color), default badge variant
  - Quick status change actions directly from dashboard:
    - ArrowRight button to start a task (nouveau → en_cours)
    - CheckCircle2 button to complete a task (en_cours → termine)
  - "Voir tout" button links to full Tasks page for comprehensive task management
  - Mutation properly invalidates cache and shows toast notifications on status updates
  - Architecture reviewed and validated by architect

- **Email Read/Unread Status Feature**:
  - Implemented separate read/unread tracking independent of processed/unprocessed status (nouveau/traité)
  - New emails from scanner are created with `isRead: false` (explicitly set in emailScanner.ts)
  - Created PATCH /api/emails/:id/mark-read API endpoint to mark emails as read
  - Frontend automatically marks email as read when user opens it in detail dialog
  - Added visual indicators in email list:
    - Unread emails: Mail icon (primary color) with data-testid="icon-unread-{emailId}"
    - Read emails: MailOpen icon (muted color) with data-testid="icon-read-{emailId}"
  - Read status persists in database and survives page refreshes
  - User flow: Emails start as unread → opening marks as read → responding/manual marking changes treated status
  - Architecture reviewed and validated by architect

## Previous Changes (October 25, 2025)
- **Automatic Task Completion When Email is Processed**:
  - Implemented automatic task completion when associated email is marked as "traité"
  - Created completeTasksForProcessedEmail() method in DatabaseStorage
  - Integrated auto-completion into all routes that mark emails as processed:
    - PATCH /api/emails/bulk/update-status (when status = 'traite')
    - PATCH /api/emails/bulk/mark-processed
    - PATCH /api/emails/:id/mark-processed
    - POST /api/emails/:id/send-response
  - Tasks automatically transition to "Terminé" status when email is marked "traité"
  - Tested and verified with e2e tests
- **Task Assignment Feature**:
  - Added assignedToId field to tasks table for user assignment
  - Created updateTaskAssignment storage method and PATCH /api/tasks/:id/assign API route
  - Enhanced Tasks.tsx UI to display assigned user with avatar and name in task cards
  - Added assignment dropdown in task detail dialog to assign/unassign tasks to users
  - Tasks can now be assigned to specific users or left unassigned
  - Assignment changes automatically refresh the tasks board

## Previous Changes (October 24, 2025)
- **Calendar Multiple Appointments Fix**:
  - Fixed bug where appointments wouldn't open when multiple were scheduled on the same day
  - Added selection dialog that appears when clicking a day with multiple appointments
  - Users can now view and select from all appointments on a given day
  - Improved UX with clear appointment list showing time, title, and location
- **Global Category System with Flexible Assignment**: 
  - Refactored categories to be global (removed account-specific association from emailCategories table)
  - Created emailAccountCategories junction table for many-to-many relationship between accounts and categories
  - Categories can now be assigned to multiple accounts, and accounts can have multiple categories
  - Updated API routes: GET/PUT /api/email-accounts/:id/categories for category management
  - Enhanced UI in Settings page:
    - Category selection checkboxes in account creation form
    - "Catégories" button on existing accounts opens dialog for category management
  - Categories tab now creates global categories without account selection requirement

## Previous Changes (October 23, 2025)
- **Individual Email Account Scanning**: Added POST /api/email-accounts/:id/scan endpoint and "Scanner maintenant" button in Settings page for manual scanning of specific email accounts
- **Authentication Bug Fixes**: 
  - Updated isAdmin middleware to accept both 'admin' and 'administrator' roles for backward compatibility
  - Fixed role preservation: upsertUser now maintains existing user roles instead of overwriting them during OIDC login
- **Email Formatting Improvements**: 
  - Removed quotation marks from display names using improved formatEmailAddress()
  - Fixed avatar initials to correctly extract first alphabetic character from email addresses
- **Gmail Integration**: Successfully configured and tested Gmail IMAP connection for sofiane.kali@gmail.com

## User Preferences
I prefer detailed explanations.
I want to be asked before major changes are made to the codebase.
I like an iterative development approach.
I want the agent to prioritize robust error handling and logging.
I prefer to see a clear plan before implementation.

## System Architecture
The application uses a modern web stack:
- **Frontend**: React, TypeScript, Tailwind CSS, and Shadcn UI provide a responsive and aesthetically pleasing user interface. The design system incorporates a professional blue color scheme, Inter typography for UI, and JetBrains Mono for code/data, supporting both dark and light modes.
- **Backend**: Express.js with Node.js provides a robust API layer for business logic and data handling.
- **Database**: PostgreSQL, hosted on Neon, for persistent storage of all application data.
- **AI Integration**: OpenAI's GPT-5 is central to intelligent email analysis, response generation, and appointment suggestions, including natural language rule creation for custom alerts.
- **Authentication**: A dual authentication system supports Replit Auth (OpenID Connect) for administrators and direct Replit users, and Email/Password for invited users. This includes secure password hashing and session management.
- **Document Storage**: Google Drive is integrated for secure and organized storage of extracted documents, with automatic categorization into a hierarchical folder structure (`PME-Assistant-Documents/facture/`, `devis/`, `rdv/`, `autre/`, and custom categories). Direct document access and download are provided from the UI, with robust security checks.

**Key Features**:
- **Dashboard**: Provides a high-level overview of critical alerts, monthly statistics, and activity summaries.
- **Email Management**: Intelligent analysis by GPT categorizes emails (now account-specific), detects priority and sentiment, generates auto-responses using customizable prompts, assigns tasks, and triggers alerts. Supports bulk processing of email statuses (Nouveau, En cours, Traité, Archivé) with a multiple selection system.
- **Calendar**: Monthly visualization and automated scheduling of appointments from emails, including AI-driven preparation suggestions.
- **Document Management**: Automatic extraction and classification of email attachments, stored on Google Drive with full-text search capabilities using OCR.
- **Alert System**: Configurable custom alerts using natural language prompts interpreted by GPT-5. Rules are validated, evaluated hourly, and support email and appointment entities with various filters.
- **Configuration**: Manages email account integration (IMAP/SMTP), intelligent tag creation, AI feature toggles, and automation settings.
- **User Management**: Role-based access control (Manager, Administrator, Collaborator) with task assignment and granular permissions.
- **Advanced Sentiment Analysis**: Detects risk levels and conflict indicators.
- **Advanced KPIs**: Tracks key performance indicators like response rates and processing time.
- **Automated Reminders**: System for generating and escalating reminders for quotes and unpaid invoices.

## External Dependencies
- **OpenAI**: Utilized for GPT-5 model access for intelligent email analysis, response generation, natural language alert rule creation, and content creation.
- **Google Drive**: Integrated for cloud storage of documents and email attachments.
- **Replit Auth**: Provides user authentication and authorization services.
- **PostgreSQL (Neon)**: The primary relational database used for all application data.
- **Tesseract.js**: For Optical Character Recognition (OCR) on image documents and scanned PDFs.
- **pdf-parse**: For extracting text from PDF documents.
- **imap-simple**: For IMAP email scanning.
- **mailparser**: For parsing email content.
- **Nodemailer**: For SMTP email sending.
# Assistant Administratif Intelligent pour PME

## Overview
This project is an intelligent web application designed to automate administrative tasks for SMEs. It leverages AI (GPT) for email analysis and automates the management of quotes, invoices, appointments, and documents. The core purpose is to streamline administrative workflows, enhance efficiency, and provide actionable insights for small and medium-sized businesses.

## Recent Changes (October 2025)
### Per-Account Email Categories System
- **Refactored email categories** from global to account-specific architecture
- **Database schema updated**: Added `emailAccountId` field to `email_categories` table (nullable for system categories)
- **Unique constraint added**: `(emailAccountId, key)` prevents duplicate category keys per account
- **System categories** (devis, facture, rdv, autre) remain global with `emailAccountId = NULL`
- **Custom categories** are now linked to specific email accounts for better organization
- **Email scanner enhanced**: 
  - Loads categories via `getEmailCategoriesForAccount()`
  - **Auto-fallback to "Autres"**: If GPT detects a category that doesn't exist for the account, the email is automatically classified as "autre" instead of being skipped
  - Ensures no emails are lost due to missing category configurations
- **Settings UI enhanced**: Categories tab now requires account selection before creating/viewing categories
- **Dashboard optimized**: Deduplicates categories by key for display
- **User experience improved**: Added alert with call-to-action when no email accounts are configured

### Document Organization by Category
- **Google Drive folder structure**: Documents are now automatically organized in category-specific subfolders
- **Hierarchical storage**: 
  ```
  PME-Assistant-Documents/
  ├── facture/     (invoices)
  ├── devis/       (quotes)
  ├── rdv/         (appointments)
  └── autre/       (others)
  ```
- **Automatic categorization**: Email attachments are stored in the subfolder matching their email category
- **Custom category support**: Custom categories automatically get their own subfolders in Google Drive
- **Implementation**: Added `getOrCreateSubfolder()` function for hierarchical folder management

### Direct Document Access from UI
- **Integrated Google Drive access**: Documents page now provides direct access to files stored in Google Drive
- **Multiple interaction methods**:
  - Click on document card/row → Opens document in Google Drive (new tab)
  - "Voir" (View) button → Opens document in Google Drive
  - "Télécharger" (Download) button → Downloads document file locally
- **Security implementation**:
  - Document ownership verification: ensures users can only access their own documents via `email.userId` check
  - Filename sanitization: prevents header injection attacks by removing quotes, newlines, and special characters
  - Full authorization flow: all actions require authentication and proper permissions
- **Technical details**:
  - Download route: `GET /api/documents/:id/download`
  - Uses `downloadFileFromDrive()` from Google Drive integration
  - Returns file with proper Content-Disposition and Content-Type headers

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
- **Dashboard**: Provides a high-level overview of critical alerts, monthly statistics, and activity summaries.
- **Email Management**: Intelligent analysis of emails by GPT to categorize, detect priority and sentiment, generate auto-responses, assign tasks, and trigger alerts. Supports customizable categories and bulk processing.
- **Calendar**: Monthly visualization and automated scheduling of appointments from emails, including AI-driven preparation suggestions.
- **Document Management**: Automatic extraction and classification of email attachments, stored on Google Drive with full-text search capabilities using OCR.
- **Alert System**: Configurable alerts for critical business events.
- **Configuration**: Manages email account integration (IMAP/SMTP), intelligent tag creation, AI feature toggles, and automation settings.
- **User Management**: Role-based access control (Manager, Administrator, Collaborator) with task assignment and granular permissions, including secure user deletion.
- **Advanced Sentiment Analysis**: Detects risk levels and conflict indicators, providing actionable recommendations.
- **Advanced KPIs**: Tracks key performance indicators like response rates, average processing time, and projected revenue.
- **Automated Reminders**: System for generating and escalating reminders for quotes and unpaid invoices.

## External Dependencies
- **OpenAI**: Utilized for GPT-5 model access for intelligent email analysis, response generation, and content creation.
- **Google Drive**: Integrated for cloud storage of documents and email attachments.
- **Replit Auth**: Provides user authentication and authorization services.
- **PostgreSQL (Neon)**: The primary relational database used for all application data.
- **Tesseract.js**: For Optical Character Recognition (OCR) on image documents and scanned PDFs.
- **pdf-parse**: For extracting text from PDF documents.
- **imap-simple**: For IMAP email scanning.
- **mailparser**: For parsing email content.
- **Nodemailer**: For SMTP email sending.
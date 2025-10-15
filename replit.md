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
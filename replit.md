# IzyInbox - Assistant Administratif Intelligent pour PME

## Overview
IzyInbox is an intelligent web application designed to automate administrative tasks for SMEs. It leverages AI for email analysis and automates the management of quotes, invoices, appointments, and documents. The core purpose is to streamline administrative workflows, enhance efficiency, and provide actionable insights for small and medium-sized businesses. The project aims to become a leading solution for smart automation for busy managers, with ambitions for broad market adoption.

## Recent Changes (October 24, 2025)
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
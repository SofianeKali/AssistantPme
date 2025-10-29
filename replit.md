# IzyInbox - Assistant Administratif Intelligent pour PME

## Overview
IzyInbox is an intelligent web application designed to automate administrative tasks for SMEs. It leverages AI for email analysis and automates the management of quotes, invoices, appointments, and documents. The core purpose is to streamline administrative workflows, enhance efficiency, and provide actionable insights for small and medium-sized businesses. The project aims to become a leading solution for smart automation for busy managers, with ambitions for broad market adoption.

## User Preferences
I prefer detailed explanations.
I want to be asked before major changes are made to the codebase.
I like an iterative development approach.
I want the agent to prioritize robust error handling and logging.
I prefer to see a clear plan before implementation.

## System Architecture
The application uses a modern web stack:
- **Frontend**: React, TypeScript, Tailwind CSS, and Shadcn UI provide a responsive and aesthetically pleasing user interface. The design system incorporates a professional blue color scheme, Inter typography for UI, and JetBrains Mono for code/data, supporting both dark and light modes. Visual icon and color pickers enhance UX for category management. Sidebar menus include real-time count badges.
- **Backend**: Express.js with Node.js provides a robust API layer for business logic and data handling. Password encryption for email accounts uses AES-256-GCM with automatic migration of plaintext passwords.
- **Database**: PostgreSQL, hosted on Neon, for persistent storage of all application data.
- **AI Integration**: OpenAI's GPT-5 is central to intelligent email analysis, response generation, appointment suggestions, and natural language rule creation for custom alerts, including AI-powered email search.
- **Authentication**: A dual authentication system supports Replit Auth (OpenID Connect) for administrators and direct Replit users, and Email/Password for invited users.
- **Document Storage**: Google Drive is integrated for secure and organized storage of extracted documents, with automatic categorization into a hierarchical folder structure.
- **UI/UX Decisions**: Consistent display of category icons and colors across the application (Dashboard, Settings, Email Badges). Dynamic displays for task statuses in the dashboard. Responsive chart period controls with vertical layout on mobile and horizontal layout on desktop. Alert cards feature hover effects and cursor-pointer to indicate clickability. Calendar views support Day, Week, and Month modes with adaptive navigation.
- **System Design Choices**: Global category system with flexible assignment to multiple email accounts via a junction table. Category deletion automatically transfers affected emails to a fallback "autre" category. Email read/unread status is tracked independently of processed status. Tasks associated with an email are automatically completed when the email is marked as "traité". Task assignment to users is supported. Appointment selection dialog for days with multiple appointments. Automated scanning of individual email accounts with configurable frequency and retention.
- **Key Features**:
    - **Dashboard**: High-level overview with critical alerts, monthly statistics, activity summaries, and "Tasks in Progress" card with quick status changes. Features advanced data visualizations with configurable period controls, responsive grid layout, and full drag-and-drop customization with persistent user preferences.
    - **Email Management**: AI-powered categorization, priority/sentiment detection, auto-response generation, task assignment, and alerts. Supports bulk processing and individual email account scanning. Features read/unread status tracking and category-based automatic marking as processed. Includes AI-powered natural language search for emails. Attachment support for email replies.
    - **Calendar**: Monthly visualization and automated scheduling of appointments from emails, with AI-driven preparation, supporting Day, Week, and Month views.
    - **Document Management**: Automatic extraction, classification, and storage of email attachments on Google Drive with full-text search, with global toggles for extraction and provider selection.
    - **Alert System**: Configurable custom alerts using natural language prompts interpreted by GPT-5. Supports bulk resolution of alerts.
    - **Configuration**: Comprehensive three-tab settings interface for system administration (admin-only access) for Email Accounts (IMAP/SMTP, scan frequency, retention), Categories (icons, colors, attachment redirection), and Automation (document extraction, storage provider, AI features). All configuration changes require admin role.
    - **User Management**: Role-based access control and task assignment.
    - **Advanced Features**: Sentiment analysis, KPIs, and automated reminders for quotes and invoices.

## External Dependencies
- **OpenAI**: GPT-5 model access for AI capabilities.
- **Google Drive**: Cloud storage for documents and email attachments.
- **Replit Auth**: User authentication and authorization.
- **PostgreSQL (Neon)**: Primary relational database.
- **Tesseract.js**: Optical Character Recognition (OCR).
- **pdf-parse**: PDF text extraction.
- **imap-simple**: IMAP email scanning.
- **mailparser**: Email content parsing.
- **Nodemailer**: SMTP email sending.
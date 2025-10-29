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
- **Backend**: Express.js with Node.js provides a robust API layer for business logic and data handling.
- **Database**: PostgreSQL, hosted on Neon, for persistent storage of all application data.
- **AI Integration**: OpenAI's GPT-5 is central to intelligent email analysis, response generation, and appointment suggestions, including natural language rule creation for custom alerts.
- **Authentication**: A dual authentication system supports Replit Auth (OpenID Connect) for administrators and direct Replit users, and Email/Password for invited users.
- **Document Storage**: Google Drive is integrated for secure and organized storage of extracted documents, with automatic categorization into a hierarchical folder structure.
- **UI/UX Decisions**: Consistent display of category icons and colors across the application (Dashboard, Settings, Email Badges). Dynamic displays for task statuses in the dashboard.
- **System Design Choices**: Global category system with flexible assignment to multiple email accounts via a junction table. Category deletion automatically transfers affected emails to a fallback "autre" category. Email read/unread status is tracked independently of processed status. Tasks associated with an email are automatically completed when the email is marked as "traité". Task assignment to users is supported. Appointment selection dialog for days with multiple appointments. Automated scanning of individual email accounts.

**Key Features**:
- **Dashboard**: High-level overview of critical alerts, monthly statistics, activity summaries, and "Tasks in Progress" card with quick status changes. Features advanced data visualizations with configurable period controls, responsive grid layout, and full drag-and-drop customization:
  * **Responsive Grid Layout**: Optimized display for all screen sizes
    - Mobile/Tablet (< 1024px): Single column, stacked vertically
    - Desktop/Large screens (≥ 1024px): 2-column grid with charts side-by-side
    - Categories section spans full width on all screens (contains 4-column internal grid)
  * **Drag-and-Drop Layout Customization**: All dashboard sections (category cards and 6 charts) support manual reorganization via drag-and-drop using @dnd-kit/sortable library
    - Persistent user preferences stored in `userDashboardLayouts` table with per-user layout configuration
    - Visual drag handles (GripVertical icon) appear on hover for intuitive interaction
    - Reset button to restore default layout order
    - Fixed sections: Tasks and Alerts cards remain at the top (not draggable)
    - Draggable sections (7 total): Categories, Email Evolution, Email Distribution, Appointments, Category Processing, Tasks Evolution, Alerts Evolution
    - Drag-and-drop works seamlessly across grid layout (2 columns on large screens)
  * **Configurable Period System**: All 6 dashboard charts support independent week/month period selection with temporal navigation (previous/next controls) and precise period labels (e.g., "Semaine du 21 au 27 octobre 2024" or "Octobre 2024")
  * **Évolution des emails traités**: Line chart showing processed email trends over configurable periods
  * **Répartition des emails reçus**: Pie chart using category-configured colors with email counts, supports period filtering
  * **Évolution des RDV**: Bar chart displaying appointment trends with week/month period selection
  * **Taux de traitement par catégorie**: Vertical bar chart colored by category showing processing rates across periods
  * **Évolution des tâches**: Stacked bar chart tracking task evolution (Nouveau/En cours/Terminé) with configurable time periods
  * **Évolution des alertes**: Stacked bar chart monitoring alert trends (Actives/Résolues) with period controls
  * Category-colored visualizations throughout for consistent visual identity
  * Weeks calculated from Monday to Sunday, months use standard calendar boundaries
- **Email Management**: AI-powered categorization, priority/sentiment detection, auto-response generation, task assignment, and alerts. Supports bulk processing and individual email account scanning. Features read/unread status tracking and category-based automatic marking as processed.
- **Calendar**: Monthly visualization and automated scheduling of appointments from emails, with AI-driven preparation.
- **Document Management**: Automatic extraction, classification, and storage of email attachments on Google Drive with full-text search.
- **Alert System**: Configurable custom alerts using natural language prompts interpreted by GPT-5.
- **Configuration**: Manages email account integration (IMAP/SMTP), intelligent tag creation, AI feature toggles, and automation settings, including comprehensive category management (create, read, update, delete) with visual pickers.
- **User Management**: Role-based access control and task assignment.
- **Advanced Features**: Sentiment analysis, KPIs, and automated reminders.

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
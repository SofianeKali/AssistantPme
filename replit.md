# IzyInbox - Assistant Administratif Intelligent pour PME

## Overview
IzyInbox is an intelligent web application designed to automate administrative tasks for SMEs. It leverages AI for email analysis and automates the management of quotes, invoices, appointments, and documents. The core purpose is to streamline administrative workflows, enhance efficiency, and provide actionable insights for small and medium-sized businesses. The project aims to become a leading solution for smart automation for busy managers, with ambitions for broad market adoption.

## User Preferences
I prefer detailed explanations.
I want to be asked before major changes are made to the codebase.
I like an iterative development approach.
I want the agent to prioritize robust error handling and logging.
I prefer to see a clear plan before implementation.

## Recent Changes
### October 29, 2025 - Chiffrement des Mots de Passe et Envoi d'Emails SMTP
- **Implémentation critique du chiffrement des mots de passe** :
  - Module de chiffrement AES-256-GCM pour les mots de passe des comptes email
  - Chiffrement automatique lors de la création de comptes email
  - Déchiffrement transparent lors de la lecture (aucun changement pour le code client)
  - Migration en douceur : détection automatique des mots de passe non chiffrés
  - Clé de chiffrement dérivée de SESSION_SECRET ou ENCRYPTION_KEY via PBKDF2
  - Salt, IV et AuthTag uniques pour chaque mot de passe stocké
  - Résout la vulnérabilité CRITIQUE de stockage en clair des mots de passe
- **Implémentation complète de l'envoi d'emails SMTP pour les rappels** :
  - Fonction `sendReminderEmail` utilisant le module `emailSender` existant
  - Envoi automatique des rappels de devis (après 48h sans réponse)
  - Envoi automatique des rappels de factures (après 15 jours d'impayé)
  - Mise à jour automatique du statut `isSent` et `sentAt` après envoi
  - Gestion d'erreurs robuste avec logs détaillés
  - Support de tous les types de rappels (devis, factures)

### October 29, 2025 - Modes de Vue Calendrier (Jour/Semaine/Mois)
- **Implémentation complète et validée des trois modes de vue pour le calendrier** :
  - Vue Mois : grille mensuelle classique (7×n) avec aperçu des rendez-vous (2 max + compteur overflow), jours de remplissage pour alignement correct avec en-têtes
  - Vue Semaine : liste des 7 jours de la semaine (lundi-dimanche) avec tous les rendez-vous détaillés par jour
  - Vue Jour : vue détaillée d'une journée avec tous les rendez-vous triés chronologiquement
  - Boutons de sélection de mode (Jour/Semaine/Mois) avec état actif visuellement marqué (toggle group)
  - Navigation adaptative : précédent/suivant/aujourd'hui ajustés selon le mode de vue (jour ±1, semaine ±7, mois ±1 mois)
  - Récupération de données optimisée : seuls les rendez-vous de la période visible sont chargés (query key dynamique avec start/end)
  - Format d'affichage adaptatif : titre de période change selon le mode (ex: "21 - 27 octobre 2024" pour la semaine, "octobre 2025" pour le mois)
  - Boutons d'ajout de rendez-vous contextuels dans chaque vue
  - Design responsive avec adaptation mobile/desktop
  - Grille mois : calcul de gridStart (startOfWeek(startOfMonth)) à gridEnd (endOfWeek(endOfMonth)) pour alignement parfait avec en-têtes de jour
  - Validation e2e : tous les modes, navigation, mise en évidence de la date du jour testés et validés

### October 29, 2025 - Résolution en Masse des Alertes
- **Implémentation de la sélection et résolution groupée d'alertes** :
  - Checkboxes pour sélectionner individuellement les alertes
  - Checkbox "Tout sélectionner" avec état indéterminé
  - Compteur d'alertes sélectionnées
  - Bouton "Résoudre la sélection" pour traiter plusieurs alertes simultanément
  - API backend `/api/alerts/bulk-resolve` avec filtre sur alertes non résolues
  - Réinitialisation automatique de la sélection lors du changement d'onglet
  - Validation côté serveur pour éviter la double-résolution
  - Messages toast avec nombre exact d'alertes résolues
  - Invalidation automatique du cache après résolution

### October 29, 2025 - Email Reply Attachments Support
- **Implemented Attachment Support for Email Replies**:
  - Added multer middleware for multipart file uploads (15 MB per file, 25 MB total)
  - Modified `/api/emails/:id/send-response` to accept file attachments via FormData
  - Updated `sendEmailResponse` in `emailSender.ts` to handle Nodemailer attachments
  - Frontend file selector with validation, preview, and removal controls
  - Supports PDF, Word, Excel, PowerPoint, Images, Archives, and other common formats
  - Client-side validation for file size limits (25 MB total)
  - Real-time display of attached files with size information
  - Files stored in-memory and sent directly via SMTP (no disk storage)

### October 29, 2025 - AI-Powered Email Search
- **Implemented AI Search Feature**: Natural language search for emails using GPT-5
  - Separated prompt analysis (once) from data retrieval (pagination-friendly)
  - Route `/api/emails/ai-search/analyze`: Analyzes user prompt with OpenAI (called once)
  - Route `/api/emails/ai-search`: Executes search with cached criteria (used for pagination)
  - Frontend caches extracted criteria client-side to avoid redundant GPT-5 calls
  - Search UI with Sparkles icon button, elegant dialog, and criteria badges
  - Button variant changes to indicate active AI search state
  - Fixed bug: corrected `cat.name` to `cat.key` in category mapping
  - Fixed OpenAI temperature parameter (changed from 0.3 to 0)
  - Production-ready with controlled API costs and fast pagination

## System Architecture
The application uses a modern web stack:
- **Frontend**: React, TypeScript, Tailwind CSS, and Shadcn UI provide a responsive and aesthetically pleasing user interface. The design system incorporates a professional blue color scheme, Inter typography for UI, and JetBrains Mono for code/data, supporting both dark and light modes. Visual icon and color pickers enhance UX for category management. Sidebar menus include real-time count badges.
- **Backend**: Express.js with Node.js provides a robust API layer for business logic and data handling.
- **Database**: PostgreSQL, hosted on Neon, for persistent storage of all application data.
- **AI Integration**: OpenAI's GPT-5 is central to intelligent email analysis, response generation, and appointment suggestions, including natural language rule creation for custom alerts.
- **Authentication**: A dual authentication system supports Replit Auth (OpenID Connect) for administrators and direct Replit users, and Email/Password for invited users.
- **Document Storage**: Google Drive is integrated for secure and organized storage of extracted documents, with automatic categorization into a hierarchical folder structure.
- **UI/UX Decisions**: Consistent display of category icons and colors across the application (Dashboard, Settings, Email Badges). Dynamic displays for task statuses in the dashboard. Responsive chart period controls with vertical layout on mobile (<640px) and horizontal layout on desktop. Alert cards feature hover effects (hover-elevate) and cursor-pointer to indicate clickability.
- **System Design Choices**: Global category system with flexible assignment to multiple email accounts via a junction table. Category deletion automatically transfers affected emails to a fallback "autre" category. Email read/unread status is tracked independently of processed status. Tasks associated with an email are automatically completed when the email is marked as "traité". Task assignment to users is supported. Appointment selection dialog for days with multiple appointments. Automated scanning of individual email accounts.

**Key Features**:
- **Dashboard**: High-level overview of critical alerts, monthly statistics, activity summaries, and "Tasks in Progress" card with quick status changes. Features advanced data visualizations with configurable period controls, responsive grid layout, and full drag-and-drop customization:
  * **Responsive Grid Layout**: Optimized display for all screen sizes
    - Mobile/Tablet (< 1024px): Single column, stacked vertically
    - Desktop/Large screens (≥ 1024px): 2-column grid with charts side-by-side
    - Categories section spans full width on all screens (contains 4-column internal grid)
  * **Drag-and-Drop Layout Customization**: All dashboard sections support manual reorganization via drag-and-drop using @dnd-kit/sortable library
    - Persistent user preferences stored in `user_dashboard_layout` table with per-user layout configuration
    - Visual drag handles (GripVertical icon) appear on hover for intuitive interaction
    - Reset button to restore default layout order
    - Draggable sections (9 total): Tasks, Alerts, Categories, Email Evolution, Email Distribution, Appointments, Category Processing, Tasks Evolution, Alerts Evolution
    - All sections can be freely reorganized, including Tasks and Alerts cards
    - Drag-and-drop works seamlessly across grid layout (2 columns on large screens)
    - Automatic layout migration for existing users: new sections are appended to custom layouts while preserving user's preferred order
    - Invalid/deprecated section IDs are filtered out automatically during layout load
  * **Configurable Period System**: All 6 dashboard charts support independent week/month period selection with temporal navigation (previous/next controls) and precise period labels (e.g., "Semaine du 21 au 27 octobre 2024" or "Octobre 2024")
  * **Évolution des emails traités**: Line chart showing processed email trends over configurable periods
  * **Répartition des emails reçus**: Pie chart using category-configured colors with email counts, supports period filtering
  * **Évolution des RDV**: Bar chart displaying appointment trends with week/month period selection
  * **Taux de traitement par catégorie**: Vertical bar chart colored by category showing processing rates across periods
  * **Évolution des tâches**: Stacked bar chart tracking task evolution (Nouveau/En cours/Terminé) with configurable time periods
  * **Évolution des alertes**: Stacked bar chart monitoring alert trends (Actives/Résolues) with period controls
  * Category-colored visualizations throughout for consistent visual identity
  * Weeks calculated from Monday to Sunday, months use standard calendar boundaries
- **Email Management**: AI-powered categorization, priority/sentiment detection, auto-response generation, task assignment, and alerts. Supports bulk processing and individual email account scanning. Features read/unread status tracking and category-based automatic marking as processed. Smart date display shows time for today's emails (e.g., "14:30"), "Hier" for yesterday, and date format (e.g., "15 oct") for older emails. Email list supports pagination (20 emails per page) with intuitive navigation controls. **AI-powered natural language search** allows users to find emails using queries like "emails non lus de Marie cette semaine" or "factures urgentes non payées" - GPT-5 analyzes the prompt and extracts structured search criteria (sender, dates, categories, priority, status, attachments, etc.) displayed as badges for transparency.
- **Calendar**: Monthly visualization and automated scheduling of appointments from emails, with AI-driven preparation.
- **Document Management**: Automatic extraction, classification, and storage of email attachments on Google Drive with full-text search.
- **Alert System**: Configurable custom alerts using natural language prompts interpreted by GPT-5. Alert cards are clickable and redirect to the Email Management page with automatic filtering to show only emails related to the specific alert.
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
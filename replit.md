# Assistant Administratif Intelligent pour PME

## Vue d'ensemble
Application web intelligente pour automatiser la gestion administrative des PME avec analyse d'emails par IA (GPT), gestion automatisée des devis, factures, rendez-vous et documents.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + Node.js
- **Base de données**: PostgreSQL (Neon)
- **IA**: OpenAI GPT-5 pour l'analyse intelligente
- **Auth**: Replit Auth (OpenID Connect)
- **Stockage**: Google Drive pour les documents

## Fonctionnalités principales

### 1. Tableau de bord
- Alertes importantes (devis sans réponse, factures impayées, RDV à venir)
- Statistiques mensuelles
- Vue d'ensemble des activités

### 2. Gestion des emails
- Analyse intelligente par GPT (type: devis/facture/RDV)
- Détection automatique de priorité et sentiment
- Génération de réponses automatiques avec validation
- Attribution aux collaborateurs
- Système d'alertes pour emails non traités

### 3. Calendrier
- Visualisation mensuelle des rendez-vous
- Planification automatique depuis les emails
- Suggestions IA de préparation pour les RDV
- Tags pour catégoriser les rendez-vous

### 4. Documents
- Extraction automatique des pièces jointes
- Classification par type (facture, devis, contrat)
- Stockage Google Drive
- Vue liste et grille

### 5. Alertes
- Devis sans réponse (48h)
- Factures impayées (15 jours)
- Emails non traités (configurable)
- RDV à venir

### 6. Configuration
- Gestion des comptes email (Gmail/Outlook via IMAP/SMTP)
- Création de tags intelligents
- Activation/désactivation des fonctionnalités IA
- Paramètres d'automatisation

### 7. Gestion utilisateurs
- Rôles: Gérant, Administrateur, Collaborateur
- Attribution des tâches
- Permissions par rôle

## Structure de la base de données

### Tables principales
- `users`: Utilisateurs avec rôles
- `email_accounts`: Configuration des comptes email
- `emails`: Emails avec analyse IA
- `documents`: Pièces jointes et documents
- `appointments`: Rendez-vous et RDV
- `alerts`: Système d'alertes
- `tags`: Étiquettes de classification
- `email_responses`: Réponses générées par IA
- `settings`: Configuration de l'application

## Intégrations configurées
- **OpenAI**: Analyse intelligente des emails (GPT-5)
- **Google Drive**: Stockage cloud des documents (connection:conn_google-drive_01K7FM68X5947DTQDWNCQKN5QV)
- **Replit Auth**: Authentification multi-utilisateurs
- **PostgreSQL**: Base de données persistante

## Configuration requise
- `OPENAI_API_KEY`: Clé API OpenAI (✓ configurée)
- `DATABASE_URL`: URL PostgreSQL (✓ auto-configurée)
- `SESSION_SECRET`: Secret pour les sessions (✓ auto-configuré)

## Scénarios d'utilisation

### Scénario 1: Traitement automatique d'un devis
1. Email reçu avec demande de devis
2. GPT détecte le type "devis"
3. Extraction des informations (prestation, date, budget)
4. Création automatique d'une tâche
5. Alerte si pas de réponse sous 48h

### Scénario 2: Facture impayée
1. Facture reçue par email
2. Extraction du montant et échéance
3. Classification et stockage
4. Alerte après 15 jours si non payée
5. Proposition de relance automatique

### Scénario 3: Planification RDV
1. Email avec proposition de date
2. Détection de l'intention de planification
3. Vérification disponibilités
4. Création automatique du RDV
5. Suggestions de préparation par IA

## Design system
- Couleurs: Bleu professionnel (#3b82f6), Vert succès, Orange warning, Rouge erreur
- Typography: Inter (UI), JetBrains Mono (code/données)
- Mode sombre/clair avec ThemeProvider
- Composants Shadcn UI personnalisés

## Développement
- Frontend: `npm run dev` (Vite)
- Backend: Express sur même port
- Base de données: `npm run db:push` pour migrations
- Workflow: "Start application" lance le serveur complet

## Prochaines étapes (Phase 2)
- Intégration OneDrive
- Système de relances automatiques
- Analyse de sentiment avancée
- KPI et statistiques avancées
- OCR pour documents scannés

## Implémentation Backend (Complétée)

### ✅ Tâche 1: Scanner IMAP automatique
- Service EmailScanner avec scan périodique (15 min)
- Connexion sécurisée IMAP avec validation TLS
- Analyse GPT-5 de chaque email (type, priorité, sentiment)
- Prévention des duplicatas via messageId exact
- Marquage des emails comme lus après traitement
- Gestion robuste des erreurs et logs détaillés

### ✅ Tâche 2: Extraction pièces jointes + Google Drive
- Extraction automatique des attachments des emails
- Upload vers dossier Google Drive dédié (PME-Assistant-Documents)
- Classification intelligente (facture/devis/contrat/autre)
- Stockage métadonnées: driveFileId, driveUrl, fileSize
- Isolation des erreurs par attachment

### ✅ Tâche 3: Système d'alertes automatiques
- Vérification périodique (60 min) des conditions d'alerte
- Devis sans réponse après 48h (severity: critical)
- Factures impayées après 15 jours (severity: warning)
- Emails urgents non traités après 24h (severity: warning)
- Prévention des duplicatas via filtre isResolved=false
- Liens vers emails source pour action rapide

### ✅ Tâche 4: Création automatique rendez-vous
- Détection GPT des emails type 'rdv' avec date
- Extraction automatique des participants (from/to)
- Durée par défaut: 1 heure
- Génération suggestions IA (préparation, documents, notes)
- Stockage complet avec aiSuggestions JSONB
- Lien vers email source

### ✅ Tâche 5: Génération réponses automatiques GPT
- API POST /api/emails/:id/generate-response
- Génération via GPT-5 avec contexte optionnel
- Workflow approbation (isApproved=false par défaut)
- API GET /api/emails/:id/responses (liste réponses)
- API PATCH /api/email-responses/:id/approve (approuver)
- API POST /api/email-responses/:id/send (envoyer si approuvé)
- Audit complet: generatedBy, approvedById, sentAt

## Services Backend

### EmailScanner (server/emailScanner.ts)
- Scan IMAP avec imap-simple et mailparser
- Analyse GPT-5 complète de chaque email
- Upload automatique pièces jointes vers Google Drive
- Création automatique rendez-vous si type 'rdv'
- Gestion erreurs isolée par email/attachment

### AlertService (server/alertService.ts)
- Génération alertes business critiques
- Vérification devis/factures/emails non traités
- Prévention duplicatas via isResolved
- Logs détaillés de chaque vérification

### EmailScheduler (server/scheduler.ts)
- Scan emails: toutes les 15 minutes
- Génération alertes: toutes les 60 minutes
- Mutex locks pour éviter concurrence
- Logs de performance et statistiques

### Google Drive Service (server/googleDrive.ts)
- Authentification via Replit Connectors
- Gestion automatique refresh tokens
- Upload avec création de dossiers
- Retour fileId et webViewLink

### OpenAI Service (server/openai.ts)
- analyzeEmail(): Classification GPT-5 complète avec analyse avancée de sentiment
- generateEmailResponse(): Réponses professionnelles
- generateAppointmentSuggestions(): Prep IA pour RDV
- generateReminderEmail(): Relances automatiques escaladées

### ReminderService (server/reminderService.ts)
- Génération automatique relances pour devis et factures
- Logique temporelle stricte: 48h post-deadline (devis), 15j (factures), puis 48h/7j entre relances
- Prévention duplicatas: vérifie relances envoyées ET en attente
- Limite max 3 relances par email
- Ton escaladé GPT (1: gentil, 2: direct, 3: ferme)
- Prêt pour intégration SMTP (isSent/sentAt)

### ✅ Tâche 6: Statistiques Dashboard complètes
- **Métriques critiques**: Devis sans réponse, factures impayées, RDV aujourd'hui, emails non traités, alertes actives
- **Métriques mensuelles**: Emails reçus/traités, taux de traitement (%), RDV créés, documents uploadés
- **Métriques hebdomadaires**: Volume emails derniers 7 jours
- **Analyses par type**: Breakdown emails par type (devis/facture/rdv/général)
- **Analyses par priorité**: Distribution priorités pour emails non traités
- **Optimisations performance**: 
  - Service alertes optimisé: 1 seule requête getAlerts() par cycle (vs N requêtes avant)
  - Filtrage in-memory des alertes non résolues
  - Calcul taux de traitement avec gestion division par zéro
  - Requêtes SQL avec date ranges précises (month/week/day)
- **Correction bugs**: Utilisation correcte du champ `status` (nouveau/en_cours/traite/archive) au lieu de isProcessed

### ✅ Tâche 8: Système de relances automatiques
- **Table reminders**: emailId, reminderType, reminderNumber, subject, body, sentToEmail, isSent, sentAt
- **ReminderService**: Génération automatique de relances pour devis et factures
- **Timing intelligent**:
  - Devis: Première relance 48h après responseDeadline, puis 48h entre relances
  - Factures: Première relance 15j après receivedAt, puis 7j entre relances
- **Prévention duplicatas**: Vérifie relances envoyées ET en attente avant création
- **Limite max**: Maximum 3 relances par email
- **Ton escaladé GPT**: 1ère gentille → 2ème directe → 3ème ferme
- **API routes**:
  - GET /api/reminders?emailId=xxx
  - POST /api/reminders/:id/send (prêt pour SMTP)
- **Scheduler**: Vérifie toutes les 120 minutes
- **État**: Backend complet, prêt pour intégration SMTP

### ✅ Tâche 9: Analyse de sentiment avancée
- **Détection des risques** (5 niveaux): none/low/medium/high/critical
  - Critical: Menace légale, résiliation contrat, plainte publique
  - High: Forte insatisfaction, mention concurrent, dommages
  - Medium: Plaintes, frustrations, attentes non comblées
  - Low: Préoccupations mineures
- **Facteurs de risque**: Liste spécifique en français (ex: "Client mécontent du délai")
- **Type d'urgence**: real/perceived/none
  - Real: Deadline concrète, obligation légale, impact business
  - Perceived: Client pressé sans deadline
- **Indicateurs de conflit**: Ton agressif, remise en question qualité, comparaison concurrent
- **Recommandations d'actions**: 
  - Format: {action, priority (immediate/high/normal), reason}
  - Ex: "Appeler le client dans l'heure" (immediate)
- **API routes nouvelles**:
  - GET /api/emails/high-risk (emails critiques/high risk triés)
  - GET /api/emails/action-recommendations (toutes recommandations triées par priorité)
- **Stockage**: Champs ajoutés dans aiAnalysis JSONB existant
- **État**: Analyse GPT enrichie, APIs exposées, prêt pour UI

## État actuel
✅ **Phase 1+2: Backend Core - COMPLÉTÉE** (Tâches 1-9)
- Scanner IMAP automatique avec GPT-5
- Extraction pièces jointes + Google Drive
- Système alertes automatiques optimisé
- Création automatique RDV
- Génération réponses GPT avec validation
- Dashboard statistiques complètes
- Système relances automatiques (devis/factures)
- Analyse sentiment avancée avec détection risques

⏳ **Phase 3: Fonctionnalités avancées** - À venir (Tâches 10-11)
- Tableau de bord KPI avancé
- OCR pour documents scannés

## Prochaines étapes immédiates
1. ✅ Dashboard stats avec vraies données
2. ✅ Analyse sentiment avancée avec recommandations
3. Tests end-to-end du workflow complet
4. SMTP réel pour envoi réponses emails et relances
5. Interface frontend complète (emails à risque, recommandations)

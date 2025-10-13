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

## État actuel
✅ Phase 1: Schema & Frontend - En cours
⏳ Phase 2: Backend - À venir
⏳ Phase 3: Integration & Tests - À venir

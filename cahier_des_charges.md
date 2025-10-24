# Cahier des Charges - IzyInbox
## Assistant Administratif Intelligent pour PME

---

**Version:** 1.0  
**Date:** 24 Octobre 2025  
**Slogan:** *"Smart Automation for Busy Managers"*

---

## Table des Matières

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Objectifs et Vision](#2-objectifs-et-vision)
3. [Architecture Technique](#3-architecture-technique)
4. [Spécifications Fonctionnelles](#4-spécifications-fonctionnelles)
   - [4.1 Dashboard (Tableau de Bord)](#41-dashboard-tableau-de-bord)
   - [4.2 Emails](#42-emails)
   - [4.3 Calendrier](#43-calendrier)
   - [4.4 Documents](#44-documents)
   - [4.5 Alertes](#45-alertes)
   - [4.6 Étiquettes (Tags)](#46-étiquettes-tags)
   - [4.7 Utilisateurs](#47-utilisateurs)
   - [4.8 Paramètres](#48-paramètres)
5. [Spécifications Techniques Détaillées](#5-spécifications-techniques-détaillées)
6. [Intégrations Externes](#6-intégrations-externes)
7. [Flux de Données et Automatisations](#7-flux-de-données-et-automatisations)
8. [Guide de Capture des Screenshots](#8-guide-de-capture-des-screenshots)

---

## 1. Présentation du Projet

### 1.1 Contexte

**IzyInbox** est une application web intelligente conçue pour automatiser les tâches administratives des PME françaises. L'application s'appuie sur l'intelligence artificielle (GPT-5 d'OpenAI) pour analyser automatiquement les emails, extraire les documents importants, planifier les rendez-vous et générer des alertes personnalisées.

### 1.2 Public Cible

- **Petites et Moyennes Entreprises (PME)** françaises
- **Gestionnaires et managers** surchargés de tâches administratives
- **Équipes administratives** nécessitant une centralisation de l'information

### 1.3 Problématique

Les PME sont souvent submergées par :
- La gestion quotidienne des emails professionnels
- Le suivi des devis et factures
- La planification des rendez-vous
- L'archivage et la recherche de documents
- La détection proactive des situations critiques

### 1.4 Solution Proposée

IzyInbox offre une solution complète d'automatisation administrative avec :
- **Analyse IA des emails** : Catégorisation automatique, détection de priorité et sentiment
- **Gestion intelligente des documents** : Extraction et OCR automatiques, stockage sur Google Drive
- **Calendrier automatisé** : Détection et planification des rendez-vous depuis les emails
- **Système d'alertes personnalisées** : Règles créées en langage naturel
- **Tableau de bord KPI** : Visualisation en temps réel de l'activité

---

## 2. Objectifs et Vision

### 2.1 Objectifs Principaux

1. **Réduire le temps consacré aux tâches administratives** de 60%
2. **Améliorer la réactivité** face aux emails urgents et aux échéances
3. **Centraliser l'information** dans une interface unique et intuitive
4. **Automatiser les processus répétitifs** grâce à l'IA
5. **Fournir des insights actionnables** via des KPIs et visualisations

### 2.2 Vision à Long Terme

- Devenir la solution de référence pour l'automatisation administrative des PME
- Extension à d'autres langues et marchés internationaux
- Intégration avec des ERP et CRM existants
- Développement d'applications mobiles natives

### 2.3 Identité de Marque

**Couleurs principales :**
- **Navy Blue (#1a2744)** : Professionnalisme et confiance
- **Cyan (#00d9ff)** : Innovation et technologie

**Typographie :**
- **Interface utilisateur** : Inter (sans-serif moderne)
- **Code et données** : JetBrains Mono (monospace)

**Modes d'affichage :**
- Mode clair (par défaut)
- Mode sombre (automatique selon préférences système)

---

## 3. Architecture Technique

### 3.1 Stack Technologique

**Frontend :**
- **Framework** : React 18 avec TypeScript
- **Routing** : Wouter (léger et performant)
- **UI Components** : Shadcn UI + Radix UI (composants accessibles)
- **Styling** : Tailwind CSS + CSS custom properties
- **Gestion d'état** : TanStack Query v5 (React Query)
- **Formulaires** : React Hook Form + Zod validation
- **Graphiques** : Recharts (visualisations interactives)
- **Dates** : date-fns avec locale française

**Backend :**
- **Runtime** : Node.js 20
- **Framework** : Express.js
- **Base de données** : PostgreSQL (hébergé sur Neon)
- **ORM** : Drizzle ORM avec migrations automatiques
- **Sessions** : express-session avec stockage PostgreSQL

**Sécurité et Authentification :**
- **Système dual** :
  - Replit Auth (OpenID Connect) pour les administrateurs
  - Email/Password pour les utilisateurs invités
- **Hachage** : bcrypt pour les mots de passe
- **Sessions** : Cookies sécurisés HTTP-only
- **Rôles** : Admin, Manager, Simple

**Intégrations IA et Cloud :**
- **OpenAI GPT-5** : Analyse d'emails, génération de réponses, création de règles
- **Google Drive API** : Stockage et organisation des documents
- **Tesseract.js** : OCR pour documents scannés
- **pdf-parse** : Extraction de texte depuis PDFs

**Email :**
- **IMAP** : imap-simple pour la réception
- **SMTP** : Nodemailer pour l'envoi
- **Parsing** : mailparser pour l'analyse des emails

### 3.2 Architecture de Base de Données

**Tables principales :**

```
users
├── id (varchar, UUID)
├── email (varchar, unique)
├── password (varchar, hashed)
├── role (varchar: manager/administrator/collaborator)
├── firstName, lastName (varchar)
└── createdAt (timestamp)

emailAccounts
├── id (varchar, UUID)
├── email (varchar)
├── provider (varchar: gmail, outlook, etc.)
├── imapHost, imapPort, smtpHost, smtpPort (varchar/integer)
├── username, password (varchar, encrypted)
├── scanFrequency (integer, minutes)
└── lastScanAt (timestamp)

emailCategories (global)
├── id (varchar, UUID)
├── key (varchar, unique: devis, facture, rdv, etc.)
├── label (varchar)
├── color (varchar, hex)
├── icon (varchar)
├── isSystem (boolean)
└── generateAutoResponse (boolean)

emailAccountCategories (junction table)
├── emailAccountId (varchar, FK)
├── categoryId (varchar, FK)
└── PRIMARY KEY (emailAccountId, categoryId)

emails
├── id (varchar, UUID)
├── emailAccountId (varchar, FK)
├── subject (text)
├── sender, recipient (varchar)
├── body (text)
├── category (varchar, FK to emailCategories.key)
├── priority (varchar: low/normal/high/urgent)
├── sentiment (varchar: positive/neutral/negative)
├── status (varchar: nouveau/en_cours/traite/archive)
├── aiSummary (text)
├── suggestedResponse (text)
├── receivedAt (timestamp)
└── processedAt (timestamp)

appointments
├── id (varchar, UUID)
├── emailId (varchar, FK, nullable)
├── title (varchar)
├── description (text)
├── location (varchar)
├── startTime, endTime (timestamp)
├── tag (varchar: client, interne, fournisseur, etc.)
├── status (varchar: confirme, en_attente, annule)
└── createdAt (timestamp)

documents
├── id (varchar, UUID)
├── emailId (varchar, FK, nullable)
├── filename (varchar)
├── documentType (varchar: facture, devis, contrat, autre)
├── mimeType (varchar)
├── extractedText (text)
├── driveFileId (varchar)
├── driveUrl (varchar)
└── createdAt (timestamp)

alerts
├── id (varchar, UUID)
├── title (varchar)
├── message (text)
├── severity (varchar: info/warning/critical)
├── entityType (varchar: email/appointment)
├── entityId (varchar, FK)
├── resolved (boolean)
├── resolvedAt (timestamp)
└── createdAt (timestamp)

alertRules
├── id (varchar, UUID)
├── name (varchar)
├── prompt (text, natural language)
├── isActive (boolean)
├── severity (varchar)
├── entityType (varchar)
├── filters (JSON)
└── createdAt (timestamp)

settings
├── id (varchar, UUID)
├── autoAnalysis (boolean)
├── autoResponses (boolean)
├── autoScheduling (boolean)
├── defaultAppointmentDuration (integer, minutes)
├── emailAlertDeadline (integer, hours)
└── updatedAt (timestamp)
```

### 3.3 Modèle de Partage

**Inbox Partagée :**
- Tous les emails sont visibles par tous les utilisateurs authentifiés
- Modèle collaboratif pour les équipes
- Permissions basées sur les rôles pour certaines actions (admin uniquement)

---

## 4. Spécifications Fonctionnelles

### 4.1 Dashboard (Tableau de Bord)

**Route :** `/`

#### 4.1.1 Objectif
Fournir une vue d'ensemble rapide et actionnale de l'activité administrative de l'entreprise.

#### 4.1.2 Structure de l'Écran

**A. En-tête**
- Titre : "Tableau de bord"
- Sous-titre : "Vue d'ensemble de votre activité administrative"

**B. KPIs Principaux (Cartes cliquables)**

1. **Carte Devis**
   - **Métrique** : Nombre de devis sans réponse
   - **Icône** : FileText (document)
   - **Couleur** : Accent primaire
   - **Action au clic** : Redirige vers `/emails?category=devis&status=nouveau`
   - **data-testid** : `kpi-devis`

2. **Carte Factures**
   - **Métrique** : Nombre de factures impayées/non traitées
   - **Icône** : Receipt
   - **Couleur** : Accent secondaire
   - **Action au clic** : Redirige vers `/emails?category=facture&status=nouveau`
   - **data-testid** : `kpi-factures`

3. **Carte Rendez-vous**
   - **Métrique** : Nombre de RDV à venir (prochaines 48h)
   - **Icône** : Calendar
   - **Couleur** : Chart-1
   - **Action au clic** : Redirige vers `/calendar`
   - **data-testid** : `kpi-appointments`

4. **Carte Emails Non Traités**
   - **Métrique** : Total des emails avec statut "nouveau"
   - **Icône** : Mail
   - **Couleur** : Chart-2
   - **Action au clic** : Redirige vers `/emails?status=nouveau`
   - **data-testid** : `kpi-unread-emails`

**C. Section Alertes Critiques**
- Titre : "Alertes actives"
- Bouton : "Vérifier maintenant" (génère de nouvelles alertes via l'IA)
- Liste des 5 dernières alertes non résolues
- Chaque alerte affiche :
  - Icône d'avertissement avec couleur selon gravité
  - Titre et message
  - Badge de sévérité (Info / Attention / Critique)
  - Date de création
  - Bouton "Résoudre"
- **data-testid** : `button-check-alerts`, `alert-{id}`, `button-resolve-{id}`

**D. Graphiques et Statistiques**

1. **Graphique Volume d'Emails (30 derniers jours)**
   - **Type** : Graphique en lignes (LineChart)
   - **Axe X** : Dates (format "dd MMM")
   - **Axe Y** : Nombre d'emails
   - **Couleurs** : Palette Chart (chart-1 à chart-4)
   - **Données** : Volume quotidien d'emails reçus
   - **Interactivité** : Tooltip au survol

2. **Répartition par Catégorie**
   - **Type** : Graphique en secteurs (PieChart)
   - **Légende** : Visible avec nom et pourcentage
   - **Couleurs** : Utilise les couleurs définies pour chaque catégorie
   - **Données** : Nombre d'emails par catégorie (devis, facture, rdv, autre)

3. **Statistiques Mensuelles**
   - **Type** : Graphique en barres (BarChart)
   - **Axe X** : Mois (format "MMM yyyy")
   - **Axe Y** : Différentes métriques
   - **Barres multiples** :
     - Emails reçus
     - Emails traités
     - Rendez-vous planifiés
     - Documents extraits

#### 4.1.3 Fonctionnalités Clés

- **Navigation rapide** : Clic sur n'importe quelle carte KPI pour accéder aux détails
- **Génération d'alertes à la demande** : Bouton pour forcer la vérification des règles
- **Actualisation automatique** : Les données se rafraîchissent via React Query
- **Responsive** : Grille adaptative (1 col mobile, 2 cols tablette, 4 cols desktop)

#### 4.1.4 États d'Interface

- **Chargement** : Skeletons animés pour KPIs et graphiques
- **Vide** : Message si aucune donnée disponible
- **Erreur** : Toast notification en cas d'échec de requête

#### 4.1.5 Capture d'Écran (À ajouter)

```
[SCREENSHOT: Vue complète du Dashboard montrant les 4 KPIs, la section alertes et les 3 graphiques]

Instructions pour capturer :
1. Se connecter avec un compte administrateur
2. Naviguer vers la route "/"
3. Attendre le chargement complet des données
4. Capturer l'écran en pleine page
```

---

### 4.2 Emails

**Route :** `/emails`

#### 4.2.1 Objectif
Centraliser la gestion de tous les emails professionnels avec analyse IA, filtrage avancé et actions automatisées.

#### 4.2.2 Structure de l'Écran

**A. En-tête**
- Titre : "Emails"
- Sous-titre : "Gestion intelligente de vos communications"

**B. Barre de Filtres et Actions**

1. **Barre de Recherche**
   - **Placeholder** : "Rechercher dans les emails..."
   - **Icône** : Search (loupe)
   - **Fonctionnalité** : Recherche en temps réel dans subject, sender, body
   - **data-testid** : `input-search-email`

2. **Filtre par Catégorie**
   - **Type** : Select dropdown
   - **Options dynamiques** : Chargées depuis `/api/email-categories`
     - "Toutes les catégories" (all)
     - Devis
     - Facture
     - Rendez-vous
     - Support client
     - Autres catégories personnalisées...
   - **data-testid** : `select-email-category`

3. **Filtre par Statut**
   - **Type** : Select dropdown
   - **Options** :
     - "Tous les statuts" (all)
     - Nouveau (nouveau)
     - En cours (en_cours)
     - Traité (traite)
     - Archivé (archive)
   - **data-testid** : `select-email-status`

4. **Actions en Masse** (visible si emails sélectionnés)
   - Bouton : "Marquer comme traité"
   - Bouton : "Archiver"
   - Indicateur : "X emails sélectionnés"
   - **data-testid** : `button-bulk-mark-processed`, `button-bulk-archive`

**C. Liste des Emails**

Chaque email est présenté dans une carte avec :

**Layout de la Carte :**
```
[Checkbox] [Avatar] [Contenu Principal] [Actions]
```

**Éléments de la Carte :**

1. **Checkbox de sélection**
   - Position : Extrême gauche
   - Fonctionnalité : Sélection multiple pour actions en masse

2. **Avatar de l'expéditeur**
   - Initiale extraite du nom/email de l'expéditeur
   - Couleur de fond aléatoire mais cohérente
   - Taille : 40x40px

3. **Contenu Principal :**
   - **Ligne 1** : Nom de l'expéditeur (formaté, sans guillemets)
   - **Ligne 2** : Sujet de l'email (en gras si non traité)
   - **Ligne 3** : Extrait du corps (1-2 lignes, tronqué)
   - **Ligne 4** : Métadonnées
     - Badge de catégorie (couleur personnalisée)
     - Badge de priorité (si High ou Urgent)
     - Badge de sentiment (si négatif, icône d'alerte)
     - Date de réception (format relatif "il y a X jours")

4. **Indicateurs Visuels :**
   - **Barre latérale colorée** : Couleur de la catégorie (épaisseur 4px)
   - **Icône IA** : Si analyse automatique effectuée
   - **Icône document** : Si pièces jointes extraites
   - **Icône calendrier** : Si rendez-vous détecté

5. **Zone d'Actions** (extrême droite)
   - Bouton "Répondre" : Génère une réponse IA
   - Bouton "Traiter" : Marque comme traité
   - Menu dropdown (MoreVertical) :
     - Voir les détails complets
     - Marquer comme non lu
     - Archiver
     - Supprimer

**D. Panneau Détails (Sidebar ou Modal)**

Lorsqu'un email est sélectionné :

1. **En-tête de l'Email**
   - Expéditeur complet avec email
   - Destinataires (To, CC)
   - Date et heure complètes
   - Bouton "Fermer"

2. **Contenu de l'Email**
   - Corps HTML rendu (ou texte brut)
   - Scrollable si long

3. **Analyse IA**
   - **Résumé automatique** : Synthèse en 2-3 phrases
   - **Catégorie détectée** : Badge avec confiance (%)
   - **Priorité** : Niveau détecté + justification
   - **Sentiment** : Positif/Neutre/Négatif avec indicateurs de risque
   - **Actions suggérées** : Liste d'actions recommandées

4. **Pièces Jointes**
   - Liste des documents extraits
   - Lien vers Google Drive pour chaque document
   - Bouton de téléchargement local

5. **Actions Disponibles**
   - **Générer une réponse**
     - Bouton principal
     - Option : Prompt personnalisé (textarea extensible)
     - Loading state pendant la génération
   - **Envoyer la réponse**
     - Dialog avec textarea éditable
     - Bouton "Envoyer" et "Annuler"
   - **Créer un rendez-vous**
     - Si catégorie RDV détectée
     - Pré-remplit les champs depuis l'email
   - **Marquer comme traité**

#### 4.2.3 Fonctionnalités Clés

**A. Génération de Réponse IA**

1. **Workflow Standard :**
   - Clic sur "Répondre avec IA"
   - Analyse du contexte de l'email (objet, corps, expéditeur)
   - Génération automatique via GPT-5
   - Affichage dans un dialog éditable
   - Possibilité d'envoyer directement ou modifier

2. **Prompt Personnalisé :**
   - Bouton "Personnaliser la réponse"
   - Affichage d'un champ textarea
   - Saisie d'instructions en langage naturel
   - Exemple : "Réponds de manière formelle en proposant un RDV la semaine prochaine"
   - Génération avec le prompt personnalisé

**B. Sélection Multiple**

- Checkbox "Tout sélectionner" dans l'en-tête
- Sélection individuelle par email
- Barre d'actions en masse apparaît automatiquement
- Actions disponibles :
  - Marquer comme traité
  - Changer de statut (en masse)
  - Archiver
  - Supprimer

**C. Tri et Filtrage**

- **Tri automatique** :
  1. Emails "nouveau" en premier
  2. Par date (plus récent d'abord)
- **Filtres cumulatifs** :
  - Recherche texte + Catégorie + Statut
- **URL Query Parameters** :
  - Support de `?category=devis&status=nouveau`
  - Permet les liens directs depuis le Dashboard

#### 4.2.4 États d'Interface

- **Chargement** : Liste de Skeleton cards
- **Vide** : Message "Aucun email trouvé" avec icône
- **Erreur** : Toast notification
- **Succès action** : Toast de confirmation

#### 4.2.5 Capture d'Écran (À ajouter)

```
[SCREENSHOT 1: Liste d'emails avec différents statuts et catégories]
[SCREENSHOT 2: Panneau détails d'un email avec analyse IA]
[SCREENSHOT 3: Dialog de génération de réponse personnalisée]
```

---

### 4.3 Calendrier

**Route :** `/calendar`

#### 4.3.1 Objectif
Visualiser et gérer tous les rendez-vous de l'entreprise dans une vue calendrier mensuelle intuitive.

#### 4.3.2 Structure de l'Écran

**A. En-tête**
- Titre : "Calendrier"
- Sous-titre : "Planification et gestion de vos rendez-vous"
- Bouton : "Nouveau rendez-vous" (crée manuellement un RDV)

**B. Navigation Mensuelle**

- **Affichage actuel** : Mois et année (ex: "Octobre 2025")
- **Bouton précédent** : Flèche gauche (ChevronLeft)
- **Bouton suivant** : Flèche droite (ChevronRight)
- **data-testid** : `button-prev-month`, `button-next-month`, `text-current-month`

**C. Grille Calendrier**

**Structure :**
- **En-tête** : Jours de la semaine (Lun, Mar, Mer, Jeu, Ven, Sam, Dim)
- **Corps** : Grille 7 colonnes × 5-6 lignes
- **Cellules de jour** :
  - Date du jour (numéro)
  - Pastilles colorées pour les rendez-vous (max 3 visibles)
  - Indicateur "+X" si plus de 3 rendez-vous
  - Jour actuel surligné (border accent)
  - Jours hors du mois en gris clair

**Interactions sur les Cellules :**

1. **Clic sur un jour sans RDV :**
   - Ouvre le dialog "Créer un rendez-vous"
   - Pré-remplit la date sélectionnée

2. **Clic sur un jour avec 1 seul RDV :**
   - Ouvre directement le dialog détails du RDV

3. **Clic sur un jour avec plusieurs RDV :**
   - Ouvre un dialog de sélection
   - Liste tous les RDV de ce jour
   - Format : "HH:mm - Titre - Lieu"
   - Clic sur un RDV ouvre ses détails

**D. Dialog Détails d'un Rendez-vous**

**Mode Lecture :**
- **En-tête** :
  - Titre du RDV (grande police)
  - Badge du tag (client, interne, fournisseur, etc.)
  - Badge du statut (confirmé, en attente, annulé)
- **Informations** :
  - 📅 Date et heure de début
  - ⏰ Date et heure de fin
  - 📍 Lieu (si renseigné)
  - 📝 Description (si renseignée)
  - 📧 Email lié (si créé depuis un email)
- **Actions** :
  - Bouton "Modifier" (icône Pencil)
  - Bouton "Annuler le RDV" (icône Trash, rouge)
  - Bouton "Fermer"

**Mode Édition :**
- **Formulaire** :
  - Champ : Titre (requis)
  - Champ : Description (textarea)
  - Champ : Lieu
  - Champ : Date et heure de début (datetime-local)
  - Champ : Date et heure de fin (datetime-local)
- **Actions** :
  - Bouton "Enregistrer"
  - Bouton "Annuler"

**E. Dialog Création de Rendez-vous**

- **Formulaire complet** :
  - Titre
  - Description
  - Lieu
  - Date/heure de début
  - Date/heure de fin
  - Tag (select : client, interne, fournisseur, personnel, autre)
- **Boutons** :
  - "Créer le rendez-vous"
  - "Annuler"
- **data-testid** : `button-create-appointment`, `input-title`, etc.

**F. Dialog Sélection (Plusieurs RDV)**

- **En-tête** : "Rendez-vous du [date]"
- **Liste** : Chaque RDV avec :
  - Icône Clock
  - Heure de début
  - Titre
  - Lieu (si présent)
  - Flèche de sélection
- **Action** : Clic ouvre le dialog détails

#### 4.3.3 Fonctionnalités Clés

**A. Détection Automatique depuis Emails**
- L'IA analyse les emails avec catégorie "rdv"
- Extrait automatiquement :
  - Date et heure suggérées
  - Lieu mentionné
  - Participants
- Crée un RDV avec statut "en attente"
- Lien vers l'email source

**B. Gestion Manuelle**
- Création manuelle complète
- Modification de tous les champs
- Annulation (soft delete, statut = annulé)

**C. Indicateurs Visuels**
- **Couleurs des pastilles** :
  - Vert : Rendez-vous confirmé
  - Orange : En attente de confirmation
  - Rouge : Annulé (mais encore affiché)
  - Bleu : Créé manuellement

**D. Support Multi-RDV**
- Affichage de plusieurs RDV par jour
- Dialog de sélection intuitif
- Aucune confusion possible

#### 4.3.4 États d'Interface

- **Chargement** : Skeleton pour la grille calendrier
- **Vide** : Calendrier sans pastilles
- **Erreur** : Toast notification

#### 4.3.5 Capture d'Écran (À ajouter)

```
[SCREENSHOT 1: Vue calendrier mensuelle avec plusieurs RDV]
[SCREENSHOT 2: Dialog de détails d'un RDV en mode lecture]
[SCREENSHOT 3: Dialog de sélection avec multiple RDV]
[SCREENSHOT 4: Dialog de création de RDV]
```

---

### 4.4 Documents

**Route :** `/documents`

#### 4.4.1 Objectif
Centraliser tous les documents extraits automatiquement des emails avec recherche avancée et accès direct à Google Drive.

#### 4.4.2 Structure de l'Écran

**A. En-tête**
- Titre : "Documents"
- Sous-titre : "Gestion centralisée de tous vos documents"
- Boutons de vue :
  - Icône List (vue liste)
  - Icône Grid (vue grille)

**B. Barre de Filtres**

1. **Recherche Textuelle**
   - Placeholder : "Rechercher un document..."
   - Icône Search
   - Recherche dans : filename, extractedText, documentType
   - **data-testid** : `input-search-document`

2. **Filtre par Type**
   - Select dropdown
   - Options :
     - "Tous les types"
     - Factures
     - Devis
     - Contrats
     - Autres
   - **data-testid** : `select-document-type`

**C. Vue Liste**

Chaque document est une ligne avec :

- **Icône de fichier** : Selon le type MIME
  - PDF → FileText (rouge)
  - Image → FileImage (bleu)
  - Word → FileText (bleu clair)
  - Excel → FileSpreadsheet (vert)
  - Autre → File (gris)
- **Nom du fichier** : Nom complet (tronqué si trop long)
- **Badge de type** : Facture, Devis, Contrat, Autre (avec couleurs)
- **Date d'ajout** : Format "dd MMM yyyy"
- **Actions** :
  - Bouton "Voir" (Eye) → Ouvre dans Google Drive
  - Bouton "Télécharger" (Download) → Téléchargement local
- **data-testid** : `document-row-{id}`, `button-view-{id}`, `button-download-{id}`

**D. Vue Grille**

Grille responsive (1-4 colonnes selon la taille d'écran) :

Chaque carte contient :
- **Zone d'aperçu** : Grande icône du type de fichier (bg-muted)
- **Nom du fichier** : 2 lignes max (line-clamp-2)
- **Badge de type**
- **Date**
- **Actions** : Voir et Télécharger (boutons en bas de carte)
- **Hover effect** : Élévation légère (hover-elevate)
- **data-testid** : `document-card-{id}`

#### 4.4.3 Fonctionnalités Clés

**A. Extraction Automatique**
- Lors de la réception d'un email avec pièces jointes
- Analyse du type de document (PDF, images, Word, Excel)
- Extraction de texte :
  - PDF → pdf-parse
  - Images → Tesseract.js (OCR)
  - Word/Excel → librairies dédiées
- Upload automatique vers Google Drive
- Catégorisation automatique (facture, devis, contrat, autre)
- Stockage des métadonnées en base de données

**B. Organisation Google Drive**

Structure hiérarchique :
```
PME-Assistant-Documents/
├── facture/
│   └── [documents de type facture]
├── devis/
│   └── [documents de type devis]
├── rdv/
│   └── [documents liés aux RDV]
├── autre/
│   └── [documents non catégorisés]
└── [catégories personnalisées]/
```

**C. Recherche Full-Text**
- Recherche dans le texte extrait (OCR)
- Recherche dans les noms de fichiers
- Résultats instantanés (debounced)

**D. Accès Sécurisé**
- Vérification des permissions avant téléchargement
- Liens Google Drive avec authentification
- Logs d'accès aux documents

#### 4.4.4 États d'Interface

- **Chargement** : Skeletons (8 éléments)
- **Vide** : Message "Aucun document trouvé"
- **Erreur** : Toast notification

#### 4.4.5 Capture d'Écran (À ajouter)

```
[SCREENSHOT 1: Vue liste avec plusieurs types de documents]
[SCREENSHOT 2: Vue grille avec cartes de documents]
[SCREENSHOT 3: Résultat de recherche textuelle]
```

---

### 4.5 Alertes

**Route :** `/alerts`

#### 4.5.1 Objectif
Afficher et gérer toutes les alertes générées automatiquement par le système de règles personnalisées.

#### 4.5.2 Structure de l'Écran

**A. En-tête**
- Titre : "Alertes"
- Sous-titre : "Suivez les alertes et notifications importantes"

**B. Onglets**

1. **Alertes Actives** (par défaut)
   - Affiche les alertes avec `resolved = false`
   - Bouton "Résoudre" sur chaque alerte

2. **Alertes Résolues**
   - Affiche les alertes avec `resolved = true`
   - Pas de bouton d'action
   - Date de résolution affichée

**C. Liste des Alertes**

Chaque alerte est une carte avec :

**Layout :**
```
[Icône Alerte] [Contenu] [Badge Sévérité] [Action Résoudre]
```

**Éléments :**

1. **Icône d'Alerte** :
   - AlertTriangle
   - Couleur selon sévérité :
     - Info → text-primary
     - Attention → text-chart-3 (orange)
     - Critique → text-destructive (rouge)

2. **Contenu** :
   - **Titre** : Titre de l'alerte (gras)
   - **Message** : Description détaillée (2-3 lignes)
   - **Date** : "dd MMMM yyyy à HH:mm"
   - **Date de résolution** : Si résolue

3. **Badge de Sévérité** :
   - "Info" (variant secondary)
   - "Attention" (bg-chart-3, orange)
   - "Critique" (variant destructive, rouge)

4. **Barre Latérale Colorée** :
   - 4px de largeur
   - Couleur selon sévérité
   - Position : Gauche de la carte

5. **Bouton Résoudre** (si non résolue) :
   - Icône CheckCircle
   - Texte "Résoudre"
   - Variant outline
   - **data-testid** : `button-resolve-{id}`

#### 4.5.3 Fonctionnalités Clés

**A. Génération Automatique**
- Exécution des règles d'alerte toutes les heures
- Évaluation des conditions sur emails et rendez-vous
- Création d'alertes si conditions remplies
- Évite les doublons (même entité + même règle)

**B. Résolution Manuelle**
- Clic sur "Résoudre"
- Mise à jour de `resolved = true` et `resolvedAt = now`
- Déplacement vers l'onglet "Résolues"
- Toast de confirmation

**C. Navigation vers Entités**
- Clic sur une alerte ouvre l'entité liée :
  - Email → Vue détails de l'email
  - Rendez-vous → Détails du RDV dans le calendrier

#### 4.5.4 États d'Interface

- **Chargement** : Liste de Skeleton cards
- **Vide** : Message différent selon l'onglet
  - Actives : "Aucune alerte active"
  - Résolues : "Aucune alerte résolue"
- **Erreur** : Toast notification

#### 4.5.5 Capture d'Écran (À ajouter)

```
[SCREENSHOT 1: Liste d'alertes actives avec différentes sévérités]
[SCREENSHOT 2: Onglet alertes résolues]
```

---

### 4.6 Étiquettes (Tags)

**Route :** `/tags`

#### 4.6.1 Objectif
Gérer les étiquettes personnalisées pour organiser et classifier automatiquement les emails et documents de l'entreprise.

#### 4.6.2 Structure de l'Écran

**A. En-tête**
- Titre : "Étiquettes"
- Sous-titre : "Gérez les étiquettes pour organiser vos emails et documents"
- Bouton : "Nouvelle étiquette" (icône Plus)

**B. Dialog de Création d'Étiquette**

Formulaire accessible via le bouton "Nouvelle étiquette" :

1. **Champ Nom** (Input)
   - Label : "Nom"
   - Placeholder : "Ex: Client important"
   - Requis
   - **data-testid** : `input-tag-name`

2. **Champ Catégorie** (Select)
   - Label : "Catégorie"
   - Options :
     - Devis
     - Facture
     - Rendez-vous
     - Client
     - Fournisseur
     - Général (par défaut)
   - **data-testid** : `select-tag-category`

3. **Sélecteur de Couleur**
   - Label : "Couleur"
   - Grille 4×2 de boutons de couleur
   - Couleurs disponibles :
     - Bleu (#3b82f6)
     - Vert (#10b981)
     - Orange (#f59e0b)
     - Rouge (#ef4444)
     - Violet (#8b5cf6)
     - Rose (#ec4899)
     - Cyan (#06b6d4)
     - Lime (#84cc16)
   - Couleur sélectionnée : Border épaisse
   - Par défaut : Bleu
   - **data-testid** : `color-{colorLabel}` (ex: `color-Bleu`)

4. **Bouton "Créer l'étiquette"**
   - Disabled si nom vide
   - Loading state pendant la création
   - Largeur complète
   - **data-testid** : `button-create-tag`

**C. Grille des Étiquettes Existantes**

Layout : Grille responsive (1 col mobile, 2 cols tablette, 3 cols desktop)

Chaque étiquette est affichée dans une carte avec :

**Layout de la Carte :**
```
[En-tête]
  [Pastille Couleur] [Nom] [Bouton Supprimer]
[Contenu]
  [Badge Catégorie] [Badge Système si applicable]
```

**Éléments de la Carte :**

1. **Pastille de Couleur**
   - Cercle coloré (12×12px)
   - Couleur de l'étiquette
   - Position : Gauche de l'en-tête

2. **Nom de l'Étiquette**
   - Texte en gras
   - Taille : base (16px)

3. **Bouton Supprimer** (si non-système)
   - Icône Trash2
   - Variant ghost
   - Taille icon (32×32px)
   - Position : Droite de l'en-tête
   - **Condition** : Affiché uniquement si `isSystem = false`
   - **data-testid** : `button-delete-tag-{id}`

4. **Badge Catégorie**
   - Variant outline
   - Texte : Label de la catégorie (ex: "Facture", "Client")
   - Taille : xs (12px)

5. **Badge Système** (si applicable)
   - Texte : "Système"
   - Variant secondary
   - Taille : xs (12px)
   - **Condition** : Affiché uniquement si `isSystem = true`

**D. État Vide**

Si aucune étiquette n'existe :
- Icône Tag (grande, centrée)
- Message : "Aucune étiquette créée"
- Centré verticalement et horizontalement

#### 4.6.3 Fonctionnalités Clés

**A. Création d'Étiquettes**

Workflow :
1. Clic sur "Nouvelle étiquette"
2. Dialog s'ouvre
3. Saisie du nom, sélection catégorie et couleur
4. Clic sur "Créer l'étiquette"
5. Validation et envoi à l'API
6. Toast de confirmation
7. Fermeture du dialog
8. Rafraîchissement de la grille

**B. Suppression d'Étiquettes**

- **Condition** : Uniquement pour les étiquettes non-système (`isSystem = false`)
- **Workflow** :
  1. Clic sur l'icône Trash
  2. Confirmation implicite (pas de dialog)
  3. Suppression immédiate
  4. Toast de confirmation
  5. Rafraîchissement de la grille
- **Protection** : Les étiquettes système ne peuvent pas être supprimées

**C. Étiquettes Système vs. Personnalisées**

1. **Étiquettes Système** :
   - Créées automatiquement par l'application
   - Attribut `isSystem = true`
   - Badge "Système" visible
   - Bouton de suppression masqué
   - Exemples : tags par défaut pour catégories principales

2. **Étiquettes Personnalisées** :
   - Créées par les utilisateurs
   - Attribut `isSystem = false`
   - Peuvent être supprimées
   - Couleur et nom personnalisables

**D. Utilisation des Étiquettes**

Les étiquettes créées ici sont utilisées pour :
- Classifier automatiquement les emails entrants (via IA)
- Organiser les documents extraits
- Filtrer et rechercher dans l'interface
- Créer des règles d'alerte personnalisées

#### 4.6.4 États d'Interface

- **Chargement** : 6 Skeleton cards dans la grille
- **Vide** : Icône Tag avec message explicatif
- **Erreur** : Toast notification rouge
- **Succès** : Toast de confirmation verte

#### 4.6.5 Données Techniques

**Table Database** : `tags`

```sql
tags
├── id (varchar, UUID)
├── name (varchar)
├── color (varchar, hex color)
├── category (varchar)
├── isSystem (boolean)
└── createdAt (timestamp)
```

**Endpoints API** :
- `GET /api/tags` : Liste toutes les étiquettes
- `POST /api/tags` : Crée une nouvelle étiquette
- `DELETE /api/tags/:id` : Supprime une étiquette (si non-système)

#### 4.6.6 Capture d'Écran (À ajouter)

```
[SCREENSHOT 1: Grille d'étiquettes avec différentes couleurs et catégories]
[SCREENSHOT 2: Dialog de création d'étiquette]
[SCREENSHOT 3: État vide (aucune étiquette)]
```

---

### 4.7 Utilisateurs

**Route :** `/users`

#### 4.7.1 Objectif
Permettre aux administrateurs de créer et gérer les comptes utilisateurs de l'organisation avec attribution de rôles et permissions.

#### 4.7.2 Restrictions d'Accès

**Accès réservé aux administrateurs** :
- Seuls les utilisateurs avec `role = 'admin'` peuvent accéder à cette page
- Les utilisateurs non-admin sont automatiquement redirigés vers le Dashboard
- Message d'accès refusé affiché si tentative d'accès direct

#### 4.7.3 Structure de l'Écran

**A. En-tête**
- Titre : "Gestion des utilisateurs"
- Sous-titre : "Créez et gérez les utilisateurs de votre organisation"
- Bouton : "Créer un utilisateur" (icône UserPlus)
- **data-testid** : `text-page-title`, `button-create-user`

**B. Dialog de Création d'Utilisateur**

Formulaire accessible via le bouton "Créer un utilisateur" :

**En-tête du Dialog :**
- Titre : "Créer un nouvel utilisateur"
- Description : "Un email de bienvenue sera envoyé avec un mot de passe temporaire"

**Formulaire :**

1. **Champ Email** (Input)
   - Label : "Email *"
   - Type : email
   - Placeholder : "utilisateur@example.com"
   - Validation : Format email valide
   - Requis
   - **data-testid** : `input-user-email`

2. **Champ Prénom** (Input)
   - Label : "Prénom *"
   - Placeholder : "Jean"
   - Requis
   - **data-testid** : `input-user-firstname`

3. **Champ Nom** (Input)
   - Label : "Nom *"
   - Placeholder : "Dupont"
   - Requis
   - **data-testid** : `input-user-lastname`

4. **Champ Rôle** (Caché - valeur par défaut)
   - Valeur : "simple" (rôle par défaut)
   - Non modifiable depuis l'interface (pour simplification)

**Boutons du Dialog :**
- "Annuler" (variant outline)
- "Créer l'utilisateur" (variant default, submit)
- **data-testid** : `button-cancel`, `button-submit-user`

**C. Liste des Utilisateurs**

Grille de cartes affichant tous les utilisateurs de l'organisation.

**Layout Grille :** Responsive (1 col mobile, 2 cols tablette, 3 cols desktop)

**Chaque Carte Utilisateur contient :**

1. **Avatar**
   - Initiales de l'utilisateur (FirstName + LastName)
   - Ou première lettre de l'email si pas de nom
   - Couleur de fond aléatoire mais cohérente
   - Taille : 48×48px

2. **Informations Utilisateur** :
   - **Nom complet** : firstName + lastName (en gras)
   - **Email** : Adresse email (texte secondaire)
   - **Rôle** : Badge indiquant le rôle
     - Admin : Badge avec icône Shield, variant default
     - Manager : Badge variant secondary
     - Simple : Badge variant outline

3. **Date de Création** :
   - Format : "Créé le dd MMM yyyy"
   - Texte tertiaire (muted)

4. **Bouton Supprimer** (si pas soi-même)
   - Icône Trash2
   - Variant destructive
   - Taille sm
   - **Condition** : Masqué si l'utilisateur est celui connecté
   - **data-testid** : `button-delete-user-{id}`

**D. Dialog de Confirmation de Suppression**

AlertDialog affiché avant la suppression d'un utilisateur :

- **Titre** : "Supprimer cet utilisateur ?"
- **Description** : "Cette action est irréversible. L'utilisateur perdra l'accès à l'application."
- **Boutons** :
  - "Annuler" (cancel)
  - "Supprimer" (destructive, action)

#### 4.7.4 Fonctionnalités Clés

**A. Création d'Utilisateur**

**Workflow complet :**
1. Admin clique sur "Créer un utilisateur"
2. Dialog s'ouvre avec formulaire
3. Saisie des informations (email, prénom, nom)
4. Clic sur "Créer l'utilisateur"
5. **Backend** :
   - Génération d'un mot de passe temporaire aléatoire
   - Hachage du mot de passe (bcrypt)
   - Création de l'utilisateur en base
   - Envoi d'un email de bienvenue avec :
     - Mot de passe temporaire
     - Instructions de connexion
     - Lien vers l'application
6. Toast de confirmation : "Utilisateur créé - Un email de bienvenue a été envoyé"
7. Rafraîchissement de la liste
8. Fermeture du dialog

**B. Suppression d'Utilisateur**

**Restrictions :**
- Impossible de se supprimer soi-même
- Confirmation requise via AlertDialog

**Workflow :**
1. Clic sur l'icône Trash d'un utilisateur
2. AlertDialog de confirmation
3. Clic sur "Supprimer"
4. Suppression de l'utilisateur en base
5. Toast de confirmation
6. Rafraîchissement de la liste

**C. Système de Rôles**

**Rôles disponibles :**

1. **Admin** :
   - Valeur en base : `admin`
   - Accès complet à toutes les fonctionnalités
   - Peut gérer les utilisateurs (page `/users`)
   - Peut configurer l'application complète
   - Peut créer des règles d'alerte
   - Badge avec icône Shield

2. **Manager** :
   - Valeur en base : `manager`
   - Accès à toutes les fonctionnalités métier
   - Peut gérer emails, RDV, documents, alertes
   - Ne peut pas gérer les utilisateurs
   - Badge variant secondary

3. **Simple** :
   - Valeur en base : `simple`
   - Accès lecture/écriture sur emails et documents
   - Accès limité aux paramètres
   - Badge variant outline

**D. Email de Bienvenue**

Contenu de l'email automatique (exemple) :

```
Sujet : Bienvenue sur IzyInbox - Vos identifiants

Bonjour [Prénom] [Nom],

Votre compte IzyInbox a été créé par un administrateur.

Vos identifiants de connexion :
- Email : [email]
- Mot de passe temporaire : [password]

Lien de connexion : [app-url]/login

Nous vous recommandons de changer votre mot de passe dès votre première connexion.

À bientôt,
L'équipe IzyInbox
```

#### 4.7.5 États d'Interface

- **Chargement** : Spinner centré
- **Accès refusé** : Message avec icône AlertCircle
- **Vide** : Message "Aucun utilisateur" (rare)
- **Erreur** : Toast notification
- **Succès** : Toast de confirmation

#### 4.7.6 Sécurité

**Mesures de Sécurité Implémentées :**

1. **Vérification du Rôle** :
   - Middleware backend `requireAdmin()`
   - Vérification côté client (redirection)
   - Protection des routes API

2. **Protection contre Auto-Suppression** :
   - Bouton de suppression masqué pour soi-même
   - Vérification backend supplémentaire

3. **Mots de Passe Sécurisés** :
   - Génération aléatoire (12 caractères min)
   - Hachage bcrypt (10 rounds)
   - Stockage uniquement du hash

4. **Validation des Données** :
   - Format email validé (Zod)
   - Unicité de l'email (constraint DB)
   - Validation des champs requis

#### 4.7.7 Données Techniques

**Table Database** : `users`

```sql
users
├── id (varchar, UUID)
├── email (varchar, unique)
├── password (varchar, hashed)
├── firstName (varchar)
├── lastName (varchar)
├── role (varchar: admin/manager/simple)
└── createdAt (timestamp)
```

**Endpoints API** :
- `GET /api/users` : Liste tous les utilisateurs (admin only)
- `POST /api/users` : Crée un nouvel utilisateur (admin only)
- `DELETE /api/users/:id` : Supprime un utilisateur (admin only)

#### 4.7.8 Capture d'Écran (À ajouter)

```
[SCREENSHOT 1: Liste des utilisateurs avec différents rôles]
[SCREENSHOT 2: Dialog de création d'utilisateur]
[SCREENSHOT 3: Dialog de confirmation de suppression]
[SCREENSHOT 4: Message d'accès refusé pour non-admin]
```

---

### 4.8 Paramètres

**Route :** `/settings`

#### 4.8.1 Objectif
Configurer tous les aspects de l'application : comptes email, catégories, automatisations IA, et règles d'alerte personnalisées.

#### 4.8.2 Structure de l'Écran

**A. En-tête**
- Titre : "Paramètres"
- Sous-titre : "Configuration de l'application"

**B. Onglets Principaux**

Les paramètres sont organisés en 4 onglets :

1. **Comptes Email**
2. **Catégories**
3. **Automatisation**
4. **Alertes Personnalisées**

---

#### 4.8.3 Onglet 1 : Comptes Email

**Objectif :** Gérer les comptes email IMAP/SMTP connectés à l'application.

**A. Section "Ajouter un Nouveau Compte"**

Formulaire de création :

1. **Champ Provider** (Select)
   - Options : Gmail, Outlook, Autre
   - Change automatiquement les valeurs IMAP/SMTP

2. **Champ Email** (Input)
   - Type : email
   - Requis
   - **data-testid** : `input-email-address`

3. **Paramètres IMAP**
   - Hôte IMAP (ex: imap.gmail.com)
   - Port IMAP (ex: 993)
   - **data-testid** : `input-imap-host`, `input-imap-port`

4. **Paramètres SMTP**
   - Hôte SMTP (ex: smtp.gmail.com)
   - Port SMTP (ex: 587)
   - **data-testid** : `input-smtp-host`, `input-smtp-port`

5. **Authentification**
   - Nom d'utilisateur
   - Mot de passe (type password)
   - **data-testid** : `input-username`, `input-password`

6. **Fréquence de Scan** (Select)
   - Options : 5, 10, 15, 30, 60 minutes
   - Par défaut : 15 minutes

7. **Assignation de Catégories** (NOUVEAU)
   - Liste de checkboxes
   - Affiche toutes les catégories disponibles
   - Sélection multiple
   - Les catégories sélectionnées seront assignées au compte via la table `emailAccountCategories`
   - **data-testid** : `checkbox-category-{categoryKey}`

8. **Bouton "Ajouter le compte"**
   - Icône Mail
   - Disabled si email vide
   - **data-testid** : `button-add-account`

**B. Section "Comptes Configurés"**

Liste des comptes existants :

Chaque compte affiche :
- **Email** : Adresse complète
- **Provider** : Gmail, Outlook, etc.
- **Fréquence** : "Scan : 15min"
- **Actions** :
  - Bouton "Catégories" (icône Tag)
    - Ouvre un dialog pour gérer les catégories assignées
    - Liste des catégories avec checkboxes
    - Bouton "Enregistrer" sauvegarde les changements
    - **data-testid** : `button-manage-categories-{accountId}`
  - Bouton "Scanner maintenant" (icône RefreshCw)
    - Force un scan immédiat
    - Loading state pendant le scan
    - **data-testid** : `button-scan-{accountId}`
  - Bouton "Supprimer" (icône Trash, rouge)
    - Confirmation avant suppression
    - **data-testid** : `button-delete-{accountId}`

**Dialog Gestion des Catégories :**
- Titre : "Gérer les catégories de [email]"
- Liste de checkboxes (toutes les catégories)
- Catégories actuellement assignées sont cochées
- Bouton "Enregistrer" → Appel API `PUT /api/email-accounts/:id/categories`
- Bouton "Annuler"

---

#### 4.8.4 Onglet 2 : Catégories

**Objectif :** Créer et gérer les catégories d'emails globales (non liées à un compte spécifique).

**A. Section "Créer une Nouvelle Catégorie"**

Formulaire :

1. **Clé Unique** (Input)
   - Identifiant technique (ex: "support_client")
   - Minuscules, underscores uniquement
   - **data-testid** : `input-category-key`

2. **Libellé** (Input)
   - Nom affiché (ex: "Support Client")
   - **data-testid** : `input-category-label`

3. **Couleur** (Color Picker)
   - Hex color (#RRGGBB)
   - Par défaut : #6366f1
   - **data-testid** : `input-category-color`

4. **Icône** (Select)
   - Liste d'icônes Lucide :
     - Mail
     - FileText
     - Calendar
     - CreditCard
     - Receipt
     - Phone
     - MessageSquare
     - Inbox
     - Send
     - Archive
     - AlertCircle
   - **data-testid** : `select-category-icon`

5. **Catégorie Système** (Switch)
   - Si activé : Catégorie protégée, non supprimable
   - Par défaut : false
   - **data-testid** : `switch-category-system`

6. **Générer des Réponses Auto** (Switch)
   - Si activé : L'IA génère automatiquement des suggestions de réponse
   - Par défaut : true
   - **data-testid** : `switch-category-auto-response`

7. **Bouton "Créer la catégorie"**
   - Icône Tag
   - **data-testid** : `button-create-category`

**B. Section "Catégories Existantes"**

Liste des catégories :

Chaque catégorie affiche :
- **Pastille de couleur** : Avec l'icône choisie
- **Libellé** : Nom affiché
- **Clé** : Identifiant technique (texte secondaire)
- **Badges** :
  - "Système" (si isSystem = true)
  - "Réponses Auto" (si generateAutoResponse = true)
- **Actions** :
  - Bouton "Supprimer" (uniquement si non-système)
  - **data-testid** : `button-delete-category-{key}`

---

#### 4.8.5 Onglet 3 : Automatisation

**Objectif :** Configurer les fonctionnalités d'IA et les paramètres d'automatisation.

**A. Configuration OpenAI**

1. **Section API Key**
   - Champ : Clé API OpenAI
   - Type : password
   - Bouton "Enregistrer"
   - **data-testid** : `input-openai-key`, `button-save-openai-key`

**B. Fonctionnalités d'Analyse**

1. **Analyse Automatique** (Switch + Description)
   - Titre : "Analyse automatique des emails"
   - Description : "Catégorise, détecte la priorité et le sentiment de chaque email"
   - **data-testid** : `switch-auto-analysis`

2. **Réponses Automatiques** (Switch + Description)
   - Titre : "Génération automatique de réponses"
   - Description : "Génère des suggestions de réponse pour les emails"
   - **data-testid** : `switch-auto-responses`

3. **Planification Automatique** (Switch + Description)
   - Titre : "Planification automatique des rendez-vous"
   - Description : "Détecte et crée automatiquement les rendez-vous depuis les emails"
   - **data-testid** : `switch-auto-scheduling`

**C. Paramètres Généraux**

1. **Durée par Défaut des RDV** (Input)
   - Type : number
   - Unité : minutes
   - Par défaut : 60
   - **data-testid** : `input-appointment-duration`

2. **Délai d'Alerte Email** (Input)
   - Type : number
   - Unité : heures
   - Description : "Alerter si un email urgent n'est pas traité après X heures"
   - Par défaut : 24
   - **data-testid** : `input-email-alert-deadline`

**D. Bouton "Enregistrer les Paramètres"**
- Sauvegarde tous les changements
- **data-testid** : `button-save-settings`

---

#### 4.8.6 Onglet 4 : Alertes Personnalisées

**Objectif :** Créer des règles d'alerte en langage naturel avec l'IA.

**A. Section "Créer une Règle d'Alerte"**

Formulaire :

1. **Description en Langage Naturel** (Textarea)
   - Placeholder : "Décrivez votre règle en langage naturel..."
   - Exemple affiché : "Alerte-moi si un email de facturecontient 'urgent' et n'a pas été traité depuis 48h"
   - Hauteur : 3-4 lignes
   - **data-testid** : `textarea-alert-prompt`

2. **Bouton "Créer la règle"**
   - Icône Sparkles (IA)
   - Loading state pendant la génération
   - **data-testid** : `button-create-alert-rule`

**Workflow de Création :**
1. L'utilisateur saisit sa règle en français
2. Clic sur "Créer la règle"
3. Envoi du prompt à GPT-5
4. L'IA parse la description et retourne :
   - Nom de la règle
   - Type d'entité (email ou appointment)
   - Sévérité (info, warning, critical)
   - Filtres JSON (catégorie, priorité, status, etc.)
   - Conditions temporelles
5. Création de la règle en base de données
6. Affichage dans la liste

**B. Section "Règles Actives"**

Liste des règles :

Chaque règle affiche :
- **Nom** : Titre de la règle
- **Description** : Prompt original en langage naturel
- **Badge Entité** : Email ou Rendez-vous
- **Badge Sévérité** : Info / Attention / Critique
- **État** : Switch Actif/Inactif
- **Actions** :
  - Toggle Actif/Inactif
  - Bouton "Supprimer" (icône Trash)
  - **data-testid** : `switch-rule-{id}`, `button-delete-rule-{id}`

**Exemples de Règles :**
- "Alerte si un devis n'a pas de réponse depuis 3 jours"
- "Alerte critique si un email contient 'avocat' ou 'juridique'"
- "Alerte si un rendez-vous est prévu dans moins de 2 heures sans confirmation"

---

#### 4.8.7 Capture d'Écran (À ajouter)

```
[SCREENSHOT 1: Onglet Comptes Email avec formulaire et liste]
[SCREENSHOT 2: Dialog de gestion des catégories d'un compte]
[SCREENSHOT 3: Onglet Catégories avec liste colorée]
[SCREENSHOT 4: Onglet Automatisation avec switches]
[SCREENSHOT 5: Onglet Alertes Personnalisées avec règles]
```

---

## 5. Spécifications Techniques Détaillées

### 5.1 Système d'Authentification

**Dual Authentication System :**

1. **Replit Auth (OpenID Connect)**
   - Pour les administrateurs et utilisateurs directs de Replit
   - Flux standard OIDC avec découvery endpoint
   - Claims supportés :
     - `sub` : Identifiant unique Replit
     - `email` : Email de l'utilisateur
     - `first_name`, `last_name` : Nom complet
   - Rôle par défaut : "manager"
   - Endpoint : `/api/auth/login` (redirection OIDC)

2. **Email/Password**
   - Pour les utilisateurs invités par l'administrateur
   - Hachage bcrypt (10 rounds)
   - Validation Zod stricte
   - Endpoint : `/api/auth/register` et `/api/auth/login`

**Gestion des Sessions :**
- `express-session` avec store PostgreSQL (`connect-pg-simple`)
- Cookies HTTP-only, Secure (en production), SameSite=Strict
- Durée : 7 jours
- Session secret dans env variable

**Middleware de Protection :**
```typescript
requireAuth() // Vérifie qu'un utilisateur est connecté
requireAdmin() // Vérifie role = "admin" ou "administrator"
```

### 5.2 Système de Catégories Global

**Architecture :**

1. **Table `emailCategories`** :
   - Stockage global des catégories
   - Aucune référence à un compte spécifique
   - Attributs : key, label, color, icon, isSystem, generateAutoResponse

2. **Table `emailAccountCategories`** (Junction) :
   - Relation many-to-many entre comptes et catégories
   - Clé composite : (emailAccountId, categoryId)
   - Permet l'assignation flexible de catégories aux comptes

**Endpoints API :**
- `GET /api/email-categories` : Liste toutes les catégories globales
- `POST /api/email-categories` : Crée une nouvelle catégorie globale
- `DELETE /api/email-categories/:id` : Supprime une catégorie (si non-système)
- `GET /api/email-accounts/:id/categories` : Récupère les catégories d'un compte
- `PUT /api/email-accounts/:id/categories` : Assigne des catégories à un compte

**Workflow d'Assignation :**
1. Lors de la création d'un compte email, l'utilisateur sélectionne des catégories
2. Après création du compte, appel API pour assigner les catégories sélectionnées
3. Modification ultérieure via le dialog "Gérer les catégories"

### 5.3 Analyse IA des Emails

**Pipeline d'Analyse :**

1. **Réception de l'Email** (IMAP)
   - Scan périodique (configurable)
   - Parsing avec `mailparser`
   - Extraction des pièces jointes

2. **Analyse GPT-5**
   - Prompt système :
     ```
     Tu es un assistant qui analyse des emails professionnels en français.
     Catégorise l'email parmi : [liste des catégories].
     Détermine la priorité : low, normal, high, urgent.
     Analyse le sentiment : positive, neutral, negative.
     Génère un résumé en 2-3 phrases.
     Suggère des actions.
     ```
   - Réponse structurée (JSON)
   - Stockage des résultats dans la table `emails`

3. **Extraction de Documents**
   - Détection du type MIME
   - Extraction de texte :
     - PDF : `pdf-parse`
     - Images : `tesseract.js` (OCR)
   - Upload vers Google Drive (dossier selon catégorie)
   - Stockage métadonnées dans `documents`

4. **Détection de Rendez-vous** (si catégorie "rdv")
   - Recherche de dates/heures dans le corps
   - Extraction de lieu et participants
   - Création d'un appointment avec statut "en_attente"

### 5.4 Système d'Alertes Personnalisées

**Architecture :**

1. **Création de Règle** :
   - L'utilisateur saisit une description en langage naturel
   - Appel API `POST /api/alert-rules/parse`
   - GPT-5 parse la description et retourne JSON structuré :
     ```json
     {
       "name": "Devis sans réponse",
       "entityType": "email",
       "severity": "warning",
       "filters": {
         "category": "devis",
         "status": "nouveau",
         "ageInHours": 72
       }
     }
     ```
   - Stockage dans `alertRules`

2. **Évaluation des Règles** :
   - Cron job toutes les heures
   - Pour chaque règle active :
     - Requête en base selon entityType et filters
     - Si entités correspondent, création d'alertes
     - Évite les doublons (même entité + même règle)

3. **Affichage et Résolution** :
   - Page `/alerts` affiche toutes les alertes
   - Résolution manuelle met à jour `resolved = true`

### 5.5 Génération de Réponses IA

**Workflow :**

1. **Sans Prompt Personnalisé** :
   - Contexte : Email original (sujet + corps + expéditeur)
   - Catégorie de l'email
   - Prompt système :
     ```
     Génère une réponse professionnelle en français pour cet email.
     Respecte le ton et le contexte.
     ```
   - Réponse générée et stockée dans `suggestedResponse`

2. **Avec Prompt Personnalisé** :
   - L'utilisateur ajoute des instructions
   - Exemple : "Réponds formellement en proposant un RDV jeudi prochain"
   - Prompt enrichi :
     ```
     Génère une réponse en tenant compte de ces instructions :
     [instructions utilisateur]
     ```
   - Réponse personnalisée

3. **Envoi de Réponse** :
   - Dialog d'édition (textarea)
   - Modification possible avant envoi
   - Envoi via SMTP (Nodemailer)
   - Mise à jour du statut de l'email

---

## 6. Intégrations Externes

### 6.1 OpenAI (GPT-5)

**Utilisation :**
- Analyse d'emails (catégorisation, priorité, sentiment, résumé)
- Génération de réponses automatiques
- Parsing de règles d'alerte en langage naturel
- Suggestions d'actions

**Configuration :**
- Clé API stockée dans `settings` (chiffrée)
- Modèle : `gpt-4` (ou `gpt-5` si disponible)
- Température : 0.7 (équilibre créativité/précision)
- Max tokens : 1500

**Coûts Estimés :**
- Analyse email : ~500 tokens/email
- Génération réponse : ~300 tokens
- Parsing règle : ~200 tokens

### 6.2 Google Drive

**Utilisation :**
- Stockage de tous les documents extraits
- Organisation hiérarchique par type
- Accès direct depuis l'interface

**Configuration :**
- OAuth 2.0 avec service account
- Permissions : Drive API (read/write)
- Dossier racine : `PME-Assistant-Documents`

**Structure de Dossiers :**
```
PME-Assistant-Documents/
├── facture/
├── devis/
├── rdv/
├── contrat/
├── autre/
└── [catégories personnalisées]/
```

**Flux d'Upload :**
1. Email reçu avec pièce jointe
2. Téléchargement de la pièce jointe
3. Extraction de texte (OCR si nécessaire)
4. Détermination du type de document (IA)
5. Upload vers le dossier approprié dans Drive
6. Récupération de l'URL publique
7. Stockage des métadonnées en base

### 6.3 Services Email (IMAP/SMTP)

**Providers Supportés :**
- Gmail (imap.gmail.com:993, smtp.gmail.com:587)
- Outlook (outlook.office365.com)
- Autre (configuration manuelle)

**IMAP (Réception) :**
- Connexion sécurisée (TLS)
- Scan périodique du dossier INBOX
- Marquage des emails traités (flag)

**SMTP (Envoi) :**
- Authentification STARTTLS
- Envoi de réponses générées par l'IA
- Gestion des erreurs (rebonds, limites)

**Sécurité :**
- Mots de passe chiffrés en base (bcrypt)
- Stockage sécurisé des credentials
- Rotation possible des mots de passe

### 6.4 Replit Auth (OpenID Connect)

**Configuration :**
- Issuer URL : fourni par Replit
- Client ID et Secret : Variables d'environnement
- Redirect URI : `https://[repl-url]/api/auth/callback`

**Claims Utilisés :**
- `sub` : Identifiant unique
- `email` : Email de l'utilisateur
- `first_name`, `last_name` : Informations de profil

**Flux d'Authentification :**
1. Clic sur "Se connecter avec Replit"
2. Redirection vers Replit
3. Autorisation de l'utilisateur
4. Redirection vers callback
5. Échange du code contre un token
6. Création/mise à jour de l'utilisateur
7. Création de session
8. Redirection vers l'application

---

## 7. Flux de Données et Automatisations

### 7.1 Flux de Réception d'Email

```
1. Scan IMAP (toutes les X minutes)
   ↓
2. Nouveau email détecté
   ↓
3. Parsing (mailparser)
   ├── Extraction métadonnées (sujet, expéditeur, date)
   ├── Extraction corps (HTML/texte)
   └── Extraction pièces jointes
   ↓
4. Analyse IA (si autoAnalysis activé)
   ├── Catégorisation
   ├── Priorité
   ├── Sentiment
   ├── Résumé
   └── Suggestions d'actions
   ↓
5. Traitement des PJ
   ├── Extraction texte (PDF/OCR)
   ├── Upload Google Drive
   └── Stockage métadonnées
   ↓
6. Détection RDV (si catégorie "rdv")
   ├── Extraction date/heure
   ├── Extraction lieu
   └── Création appointment
   ↓
7. Stockage email en base
   ↓
8. Génération réponse auto (si autoResponses activé + catégorie supportée)
   ↓
9. Fin du traitement
```

### 7.2 Flux de Génération d'Alerte

```
1. Cron job (toutes les heures)
   ↓
2. Récupération des règles actives
   ↓
3. Pour chaque règle :
   ├── Détermination entityType (email ou appointment)
   ├── Construction requête SQL selon filters
   ├── Exécution requête
   └── Évaluation des résultats
   ↓
4. Si entités correspondent :
   ├── Vérification absence de doublon
   ├── Création alerte
   └── Stockage en base
   ↓
5. Affichage dans Dashboard et page Alertes
   ↓
6. Notification utilisateur (toast au prochain chargement)
```

### 7.3 Flux de Création de RDV depuis Email

```
1. Email reçu avec catégorie "rdv"
   ↓
2. Analyse IA du corps de l'email
   ├── Détection de dates/heures (regex + NLP)
   ├── Extraction de lieu (entités nommées)
   └── Extraction de participants
   ↓
3. Validation des données
   ├── Date dans le futur ?
   ├── Heure cohérente ?
   └── Lieu renseigné ?
   ↓
4. Création appointment
   ├── startTime, endTime (calculé avec durée par défaut)
   ├── title (depuis sujet email)
   ├── description (extrait du corps)
   ├── location
   ├── emailId (lien vers email source)
   └── status = "en_attente"
   ↓
5. Affichage dans le calendrier
   ↓
6. Notification utilisateur
```

### 7.4 Flux de Recherche de Documents

```
1. Saisie dans barre de recherche
   ↓
2. Debouncing (300ms)
   ↓
3. Requête API avec paramètres :
   ├── search (texte)
   └── type (filtre)
   ↓
4. Recherche en base
   ├── LIKE sur filename
   ├── LIKE sur extractedText (full-text search)
   └── Filtre sur documentType
   ↓
5. Retour des résultats
   ↓
6. Affichage dans la vue (liste ou grille)
```

---

## 8. Guide de Capture des Screenshots

Pour compléter ce cahier des charges avec des captures d'écran réelles, suivez ces étapes :

### 8.1 Préparation

1. **Lancer l'application** :
   ```bash
   npm run dev
   ```

2. **Se connecter avec un compte administrateur** :
   - Utiliser Replit Auth ou créer un compte email/password
   - S'assurer d'avoir le rôle "administrator"

3. **Charger des données de test** :
   - Ajouter au moins 1 compte email configuré
   - S'assurer d'avoir des emails, rendez-vous, documents et alertes

### 8.2 Captures d'Écran à Réaliser

**Dashboard :**
- [ ] Vue complète avec les 4 KPIs, alertes et graphiques
- [ ] Vue mobile (responsive)

**Emails :**
- [ ] Liste d'emails avec filtres appliqués
- [ ] Panneau détails d'un email avec analyse IA
- [ ] Dialog de génération de réponse
- [ ] Dialog de prompt personnalisé
- [ ] Sélection multiple d'emails
- [ ] Vue mobile

**Calendrier :**
- [ ] Vue mensuelle avec plusieurs RDV
- [ ] Dialog de détails d'un RDV (mode lecture)
- [ ] Dialog de détails d'un RDV (mode édition)
- [ ] Dialog de sélection (multiple RDV sur un jour)
- [ ] Dialog de création de RDV
- [ ] Vue mobile

**Documents :**
- [ ] Vue liste avec différents types de documents
- [ ] Vue grille
- [ ] Résultat de recherche textuelle
- [ ] Vue mobile

**Alertes :**
- [ ] Liste d'alertes actives (différentes sévérités)
- [ ] Onglet alertes résolues
- [ ] Vue mobile

**Paramètres - Comptes Email :**
- [ ] Formulaire d'ajout avec catégories
- [ ] Liste des comptes configurés
- [ ] Dialog de gestion des catégories d'un compte
- [ ] Vue mobile

**Paramètres - Catégories :**
- [ ] Formulaire de création
- [ ] Liste des catégories avec couleurs et icônes
- [ ] Vue mobile

**Paramètres - Automatisation :**
- [ ] Configuration OpenAI et switches
- [ ] Vue mobile

**Paramètres - Alertes Personnalisées :**
- [ ] Formulaire de création de règle
- [ ] Liste des règles actives
- [ ] Vue mobile

### 8.3 Outils Recommandés

**Pour Windows :**
- Outil Capture d'écran (Win + Shift + S)
- Snagit (payant, très complet)

**Pour Mac :**
- Cmd + Shift + 4 (capture de zone)
- Cmd + Shift + 5 (outil de capture)

**Pour Linux :**
- Flameshot
- gnome-screenshot

**Extensions Navigateur :**
- Awesome Screenshot
- Nimbus Screenshot
- Full Page Screen Capture

### 8.4 Organisation des Screenshots

Créer un dossier `screenshots/` à la racine du projet :

```
screenshots/
├── dashboard/
│   ├── desktop-full-view.png
│   └── mobile-view.png
├── emails/
│   ├── list-with-filters.png
│   ├── detail-panel.png
│   ├── response-dialog.png
│   └── mobile-view.png
├── calendar/
│   ├── monthly-view.png
│   ├── appointment-details.png
│   ├── selection-dialog.png
│   └── mobile-view.png
├── documents/
│   ├── list-view.png
│   ├── grid-view.png
│   └── mobile-view.png
├── alerts/
│   ├── active-alerts.png
│   └── resolved-alerts.png
└── settings/
    ├── email-accounts.png
    ├── categories.png
    ├── automation.png
    └── custom-alerts.png
```

### 8.5 Insertion dans le Document

Une fois les captures réalisées, insérer dans chaque section avec la syntaxe Markdown :

```markdown
![Description de l'écran](./screenshots/dossier/fichier.png)
```

**Exemple :**
```markdown
#### Vue Dashboard Complète
![Dashboard avec KPIs, alertes et graphiques](./screenshots/dashboard/desktop-full-view.png)
```

---

## 9. Conclusion

### 9.1 Récapitulatif des Fonctionnalités

IzyInbox est une solution complète et innovante pour l'automatisation administrative des PME, offrant :

✅ **Analyse IA avancée** : Catégorisation, priorité, sentiment, résumés  
✅ **Gestion intelligente des emails** : Filtrage, recherche, réponses automatiques  
✅ **Calendrier automatisé** : Détection et planification de RDV depuis emails  
✅ **Bibliothèque de documents** : Extraction OCR, stockage Google Drive, recherche full-text  
✅ **Système d'alertes personnalisées** : Règles en langage naturel, évaluation automatique  
✅ **Dashboard KPI** : Visualisations Recharts interactives, métriques clés  
✅ **Configuration flexible** : Catégories globales, assignation par compte, automatisations  
✅ **Sécurité robuste** : Dual auth, sessions sécurisées, rôles utilisateurs  

### 9.2 Évolutions Futures

**Phase 2 (Court terme) :**
- Notifications push en temps réel (WebSocket)
- Export de rapports (PDF, Excel)
- Intégration calendriers externes (Google Calendar, Outlook)
- Application mobile (React Native)

**Phase 3 (Moyen terme) :**
- Intégration CRM (Salesforce, HubSpot)
- Intégration ERP (Odoo, SAP)
- Tableau de bord personnalisable (widgets drag-and-drop)
- Multi-langue (EN, ES, DE)

**Phase 4 (Long terme) :**
- Marketplace d'intégrations
- API publique pour développeurs tiers
- Version white-label pour revendeurs
- Intelligence prédictive (anticipation des besoins)

### 9.3 Contact et Support

**Documentation Technique :** [À définir]  
**Support Utilisateur :** [À définir]  
**GitHub Repository :** [À définir]

---

**Document rédigé par l'équipe IzyInbox**  
**Dernière mise à jour : 24 Octobre 2025**  
**Version : 1.0**

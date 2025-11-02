# IzyInbox - Assistant Administratif Intelligent pour PME

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18.x ou supérieur ([télécharger](https://nodejs.org/))
- **npm** (inclus avec Node.js)
- **PostgreSQL** 14.x ou supérieur ([télécharger](https://www.postgresql.org/download/))
- Un compte **OpenAI** avec accès à l'API ([obtenir une clé](https://platform.openai.com/api-keys))
- Un compte **Stripe** pour les paiements ([créer un compte](https://dashboard.stripe.com/register))

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <votre-repo-github>
cd izyinbox
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de la base de données PostgreSQL

#### Option A : Base de données locale

1. Créez une nouvelle base de données PostgreSQL :

```bash
psql -U postgres
CREATE DATABASE izyinbox;
\q
```

2. Votre `DATABASE_URL` sera :
```
postgresql://postgres:votre_mot_de_passe@localhost:5432/izyinbox
```

#### Option B : Base de données cloud (Neon recommandé)

1. Créez un compte sur [Neon](https://neon.tech/)
2. Créez un nouveau projet
3. Copiez la `DATABASE_URL` fournie

### 4. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Base de données (OBLIGATOIRE)
DATABASE_URL=postgresql://user:password@localhost:5432/izyinbox

# Sécurité (OBLIGATOIRE)
SESSION_SECRET=votre_secret_aleatoire_tres_long_et_securise
ENCRYPTION_KEY=une_autre_cle_secrete_pour_le_chiffrement

# OpenAI (OBLIGATOIRE pour les fonctionnalités IA)
OPENAI_API_KEY=sk-...

# Stripe (OBLIGATOIRE pour les abonnements)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (OBLIGATOIRE pour l'envoi d'emails)
RESEND_API_KEY=re_...

# Environnement
NODE_ENV=development
PORT=5000

# Authentification Replit (OPTIONNEL - uniquement si vous voulez utiliser Replit Auth)
ISSUER_URL=https://replit.com/oidc
REPL_ID=votre_repl_id
REPLIT_DOMAINS=localhost:5000
```

#### Génération des secrets

Pour générer des secrets sécurisés :

```bash
# Sur Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Sur Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Initialiser la base de données

Appliquez le schéma à votre base de données :

```bash
npm run db:push
```

Cette commande créera automatiquement toutes les tables nécessaires.

### 6. Obtenir les clés API nécessaires

#### OpenAI
1. Visitez [platform.openai.com](https://platform.openai.com/api-keys)
2. Créez une nouvelle clé API
3. Copiez-la dans `.env` comme `OPENAI_API_KEY`

#### Stripe
1. Visitez [dashboard.stripe.com](https://dashboard.stripe.com)
2. En mode Test, récupérez :
   - Clé secrète : `STRIPE_SECRET_KEY`
   - Clé publique : `VITE_STRIPE_PUBLIC_KEY`
3. Pour le webhook :
   - Installez Stripe CLI : `brew install stripe/stripe-cli/stripe` (Mac) ou téléchargez depuis [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - Exécutez : `stripe listen --forward-to localhost:5000/api/stripe-webhook`
   - Copiez le signing secret dans `STRIPE_WEBHOOK_SECRET`

#### Resend (pour l'envoi d'emails)
1. Visitez [resend.com](https://resend.com)
2. Créez un compte et obtenez une clé API
3. Copiez-la dans `.env` comme `RESEND_API_KEY`

## 🎯 Démarrage de l'application

### Mode développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:5000](http://localhost:5000)

### Mode production

```bash
# Construire l'application
npm run build

# Démarrer en production
npm start
```

## 📁 Structure du projet

```
izyinbox/
├── client/                 # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/    # Composants React réutilisables
│   │   ├── pages/        # Pages de l'application
│   │   ├── lib/          # Utilitaires et configurations
│   │   └── App.tsx       # Point d'entrée React
├── server/                # Backend Express + Node.js
│   ├── routes.ts         # Routes API
│   ├── storage.ts        # Couche d'accès aux données
│   ├── index.ts          # Point d'entrée serveur
│   ├── replitAuth.ts     # Configuration authentification
│   └── services/         # Services métier (email, AI, etc.)
├── shared/               # Code partagé frontend/backend
│   └── schema.ts         # Schéma de base de données (Drizzle ORM)
└── .env                  # Variables d'environnement (à créer)
```

## 🔧 Scripts disponibles

```bash
npm run dev          # Démarre l'application en mode développement
npm run build        # Construit l'application pour la production
npm start            # Démarre l'application en mode production
npm run check        # Vérifie les erreurs TypeScript
npm run db:push      # Synchronise le schéma DB avec la base de données
```

## 🧪 Test du setup

Une fois l'application démarrée, vous devriez pouvoir :

1. **Accéder à l'application** : [http://localhost:5000](http://localhost:5000)
2. **Créer un compte** : Utilisez l'option "Essai gratuit" sur la page d'accueil
3. **Se connecter** : Utilisez les identifiants créés

## ⚠️ Problèmes courants

### Port 5000 déjà utilisé

Si le port 5000 est utilisé par une autre application, modifiez la variable `PORT` dans `.env` :

```bash
PORT=3000
```

### Erreur de connexion à la base de données

Vérifiez que :
- PostgreSQL est bien démarré
- La `DATABASE_URL` est correcte
- L'utilisateur PostgreSQL a les permissions nécessaires

```bash
# Tester la connexion
psql "postgresql://user:password@localhost:5432/izyinbox"
```

### Erreur "ENCRYPTION_KEY or SESSION_SECRET must be set"

Assurez-vous d'avoir défini au moins l'une de ces variables dans votre fichier `.env`.

### Les emails ne partent pas

En développement, vérifiez :
- Que `RESEND_API_KEY` est définie
- Que vous avez vérifié votre domaine dans Resend (ou utilisez leur domaine de test)

## 🔐 Sécurité

**⚠️ IMPORTANT** : Ne commitez **JAMAIS** le fichier `.env` dans Git !

Le fichier `.gitignore` inclut déjà `.env`, mais vérifiez toujours avant de pousser votre code.

## 📚 Documentation complémentaire

- [Documentation Drizzle ORM](https://orm.drizzle.team/)
- [Documentation Express](https://expressjs.com/)
- [Documentation React](https://react.dev/)
- [Documentation OpenAI](https://platform.openai.com/docs)
- [Documentation Stripe](https://stripe.com/docs)

## 💡 Fonctionnalités principales

- ✅ Authentification multi-méthodes (OIDC, Email/Password)
- ✅ Analyse d'emails par IA (GPT-5)
- ✅ Gestion automatisée de tâches
- ✅ Calendrier intelligent
- ✅ Stockage cloud (Google Drive, OneDrive)
- ✅ Système d'alertes personnalisables
- ✅ Abonnements Stripe avec essai gratuit 14 jours
- ✅ Multi-tenant avec isolation complète des données

## 🤝 Contribution

Pour contribuer au projet :
1. Forkez le dépôt
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Commitez vos changements (`git commit -m 'Ajout de fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/amelioration`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT

## 📧 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

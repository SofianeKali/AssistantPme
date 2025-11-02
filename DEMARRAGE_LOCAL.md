# 🚀 Guide de démarrage rapide - IzyInbox en local

Ce guide vous permet de démarrer **rapidement** IzyInbox sur votre machine locale après avoir récupéré le code depuis GitHub.

## ⚡ Démarrage en 5 minutes

### 1️⃣ Prérequis rapides

Installez ces outils si vous ne les avez pas déjà :

- **Node.js 18+** : [nodejs.org](https://nodejs.org/)
- **PostgreSQL 14+** : [postgresql.org](https://www.postgresql.org/download/)

### 2️⃣ Installation

```bash
# Cloner le projet
git clone <votre-repo-github>
cd izyinbox

# Installer les dépendances
npm install
```

### 3️⃣ Configuration minimale

Créez un fichier `.env` à la racine :

```bash
# Base de données
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@localhost:5432/izyinbox

# Secrets (générez-les avec la commande ci-dessous)
SESSION_SECRET=changez_moi_secret_tres_long_32_caracteres_minimum
ENCRYPTION_KEY=changez_moi_autre_cle_32_caracteres_minimum

# OpenAI (obligatoire pour l'IA)
OPENAI_API_KEY=sk-proj-votre_cle_openai

# Stripe (obligatoire pour les abonnements)
STRIPE_SECRET_KEY=sk_test_votre_cle_stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_publique_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# Resend (obligatoire pour les emails)
RESEND_API_KEY=re_votre_cle_resend

# Environnement
NODE_ENV=development
PORT=5000

# ⚠️ NE PAS définir REPLIT_DOMAINS, ISSUER_URL ou REPL_ID en local !
# Ces variables sont uniquement pour Replit.com
# L'application utilisera automatiquement l'auth Email/Password en local
```

**💡 Générer des secrets sécurisés :**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4️⃣ Créer la base de données

```bash
# Connectez-vous à PostgreSQL
psql -U postgres

# Créez la base
CREATE DATABASE izyinbox;
\q

# Initialisez le schéma
npm run db:push
```

### 5️⃣ Lancer l'application

#### Option 1 : Scripts Windows (Recommandé pour Windows)

**Pour CMD :**
```bash
start-dev.bat
```

**Pour PowerShell :**
```powershell
.\start-dev.ps1
```

#### Option 2 : NPM (Linux, macOS, Windows)

Si vous modifiez `package.json` ligne 7 :
```json
"dev": "cross-env NODE_ENV=development node --import tsx/esm server/index.ts"
```

Puis :
```bash
npm run dev
```

#### Option 3 : Commande directe

**Windows CMD :**
```bash
set NODE_ENV=development && node --import tsx/esm server/index.ts
```

**Windows PowerShell :**
```powershell
$env:NODE_ENV="development"; node --import tsx/esm server/index.ts
```

**Linux/macOS :**
```bash
NODE_ENV=development node --import tsx/esm server/index.ts
```

🎉 **C'est fait !** Ouvrez [http://localhost:5000](http://localhost:5000)

> **💡 Note :** Si vous utilisez Node.js v18.19.0+ ou v20.6.0+, utilisez `--import tsx/esm` au lieu de `--loader tsx` (déprécié).

## 🔑 Obtenir les clés API

### OpenAI (IA - OBLIGATOIRE)

1. Allez sur [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Créez une nouvelle clé API
3. Copiez-la dans `.env` → `OPENAI_API_KEY`

### Stripe (Paiements - OBLIGATOIRE)

1. Créez un compte sur [stripe.com](https://dashboard.stripe.com/register)
2. En mode **Test**, récupérez :
   - **Clé secrète** → `STRIPE_SECRET_KEY` (commence par `sk_test_`)
   - **Clé publique** → `VITE_STRIPE_PUBLIC_KEY` (commence par `pk_test_`)

3. **Pour le webhook local** :
   ```bash
   # Installez Stripe CLI
   brew install stripe/stripe-cli/stripe  # Mac
   # ou téléchargez depuis stripe.com/docs/stripe-cli
   
   # Lancez le listener (dans un terminal séparé)
   stripe listen --forward-to localhost:5000/api/stripe-webhook
   
   # Copiez le "webhook signing secret" dans .env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Resend (Emails - OBLIGATOIRE)

1. Créez un compte sur [resend.com](https://resend.com)
2. Créez une clé API
3. Copiez-la dans `.env` → `RESEND_API_KEY`

## ✅ Vérifier que tout fonctionne

Une fois démarré, testez :

1. **Page d'accueil** : [http://localhost:5000](http://localhost:5000)
2. **Créer un compte** : Cliquez sur "Essai gratuit 14 jours"
3. **Se connecter** : Utilisez vos identifiants

## ⚠️ Problèmes courants

### ❌ Port 5000 déjà utilisé

Sur Mac, AirPlay utilise parfois le port 5000.

**Solution** : Changez le port dans `.env`

```bash
PORT=3000
```

### ❌ Erreur "Cannot connect to database"

**Vérifications** :

```bash
# PostgreSQL est-il démarré ?
# Sur Mac :
brew services list | grep postgresql

# Sur Linux :
sudo systemctl status postgresql

# Testez la connexion manuellement
psql "postgresql://postgres:password@localhost:5432/izyinbox"
```

### ❌ "ENCRYPTION_KEY or SESSION_SECRET must be set"

Vérifiez que votre fichier `.env` contient bien ces variables.

### ❌ Les emails ne partent pas

En développement :
- Vérifiez que `RESEND_API_KEY` est définie
- Dans Resend, vous pouvez utiliser leur domaine de test sans vérification

## 📂 Structure du projet

```
izyinbox/
├── client/          # Frontend (React + TypeScript)
├── server/          # Backend (Express + Node.js)
├── shared/          # Code partagé (schéma DB)
├── .env            # ⚠️ Vos secrets (NE PAS COMMITER)
├── .env.example    # Template de configuration
└── README.md       # Documentation complète
```

## 🎯 Prochaines étapes

Une fois l'application démarrée :

1. **Créez un compte** via "Essai gratuit"
2. **Configurez un compte email** dans Paramètres → Comptes Email
3. **Ajoutez des catégories** dans Paramètres → Catégories
4. **Testez l'analyse d'emails** en lançant un scan manuel

## 📚 Documentation complète

Pour plus de détails, consultez :
- **README.md** : Documentation complète en anglais
- **.env.example** : Toutes les variables disponibles avec explications

## 💡 Développement

```bash
# Mode développement (avec hot-reload)
npm run dev

# Vérifier les types TypeScript
npm run check

# Mettre à jour le schéma de la base
npm run db:push

# Build pour production
npm run build

# Lancer en production
npm start
```

## 🔐 Sécurité

**⚠️ IMPORTANT** :

- **NE COMMITEZ JAMAIS** le fichier `.env` dans Git
- Le `.gitignore` protège automatiquement `.env`
- Utilisez `.env.example` comme template à partager

## 📞 Besoin d'aide ?

- Consultez la documentation complète : **README.md**
- Vérifiez les variables : **.env.example**
- Ouvrez une issue sur GitHub

---

**Bon développement ! 🚀**

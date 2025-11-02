# 🪟 Guide de dépannage Windows - IzyInbox

Ce guide résout les problèmes courants rencontrés lors de l'exécution d'IzyInbox sur Windows.

## ⚡ Démarrage rapide (TL;DR)

**Problème le plus courant :** Erreur avec `tsx` sur Node.js v18+

**Solution la plus simple :**
```bash
# Dans le dossier du projet, lancez :
start-dev.bat
```

---

## 🔧 Problèmes fréquents et solutions

### 1. Erreur : "tsx must be loaded with --import instead of --loader"

**Symptôme :**
```
Error: tsx must be loaded with --import instead of --loader
The --loader flag was deprecated in Node v20.6.0 and v18.19.0
```

**Cause :** Node.js v18.19.0+ et v20.6.0+ ont déprécié le flag `--loader`.

**✅ Solution :**

Utilisez les scripts fournis :
```bash
# CMD
start-dev.bat

# PowerShell
.\start-dev.ps1
```

Ou modifiez votre `package.json` ligne 7 :
```json
"dev": "cross-env NODE_ENV=development node --import tsx/esm server/index.ts"
```

---

### 2. Erreur : "import.meta.dirname is undefined"

**Symptôme :**
```
TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
```

**Cause :** `import.meta.dirname` n'est pas disponible dans toutes les versions de Node.js avec `tsx`.

**✅ Solution :**

Cette erreur est automatiquement résolue en utilisant `--import tsx/esm` au lieu de `--loader tsx`. Utilisez les scripts Windows fournis.

---

### 3. Erreur : "REPLIT_DOMAINS not provided"

**Symptôme :**
```
Error: REPLIT_DOMAINS not provided
```

**Cause :** L'application essaie d'utiliser l'authentification Replit qui n'est pas disponible en local.

**✅ Solution :**

**NE PAS** définir `REPLIT_DOMAINS`, `ISSUER_URL` ou `REPL_ID` dans votre fichier `.env` en local. L'application détectera automatiquement l'environnement local et utilisera uniquement l'authentification Email/Password.

Votre `.env` devrait ressembler à :
```bash
DATABASE_URL=postgresql://postgres:mdp@localhost:5432/izyinbox
SESSION_SECRET=votre_secret
ENCRYPTION_KEY=votre_cle
OPENAI_API_KEY=sk-...
# Pas de REPLIT_DOMAINS, ISSUER_URL ou REPL_ID !
```

---

### 4. Port 5000 déjà utilisé

**Symptôme :**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause :** Une autre application utilise déjà le port 5000.

**✅ Solution :**

Changez le port dans votre `.env` :
```bash
PORT=3000
```

Ou arrêtez l'application qui utilise le port 5000.

---

### 5. Erreur de connexion PostgreSQL

**Symptôme :**
```
Error: Connection terminated unexpectedly
FATAL: password authentication failed
```

**Cause :** Mauvais identifiants ou PostgreSQL non démarré.

**✅ Solution :**

1. Vérifiez que PostgreSQL est démarré :
   ```bash
   # Ouvrez "Services" Windows (Win + R → services.msc)
   # Cherchez "PostgreSQL" et assurez-vous qu'il est démarré
   ```

2. Vérifiez votre `DATABASE_URL` dans `.env` :
   ```bash
   DATABASE_URL=postgresql://postgres:votre_vrai_mot_de_passe@localhost:5432/izyinbox
   ```

3. Testez la connexion :
   ```bash
   psql -U postgres -d izyinbox
   ```

---

### 6. Erreur : "cross-env: command not found"

**Symptôme :**
```
'cross-env' n'est pas reconnu en tant que commande interne
```

**Cause :** Le package `cross-env` n'est pas installé.

**✅ Solution :**

```bash
npm install
```

Si le problème persiste :
```bash
npm install cross-env --save-dev
```

---

### 7. Erreur : "listen ENOTSUP: operation not supported on socket 0.0.0.0"

**Symptôme :**
```
Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:5000
```

**Cause :** Windows ne permet pas à Node.js d'écouter sur `0.0.0.0` en raison de restrictions réseau.

**✅ Solution :**

**Option 1 : Automatique (Recommandé)**

Assurez-vous que votre fichier `.env` **ne contient PAS** ces variables :
```bash
# ⚠️ Ne PAS définir ces variables en local !
# REPL_ID=...
# REPLIT_DOMAINS=...
```

L'application détectera automatiquement qu'elle est en local et utilisera `localhost` au lieu de `0.0.0.0`.

**Option 2 : Explicite**

Ajoutez cette ligne dans votre `.env` :
```bash
HOST=localhost
```

**Option 3 : Changez le port et testez**

Essayez un autre port :
```bash
PORT=3000
HOST=localhost
```

---

### 8. Chemins de fichiers avec antislash (\)

**Symptôme :**
Les imports de fichiers ne fonctionnent pas sur Windows à cause des `\` au lieu de `/`.

**Cause :** Windows utilise `\` comme séparateur de chemin, Node.js préfère `/`.

**✅ Solution :**

L'application utilise déjà `path.resolve()` qui gère automatiquement les chemins Windows. Aucune action requise de votre part !

---

## 📝 Commandes de démarrage par plateforme

### Windows CMD
```bash
set NODE_ENV=development && node --import tsx/esm server/index.ts
```

### Windows PowerShell
```powershell
$env:NODE_ENV="development"; node --import tsx/esm server/index.ts
```

### Linux/macOS
```bash
NODE_ENV=development node --import tsx/esm server/index.ts
```

---

## 🆘 Encore des problèmes ?

### Diagnostic complet

Exécutez ces commandes et partagez les résultats :

```bash
# Version de Node.js
node --version

# Version de npm
npm --version

# PostgreSQL disponible ?
psql --version

# Variables d'environnement
echo %NODE_ENV%          # CMD
echo $env:NODE_ENV       # PowerShell

# Tester PostgreSQL
psql -U postgres -c "SELECT version();"
```

### Logs détaillés

Lancez l'application avec des logs détaillés :

```bash
set DEBUG=* && start-dev.bat
```

---

## ✅ Checklist de vérification

Avant de demander de l'aide, vérifiez :

- [ ] Node.js v18+ installé (`node --version`)
- [ ] PostgreSQL installé et démarré
- [ ] Fichier `.env` créé avec toutes les variables requises
- [ ] Base de données `izyinbox` créée (`CREATE DATABASE izyinbox;`)
- [ ] Schéma synchronisé (`npm run db:push`)
- [ ] Dépendances installées (`npm install`)
- [ ] **Pas de variables Replit** dans `.env` (REPLIT_DOMAINS, ISSUER_URL, REPL_ID)

---

## 🎯 Configuration minimale pour tester

Si vous voulez juste tester rapidement sans toutes les fonctionnalités :

```bash
# .env minimal
DATABASE_URL=postgresql://postgres:mdp@localhost:5432/izyinbox
SESSION_SECRET=changez_moi_secret_tres_long_minimum_32_caracteres
ENCRYPTION_KEY=changez_moi_autre_cle_32_caracteres_minimum
NODE_ENV=development
PORT=5000

# Les clés API suivantes sont optionnelles pour un premier test :
# OPENAI_API_KEY (IA ne fonctionnera pas)
# STRIPE_SECRET_KEY (Paiements ne fonctionneront pas)
# RESEND_API_KEY (Emails ne fonctionneront pas)
```

Lancez ensuite :
```bash
npm run db:push
start-dev.bat
```

---

## 📚 Ressources utiles

- [Documentation PostgreSQL Windows](https://www.postgresql.org/download/windows/)
- [Documentation Node.js](https://nodejs.org/en/docs/)
- [Documentation tsx](https://github.com/privatenumber/tsx)
- [Guide complet de démarrage](./DEMARRAGE_LOCAL.md)

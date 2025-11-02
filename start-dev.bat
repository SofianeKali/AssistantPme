@echo off
echo Demarrage d'IzyInbox en mode developpement...
set NODE_ENV=development
npx tsx --tsconfig tsconfig.server.json server/index.ts

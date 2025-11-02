@echo off
echo Demarrage d'IzyInbox en mode developpement...
set NODE_ENV=development
node --import tsx/esm server/index.ts

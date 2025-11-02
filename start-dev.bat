@echo off
echo Demarrage d'IzyInbox en mode developpement...
set NODE_ENV=development
node --loader tsx --no-warnings server/index.ts

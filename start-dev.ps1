# Script de démarrage pour Windows PowerShell
Write-Host "Demarrage d'IzyInbox en mode developpement..." -ForegroundColor Green
$env:NODE_ENV = "development"
node --loader tsx --no-warnings server/index.ts

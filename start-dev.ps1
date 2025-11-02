# Script de démarrage pour Windows PowerShell
Write-Host "Demarrage d'IzyInbox en mode developpement..." -ForegroundColor Green
$env:NODE_ENV = "development"
npx tsx --tsconfig tsconfig.server.json server/index.ts

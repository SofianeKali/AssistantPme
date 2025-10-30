# 💰 FINANCIAL MODEL - IzyInbox
## Projections Financières Détaillées 2026-2028

**Version:** 1.0  
**Date:** Octobre 2025  
**Période:** 36 mois (M0 = Janvier 2026)

---

## 📊 ASSUMPTIONS & HYPOTHÈSES

### Revenue Assumptions

#### Pricing Tiers
| Plan | Prix Mensuel | Prix Annuel | Discount Annuel |
|------|--------------|-------------|-----------------|
| Starter | €59 | €566 | 20% (-€142) |
| Professional | €149 | €1 430 | 20% (-€358) |
| Enterprise | €399 | €3 830 | 20% (-€958) |

#### Customer Mix Evolution
```
AN 1 (Mois 12)
├─ Starter: 60% (72 clients)
├─ Professional: 35% (42 clients)
└─ Enterprise: 5% (6 clients)
   Total: 120 clients

AN 2 (Mois 24)
├─ Starter: 45% (203 clients)
├─ Professional: 45% (203 clients)
└─ Enterprise: 10% (44 clients)
   Total: 450 clients

AN 3 (Mois 36)
├─ Starter: 30% (450 clients)
├─ Professional: 50% (750 clients)
└─ Enterprise: 20% (300 clients)
   Total: 1 500 clients
```

#### Payment Terms Mix
| Type | % Clients An 1 | % Clients An 2 | % Clients An 3 |
|------|----------------|----------------|----------------|
| Mensuel | 70% | 60% | 50% |
| Annuel | 30% | 40% | 50% |

#### Acquisition Channels Mix
| Channel | % An 1 | % An 2 | % An 3 | CAC Moyen |
|---------|--------|--------|--------|-----------|
| Partnerships (Experts-Comptables) | 30% | 50% | 60% | €300 |
| LinkedIn Ads | 25% | 20% | 15% | €450 |
| Google Ads | 20% | 15% | 10% | €500 |
| SEO/Content (Organic) | 15% | 10% | 8% | €100 |
| Referrals | 10% | 5% | 7% | €50 |

**CAC Blended:**
- An 1: €400
- An 2: €350
- An 3: €300

#### Churn Assumptions
| Métrique | An 1 | An 2 | An 3 | Benchmark |
|----------|------|------|------|-----------|
| **Churn Mensuel** | 1,0% | 0,7% | 0,5% | 0,8-1,5% |
| **Churn Annuel** | 12% | 8% | 6% | 10-15% |
| **Retention Rate** | 88% | 92% | 94% | 85-90% |

#### Expansion Revenue (Upsells)
- % clients upgrading: 5% (An 1) → 8% (An 2) → 10% (An 3)
- Avg upgrade: Starter → Pro (€90/mois gain)

### Cost Assumptions

#### Personnel Costs (Salaire Brut + Charges 45%)
| Rôle | Salaire Annuel Brut | Coût Total | Effectif An 1 | An 2 | An 3 |
|------|---------------------|------------|---------------|------|------|
| CEO/Co-founder | €60K | €87K | 1 | 1 | 1 |
| CTO/Co-founder | €70K | €102K | 1 | 1 | 1 |
| Full-stack Engineer | €55K | €80K | 2 | 4 | 7 |
| Product Designer | €45K | €65K | 1 | 1 | 2 |
| Customer Success Manager | €40K | €58K | 1 | 3 | 5 |
| Sales Development Rep (SDR) | €35K | €51K | 0 | 2 | 3 |
| Account Executive | €50K | €73K | 0 | 0 | 2 |
| Marketing Manager | €45K | €65K | 0 | 1 | 1 |
| Partnership Manager | €45K | €65K | 1 | 1 | 2 |
| DevOps Engineer | €60K | €87K | 0 | 1 | 1 |
| **TOTAL TEAM** | - | - | **7** | **15** | **25** |

#### Infrastructure Costs (Mensuel)
| Service | An 1 (€/mois) | An 2 | An 3 | Notes |
|---------|---------------|------|------|-------|
| AWS/Scaleway (Cloud) | €500 | €1 500 | €4 000 | Scaling avec utilisateurs |
| OpenAI API | €800 | €2 500 | €6 000 | €0,02/1K tokens, subsidized par crédits clients |
| Database (Neon) | €200 | €500 | €1 000 | PostgreSQL managed |
| CDN & Storage | €100 | €300 | €800 | Cloudflare, S3 |
| Monitoring (Datadog, Sentry) | €200 | €400 | €600 | APM, logs, errors |
| SaaS Tools | €300 | €600 | €1 000 | CRM, Analytics, Support |
| Security & Compliance | €150 | €300 | €500 | ISO 27001, pen tests |
| **TOTAL INFRA** | **€2 250** | **€6 100** | **€13 900** | |

#### Marketing & Sales Costs (Mensuel)
| Poste | An 1 | An 2 | An 3 |
|-------|------|------|------|
| LinkedIn Ads | €3 000 | €5 000 | €8 000 |
| Google Ads | €2 000 | €3 000 | €4 000 |
| Content Marketing | €1 000 | €2 000 | €3 000 |
| Events & Webinaires | €1 000 | €2 000 | €3 000 |
| SEO Tools (Ahrefs, Semrush) | €300 | €500 | €800 |
| Design & Creative | €500 | €1 000 | €1 500 |
| Partnerships Program | €500 | €1 500 | €3 000 |
| **TOTAL MARKETING** | **€8 300** | **€15 000** | **€23 300** |

#### Operations & Admin (Mensuel)
| Poste | An 1 | An 2 | An 3 |
|-------|------|------|------|
| Bureaux / Coworking | €1 500 | €3 000 | €5 000 |
| Legal & Comptabilité | €800 | €1 200 | €1 800 |
| Insurance (RC Pro, Cyber) | €300 | €500 | €800 |
| Recrutement | €500 | €1 500 | €2 500 |
| Formation & Events Team | €200 | €500 | €1 000 |
| Divers | €500 | €800 | €1 200 |
| **TOTAL OPERATIONS** | **€3 800** | **€7 500** | **€12 300** |

---

## 📈 REVENUS DÉTAILLÉS (36 MOIS)

### Année 1: Mois par Mois

| Mois | Nouveaux Clients | Total Clients | Churn | MRR | ARR (Run Rate) | Revenus Additionnels | Total Revenus Mois |
|------|------------------|---------------|-------|-----|----------------|----------------------|--------------------|
| M1 | 3 | 3 | 0 | €223 | €2 676 | €1 500 | €1 723 |
| M2 | 5 | 8 | 0 | €596 | €7 152 | €2 500 | €3 096 |
| M3 | 7 | 15 | -0 | €1 117 | €13 404 | €3 500 | €4 617 |
| M4 | 8 | 23 | -0 | €1 713 | €20 556 | €4 000 | €5 713 |
| M5 | 9 | 32 | -0 | €2 384 | €28 608 | €4 800 | €7 184 |
| M6 | 10 | 42 | -0 | €3 127 | €37 524 | €5 000 | €8 127 |
| M7 | 11 | 52 | -1 | €3 873 | €46 476 | €5 200 | €9 073 |
| M8 | 12 | 63 | -1 | €4 692 | €56 304 | €6 300 | €10 992 |
| M9 | 13 | 75 | -1 | €5 584 | €67 008 | €7 500 | €13 084 |
| M10 | 14 | 88 | -1 | €6 549 | €78 588 | €8 800 | €15 349 |
| M11 | 15 | 102 | -1 | €7 590 | €91 080 | €10 200 | €17 790 |
| M12 | 18 | 119 | -1 | €8 855 | €106 260 | €11 900 | €20 755 |
| **TOTAL AN 1** | **125** | **120** | **-6** | **€8 855** | **€106 260** | **€70 200** | **€117 503** |

**Notes An 1:**
- Démarrage progressif (3 clients M1 → 18 clients M12)
- Revenus additionnels: Onboarding (€500/client) + Add-ons
- Churn démarre M7 (1%/mois)
- MRR fin année: €8 855 (arrondi €9K)

---

### Année 2: Trimestriel

| Trimestre | Nouveaux Clients | Total Clients Début | Churn Trim | Total Clients Fin | MRR Fin | ARR (Run Rate) | Revenus Trim | Revenus Additionnels |
|-----------|------------------|---------------------|------------|-------------------|---------|----------------|--------------|----------------------|
| Q1 (M13-15) | 75 | 120 | -6 | 189 | €17 010 | €204 120 | €41 733 | €18 750 |
| Q2 (M16-18) | 85 | 189 | -5 | 269 | €24 210 | €290 520 | €61 419 | €21 250 |
| Q3 (M19-21) | 95 | 269 | -6 | 358 | €32 220 | €386 640 | €84 654 | €23 750 |
| Q4 (M22-24) | 105 | 358 | -8 | 455 | €40 950 | €491 400 | €110 783 | €26 250 |
| **TOTAL AN 2** | **360** | **120** | **-25** | **455** | **€40 950** | **€491 400** | **€298 589** | **€90 000** |

**Notes An 2:**
- Accélération acquisition (partenariats actifs)
- Churn réduit à 0,7%/mois (8% annuel)
- Expansion revenue: +€15K (upsells Starter → Pro)
- Mix plans: Plus de Pro & Enterprise

---

### Année 3: Trimestriel

| Trimestre | Nouveaux Clients | Total Clients Début | Churn Trim | Total Clients Fin | MRR Fin | ARR (Run Rate) | Revenus Trim | Revenus Additionnels |
|-----------|------------------|---------------------|------------|-------------------|---------|----------------|--------------|----------------------|
| Q1 (M25-27) | 240 | 455 | -10 | 685 | €68 500 | €822 000 | €179 925 | €60 000 |
| Q2 (M28-30) | 260 | 685 | -10 | 935 | €93 500 | €1 122 000 | €262 575 | €65 000 |
| Q3 (M31-33) | 280 | 935 | -13 | 1 202 | €120 200 | €1 442 400 | €352 022 | €70 000 |
| Q4 (M34-36) | 310 | 1 202 | -15 | 1 497 | €149 700 | €1 796 400 | €453 213 | €75 000 |
| **TOTAL AN 3** | **1 090** | **455** | **-48** | **1 497** | **€149 700** | **€1 796 400** | **€1 247 735** | **€270 000** |

**Notes An 3:**
- Forte croissance (partnerships matures)
- Churn réduit à 0,5%/mois (6% annuel)
- Expansion revenue: +€30K (upsells + add-ons)
- ARPU augmenté (€100/mois)

---

## 💸 COÛTS DÉTAILLÉS (36 MOIS)

### Année 1: Structure de Coûts

| Catégorie | M1-M3 (€/mois) | M4-M6 | M7-M9 | M10-M12 | Total An 1 |
|-----------|----------------|-------|-------|---------|------------|
| **Salaires** | €36 000 | €36 000 | €40 000 | €40 000 | €456 000 |
| **Infrastructure** | €2 250 | €2 400 | €2 600 | €2 800 | €29 700 |
| **Marketing** | €6 000 | €7 000 | €8 000 | €9 000 | €90 000 |
| **Operations** | €3 000 | €3 200 | €3 500 | €3 800 | €40 200 |
| **One-time (Setup)** | €10 000 | €0 | €0 | €0 | €10 000 |
| **TOTAL** | **€57 250** | **€48 600** | **€54 100** | **€55 600** | **€625 900** |

**Détail Salaires An 1:**
- M1-M6: 7 personnes (CEO, CTO, 2 Eng, Designer, CSM, Partnership Mgr)
- M7-M12: +1 Engineer (total 8 personnes)

**Burn Rate Mensuel:**
- Moyenne: €52K/mois
- Runway avec €600K: 11,5 mois (ajusté avec revenus = 18 mois)

---

### Année 2: Structure de Coûts

| Catégorie | Q1 (€/mois) | Q2 | Q3 | Q4 | Total An 2 |
|-----------|-------------|----|----|-----|------------|
| **Salaires** | €65 000 | €70 000 | €75 000 | €80 000 | €870 000 |
| **Infrastructure** | €4 000 | €5 000 | €6 000 | €7 000 | €66 000 |
| **Marketing** | €12 000 | €14 000 | €15 000 | €16 000 | €171 000 |
| **Operations** | €6 000 | €6 500 | €7 000 | €7 500 | €81 000 |
| **TOTAL** | **€87 000** | **€95 500** | **€103 000** | **€110 500** | **€1 188 000** |

**Détail Salaires An 2:**
- Q1: +2 SDR, +1 CSM (total 11)
- Q2: +2 Engineers (total 13)
- Q3: +1 Marketing Mgr, +1 DevOps (total 15)
- Q4: Pas de recrutement (consolidation)

---

### Année 3: Structure de Coûts

| Catégorie | Q1 (€/mois) | Q2 | Q3 | Q4 | Total An 3 |
|-----------|-------------|----|----|-----|------------|
| **Salaires** | €100 000 | €110 000 | €120 000 | €130 000 | €1 380 000 |
| **Infrastructure** | €10 000 | €12 000 | €14 000 | €15 000 | €153 000 |
| **Marketing** | €20 000 | €22 000 | €24 000 | €25 000 | €273 000 |
| **Operations** | €10 000 | €11 000 | €12 000 | €13 000 | €138 000 |
| **TOTAL** | **€140 000** | **€155 000** | **€170 000** | **€183 000** | **€1 944 000** |

**Détail Salaires An 3:**
- Q1: +3 Engineers, +2 CSM (total 20)
- Q2: +2 AE, +1 SDR (total 23)
- Q3: +1 PM, +1 Designer (total 25)
- Q4: Pas de recrutement

---

## 📊 P&L (COMPTE DE RÉSULTAT) - 3 ANS

### Synthèse Annuelle

| Ligne | Année 1 | Année 2 | Année 3 |
|-------|---------|---------|---------|
| **REVENUS** | | | |
| Subscriptions (MRR × 12) | €106 260 | €491 400 | €1 796 400 |
| Revenus Additionnels | €70 200 | €90 000 | €270 000 |
| **Total Revenus** | **€176 460** | **€581 400** | **€2 066 400** |
| | | | |
| **COÛTS VARIABLES** | | | |
| Cost of Goods Sold (COGS) | €29 700 | €66 000 | €153 000 |
| Commissions Partnerships (20%) | €21 252 | €98 280 | €359 280 |
| **Total COGS** | **€50 952** | **€164 280** | **€512 280** |
| | | | |
| **MARGE BRUTE** | **€125 508** | **€417 120** | **€1 554 120** |
| **% Marge Brute** | **71%** | **72%** | **75%** |
| | | | |
| **COÛTS OPÉRATIONNELS** | | | |
| Salaires & Charges | €456 000 | €870 000 | €1 380 000 |
| Marketing & Sales | €90 000 | €171 000 | €273 000 |
| Operations & Admin | €40 200 | €81 000 | €138 000 |
| One-time Costs | €10 000 | €0 | €0 |
| **Total OPEX** | **€596 200** | **€1 122 000** | **€1 791 000** |
| | | | |
| **EBITDA** | **-€470 692** | **-€704 880** | **-€236 880** |
| **% EBITDA** | **-267%** | **-121%** | **-11%** |
| | | | |
| **CASH FLOW** | | | |
| Burn Rate Mensuel | -€39K | -€59K | -€20K |
| Runway (mois) | 15 | 10 | 30+ |

**Notes:**
- An 1: Investissement lourd (team building)
- An 2: Scaling, EBITDA négatif mais amélioration
- An 3: Proche profitabilité (-11% EBITDA)
- Profitabilité attendue: M32-34

---

## 💰 MÉTRIQUES SaaS CLÉS

### Unit Economics

| Métrique | An 1 | An 2 | An 3 | Benchmark | Status |
|----------|------|------|------|-----------|--------|
| **ARPU** (€/mois) | €75 | €90 | €100 | €50-80 | ✅ Au-dessus |
| **CAC** | €400 | €350 | €300 | <€400 | ✅ Bon |
| **LTV** (24 mois) | €2 160 | €2 592 | €3 240 | - | - |
| **LTV/CAC** | 5,4x | 7,4x | 10,8x | >3x | ✅ Excellent |
| **Payback Period** | 5 mois | 4 mois | 3 mois | <12 mois | ✅ Excellent |
| **Gross Margin** | 71% | 72% | 75% | >70% | ✅ Bon |
| **Logo Retention** | 88% | 92% | 94% | >85% | ✅ Excellent |
| **Net Revenue Retention** | 95% | 102% | 108% | >100% | ⚠️→✅ |

**Calculs:**
- **ARPU**: MRR / Nombre clients
- **CAC**: (Marketing + Sales + Commissions) / Nouveaux clients
- **LTV**: ARPU × (1/Churn mensuel) × Gross Margin
- **Payback**: CAC / (ARPU × Gross Margin)
- **NRR**: (Expansion Revenue - Churn) / ARR début période

---

### Cohort Analysis (Exemple Cohorte M6)

| Mois | Clients Début | Churn | Upsells | Clients Fin | Revenus | Retention $ |
|------|---------------|-------|---------|-------------|---------|-------------|
| M6 | 10 | 0 | 0 | 10 | €750 | 100% |
| M7 | 10 | 0 | 0 | 10 | €750 | 100% |
| M8 | 10 | -1 | 0 | 9 | €675 | 90% |
| M9 | 9 | 0 | +1 | 9 | €764 | 102% |
| M10 | 9 | 0 | 0 | 9 | €810 | 108% |
| M11 | 9 | -1 | 0 | 8 | €720 | 96% |
| M12 | 8 | 0 | +1 | 8 | €869 | 116% |
| **M18** | 8 | - | - | 8 | €960 | **128%** |

**Insights:**
- 80% logo retention à M18
- 128% net revenue retention (expansion > churn)
- Upsells compensent largement le churn

---

## 💵 CASH FLOW & FUNDRAISING

### Cash Flow Statement (Simplifié)

| Ligne | An 1 | An 2 | An 3 |
|-------|------|------|------|
| **Operating Activities** | | | |
| Cash from Customers | €176 460 | €581 400 | €2 066 400 |
| Cash to Suppliers | -€50 952 | -€164 280 | -€512 280 |
| Cash to Employees | -€456 000 | -€870 000 | -€1 380 000 |
| Cash to Operations | -€140 200 | -€252 000 | -€411 000 |
| **Net Operating CF** | **-€470 692** | **-€704 880** | **-€236 880** |
| | | | |
| **Investing Activities** | | | |
| CapEx (Software, Hardware) | -€10 000 | -€15 000 | -€20 000 |
| **Net Investing CF** | **-€10 000** | **-€15 000** | **-€20 000** |
| | | | |
| **Financing Activities** | | | |
| Seed Round (M0) | €600 000 | €0 | €0 |
| Series A (M24) | €0 | €2 500 000 | €0 |
| **Net Financing CF** | **€600 000** | **€2 500 000** | **€0** |
| | | | |
| **NET CASH FLOW** | **€119 308** | **€1 780 120** | **-€256 880** |
| **Cash Balance (End)** | **€119 308** | **€1 899 428** | **€1 642 548** |

**Notes:**
- Seed €600K (M0): Couvre An 1 + partie An 2
- Series A €2,5M (M24): Scale An 3 + runway An 4
- Cash positif jusqu'à M36 (runway sécurisé)

---

### Fundraising Timeline

```
M0 (Jan 2026): SEED - €600K
├─ Pre-money valuation: €3M
├─ Post-money valuation: €3,6M
├─ Dilution: 20%
├─ Use: Team (60%), Marketing (17%), Infra (7%), Ops (10%), Buffer (6%)
└─ Runway: 18 mois (avec revenus)

M24 (Jan 2028): SERIES A - €2,5M
├─ Pre-money valuation: €10M (basé sur €1M ARR × 10x)
├─ Post-money valuation: €12,5M
├─ Dilution: 20% (cumulé 36% dilution fondateurs)
├─ Use: Scale Sales (40%), Expansion EU (25%), R&D (20%), Ops (15%)
└─ Runway: 24 mois (jusqu'à profitabilité)

M48 (Jan 2030): SERIES B ou Profitabilité
├─ ARR projeté: €8M-10M
├─ Option 1: Series B €10M (scale international)
├─ Option 2: Bootstrap (profitable)
└─ Valuation: €80M-100M (10x ARR)
```

---

## 🎯 SENSIBILITÉ & SCENARIOS

### Scenario Analysis

| Métrique | Pessimiste | Base Case | Optimiste |
|----------|------------|-----------|-----------|
| **Clients M36** | 1 000 | 1 500 | 2 200 |
| **ARPU M36** | €80 | €100 | €120 |
| **Churn An 3** | 10% | 6% | 4% |
| **CAC An 3** | €400 | €300 | €200 |
| **ARR M36** | €960K | €1 800K | €3 168K |
| **EBITDA M36** | -€500K | -€237K | +€300K |
| **Runway** | 18 mois | 30+ mois | Profitable |
| **Series A Need** | €3M | €2,5M | €2M |

**Sensibilité Churn:**
```
Si Churn An 3 = 10% (vs. 6% base)
├─ Clients M36: 1 200 (vs. 1 500)
├─ ARR M36: €1 440K (vs. €1 800K)
├─ LTV/CAC: 6,5x (vs. 10,8x)
└─ Impact: -€360K ARR (-20%)
```

**Sensibilité CAC:**
```
Si CAC An 3 = €450 (vs. €300 base)
├─ Budget Marketing: +€50K/an nécessaire
├─ Payback: 4,5 mois (vs. 3 mois)
├─ LTV/CAC: 7,2x (vs. 10,8x)
└─ Impact: Toujours sain mais moins de marge
```

---

## 📈 VALUATION & EXIT SCENARIOS

### Valuation Multiples (SaaS Benchmarks)

| Stage | ARR | Multiple | Valuation | Contexte |
|-------|-----|----------|-----------|----------|
| **Seed** | €100K | 30x | €3M | Early traction, product-market fit |
| **Series A** | €500K | 20x | €10M | Proven GTM, scaling channels |
| **Series B** | €3M | 15x | €45M | Efficient growth, path to profitability |
| **Series C** | €10M | 10-12x | €100-120M | Profitable or near, market leader |

### Exit Scenarios (M48 - Janvier 2030)

**Scenario 1: Acquisition Stratégique**
```
Acquéreur: Sage, Cegid, Pennylane (Fintechs FR)
├─ ARR M48: €8M
├─ Multiple: 8x (stratégique = premium)
├─ Valuation: €64M
├─ Fondateurs (64% post-dilution): €41M
└─ ROI Seed: 17,7x (€600K → €10,6M)
```

**Scenario 2: IPO / SPAC**
```
Marché: Euronext Growth (Paris)
├─ ARR M60: €15M
├─ Multiple: 6x (public markets = discount)
├─ Valuation: €90M
├─ Fondateurs (60% post-Series C): €54M
└─ ROI Seed: 25x (€600K → €15M)
```

**Scenario 3: Bootstrap (Pas d'exit)**
```
├─ ARR M60: €20M
├─ EBITDA margin: 25%
├─ Dividendes annuels: €5M
├─ Fondateurs (80% ownership): €4M/an
└─ Valuation implicite: €100M+ (20x EBITDA)
```

---

## 🔧 TOOLS & TEMPLATES

### Excel Model Structure (À Construire)

```
ONGLETS RECOMMANDÉS:

1. Dashboard
   ├─ Métriques clés (ARR, MRR, CAC, LTV, etc.)
   ├─ Graphiques (revenus, clients, cash)
   └─ Alertes (runway, burn rate)

2. Revenue Model
   ├─ Customer acquisition (mensuel)
   ├─ Churn tracking
   ├─ ARPU evolution
   ├─ Expansion revenue
   └─ Revenue recognition

3. Cost Model
   ├─ Headcount planning
   ├─ Salaries & benefits
   ├─ Infrastructure costs
   ├─ Marketing spend by channel
   └─ Operations costs

4. P&L
   ├─ Monthly P&L (M1-M36)
   ├─ Quarterly view
   ├─ Annual summary
   └─ Cumulative view

5. Cash Flow
   ├─ Operating CF
   ├─ Investing CF
   ├─ Financing CF
   └─ Cash balance tracking

6. Unit Economics
   ├─ CAC by channel
   ├─ LTV calculation
   ├─ Payback period
   └─ Cohort analysis

7. Scenarios
   ├─ Base case
   ├─ Pessimistic (-30%)
   ├─ Optimistic (+50%)
   └─ Sensitivity tables

8. Funding
   ├─ Cap table
   ├─ Dilution tracking
   ├─ Investor returns
   └─ Exit scenarios
```

### Formules Excel Clés

**MRR Calculation:**
```
=SUMIFS(Customers[Count], Customers[Plan], "Starter") * 59
+ SUMIFS(Customers[Count], Customers[Plan], "Pro") * 149
+ SUMIFS(Customers[Count], Customers[Plan], "Enterprise") * 399
```

**CAC Calculation:**
```
=(Marketing_Spend + Sales_Salaries + Commissions) / New_Customers
```

**LTV Calculation:**
```
=ARPU * (1 / Churn_Rate) * Gross_Margin
```

**Churn Rate:**
```
=Churned_Customers / Total_Customers_Start_Month
```

---

## 📊 KPIs DASHBOARD (Suivi Mensuel)

### Metrics to Track

| Catégorie | Métrique | Fréquence | Owner | Alerte Si |
|-----------|----------|-----------|-------|-----------|
| **Growth** | Nouveaux clients | Hebdo | Sales | <10/mois |
| | MRR | Hebdo | CEO | Growth <10%/mois |
| | ARR | Mensuel | CEO | - |
| **Efficiency** | CAC | Mensuel | Marketing | >€500 |
| | LTV/CAC | Mensuel | CEO | <3x |
| | Payback | Mensuel | CFO | >12 mois |
| **Retention** | Churn mensuel | Hebdo | CSM | >1,5% |
| | NPS | Mensuel | CSM | <40 |
| | Logo Retention | Mensuel | CSM | <85% |
| **Engagement** | DAU | Quotidien | Product | <70% |
| | Feature Adoption | Hebdo | Product | <50% |
| | Support Tickets | Quotidien | CSM | >10% users |
| **Financial** | Burn Rate | Hebdo | CFO | >€60K/mois |
| | Runway | Hebdo | CFO | <6 mois |
| | Cash Balance | Quotidien | CFO | <€100K |

---

## ✅ CONCLUSION & NEXT STEPS

### Financial Health Summary

**Année 1:** Investissement fondation
- ✅ 120 clients acquis
- ✅ €176K revenus
- ❌ -€471K EBITDA (normal early-stage)
- ✅ Runway sécurisé (18 mois)

**Année 2:** Scaling
- ✅ 450 clients (3,75x growth)
- ✅ €581K revenus
- ❌ -€705K EBITDA (investissement croissance)
- ✅ Series A secured (€2,5M)

**Année 3:** Path to Profitability
- ✅ 1 500 clients (3,3x growth)
- ✅ €2M+ revenus
- ⚠️ -€237K EBITDA (proche break-even)
- ✅ Profitability M32-34

### Recommendations

1. **Monitor CAC by Channel**  
   → Optimize spend vers partnerships (meilleur ROI)

2. **Reduce Churn Aggressively**  
   → Chaque 1% churn = -€180K ARR (An 3)

3. **Focus Expansion Revenue**  
   → Upsells = 0 CAC, pure profit

4. **Plan Series A Early**  
   → Commencer discussions M18 (6 mois avant need)

5. **Benchmark Competitors**  
   → Track pricing, features, GTM strategies

---

**Dernière mise à jour:** Octobre 2025  
**Version:** 1.0  
**Format Excel disponible:** financial-model-izyinbox.xlsx (à créer)

**Contact:**  
[Votre nom] - CFO/CEO  
[Email]  
[LinkedIn]


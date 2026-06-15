# PrivateDrop

> Créez des ventes privées, drops chronométrés et showrooms exclusifs directement sur Shopify.

App Shopify embarquée (Remix + TypeScript strict + Prisma/PostgreSQL + Polaris/Tailwind).
Installation via **OAuth officiel Shopify** — jamais de token copié/collé.

Ce dépôt est au **Milestone 1 — Fondation** : OAuth, sessions, base de données,
webhooks RGPD, splash screen premium et tableau de bord vide fonctionnel dans
l'admin Shopify, plus la base de l'App Proxy.

---

## 1. Prérequis

- **Node.js** ≥ 18.20 (testé sur Node 22)
- **npm** ≥ 10
- **PostgreSQL** (local via Docker, ou Neon/Render/Supabase)
- Un **compte Shopify Partners** : https://partners.shopify.com
- Une **boutique de développement** (créée depuis le Partner Dashboard) ou votre boutique de test
- Le **Shopify CLI** est embarqué comme dépendance du projet (`npm run dev` l'invoque) — rien à installer globalement.

---

## 2. Installation locale

```bash
# 1. Dépendances
npm install

# 2. Base de données Postgres locale (Docker)
docker compose up -d

# 3. Variables d'environnement
cp .env.example .env
# Génère les 3 secrets applicatifs :
#   openssl rand -hex 32   (à coller dans ACCESS_COOKIE_SECRET, EMAIL_HASH_SALT, ENCRYPTION_KEY)
# DATABASE_URL est déjà bon si tu utilises le docker-compose fourni.

# 4. Migrations Prisma + client
npm run prisma -- migrate deploy
npm run prisma -- generate
```

> `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` / `SHOPIFY_APP_URL` sont injectées
> automatiquement par `shopify app dev` lors de la première exécution. Pas besoin
> de les remplir à la main en développement.

---

## 3. Créer l'app Shopify (une seule fois)

Aucune création manuelle de "custom app" avec token. On passe par le CLI officiel :

```bash
# Connecte le CLI à ton compte Partners et crée (ou relie) l'app.
npm run config:link
```

Le CLI :
1. ouvre le navigateur pour t'authentifier sur Shopify Partners ;
2. propose de **créer une nouvelle app** (choisis « Create this app on Shopify ») ;
3. écrit le `client_id` dans `shopify.app.toml` ;
4. enregistre les scopes (`read_products,read_customers`), les webhooks et l'App Proxy déclarés dans le toml.

> **Protected Customer Data** : `read_customers` requiert d'activer l'accès aux
> données client protégées dans le Partner Dashboard
> (App → API access → Protected customer data). À faire avant l'installation,
> sinon le scope sera refusé.

---

## 4. Lancer en développement et installer sur une boutique

```bash
npm run dev
```

Le CLI :
1. démarre un **tunnel** public (Cloudflare) et met à jour `application_url` + les URLs OAuth automatiquement ;
2. lance le serveur Remix ;
3. affiche une **URL d'installation** ("Preview in your browser" / appuie sur `p`).

Ouvre cette URL, **choisis ta boutique de dev**, accepte l'écran de permissions
(`read_products`, `read_customers`). À l'acceptation :

- OAuth se termine, le **token est stocké côté serveur** (table `Session`) ;
- le **Shop est créé/mis à jour** en base (table `Shop` + `OnboardingState`) ;
- tu es redirigé dans l'admin Shopify ;
- le **splash screen premium** s'affiche brièvement, puis l'écran **Smart Start**
  (avec le vrai nom/domaine/forfait de ta boutique récupérés via OAuth) ;
- « Accéder au tableau de bord » t'amène au **dashboard vide** mais fonctionnel.

L'app est visible dans **Shopify Admin → Apps → PrivateDrop**.

---

## 5. Tester / vérifier (checklist M1)

| Vérification | Où |
|---|---|
| App démarre | terminal `npm run dev` sans erreur |
| OAuth fonctionne | écran de permissions Shopify accepté |
| Token stocké serveur | `npm run prisma -- studio` → table `Session` |
| Shop upserté | table `Shop` (1 ligne, `uninstalledAt` null) |
| Splash visible | redirection post-install (~1,2 s) |
| Smart Start | nom/domaine/forfait réels affichés |
| Dashboard | Apps → PrivateDrop, KPIs à 0 |
| Webhooks enregistrés | `npm run dev` log « registered » ; ou Partner Dashboard |
| App Proxy | visiter `https://<ta-boutique>/apps/privatedrop` → page PrivateDrop |
| Désinstallation propre | désinstaller depuis l'admin → `Shop.uninstalledAt` rempli, `Session` purgée |

Inspecter la base à tout moment :

```bash
npm run prisma -- studio
```

---

## 6. Scopes & justification

| Scope | Pourquoi |
|---|---|
| `read_products` | Sélection des produits et snapshots (titre, image, prix, stock) pour les événements. |
| `read_customers` | Règles d'accès VIP : email client, tag client, ancien client (via `numberOfOrders`). |

Pas de `read_orders`, `write_*`, ni accès thème en V1 — scopes minimaux.

---

## 7. Webhooks configurés

| Topic | Route | Effet |
|---|---|---|
| `app/uninstalled` | `/webhooks/app/uninstalled` | Marque le shop désinstallé, archive ses événements, purge les sessions. |
| `app/scopes_update` | `/webhooks/app/scopes_update` | Met à jour les scopes de la session. |
| `customers/data_request` | `/webhooks/customers/data_request` | RGPD — aucune donnée client identifiante stockée. |
| `customers/redact` | `/webhooks/customers/redact` | RGPD — emails non réversibles (hash). |
| `shop/redact` | `/webhooks/shop/redact` | RGPD — purge complète du tenant. |

---

## 8. Architecture (rappel)

```
app/
  routes/            Contrôleurs Remix (admin, auth, webhooks, proxy)
  domain/            Logique métier pure et testable (shop/, à venir: events/access/onboarding)
  components/        UI premium réutilisable (SplashScreen, …)
  styles/            Tokens Tailwind (liquid glass)
  shopify.server.ts  Config OAuth + session storage Prisma
  db.server.ts       Client Prisma
prisma/schema.prisma Modèle de données multi-tenant
```

---

## 9. Limites actuelles (fin M1)

- Smart Start est un placeholder : il affiche les infos boutique mais ne scanne
  pas encore produits/clients/tags (→ Milestone 2).
- Le dashboard est volontairement vide (création d'événements → Milestone 3).
- L'App Proxy ne sert qu'une page de base ; la page événement premium → Milestone 5.

## 10. Prochaine étape — Milestone 2 (Smart Start)

Scan boutique réel : produits, clients, tags VIP, collections + 3 suggestions
d'événements, persistés dans `OnboardingState`.

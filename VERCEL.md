# Déploiement PrivateDrop sur Vercel (M1.1)

Objectif : **GitHub → Vercel → Neon Postgres → Shopify Partner Dashboard →
installation dans Shopify Admin**, sans Docker ni terminal local.

URL de production cible : `https://privatedrop-shopify-app.vercel.app`
(remplace partout si la tienne diffère).

---

## 0. Pourquoi ça crashait (et ce qui est corrigé)

| Cause du `FUNCTION_INVOCATION_FAILED` | Correctif appliqué |
|---|---|
| `SHOPIFY_APP_URL` absente → `new URL("")` plante au chargement du module (toutes les routes 500) | Fallback vers une URL valide dans `shopify.server.ts` + variable à renseigner |
| Prisma Client non généré / mauvais moteur pour le runtime Vercel | `binaryTargets = ["native","rhel-openssl-3.0.x"]` + `prisma generate` dans le build |
| Pas de preset Vercel pour Remix (Vite) | `@vercel/remix` + `vercelPreset()` activé sous Vercel |
| Migrations jamais appliquées en prod | `prisma migrate deploy` exécuté dans `vercel-build` |
| Aucune route « vivante » sans auth | Route publique **`/health`** ajoutée |

---

## 1. Créer la base Postgres en ligne (Neon — recommandé)

1. Crée un compte sur https://neon.tech → **New Project** (région proche de tes
   fonctions Vercel, ex. `us-east` pour Vercel `iad1`).
2. Dans **Connection Details**, copie la chaîne de connexion. Une **seule** URL
   suffit (exécution + migrations).
   - Recommandé : la connexion **directe** (host **sans** `-pooler`).
   - La connexion poolée (`-pooler`) fonctionne aussi pour l'exécution.
3. Ajoute `?sslmode=require` à la fin si absent.

Format attendu (`DATABASE_URL`) :

```
postgresql://USER:PASSWORD@ep-xxxx.us-east-1.aws.neon.tech/DBNAME?sslmode=require
```

> Une seule variable `DATABASE_URL` est nécessaire. Pas de `DIRECT_URL`.

> Supabase fonctionne aussi : utilise la chaîne **Direct connection** (port 5432).

---

## 2. Variables d'environnement Vercel

Vercel → ton projet → **Settings → Environment Variables**.
Crée chaque variable pour les environnements **Production** (et Preview si tu veux).

| Variable | Valeur | Notes |
|---|---|---|
| `SHOPIFY_API_KEY` | (Partner Dashboard → API key) | Client ID de l'app |
| `SHOPIFY_API_SECRET` | (Partner Dashboard → API secret key) | **Secret**, ne jamais exposer |
| `SHOPIFY_APP_URL` | `https://privatedrop-shopify-app.vercel.app` | Sans slash final |
| `SCOPES` | `read_products,read_customers` | V1, inchangé |
| `DATABASE_URL` | (Neon — une seule URL) | cf. §1 |
| `ACCESS_COOKIE_SECRET` | `openssl rand -hex 32` | secret cookie d'accès |
| `EMAIL_HASH_SALT` | `openssl rand -hex 32` | salt hash emails (RGPD) |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` | chiffrement codes d'accès |
| `APP_PROXY_SUBPATH` | `privatedrop` | App Proxy |
| `APP_PROXY_PREFIX` | `apps` | App Proxy |
| `NODE_ENV` | `production` | Vercel le met déjà ; optionnel |

> **`PORT`** : **inutile** sur Vercel (les fonctions serverless ne l'utilisent
> pas). Ne pas la définir.

> Pas besoin de générer les 3 secrets via un terminal compliqué : tu peux
> utiliser n'importe quel générateur hex 32 octets / 64 caractères. En ligne de
> commande Mac : `openssl rand -hex 32`.

Après avoir ajouté/changé une variable : **Redeploy** le projet.

---

## 3. Brancher GitHub → Vercel

1. Vercel → **Add New… → Project → Import** le repo
   `nzodms/-privatedrop-shopify-app`.
2. **Branch** : déploie la branche que tu veux tester
   (`claude/m1-1-vercel-production-ready`), ou merge-la dans `main` d'abord.
3. **Framework Preset** : *Remix* (détecté automatiquement).
4. **Build Command** : laissée par défaut — `vercel.json` impose déjà
   `npm run vercel-build` (génère Prisma + applique les migrations + build).
5. **Install Command** : `npm install` (déclenche `postinstall` → `prisma generate`).
6. Renseigne d'abord les variables (§2), puis **Deploy**.

---

## 4. Appliquer les migrations en production

**Automatique** : à chaque déploiement, `vercel-build` exécute
`prisma migrate deploy` (via `DATABASE_URL`). Tu n'as rien à faire.

**Manuel (option, depuis ton Mac)** si tu veux forcer hors déploiement :

```bash
DATABASE_URL="postgresql://...neon...?sslmode=require" npx prisma migrate deploy
```

Vérifier l'état : `npx prisma migrate status`.

---

## 5. Vérifier que le déploiement est vivant

Une fois déployé, ouvre :

```
https://privatedrop-shopify-app.vercel.app/health
```

Réponse attendue (toujours 200, sans Shopify ni DB) :

```json
{ "ok": true, "service": "privatedrop", "time": "..." }
```

> Ouvrir la racine `/` directement affichera la page de connexion PrivateDrop
> (et non plus un crash). L'app est conçue pour s'ouvrir **dans Shopify Admin** ;
> hors Admin, c'est normal de ne voir que l'écran de login.

---

## 6. Configurer Shopify Partner Dashboard

Partner Dashboard → ton app → **Configuration** (ou **App setup**) :

| Champ | Valeur exacte |
|---|---|
| **App URL** | `https://privatedrop-shopify-app.vercel.app` |
| **Allowed redirection URL(s)** | `https://privatedrop-shopify-app.vercel.app/auth/callback` |
| | `https://privatedrop-shopify-app.vercel.app/auth/shopify/callback` |
| | `https://privatedrop-shopify-app.vercel.app/api/auth/callback` |
| **Embedded app** | **Activé** (oui) |
| **App Proxy → Subpath prefix** | `apps` |
| **App Proxy → Subpath** | `privatedrop` |
| **App Proxy → Proxy URL** | `https://privatedrop-shopify-app.vercel.app/proxy` |

Webhooks RGPD (Partner Dashboard → **Compliance webhooks**) — pointer vers :

| Topic | URL |
|---|---|
| Customer data request | `https://privatedrop-shopify-app.vercel.app/webhooks/customers/data_request` |
| Customer redact | `https://privatedrop-shopify-app.vercel.app/webhooks/customers/redact` |
| Shop redact | `https://privatedrop-shopify-app.vercel.app/webhooks/shop/redact` |

> **Protected Customer Data** : Partner Dashboard → **API access → Protected
> customer data access** → demander l'accès (requis par `read_customers`),
> sinon l'install échoue sur ce scope.

> Scopes : déclarés dans `shopify.app.toml` (`read_products,read_customers`). Si
> tu utilises le CLI `npm run deploy`, ils sont poussés ; sinon, vérifie qu'ils
> correspondent dans le dashboard.

---

## 7. Installer l'app dans Shopify Admin

Deux façons :

**A. Lien d'installation direct** (le plus simple) :
```
https://privatedrop-shopify-app.vercel.app/auth?shop=TA-BOUTIQUE.myshopify.com
```
Ouvre-le, accepte les permissions → OAuth se fait → tu es redirigé **dans
Shopify Admin**, app embarquée → **splash premium** → **Smart Start** → dashboard.

**B. Depuis le Partner Dashboard** : ton app → **Test your app → Select store**
→ installe sur ta boutique de dev.

L'app apparaît ensuite dans **Shopify Admin → Apps → PrivateDrop**, et reste
**embedded** (affichée dans l'iframe de l'admin).

---

## 8. Checklist de validation M1.1

- [ ] `/health` répond `{ ok: true }`
- [ ] La racine `/` ne crash plus (affiche l'écran de login)
- [ ] Variables Vercel renseignées (§2) + redeploy
- [ ] Migrations appliquées (tables visibles dans Neon)
- [ ] App URL + redirection URLs + App Proxy configurés (§6)
- [ ] Protected Customer Data demandé
- [ ] Install OAuth OK → splash → Smart Start → dashboard, **dans** Shopify Admin
- [ ] L'app reste embedded (iframe admin)

Quand tout est coché → on lance **M2 (Smart Start)**.

---

## 9. Dépannage rapide

- **500 au cold start** → vérifie `SHOPIFY_APP_URL` (URL complète, https, sans
  slash final) et regarde **Vercel → Deployment → Functions → Logs**.
- **`PrismaClientInitializationError` / engine introuvable** → re-déploie
  (le build régénère le client) ; vérifie que `binaryTargets` contient
  `rhel-openssl-3.0.x` (déjà le cas).
- **Migrations échouent au build** → `DATABASE_URL` invalide ou DB inaccessible ;
  teste la chaîne dans Neon SQL editor. Si l'erreur mentionne un advisory lock /
  PgBouncer, utilise la connexion **directe** Neon (host sans `-pooler`).
- **`Environment variable not found: DIRECT_URL`** → corrigé : le schéma n'utilise
  plus que `DATABASE_URL`. Assure-toi d'être sur le dernier commit de la branche.
- **Écran blanc dans l'admin / refus iframe** → App URL/redirect non alignées
  avec `SHOPIFY_APP_URL`, ou app non « embedded » dans le dashboard.
- **Scope `read_customers` refusé** → Protected Customer Data non approuvé.

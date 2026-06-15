# PrivateDrop — Installer l'app embedded (Vercel + Shopify)

Objectif : une **vraie app Shopify embedded**, visible dans
**Shopify Admin → Apps → PrivateDrop**, hébergée sur Vercel. Version la plus
simple possible : OAuth classique, scope `read_products`, dashboard + splash.

URL de prod cible : `https://privatedrop-shopify-app.vercel.app`
(remplace partout si la tienne diffère).

---

## ✅ Checklist ultra-simple (vue d'ensemble)

1. **Base de données** : créer une Postgres Neon → copier **1** URL.
2. **Vercel** : importer le repo, coller les variables, déployer.
3. **Vérifier** : ouvrir `/health` → `{ ok: true }`.
4. **Partner Dashboard** : renseigner App URL + Redirect URLs + Embedded.
5. **Installer** : ouvrir l'URL d'installation avec ta boutique.
6. **Vérifier dans l'admin** : Shopify Admin → Apps → PrivateDrop.

Détails ci-dessous.

---

## 1. Base de données (le plus simple)

**Option A — Neon (recommandé, gratuit, sans carte) :**
1. https://neon.tech → **New Project**. Choisis une région **US East**
   (Vercel déploie souvent en `iad1`).
2. Dans **Connection Details**, **désactive** le toggle « Pooled connection »
   pour avoir la connexion **directe**, puis copie l'URL.
3. Vérifie qu'elle finit par `?sslmode=require` (ajoute-le sinon).

Tu obtiens **une seule** chaîne, c'est ton `DATABASE_URL` :
```
postgresql://USER:PASSWORD@ep-xxxx.us-east-1.aws.neon.tech/DBNAME?sslmode=require
```
> Une seule variable. Pas de `DIRECT_URL`, pas de pooling à gérer.

**Option B — Vercel Storage (zéro copier-coller) :**
Dans Vercel → ton projet → **Storage → Create Database → Postgres (Neon)**.
Vercel injecte `DATABASE_URL` automatiquement. *(Si les migrations échouent au
build avec une erreur « advisory lock / PgBouncer », repasse sur l'Option A avec
l'URL directe.)*

---

## 2. Variables d'environnement Vercel

Vercel → projet → **Settings → Environment Variables** (environnement **Production**) :

| Variable | Valeur |
|---|---|
| `SHOPIFY_API_KEY` | Client ID (Partner Dashboard) |
| `SHOPIFY_API_SECRET` | Client secret (Partner Dashboard) |
| `SHOPIFY_APP_URL` | `https://privatedrop-shopify-app.vercel.app` (sans slash final) |
| `SCOPES` | `read_products` |
| `DATABASE_URL` | l'URL Neon de l'étape 1 |
| `ACCESS_COOKIE_SECRET` | une valeur aléatoire (`openssl rand -hex 32`) |
| `EMAIL_HASH_SALT` | une valeur aléatoire |
| `ENCRYPTION_KEY` | une valeur aléatoire |
| `APP_PROXY_SUBPATH` | `privatedrop` |
| `APP_PROXY_PREFIX` | `apps` |

> **Pas besoin** de `DIRECT_URL`, ni de `PORT`, ni de `NODE_ENV` (Vercel le gère).
> Les 3 secrets aléatoires : n'importe quelle longue chaîne hex fait l'affaire
> pour le moment.

Après tout changement de variable → **Redeploy**.

---

## 3. Brancher GitHub → Vercel

1. Vercel → **Add New… → Project → Import** `nzodms/-privatedrop-shopify-app`.
2. **Branch** : `claude/m1-2-simple-embedded-app` (ou merge-la dans `main`).
3. **Framework Preset** : *Remix* (auto-détecté).
4. **Build Command** : laissée par défaut — `vercel.json` impose déjà
   `npm run vercel-build` (génère Prisma + applique les migrations + build).
5. Renseigne les variables (§2), puis **Deploy**.

Les **migrations s'appliquent automatiquement** à chaque déploiement. Rien à
lancer à la main.

---

## 4. Vérifier que le déploiement est vivant

Ouvre :
```
https://privatedrop-shopify-app.vercel.app/health
```
Réponse attendue (toujours 200, sans Shopify ni DB) :
```json
{ "ok": true, "service": "privatedrop", "time": "..." }
```
La racine `/` affiche un écran de connexion (normal : l'app est faite pour
s'ouvrir **dans** Shopify Admin).

---

## 5. Configurer Shopify Partner Dashboard

Partner Dashboard → ton app → **Configuration / App setup** :

| Champ | Valeur exacte |
|---|---|
| **App URL** | `https://privatedrop-shopify-app.vercel.app` |
| **Allowed redirection URL(s)** | `https://privatedrop-shopify-app.vercel.app/auth/callback` |
| **Embedded app** | **Activé** |
| **App Proxy → Subpath prefix** | `apps` |
| **App Proxy → Subpath** | `privatedrop` |
| **App Proxy → Proxy URL** | `https://privatedrop-shopify-app.vercel.app/proxy` |

> **Scope `read_products` uniquement** → **aucune approbation Protected Customer
> Data nécessaire** pour cette étape. (On ajoutera `read_customers` plus tard,
> quand on construira les règles VIP.)

Webhooks RGPD (Partner Dashboard → **Compliance webhooks**) :

| Topic | URL |
|---|---|
| Customer data request | `…/webhooks/customers/data_request` |
| Customer redact | `…/webhooks/customers/redact` |
| Shop redact | `…/webhooks/shop/redact` |

---

## 6. Installer l'app dans Shopify Admin

**Le plus simple** — ouvre cette URL (remplace la boutique) :
```
https://privatedrop-shopify-app.vercel.app/auth?shop=TA-BOUTIQUE.myshopify.com
```
→ Shopify affiche l'écran de permissions (`read_products`) → **Installer** →
OAuth se termine → tu es redirigé **dans Shopify Admin**, app embarquée →
**splash premium** → **dashboard** avec le bouton « Créer une vente privée ».

*Alternative* : Partner Dashboard → ton app → **Test your app → Select store**.

---

## 7. Vérifier que l'app est bien dans Shopify Admin

- Shopify Admin → **Apps** → **PrivateDrop** apparaît dans la liste.
- Clique dessus → elle s'ouvre **embedded** (dans l'admin, pas un onglet externe).
- Tu vois le **splash**, puis le **dashboard** (compteurs à 0) et le bouton
  **« Créer une vente privée »** (ouvre une modale « Bientôt disponible »).
- La carte « Connexion Shopify » affiche ton domaine de boutique.

Si tu vois tout ça → **l'app embedded est installée et fonctionne**. ✅

---

## 8. Dépannage rapide

- **500 / `FUNCTION_INVOCATION_FAILED`** → vérifie `SHOPIFY_APP_URL` (https,
  sans slash final) puis **Vercel → Deployments → Functions → Logs**.
- **Build échoue sur les migrations** → `DATABASE_URL` invalide/inaccessible, ou
  erreur « advisory lock/PgBouncer » → utilise l'URL Neon **directe** (Option A).
- **`Environment variable not found`** → une variable manque dans Vercel (§2).
- **Écran blanc / refus iframe dans l'admin** → App URL / Redirect URL pas
  alignées avec `SHOPIFY_APP_URL`, ou app non « Embedded » dans le dashboard.
- **Boucle de redirection à l'install** → Redirect URL manquante :
  `…/auth/callback`.

---

## Ce qui n'est PAS encore là (volontairement)

- Création réelle d'événement (bouton = modale « Bientôt »).
- Smart Start / scan boutique.
- Règles VIP (`read_customers`).
- Page événement côté boutique (App Proxy posé mais minimal).

On les ajoute **après** avoir validé que l'app s'installe et s'ouvre dans
Shopify Admin.

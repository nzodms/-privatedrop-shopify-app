# PrivateDrop — MVP Vente privée (thème Shopify)

Page de **vente privée / droplist premium** intégrée directement dans ton thème
Shopify actuel. **Aucune app, aucune API, aucun paiement modifié, aucun service
externe.** Tu déposes 2 fichiers, tu crées une page, tu personnalises dans le
customizer.

Deux fichiers :
- `sections/pd-private-sale.liquid` → la section (design + timer + accès code + produits)
- `templates/page.private-sale.json` → un template de page qui utilise la section

---

## ⚠️ Avant de commencer — ne rien casser

1. **Online Store → Themes** → sur ton thème actuel : **⋯ → Duplicate**.
   Travaille sur la copie (ou au moins garde la duplication comme sauvegarde).
2. Le code de la section est **entièrement isolé** : tout le CSS est scopé à la
   section, rien ne touche le reste du thème. Tu n'édites **aucun** fichier existant.

---

## Méthode 1 — Page dédiée (recommandée)

1. **Online Store → Themes → ⋯ → Edit code.**
2. Dossier **Sections → Add a new section** → nom `pd-private-sale` (type Liquid)
   → **supprime le contenu par défaut** et **colle** tout
   `sections/pd-private-sale.liquid` → **Save**.
3. Dossier **Templates → Add a new template → Page →** *(type JSON)* →
   nom `private-sale` → colle le contenu de `templates/page.private-sale.json`
   → **Save**.
   *(Le fichier créé s'appellera `templates/page.private-sale.json`.)*
4. **Admin → Online Store → Pages → Add page.**
   - Titre : `Vente privée` (l'URL sera `/pages/vente-privee`).
   - À droite, **Theme template** → choisis **`private-sale`** → **Save**.
5. **Personnalise** : Online Store → Themes → **Customize** → en haut, sélectionne
   la page **`Pages → Vente privée`** → règle textes, couleurs, dates, code, et
   ajoute tes produits (bloc **Produit**) → **Save**.

Ta page est en ligne sur `https://ta-boutique.com/pages/vente-privee`.

---

## Méthode 2 — Encore plus rapide (sans template)

Si tu veux juste tester sans créer de template :

1. Fais l'étape 2 ci-dessus (créer la section `pd-private-sale`).
2. Customizer → ouvre **n'importe quelle page** (ou la page d'accueil) →
   **Add section** → choisis **« Vente privée »** → personnalise → **Save**.

La section apparaît grâce à son *preset* intégré.

---

## Personnalisation (tout dans le customizer)

- **Accès par code** : active/désactive, change le code (ex. `VIP2026`), les textes.
- **Dates & timer** : `Ouverture` et `Fermeture` au format
  `2026-07-01T18:00:00+02:00` (date + heure + fuseau). Vide = pas de limite.
  - Avant l'ouverture → message « avant » + compte à rebours jusqu'à l'ouverture.
  - Pendant → produits visibles + compte à rebours jusqu'à la fermeture.
  - Après → message « après » (et produits masqués si tu coches l'option).
- **Hero** : sur-titre, titre, sous-titre, image.
- **Produits** : ajoute des blocs **Produit**, choisis le produit, un badge
  (ex. « Édition limitée ») et une note (ex. « 12 pièces »).
- **Design** : fond, texte, accent, couleur de carte (effet *liquid glass*),
  arrondi, police (thème ou Apple-like), marges, colonnes.
- **Boutons** : « Voir le produit » (vers la fiche) et « Ajouter au panier »
  (ajout natif Shopify via le panier, **sans toucher au checkout**).

---

## Notes importantes

- **Accès par code = MVP, pas une vraie sécurité.** La vérification se fait dans
  le navigateur ; le code est visible dans le code source de la page. C'est
  parfait pour valider le concept. La vraie protection (vérification serveur,
  clients VIP, tags) viendra avec l'app SaaS.
- **Compte à rebours côté client** : basé sur l'horloge du visiteur. Indique
  toujours le fuseau dans la date (`+02:00`) pour rester cohérent.
- **« Ajouter au panier »** utilise le panier standard Shopify (`/cart/add`).
  Le checkout, les paiements et tes réglages existants ne sont pas modifiés.
- Fonctionne sur les thèmes **Online Store 2.0** (Dawn et la majorité des thèmes
  récents). Sur un thème *vintage* (non 2.0), utilise la Méthode 1 mais crée la
  page via un template Liquid — dis-le-moi si c'est ton cas, je te le fournis.

---

## Désinstaller (revenir en arrière)

- Supprime la section dans le customizer (ou remets la page sur le template
  `page` par défaut), et/ou supprime les 2 fichiers dans **Edit code**.
- Comme aucun fichier existant n'a été modifié, ta boutique revient à l'identique.

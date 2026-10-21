# Appli Tontine — Cahier des charges V1

## Objectif

Application web de gestion de tontines pour Bobo-Dioulasso (Burkina Faso), en français.
Remplacer le carnet papier du collecteur.

## Rôles

- **Collecteur** : gère groupes, membres, paiements
- **Membre** : consulte ses cotisations (lecture seule)

## Fonctions V1

1. **Créer un groupe** : nom, montant, fréquence (jour, semaine, mois)
2. **Ajouter des membres** : nom, téléphone, quartier
3. **Mode tournée** : liste des membres par quartier, un clic pour marquer "payé"
4. **Paiement Orange Money** : validation manuelle par le collecteur
5. **Reçu via WhatsApp** : envoyé via un lien wa.me après chaque paiement
6. **Tableau de bord** : payés, retards, total collecté, tour du bénéficiaire

## Contraintes

- Application web installable (PWA)
- Fonctionne hors connexion puis synchronise
- Rapide sur Android d'entrée de gamme
- Interface très simple, en français

---

## Architecture technique

### Stack

| Couche | Choix | Pourquoi |
|--------|-------|----------|
| Frontend | HTML + CSS + JavaScript vanilla (Vite) | Léger, simple, PWA via vite-plugin-pwa |
| UI | Tailwind CSS | Responsive, pas de composants lourds |
| Stockage local | IndexedDB via Dexie.js | Offline-first, données structurées |
| Sync | Background Sync + file d'attente | Synchronise quand le réseau revient |
| Backend | FastAPI (Python) | Cohérent avec le stack existant |
| Base de données | SQLite (dev) → PostgreSQL (prod) | Léger pour commencer |
| Auth | Code PIN par collecteur | Simple, adapté au terrain |

### Modèle de données

```
Groupe       { id, nom, montant, frequence, date_creation, collecteur_id }
Membre       { id, nom, telephone, quartier, groupe_id }
Paiement     { id, membre_id, groupe_id, montant, date, mode (espèce/OM), statut, sync }
Tour         { id, groupe_id, membre_id, numero, date_prevue, date_effective }
Collecteur   { id, nom, telephone, pin }
```

### Fonctionnement offline

1. Toutes les données sont d'abord écrites dans IndexedDB
2. Les opérations en attente vont dans une file de sync
3. Quand le réseau revient → envoi groupé au backend
4. Conflit résolu par "dernière écriture gagne" (un seul collecteur par groupe)

### Écrans principaux

1. **Connexion** — saisie PIN collecteur
2. **Mes groupes** — liste des groupes du collecteur
3. **Groupe** — membres, stats, prochain bénéficiaire
4. **Tournée** — membres triés par quartier, bouton "Payé" / "Orange Money"
5. **Tableau de bord** — payés, retards, total, tour en cours
6. **Reçu** — aperçu + bouton "Envoyer via WhatsApp"

---

## Plan par étapes

| Étape | Contenu | Livrable |
|-------|---------|----------|
| 1 | Initialisation projet (Vite + PWA + Tailwind + structure) | App installable sur Android |
| 2 | Modèle de données IndexedDB (Dexie) + CRUD groupes | Créer/modifier/supprimer un groupe |
| 3 | CRUD membres + affectation à un groupe | Ajouter des membres avec quartier |
| 4 | Mode tournée — liste par quartier + marquer payé | Écran de collecte terrain |
| 5 | Gestion paiement Orange Money (validation manuelle) | Bouton OM + confirmation collecteur |
| 6 | Reçu + envoi WhatsApp (lien wa.me) | Reçu généré + partage |
| 7 | Tableau de bord (stats, retards, bénéficiaire) | Dashboard collecteur |
| 8 | Backend FastAPI + sync offline → serveur | Données persistées côté serveur |
| 9 | Auth PIN collecteur + vue membre (lecture seule) | Deux rôles fonctionnels |
| 10 | Tests + polish PWA (icône, splash, manifest) | V1 prête à déployer |

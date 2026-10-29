# Ma Tontine Faso — Cahier des charges V2

## Contexte
Application de gestion de tontines pour Bobo-Dioulasso (Burkina Faso), en français.
Objectif : remplacer le carnet papier du collecteur.
Éditeur : DOCTEUR PC. Adresse : matontine.docteurpc.org (Cloudflare).

## Utilisateurs
- Collecteur : gère ses groupes, ses membres et les paiements.
- Membre : consulte ses cotisations et reçoit ses reçus.

## Fonctions (V1 + V2)
1. Créer un groupe : nom, montant, fréquence (jour, semaine, mois), pénalité de retard, commission du collecteur.
2. Ajouter des membres : nom, téléphone, quartier, photo. Fiche membre : historique, solde, retards.
3. Mode tournée : liste des membres par quartier, un clic pour marquer "payé".
4. Paiement Orange Money ou espèce : validation manuelle par le collecteur.
5. Reçu via lien WhatsApp (wa.me) + reçu PDF avec logo après chaque paiement.
6. Tableau de bord (Accueil) : total collecté, commission, payés, retards, graphiques jour/semaine/mois.
7. Calendrier des tours : ordre des bénéficiaires, dates, levée enregistrée.
8. Rappels WhatsApp pour les retardataires (individuels ou groupés, messages pré-remplis).
9. Pénalités de retard et commission, calculées automatiquement et paramétrables par groupe.
10. Rapports exportables en PDF et Excel (par groupe, par période).
11. Sécurité : connexion par code PIN (verrouillage après 5 tentatives, 5 min) + journal de toutes les actions.

## Design
- Style moderne type application bancaire mobile, police Inter, couleurs vert/jaune/rouge du Faso.
- Navigation par barre basse 5 onglets : Accueil, Groupes, Tournée, Membres, Rapports.
- Mode sombre (bascule + préférence système), cartes arrondies, animations douces, états vides illustrés.
- Logo Ma Tontine Faso sur la connexion et en en-tête de l'accueil.

## Technologies
- PWA vanilla : HTML, CSS (Tailwind v4), JavaScript, Vite, Dexie.js (IndexedDB offline).
- Graphiques en SVG pur (pas de librairie). jsPDF + SheetJS chargés à la demande (hors précache).
- Serveur : Python FastAPI, SQLAlchemy, Alembic. Base : SQLite (dev) / PostgreSQL (prod).
- Fonctionne hors connexion pendant la tournée, synchronise paiements + journal au retour du réseau.
- Rapide sur Android d'entrée de gamme (bundle app ~47 Ko gzip, précache ~218 Ko).

## Déploiement
- Backend : Render (FastAPI + PostgreSQL). Migrations via `alembic upgrade head` au démarrage.
- Frontend : Cloudflare Pages (build `npm run build`, dossier `dist`). Variable `VITE_API_URL`.
- Repo GitHub : DOCTEUR-PC/ma-tontine-faso.

## Plus tard (hors V2)
Paiement Orange Money automatique, rappels automatiques programmés, comptes membres en lecture.

## Modèle d'affaires
Abonnement de 2 000 à 5 000 FCFA par mois et par collecteur, premier mois gratuit.

## Méthode de travail
Propose l'architecture et un plan par étapes, attends ma validation avant de coder.
Avance une fonction à la fois et explique simplement chaque étape. Fais tester chaque étape.

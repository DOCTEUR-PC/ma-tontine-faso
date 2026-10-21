# Ma Tontine Faso — Cahier des charges V1

## Contexte
Application de gestion de tontines pour Bobo-Dioulasso (Burkina Faso), en français.
Objectif : remplacer le carnet papier du collecteur.
Éditeur : DOCTEUR PC. Adresse : matontine.docteurpc.org (Cloudflare).

## Utilisateurs
- Collecteur : gère ses groupes, ses membres et les paiements.
- Membre : consulte ses cotisations et reçoit ses reçus.

## Fonctions V1
1. Créer un groupe : nom, montant, fréquence (jour, semaine, mois).
2. Ajouter des membres : nom, téléphone, quartier.
3. Mode tournée : liste des membres par quartier, un clic pour marquer "payé".
4. Paiement Orange Money : validation manuelle par le collecteur.
5. Reçu envoyé via un lien WhatsApp (wa.me) après chaque paiement.
6. Tableau de bord : payés, retards, total collecté, tour du bénéficiaire.

## Technologies
- Application web installable (PWA) : HTML, CSS, JavaScript.
- Serveur : Python FastAPI. Base de données : PostgreSQL.
- Fonctionne hors connexion pendant la tournée, puis synchronise.
- Rapide sur Android d'entrée de gamme, interface très simple.

## Plus tard (hors V1)
Paiement Orange Money automatique, rappels automatiques, comptes membres.

## Modèle d'affaires
Abonnement de 2 000 à 5 000 FCFA par mois et par collecteur, premier mois gratuit.

## Méthode de travail
Propose l'architecture et un plan par étapes, attends ma validation avant de coder.
Avance une fonction à la fois et explique simplement chaque étape.

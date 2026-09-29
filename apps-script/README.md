# Backend Google Apps Script

Ce script prépare une API gratuite pour le Google Sheet Lumo.

## Installation

1. Ouvrir le Google Sheet propriétaire.
2. Ouvrir **Extensions > Apps Script**.
3. Remplacer le contenu de l’éditeur par `Code.gs`.
4. Enregistrer, sélectionner `setup_`, puis cliquer sur **Exécuter**.
5. Autoriser l’accès au Sheet avec le compte propriétaire.
6. Déployer comme **application Web**, exécutée en tant que propriétaire.

Le script crée ou conserve quatre onglets techniques : `Lumo_Sales`, `Lumo_Accounts`, `Lumo_Products` et `Lumo_Config`. Il ne modifie pas les onglets métier existants.

## Important

Le script actuel est une étape d’initialisation et de contrôle (`health`/`setup`). Les ventes prévoient maintenant les statuts `status`, `packedAt` et `cancelledAt` pour le flux emballeur. Il ne faut pas publier l’application finale avant d’avoir confirmé les colonnes métier, notamment `Bénéfice R` et `Bénéfice N`, ainsi que la méthode d’authentification des vendeurs.

# Backend Google Apps Script

Ce script prépare une API gratuite pour le Google Sheet Lumo.

## Installation

1. Ouvrir le Google Sheet propriétaire.
2. Ouvrir **Extensions > Apps Script**.
3. Remplacer le contenu de l’éditeur par `Code.gs`.
4. Enregistrer, sélectionner `setup_`, puis cliquer sur **Exécuter**.
5. Autoriser l’accès au Sheet avec le compte propriétaire.
6. Déployer comme **application Web**, exécutée en tant que propriétaire, avec l’accès adapté aux comptes Google autorisés.
7. Copier l’URL `/exec` du déploiement dans `dist/config.js`, dans `apiUrl`.
8. Republier `dist/` sur Cloudflare Pages.

## Connexion Google

1. Créer un identifiant OAuth **Web application** dans Google Cloud Console.
2. Ajouter `https://lumo-2cu.pages.dev` comme origine JavaScript autorisée.
3. Renseigner cet ID dans `dist/config.js` sous `googleClientId`.
4. Dans `Lumo_Accounts`, renseigner l’adresse Google de chaque compte dans `email`.

Le backend vérifie le jeton auprès de Google et refuse toute écriture sans compte autorisé. Ne jamais mettre un secret client Google dans le frontend : seul l’ID client public y est autorisé.

Le script crée ou conserve quatre onglets techniques : `Lumo_Sales`, `Lumo_Accounts`, `Lumo_Products` et `Lumo_Config`. Il ne modifie pas les onglets métier existants.

## Important

Actions disponibles : `GET ?action=health`, `GET ?action=list&seller=...`, et POST `setup`, `create`, `pack`, `cancel`, `roles`, `rate`.

Les ventes prévoient les statuts `status`, `packedAt` et `cancelledAt` pour le flux emballeur. Il faut encore confirmer les colonnes métier, notamment `Bénéfice R` et `Bénéfice N`, ainsi que la méthode d’authentification des vendeurs avant un usage réel.

L’URL Apps Script est un endpoint public ou limité par Google selon le réglage choisi. Ne pas considérer le mode « accessible à tous » comme une authentification : pour la production, limiter les comptes Google autorisés ou ajouter une authentification serveur.

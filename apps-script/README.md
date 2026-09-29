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

## Connexion par identifiant

1. Exécuter `setup_` pour créer `admin` et `joys` si nécessaire.
2. Remplacer les deux valeurs `CHANGE_...` dans `setInitialPasswords_` par des mots de passe choisis localement.
3. Exécuter `setInitialPasswords_`, puis supprimer les mots de passe du code Apps Script.
4. L’admin connecté crée ensuite les autres comptes depuis le panneau **Rémunérations vendeurs**.

Le backend conserve uniquement un hash SHA-256 et des sessions temporaires. Les identifiants doivent être transmis séparément aux utilisateurs, jamais publiés dans Git ou dans le frontend.

Le script crée ou conserve quatre onglets techniques : `Lumo_Sales`, `Lumo_Accounts`, `Lumo_Products` et `Lumo_Config`. Il ne modifie pas les onglets métier existants.

## Important

Actions disponibles : `GET ?action=health`, `GET ?action=list&seller=...`, et POST `setup`, `create`, `pack`, `cancel`, `roles`, `rate`.

Les ventes prévoient les statuts `status`, `packedAt` et `cancelledAt` pour le flux emballeur. Il faut encore confirmer les colonnes métier, notamment `Bénéfice R` et `Bénéfice N`, ainsi que la méthode d’authentification des vendeurs avant un usage réel.

L’URL Apps Script est un endpoint public ou limité par Google selon le réglage choisi. Ne pas considérer le mode « accessible à tous » comme une authentification : pour la production, limiter les comptes Google autorisés ou ajouter une authentification serveur.

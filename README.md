# Lumo — ventes

## Ouvrir sur Mac
1. Décompresser cette archive.
2. Ouvrir le dossier Lumo dans VS Code.
3. Pour un aperçu immédiat, ouvrir dist/index.html dans un navigateur.
4. Pour développer, utiliser un serveur local : avec Python 3 installé, exécuter `python3 -m http.server 8000 --directory dist` dans ce dossier, puis ouvrir http://localhost:8000. Arrêter avec Ctrl+C.

Aucune compilation ni dépendance npm n’est nécessaire pour le frontend actuel.

## Fichiers
- dist/index.html : interface et logique initiale.
- dist/upgrade.js : thème fonctionnel, pocket, rémunérations, calculs et sauvegarde locale.
- dist/config.js : configuration de l’API distante, à compléter après le déploiement du backend.
- apps-script/Code.gs : amorce du backend Google Apps Script relié au Sheet.
- apps-script/README.md : procédure d’installation et limites actuelles du backend.
- .github/workflows/deploy-pages.yml : publication automatique sur GitHub Pages à chaque push sur `main`.
- .openai/hosting.json : identité du Site existant, à conserver pour une republication via Sites.
- CONTEXTE_CODEX.md : état du projet et points à traiter.

Les changements locaux ne modifient pas automatiquement le site en ligne. Un déploiement distinct et authentifié est nécessaire.

## Architecture gratuite recommandée

- GitHub Pages héberge `dist/` gratuitement.
- Google Apps Script sert de passerelle vers le Google Sheet sans exposer les identifiants Google dans le navigateur.
- Le compte Google propriétaire doit exécuter et autoriser Apps Script.

Le frontend est actuellement publié sur [lumo-2cu.pages.dev](https://lumo-2cu.pages.dev) via Cloudflare Pages.

Cette base ne doit pas encore être annoncée comme une version connectée : les colonnes du Sheet, les formules `Bénéfice R` / `Bénéfice N` et la vraie authentification des vendeurs doivent être confirmées avant de brancher les écritures et les lectures métier.

## Finalisation du déploiement

1. Créer un dépôt GitHub privé et y pousser ce dossier.
2. Activer **Settings > Pages > GitHub Actions**.
3. Ouvrir le Sheet, installer `apps-script/Code.gs`, exécuter `setup_`, puis déployer l’application Web.
4. Renseigner l’URL de l’application Web dans `dist/config.js`.
5. Confirmer les onglets et colonnes métier avec le propriétaire du Sheet.
6. Tester les ventes, stocks, rémunérations et calculs avant de publier aux vendeurs.

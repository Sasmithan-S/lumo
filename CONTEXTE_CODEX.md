# Reprise du projet Lumo

Site existant : https://lumo-ventes.sassursuj.chatgpt.site
Cette archive contient les deux fichiers source de la version sombre publiée, sans historique Git ni identifiants d'accès.

## État actuel
Prototype HTML/CSS/JS statique, pas de framework ni de backend.
Le script upgrade.js étend et remplace une partie de la logique inline de index.html.
L'interface simule les comptes Admin Lumo, sujif et joys. Le sélecteur de compte n'est PAS une authentification.
Les données sont sauvegardées dans localStorage sous lumo-demo-v2 et ne sont pas partagées entre navigateurs ou appareils.
Les photos produits restent à fournir. Les initiales sont provisoires.
Google Sheets, connexion Google et paiement réel ne sont pas implémentés.

## Rémunération demandée
Pocket initial = 0 centime. Tarif par défaut = 100 centimes par flacon.
Chaque vente conserve payRateCents et payCents, calculés à l'enregistrement.
Une modification du tarif admin affecte uniquement les prochaines ventes.
Les ventes d'exemple initiales ont payCents = 0 pour garder les nouveaux pockets à zéro.
Le pocket correspond à la somme des gains des ventes conservées, pas à un solde bancaire.
Supprimer une vente restaure le stock et retire son gain.
Une modification du prix seul ne modifie pas le gain par flacon.
Le CA et le bénéfice estimé sont recalculés depuis les ventes. Frais TikTok = 0 provisoirement, à configurer. Aucune fiscalité incluse.

## Exigences finales
Admins et vendeurs peuvent enregistrer des ventes. Identité vendeur issue du compte authentifié.
Vente : date, pseudo TikTok, parfums/quantités, montant, boutique, URL du bordereau facultative.
Admin : historique, filtres, vérification, correction/suppression, stocks, comparaison vendeurs, tarifs.
6 parfums : Velvet Kiss, Sublime Satin, Cotton Bloom, Cashmere Whisper, Eternal Silk, Sweet Tweed.
Boutiques : Lumo Trends, Lumo Shop.
Google Sheet cible fourni par le propriétaire : https://docs.google.com/spreadsheets/d/1xJePHU-coBR_L-p0PwrjS-PbGgAXfo4lrlHzayZSS_s/edit
La structure et les règles Bénéfice R / Bénéfice N restent à obtenir avant de connecter les écritures.

## Suite
Conserver le design sombre. Examiner le code avant modification.
Mettre en place une vraie authentification et des contrôles côté serveur avant un usage réel.
Choisir le backend et l'accès autorisé au Sheet avec le propriétaire ; Apps Script a été envisagé mais pas implémenté.
La version est une démo : ne pas annoncer une synchronisation ni une sécurité de production existantes.
Le Site reste privé. Ne pas changer son audience pour déployer.

# Dettes : quiz-live-angular

Une entrée = une ligne commençant par `- **` (comptée par `scripts/session-open.ps1`).
Sévérité : 🔴 bloque ou trompe, 🟠 à traiter, sans urgence. Dernière mise à jour : 2026-11-05.

## Mesurées pendant `feat(authentication): open the session before the first navigation` (#14)

- **`ErrorPage.goHome()` mène à une page vide** 🟠 : `/` n'a pas de route. Observé le 2026-11-01 (Olivier, puis navigateur sans interface) : la navigation réussit, l'écran reste noir, aucune erreur en console. L'hypothèse d'un rejet « Cannot match any routes » est infirmée (une URL vide n'exige aucune route). `/` redirige maintenant vers `/dashboard` (`feat(routing): open the dashboard when the application starts at the root`), mais la page d'erreur n'apparaît aujourd'hui que si la session n'est pas prête : `goHome()` efface l'erreur, `/` mène à `/dashboard`, le guard renvoie vers `/error`, qui n'affiche rien sans erreur. Observé le 2026-11-05 en navigateur sans interface avec un faux hub (401, puis hub éteint), puis confirmé sur le hub réel (smoke test d'Olivier, Edge sans interface, hub éteint) : `/error`, page vide. Le bouton reste un cul-de-sac.
- **Texte « Nous tentons une reconnexion automatique »** 🟠 : affiché sur la page « connexion perdue », alors que le CDC interdit tout retry de l'initialisation. Faux au démarrage ; vrai seulement pour le WebSocket (US-ANG-010).
- **Variante `invalid-credentials` sans bloc CSS** 🟠 : `error-page.scss` définit `--variant-color` pour 4 variantes (`not-found`, `connection-lost`, `server-error`, `game-corrupted`), pas pour `invalid-credentials` (ajoutée avec CA-25). Sur cette page, « invalides » est invisible (dégradé sur une variable non définie) et la couleur de l'eyebrow aussi. Capture d'Olivier du 2026-11-01, reproduit en navigateur sans interface sur `main`. Rendu des 4 autres variantes non regardé.
- **Délai de 10 s non mesuré hors poste d'Olivier** 🟠 : mesuré une fois (10,07 s, Edge, proxy de dev). Choix, pas mesure de référence ; non confirmé sur un déploiement réel.
- **Un vrai 500 du hub s'affiche « connexion perdue »** 🟠 : le proxy de dev répond 500 quand le hub est éteint, les deux cas sont indiscernables (voir décision #2).
- **Branches distantes résiduelles** 🟠 : `chore/node-version`, `ci/prove-red`, `ci/workflows`, `ci/prove-lint-red`, plus les branches `session/*` déjà fusionnées. Rien supprimé par Claude ; suppression à faire par Olivier.
- **Protections de branche** 🟠 : posées par Olivier le 2026-11-01 sur `main` des trois dépôts actifs, **non relues** d'ici (réglage GitHub). À relire avant de les compter comme acquises.

## Mesurées pendant `docs(workflow): describe the CA matrix by Angular layers in the handoff template`

- **« HEAD d'arrivée » du handoff = HEAD de la branche, pas le hash du squash** 🟠 : `scripts/session-close.ps1` écrit `git rev-parse HEAD` avant la fusion ; le commit qui arrive sur `main` a un autre hash (ex. #15 : `b0da12b` sur la branche, `4bd5eac` sur `main`). Correction du script : session dédiée (choix d'Olivier).
- **Gabarit de handoff divergent des autres dépôts** 🟠 : `docs/sessions/TEMPLATE.md` porte ici une matrice par couches Angular ; le hub et le firmware gardent l'ancienne. Propagation décidée, à faire dans une session de chaque dépôt (voir décision #7).

## Mesurées pendant `chore(authentication): expose the session token and its readiness`

- **`AuthService` ne peut pas servir de `TokenProvider` au WebSocket** 🟠 : le port (`websocket.service.ts`) exige `token()` et `refresh()` ; `AuthService` expose maintenant `getToken()` et `isReady()`, sans `refresh()` (CA-11, CA-12). À réconcilier quand `WebSocketService` sera injecté : adapter le port (consommateur) plutôt qu'ouvrir de nouveau le signal.
- **`isReady()` = présence du token** 🟠 : `true` dès qu'un token est stocké, `false` avant et après un échec. Au refresh (CA-12 à CA-16), un token expiré resterait « prêt » ; à retravailler avec le CA-5 (`authGuard`).

## Mesurées pendant `chore(authentication): attach the session token to every request`

- **Le JWT partirait vers toute origine** 🟠 : `authInterceptor` est branché globalement (CA-4 : « toutes les requêtes `HttpClient` ») sans filtre d'origine. Aucune requête vers une origine tierce n'existe aujourd'hui ; à restreindre (origine du hub) avant d'en ajouter une.
- **Branchement non observable en prod** 🟠 : l'application ne fait aucune requête `HttpClient` après le POST du token (le premier `GET` est au CA-17). Le branchement n'est prouvé que par `app.config.spec.ts`, jamais au navigateur ; à observer avec la première requête authentifiée.

## Mesurées pendant `chore(authentication): block protected routes until the session is ready`

- **`authGuard` redirige vers une page vide si aucune erreur n'a été signalée** 🟠 : le guard renvoie `/error` quand `isReady()` est faux, sans appeler `ErrorService`. Or `error-page.html` n'affiche rien tant que `currentError` est `null` (`@if (error(); as err)`). Sans effet tant que `/dashboard` n'était joignable que par son URL (l'échec d'`initialize()` signale toujours une erreur avant). `/dashboard` est la première route protégée. Le cas est devenu atteignable avec `feat(routing): open the dashboard when the application starts at the root` : après un échec du démarrage, « Retour à l'accueil » efface l'erreur puis le guard renvoie vers `/error` (voir `ErrorPage.goHome()`). Observé le 2026-11-05 en navigateur sans interface (faux hub), confirmé sur le hub réel le même jour (smoke test d'Olivier). La décision attend d'être prise : le guard signale lui-même une variante, ou la page affiche un défaut.
- **Le guard hérite de la limite d'`isReady()`** 🟠 : présence du token seulement (voir l'entrée de `chore(authentication): expose the session token and its readiness`). Au refresh (CA-12 à CA-16), un token expiré passerait le guard.

## Mesurées pendant `feat(dashboard): protect the dashboard page until the session is ready`

- **Identifiants de développement désalignés du hub local** 🟠 : `environment.development.ts` versionne `dev-password`, or l'admin de la base du hub local a un autre mot de passe (le `.env` du hub en portait un autre). Le hub répondait 401 et l'application finissait sur la page « identifiants invalides ». Cause : `seed-users.ts` n'insère les utilisateurs que si la table est vide ; relancer `npm run seed` après avoir changé `ADMIN_PASSWORD` ne change rien et ne signale rien, et le `.env` n'est pas relu à la connexion (le hub compare au hash stocké). Contourné au smoke test par une modification locale non commitée de `environment.development.ts`. Le validateur du hub accepte `dev-password` (12 à 72 caractères ASCII imprimables, sans autre règle). Piste : session dédiée pour fixer une convention (valeur commune ou réinitialisation documentée), et signaler dans le `DEBTS.md` du hub que le seed ignore silencieusement un mot de passe différent. Complète l'entrée « Entre dépôts ».
- **Page `/dashboard` minimale, hors shell** 🟠 : un titre seulement, sans sidebar ni topbar ; le fond ambiant (deux dégradés du design system) est recopié dans `dashboard.scss`, comme dans `error-page.scss`. À factoriser avec le shell (session `feat(layout)` à venir).
- **Style du titre sans test** 🟠 : SCSS sans rouge honnête (taille, graisse, interlettrage du design system), vérifié au smoke test seulement.

## Mesurées pendant `feat(routing): open the dashboard when the application starts at the root`

- **`pathMatch: 'full'` de la redirection racine non verrouillé par un test** 🟠 : muter en `'prefix'` laisse les 165 tests verts. Mutant équivalent avec la table de routes actuelle (quand la redirection ne mène nulle part, Angular retombe sur la route suivante). Deviendra observable avec une route enfant sous `/dashboard` (session `feat(layout)`) : à tester à ce moment-là.

## Reportées du récap du 2026-10-31 (non revérifiées)

Hypothèses du récap `RECAP-ANGULAR.md`, importées telles quelles. Rien ici n'a été remesuré le 2026-11-01, sauf mention contraire.

- **`tsc` racine sans effet** 🔴 : `tsconfig.json` est un fichier « solution » (`files: []`), `tsc --noEmit` ne compile rien. Garde-fou : `ngc -p tsconfig.app.json` et `-p tsconfig.spec.json`.
- **`npm audit` : 67 vulnérabilités** 🟠 (2 low, 40 moderate, 22 high, 3 critical), identiques runner et poste ; 16 moderate attribués aux dépendances de lint. Non triées.
- **Configuration lint minimale** 🟠 : `recommended` seulement, aucun formateur vérifié, couverture HTML et templates inline démontrée en session 4 (M1 à M3).
- **Durée de `npm ci`** 🟠 : 49 à 54 s sur le runner (≈ 19 s après la PR #5), 2 min sur le poste d'Olivier, cache npm désactivé, non tranché.
- **Actions GitHub épinglées par étiquette `@v7`** 🟠 : SHA relevés dans les journaux (`checkout` `3d3c42e5aac5ba805825da76410c181273ba90b1`, `setup-node` `949feb2413d6458794dcd2491c4babbbce0c15c1`), aucun Dependabot.
- **Image `ubuntu-24.04` épinglée à la main** 🟠.
- **`install-scripts` non tranché** 🟠 : 4 paquets (`@parcel/watcher`, `esbuild`, `lmdb`, `msgpackr-extract`).
- **Quatre versions de npm** 🟠 : `packageManager` 11.13.0, runner 11.20.0, poste 11.21.1, bac à sable 10.9.9.
- **Journaux Actions illisibles depuis le bac à sable** 🟠 : lecture par collage de l'utilisateur.
- **Anomalie non expliquée** 🟠 : run `push` en échec sans job sur le stub de la PR #5.
- **Aucune garde permanente sur `fileReplacements`** 🟠 (`environment.development.ts`).
- **`environment.ts` de production = `set-by-ci`** 🟠 : sans injection par la CI, tout démarrage échoue en 401.
- **Écrasement silencieux possible du `environment.ts` local** 🟠.
- **Build de production dépendant du réseau (fonts), non couvert par la CI** 🟠.
- **`engines` racine non discriminant** 🟠.
- **Forme d'`environment` ≠ spec** 🟠 : `wsUrl` absent (CA-6).
- **`WebSocketService` non câblé** 🟠 : jamais injecté hors specs.
- **`AuthService` incomplet vs spec** 🟠 : `getToken()`, `isReady`, `refresh()` absents (CA-2, CA-11).
- **Code de fermeture `4004` hors US** 🟠 : `goToError` testé mais non spécifié dans US-ANG-001.
- **Fixture d'auth en camelCase** 🟠 : format du hub (`expires_in`, `token_type`) à confronter à la spec.
- **Indentation des `it.each` de `confirm-dialog.spec.ts`** 🟠.
- **`data-testid="close"` de `confirm-dialog` conservé** 🟠 : voulu d'après le récap, à confirmer.
- **PR #1 fermée sans fusion** 🟠 : contenu jamais relu.
- **README Angular CLI** 🟠.
- **Poste d'Olivier parfois en retard sur `main`** 🟠 : discipline `git pull --ff-only` après chaque fusion.
- **Entre dépôts** 🟠 : `ADMIN_PASSWORD=dev-password` du `.env` local du hub ; preuve du hub faite sous Node 22 alors qu'il exige `>=26 <27`. Les dettes du hub vivent dans le `DEBTS.md` du hub.

## Levées

- ~~Refus du guard non observé au navigateur~~ : observé sur le hub réel le 2026-11-05 (smoke test d'Olivier) : après l'échec du démarrage, « Retour à l'accueil » efface l'erreur, `/` mène à `/dashboard`, le guard renvoie vers `/error` (page vide, voir `ErrorPage.goHome()`).
- ~~`/dashboard` n'est joignable que par son URL~~ : la racine `/` y redirige (`feat(routing): open the dashboard when the application starts at the root`), observé sur le hub réel le 2026-11-05 (smoke test d'Olivier : `/` -> `/dashboard`, titre rendu, POST du token en 200).
- ~~`authGuard` sans consommateur, non observable~~ : branché sur `/dashboard` (`feat(dashboard): protect the dashboard page until the session is ready`), chemin « session prête » observé au navigateur le 2026-11-04.
- ~~Lint absent de `ci.yml`~~ : étape en place depuis #10, démontrée rouge et verte.
- ~~Lint jamais exécuté sous Node 26~~ : runner Node 26.13.0 et poste (Node 26.13.0).
- ~~`ng serve` jamais exécuté dans un navigateur~~ : démarrage, 401, hub absent et hub muet observés le 2026-11-01 (smoke test de #14).
- ~~Hypothèse du récap « `provideHttpClient` absent, échec d'injection probable »~~ : infirmée, `HttpClient` est `providedIn: 'root'` en Angular 21.2 (décision #3).

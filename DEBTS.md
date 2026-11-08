# Dettes : quiz-live-angular

Une entrée = une ligne commençant par `- **` (comptée par `scripts/session-open.ps1`).
Sévérité : 🔴 bloque ou trompe, 🟠 à traiter, sans urgence. Dernière mise à jour : 2026-11-08.

## Mesurées pendant `feat(authentication): open the session before the first navigation` (#14)

- **`ErrorPage.goHome()` reboucle sur `/error` quand la session n'est pas prête** 🟠 : la page d'erreur n'apparaît aujourd'hui que si la session n'est pas prête ; `/` mène à `/dashboard`, le guard renvoie vers `/error`. Depuis `fix(error): explain why the dashboard is unavailable when the session is not ready`, l'erreur n'est plus effacée dans ce cas : la page reste lisible (plus de page vide, historique : noir observé le 2026-11-01 puis le 2026-11-05 sur le hub réel). Le bouton ne mène toujours nulle part : un vrai « réessayer » (nouvelle initialisation) reste à concevoir.
- **Délai de 10 s non mesuré hors poste d'Olivier** 🟠 : mesuré une fois (10,07 s, Edge, proxy de dev). Choix, pas mesure de référence ; non confirmé sur un déploiement réel.
- **Un vrai 500 du hub s'affiche « connexion perdue »** 🟠 : le proxy de dev répond 500 quand le hub est éteint, les deux cas sont indiscernables (voir décision #2).
- **Branches distantes résiduelles** 🟠 : `chore/node-version`, `ci/prove-red`, `ci/workflows`, `ci/prove-lint-red`, plus les branches `session/*` déjà fusionnées. Rien supprimé par Claude ; suppression à faire par Olivier.
- **Protections de branche** 🟠 : posées par Olivier le 2026-11-01 sur `main` des trois dépôts actifs, **non relues** d'ici (réglage GitHub). À relire avant de les compter comme acquises.

## Mesurées pendant `docs(workflow): describe the CA matrix by Angular layers in the handoff template`

- **« HEAD d'arrivée » du handoff = HEAD de la branche, pas le hash du squash** 🟠 : `scripts/session-close.ps1` écrit `git rev-parse HEAD` avant la fusion ; le commit qui arrive sur `main` a un autre hash (ex. #15 : `b0da12b` sur la branche, `4bd5eac` sur `main`). Correction du script : session dédiée (choix d'Olivier).
- **Gabarit de handoff divergent des autres dépôts** 🟠 : `docs/sessions/TEMPLATE.md` porte ici une matrice par couches Angular ; le hub et le firmware gardent l'ancienne. Propagation décidée, à faire dans une session de chaque dépôt (voir décision #7).

## Mesurées pendant `chore(authentication): expose the session token and its readiness`

- **`isReady()` = présence du token** 🟠 : `true` dès qu'un token est stocké, `false` avant et après un échec. Au refresh (CA-12 à CA-16), un token expiré resterait « prêt » ; à retravailler avec le CA-5 (`authGuard`). `refresh()` (ajouté) n'y change rien : un refresh en échec laisse le token courant et `isReady()` intacts (décision #17).

## Mesurées pendant `chore(authentication): attach the session token to every request`

- **Le JWT partirait vers toute origine** 🟠 : `authInterceptor` est branché globalement (CA-4 : « toutes les requêtes `HttpClient` ») sans filtre d'origine. Aucune requête vers une origine tierce n'existe aujourd'hui ; à restreindre (origine du hub) avant d'en ajouter une.
- **Branchement non observable en prod** 🟠 : l'application ne fait aucune requête `HttpClient` après le POST du token (le premier `GET` est au CA-17). Le branchement n'est prouvé que par `app.config.spec.ts`, jamais au navigateur ; à observer avec la première requête authentifiée.

## Mesurées pendant `chore(authentication): block protected routes until the session is ready`

- **`authGuard` redirige vers une page vide si aucune erreur n'a été signalée** 🟠 : le guard renvoie `/error` quand `isReady()` est faux, sans appeler `ErrorService`, et `error-page.html` n'affiche rien tant que `currentError` est `null` (`@if (error(); as err)`). Latent depuis `fix(error): explain why the dashboard is unavailable when the session is not ready` (décision #13) : « session non prête » implique « erreur posée » parce que `initialize()` signale toujours son échec et que `goHome()` ne l'efface plus dans ce cas. Rien ne le garantit côté guard : toute future lecture de `isReady()` à faux sans erreur (refresh, CA-12 à CA-16) ou tout nouvel appel à `clearError()` rouvre la page vide.
- **Le guard hérite de la limite d'`isReady()`** 🟠 : présence du token seulement (voir l'entrée de `chore(authentication): expose the session token and its readiness`). Au refresh (CA-12 à CA-16), un token expiré passerait le guard.

## Mesurées pendant `feat(dashboard): protect the dashboard page until the session is ready`

- **Identifiants de développement désalignés du hub local** 🟠 : `environment.development.ts` versionne `dev-password`, or l'admin de la base du hub local a un autre mot de passe (le `.env` du hub en portait un autre). Le hub répondait 401 et l'application finissait sur la page « identifiants invalides ». Cause : `seed-users.ts` n'insère les utilisateurs que si la table est vide ; relancer `npm run seed` après avoir changé `ADMIN_PASSWORD` ne change rien et ne signale rien, et le `.env` n'est pas relu à la connexion (le hub compare au hash stocké). Contourné au smoke test par une modification locale non commitée de `environment.development.ts`. Le validateur du hub accepte `dev-password` (12 à 72 caractères ASCII imprimables, sans autre règle). Piste : session dédiée pour fixer une convention (valeur commune ou réinitialisation documentée), et signaler dans le `DEBTS.md` du hub que le seed ignore silencieusement un mot de passe différent. Complète l'entrée « Entre dépôts ».
- **Page `/dashboard` minimale, hors shell** 🟠 : un titre seulement, sans sidebar ni topbar ; le fond ambiant (deux dégradés du design system) est recopié dans `dashboard.scss`, comme dans `error-page.scss`. À factoriser avec le shell (session `feat(layout)` à venir).
- **Style du titre sans test** 🟠 : SCSS sans rouge honnête (taille, graisse, interlettrage du design system), vérifié au smoke test seulement.

## Mesurées pendant `feat(routing): open the dashboard when the application starts at the root`

- **`pathMatch: 'full'` de la redirection racine non verrouillé par un test** 🟠 : muter en `'prefix'` laisse les 165 tests verts. Mutant équivalent avec la table de routes actuelle (quand la redirection ne mène nulle part, Angular retombe sur la route suivante). Deviendra observable avec une route enfant sous `/dashboard` (session `feat(layout)`) : à tester à ce moment-là.

## Mesurées pendant `fix(error): explain why the dashboard is unavailable when the session is not ready`

- **`ErrorPage` (`shared/ui`) dépend d'`AuthService` (`core`)** 🟠 : `goHome()` lit `isReady()` pour décider d'effacer l'erreur. Un composant partagé qui connaît l'authentification est un couplage de plus ; piste : déplacer la règle dans `ErrorService` ou dans un service d'orchestration quand le shell arrivera (`feat(layout)`).
- **Chemin « session prête » de `goHome()` non observable au navigateur** 🟠 : aucune erreur n'existe aujourd'hui avec une session prête (`not-found`, `server-error`, `game-corrupted` n'ont pas d'émetteur). Couvert par `error-page.spec.ts` seulement.

## Mesurées pendant `fix(error): remove the automatic reconnection promise at startup`

- **Le test d'absence ne cible que le mot « reconnexion »** 🟠 : `does not promise an automatic reconnection when the connection is lost` échoue sur « reconnexion » (casse ignorée, mutation « Reconnexion en cours » tuée), mais une autre promesse (« nouvelle tentative », « réessai automatique ») passerait. Acceptable tant que le message tient en deux phrases.
- **Copies obsolètes du texte hors code** 🟠 : `docs/quiz-buzzer-03-guide-implementation-angular.md` (l. 445) et la maquette `docs/quiz-buzzer-error-page.html` (l. 813) portent encore la promesse. Non modifiées (le guide et la maquette ne sont pas le CDC, aucun CA ne cite le texte).
- **La variante `connection-lost` ne dit plus rien d'une reprise** 🟠 : vrai au démarrage, insuffisant pour le WebSocket (US-ANG-010), où une reconnexion existe et doit s'afficher. À traiter avec l'émetteur de cette erreur : sans doute un message distinct, pas un retour de la phrase retirée.

## Mesurées pendant `fix(error): make the invalid credentials title readable`

- **Le test vérifie la présence d'une couleur de variante, pas son effet** 🟠 : `gives the $variant screen a variant color…` exige `--variant-color` non vide (jsdom, styles compilés du composant). Il ne détecte ni une mauvaise valeur, ni un dégradé de titre invalide, ni la lisibilité réelle. Vérifié au navigateur seulement pour `invalid-credentials` (smoke test d'Olivier) ; le rendu des quatre autres variantes reste non regardé.
- **Maquette et design system muets sur la variante `invalid-credentials`** 🟠 : `docs/quiz-buzzer-error-page.html` (4 variantes) et la section 14 de `docs/quiz-buzzer-01-design-system.md` ne la décrivent pas ; le CDC (CA-25) ne fixe que le message. Couleur choisie par défaut (décision #15). À compléter dans un commit `docs` dédié.

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
- **Code de fermeture `4004` hors US** 🟠 : `goToError` testé mais non spécifié dans US-ANG-001.
- **Fixture d'auth en camelCase** 🟠 : format du hub (`expires_in`, `token_type`) à confronter à la spec.
- **Indentation des `it.each` de `confirm-dialog.spec.ts`** 🟠.
- **`data-testid="close"` de `confirm-dialog` conservé** 🟠 : voulu d'après le récap, à confirmer.
- **PR #1 fermée sans fusion** 🟠 : contenu jamais relu.
- **README Angular CLI** 🟠.
- **Poste d'Olivier parfois en retard sur `main`** 🟠 : discipline `git pull --ff-only` après chaque fusion.
- **Entre dépôts** 🟠 : `ADMIN_PASSWORD=dev-password` du `.env` local du hub ; preuve du hub faite sous Node 22 alors qu'il exige `>=26 <27`. Les dettes du hub vivent dans le `DEBTS.md` du hub.

## Mesurées pendant `chore(authentication): refresh the session token on demand`

- **Appels concurrents à `refresh()` non dédoublonnés** 🟠 : chaque appel émet son propre `POST /api/v1/token`. Un `4002` et un `token_expiring_soon` proches (CA-11, CA-12) en lanceraient deux, le dernier arrivé gagnant. Tranché au CA-12 : on laisse faire (décision #22) ; le cas est désormais atteignable en production et reste ouvert tant que la requête n'est pas partagée.
- **Un `refresh()` en échec ne touche ni au token ni à `isReady()`** 🟠 : choix d'Olivier (décision #17). L'appelant reçoit l'erreur ; rien n'invalide un token que le serveur a déjà refusé (voir l'entrée sur `isReady()`). À reprendre avec CA-15.
- **Le spec d'`AuthService` importe le port du WebSocket** 🟠 : la preuve de compatibilité (`const provider: TokenProvider = service`) place un import `core/authentication` → `core/websocket` dans un spec. Sans effet en prod ; si le port migre ou est scindé, la preuve suit.

## Mesurées pendant `feat(websocket): connect to the hub once the session is ready`

- **`ErrorNavigator` factice** 🟠 : `app.config.ts` passe `{ goToError: () => { } }`. Un code `4004` (session remplacée) arrête la reconnexion sans rien afficher. À remplacer par la session B (variante d'erreur propre au WebSocket, voir la note de la décision #14 sur le texte « connexion perdue »).
- **Une exception synchrone de `new WebSocket(...)` empêche le démarrage** 🟠 : `connect()` est appelé dans l'initialiseur sans `try/catch`. Une `wsUrl` invalide (valeur de production mal injectée, par exemple) ferait échouer le démarrage de l'application au lieu de la seule socket.
- **Les codes de fermeture `4002` et `4004` n'ont jamais été observés sur un vrai hub** 🟡 : le smoke test du 2026-11-07 a couvert l'ouverture, la coupure et la reprise, pas l'expiration du token (`JWT_EXPIRATION_TIME` court côté hub) ni le remplacement de session (deux connexions du même compte).
- **Trois doublures de socket dans les specs** 🟡 : `FakeSocket` (`websocket.service.spec.ts`), `FakeSocket` (`app.config.websocket.spec.ts`) et `InertSocket` (`app.config.spec.ts`). À mutualiser dans une aide de test partagée si une quatrième apparaît.
- **Le build de production n'a pas été exécuté** 🟡 : le téléchargement des polices Google est refusé (403) depuis l'environnement de session ; la valeur de production de `wsUrl` n'est vérifiée que par `tsc`.

## Levées

- ~~Un `refresh()` rejeté dans `onclose` (code `4002`) n'est pas capturé~~ : capturé, la reconnexion repart quand même (`fix(websocket): keep the connection attempts going when the token refresh fails`, décision #21). Verrouillé par un test sous temps simulé ; comportement non observé sur un vrai hub (voir l'entrée ci-dessous).
- ~~Le service n'a jamais tourné sur un vrai `WebSocket`~~ : observé le 2026-11-07 au navigateur sur le hub réel (smoke test d'Olivier de `feat(websocket): connect to the hub once the session is ready`) : `101` sur `ws://localhost:3000/ws`, trame `auth` puis `auth_success`, reprise après coupure (5 tentatives en échec puis connexion, token réutilisé sans nouveau `POST /api/v1/token`). Les codes `4002` et `4004` n'ont pas été provoqués (voir l'entrée dédiée).
- ~~Forme d'`environment` ≠ spec (`wsUrl` absent, CA-6)~~ : `wsUrl` ajouté aux deux environnements (`feat(websocket): connect to the hub once the session is ready`, décision #19).
- ~~`WebSocketService` non câblé~~ : fourni par `app.config.ts` et connecté une fois la session prête (décision #19) ; le chemin « vraie socket » a été observé au smoke test du 2026-11-07 (voir la levée suivante).
- ~~`AuthService` incomplet vs spec (`getToken()`, `isReady`, `refresh()` absents)~~ : `getToken()` et `isReady()` existaient déjà (l'entrée était périmée) ; `refresh()` ajouté (`chore(authentication): refresh the session token on demand`, décision #17).
- ~~`AuthService` n'a pas `refresh()`, que le port `TokenProvider` exige~~ : `refresh()` ajouté, compatibilité prouvée au compilateur (`const provider: TokenProvider = service` dans `auth.service.spec.ts`).
- ~~Le port `TokenProvider` exigeait un signal qu'`AuthService` n'expose plus~~ : le port lit `getToken()` (`chore(websocket): align the token port with the authentication service`, décision #16) ; reste `refresh()` (voir ci-dessus).
- ~~Refus du guard non observé au navigateur~~ : observé sur le hub réel le 2026-11-05 (smoke test d'Olivier) : après l'échec du démarrage, « Retour à l'accueil » efface l'erreur, `/` mène à `/dashboard`, le guard renvoie vers `/error` (page vide, voir `ErrorPage.goHome()`).
- ~~`/dashboard` n'est joignable que par son URL~~ : la racine `/` y redirige (`feat(routing): open the dashboard when the application starts at the root`), observé sur le hub réel le 2026-11-05 (smoke test d'Olivier : `/` -> `/dashboard`, titre rendu, POST du token en 200).
- ~~`authGuard` sans consommateur, non observable~~ : branché sur `/dashboard` (`feat(dashboard): protect the dashboard page until the session is ready`), chemin « session prête » observé au navigateur le 2026-11-04.
- ~~Lint absent de `ci.yml`~~ : étape en place depuis #10, démontrée rouge et verte.
- ~~Lint jamais exécuté sous Node 26~~ : runner Node 26.13.0 et poste (Node 26.13.0).
- ~~`ng serve` jamais exécuté dans un navigateur~~ : démarrage, 401, hub absent et hub muet observés le 2026-11-01 (smoke test de #14).
- ~~Hypothèse du récap « `provideHttpClient` absent, échec d'injection probable »~~ : infirmée, `HttpClient` est `providedIn: 'root'` en Angular 21.2 (décision #3).

## Mesurées pendant `fix(websocket): restart the reconnection delay once the hub accepts the session`

- **Le service analyse chaque message entrant pour y lire son type** 🟡 : la lecture du type est mutualisée (`messageType`), mais `auth_success` et `token_expiring_soon` sont testés l'un après l'autre : deux `JSON.parse` par message, en plus de l'émission brute sur `messages$`. Les futurs consommateurs (CA-14) en ajouteraient un chacun. À résoudre en lisant le type une seule fois par message, quand `messages$` sera filtré et typé.
- **La remise à zéro du délai n'a jamais été observée sur un vrai hub** 🟡 : verrouillée par trois tests sous temps simulé (remise à zéro sur `auth_success`, pas sur un autre message, pas sur un message non JSON), pas au navigateur. Observable avec deux coupures successives après une reprise réussie.

## Mesurées pendant `fix(websocket): keep the connection attempts going when the token refresh fails`

- **Un refresh en échec relance la connexion avec le token expiré** 🟠 : le hub refusera de nouveau (`4002`) et la boucle reconnexion / refus tourne indéfiniment au rythme du backoff (plafonné à 30 s). Les 3 tentatives à 5 s puis la fermeture de CA-15 n'existent pas. À reprendre avec CA-15.
- **L'échec du refresh est avalé sans trace** 🟡 : le `catch` est vide, rien n'est journalisé ni signalé à l'utilisateur. À reconsidérer avec CA-15.
- **La reprise après un `refresh()` rejeté n'a jamais été observée sur un vrai hub** 🟡 : test unitaire seulement (choix d'Olivier). Observable avec un `JWT_EXPIRATION_TIME` court côté hub et le hub joignable mais `POST /api/v1/token` en échec.

## Mesurées pendant `feat(websocket): refresh the token when the hub announces its expiry`

- **L'échec du refresh proactif est avalé sans trace** 🟡 : le `catch` est vide, aucune relance (CA-15 prévoit 3 tentatives à 5 s) ni journal. À reprendre avec CA-15.
- **`token_expiring_soon` n'a jamais été reçu d'un vrai hub** 🟠 : le hub ne l'émet pas (US-021 non implémentée, voir « Mesurées pendant `chore(scripts): add a fake hub…` »). Le seul message reçu en vrai est celui d'un faux hub.
- **Les doublures `vi.fn()` masquent les rejets non capturés** 🟡 : `vi.fn()` attache un gestionnaire aux promesses qu'il retourne ; un test sur « pas de rejet non capturé » doit employer une fonction nue (c'est le cas du test « should stay silent… »). Le `refresh` du `beforeEach` est resté un `vi.fn` : un futur test de ce type doit le remplacer, pas s'y fier.

## Mesurées pendant `feat(websocket): send the refreshed token to the hub`

- **Un `send` en échec est avalé comme un refresh en échec** 🟡 : le `catch` de CA-12 couvre aussi l'envoi de `auth_refresh` (socket fermée entre l'annonce et la fin du refresh : rien n'est journalisé ni relancé). La fermeture déclenche déjà la reconnexion, avec le token rafraîchi. À reconsidérer avec CA-15.
- **Le token renvoyé est relu au retour du refresh, pas celui que ce refresh a obtenu** 🟡 : le port `refresh()` ne retourne rien, `getToken()` donne le dernier token stocké. Avec deux refresh concurrents (voir la dette sur les appels concurrents), le dernier arrivé gagne ; un `getToken()` à `null` serait envoyé tel quel.
- **`auth_refresh` n'a jamais été reçu d'un vrai hub** 🟠 : le hub l'ignore une fois la session authentifiée (US-021 non implémentée). Le `auth_success` qui doit le suivre n'est pas exploité (CA-14, aucun timer de refresh n'existe encore).

## Mesurées pendant `chore(scripts): add a fake hub to smoke-test the token refresh`

- **Le hub n'implémente pas US-021** 🟠 : `ws-route.ts` (hub, `deb5465`) n'émet ni `token_expiring_soon` ni `token_expired` et ne traite pas `auth_refresh` ; la fermeture `4002` n'existe qu'à l'authentification initiale. CA-12, CA-13, CA-14 et CA-16 ne peuvent pas être observés sur un vrai hub avant cette implémentation (session du dépôt `quiz-live-server`). Le handoff précédent supposait le contraire (« hub avec `JWT_EXPIRATION_TIME` court »).
- **Le faux hub prouve le câblage, pas le hub** 🟡 : `scripts/fake-hub.mjs` joue la lecture de US-021 par Claude (annonce après `auth_success`, `auth_success` en réponse à `auth_refresh`). Il ne couvre ni `TOKEN_MISMATCH`, ni `TOKEN_EXPIRED` avec fermeture `4002`, ni `token_expired`. Écart possible avec le vrai hub non détectable ici.
- **Le faux hub n'est validé que par un client Node jetable** 🟡 : 5 cas rejoués hors dépôt (nominal, échec voulu, client muet, ancien token, échec voulu avec client nominal) ; le verdict n'est confronté à un navigateur qu'au smoke test d'Olivier.
- **Un onglet a reçu `token_expiring_soon` sans émettre de `POST`** 🟡 : smoke test du 2026-11-08, scénario `--fail-refresh` : `WS #1` (onglet resté ouvert du scénario précédent, reconnecté avec `fake-token-2`) reçoit l'annonce à 11:13:24 ; le hub ne voit aucun `POST /api/v1/token` avant le rechargement de 11:13:30. Non reproduit ni expliqué (onglet en arrière-plan ? requête perdue par le proxy de dev ? refresh non appelé ?). À rejouer avec un seul onglet, la console d'Edge ouverte, avant de s'appuyer sur CA-12 en conditions réelles.

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
- **Code de fermeture `4004` hors critères d'acceptation** 🟠 : le comportement (page d'erreur `session-replaced`, pas de reconnexion) est testé et décidé (#28), mais US-ANG-001 ne le porte que dans ses « Points de vigilance », sans CA numéroté. À formaliser (CA-26) si Olivier le veut.
- **Fixture d'auth en camelCase** 🟠 : format du hub (`expires_in`, `token_type`) à confronter à la spec.
- **Indentation des `it.each` de `confirm-dialog.spec.ts`** 🟠.
- **`data-testid="close"` de `confirm-dialog` conservé** 🟠 : voulu d'après le récap, à confirmer.
- **PR #1 fermée sans fusion** 🟠 : contenu jamais relu.
- **README Angular CLI** 🟠.
- **Poste d'Olivier parfois en retard sur `main`** 🟠 : discipline `git pull --ff-only` après chaque fusion.
- **Entre dépôts** 🟠 : `ADMIN_PASSWORD=dev-password` du `.env` local du hub ; preuve du hub faite sous Node 22 alors qu'il exige `>=26 <27`. Les dettes du hub vivent dans le `DEBTS.md` du hub.

## Mesurées pendant `chore(authentication): refresh the session token on demand`

- **Appels concurrents à `refresh()` non dédoublonnés** 🟠 : chaque appel émet son propre `POST /api/v1/token`. Un `4002` et un `token_expiring_soon` proches (CA-11, CA-12) en lanceraient deux, le dernier arrivé gagnant. Tranché au CA-12 : on laisse faire (décision #22) ; le cas est désormais atteignable en production et reste ouvert tant que la requête n'est pas partagée.
- **Un `refresh()` en échec ne touche ni au token ni à `isReady()`** 🟠 : choix d'Olivier (décision #17). L'appelant reçoit l'erreur ; rien n'invalide un token que le serveur a déjà refusé (voir l'entrée sur `isReady()`). CA-15 ne l'a pas réglé : après 3 échecs la socket est fermée et la reconnexion repart avec ce même token.
- **Le spec d'`AuthService` importe le port du WebSocket** 🟠 : la preuve de compatibilité (`const provider: TokenProvider = service`) place un import `core/authentication` → `core/websocket` dans un spec. Sans effet en prod ; si le port migre ou est scindé, la preuve suit.

## Mesurées pendant `feat(websocket): connect to the hub once the session is ready`

- **Une exception synchrone de `new WebSocket(...)` empêche le démarrage** 🟠 : `connect()` est appelé dans l'initialiseur sans `try/catch`. Une `wsUrl` invalide (valeur de production mal injectée, par exemple) ferait échouer le démarrage de l'application au lieu de la seule socket.
- **Le code de fermeture `4002` n'a jamais été observé sur un vrai hub** 🟡 : le smoke test du 2026-11-07 a couvert l'ouverture, la coupure et la reprise, pas l'expiration du token (le hub n'émet `4002` qu'à l'authentification initiale, voir « Le hub n'implémente pas US-021 »). `4004` : observé le 2026-11-08 (voir « Levées »).
- **Trois doublures de socket dans les specs** 🟡 : `FakeSocket` (`websocket.service.spec.ts`), `FakeSocket` (`app.config.websocket.spec.ts`) et `InertSocket` (`app.config.spec.ts`). À mutualiser dans une aide de test partagée si une quatrième apparaît.
- **Le build de production n'a pas été exécuté** 🟡 : le téléchargement des polices Google est refusé (403) depuis l'environnement de session ; la valeur de production de `wsUrl` n'est vérifiée que par `tsc`.

## Levées

- ~~`4004` jamais observé sur un vrai hub~~ : observé le 2026-11-08 au navigateur sur le hub réel (smoke test d'Olivier de `feat(error): explain that the session was taken over by another tab`) : un second onglet fait afficher la page `session-replaced` sur le premier, sans reconnexion pendant 40 s (le journal du hub ne montre aucune connexion entre l'ouverture du second onglet et le F5 du premier, ~3 min plus tard) ; un F5 du premier onglet inverse la situation. Aucune erreur en console.
- ~~`ErrorNavigator` factice~~ : remplacé par `errorService.sessionReplaced()` ; un `4004` affiche la page d'erreur `session-replaced` (`feat(error): explain that the session was taken over by another tab`, décision #28).
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

- **Le service analyse chaque message entrant pour y lire son type** 🟡 : la lecture du type est mutualisée (`messageType`), mais `auth_success` et `token_expiring_soon` sont testés l'un après l'autre : deux `JSON.parse` par message, en plus de l'émission brute sur `messages$`. Les futurs consommateurs en ajouteraient un chacun. À résoudre en lisant le type une seule fois par message, quand `messages$` sera filtré et typé.
- **La remise à zéro du délai n'a jamais été observée sur un vrai hub** 🟡 : verrouillée par trois tests sous temps simulé (remise à zéro sur `auth_success`, pas sur un autre message, pas sur un message non JSON), pas au navigateur. Observable avec deux coupures successives après une reprise réussie.

## Mesurées pendant `fix(websocket): keep the connection attempts going when the token refresh fails`

- **Un refresh en échec relance la connexion avec le token expiré** 🟠 : le hub refusera de nouveau (`4002`) et la boucle reconnexion / refus tourne indéfiniment au rythme du backoff (plafonné à 30 s). Les 3 tentatives à 5 s puis la fermeture de CA-15 n'existent que pour le refresh proactif (`token_expiring_soon`) ; ce chemin `4002` n'a toujours aucune borne, la spec ne dit rien pour lui (décision #21).
- **L'échec du refresh est avalé sans trace** 🟡 : le `catch` est vide, rien n'est journalisé ni signalé à l'utilisateur. À reconsidérer avec CA-15.
- **La reprise après un `refresh()` rejeté n'a jamais été observée sur un vrai hub** 🟡 : test unitaire seulement (choix d'Olivier). Observable avec un `JWT_EXPIRATION_TIME` court côté hub et le hub joignable mais `POST /api/v1/token` en échec.

## Mesurées pendant `feat(websocket): refresh the token when the hub announces its expiry`

- **L'échec du refresh proactif est avalé sans trace** 🟡 : les relances existent (CA-15, décision #25) mais rien n'est journalisé ni signalé à l'utilisateur, y compris après la 3e défaillance et la fermeture de la socket.
- **`token_expiring_soon` n'a jamais été reçu d'un vrai hub** 🟠 : le hub ne l'émet pas (US-021 non implémentée, voir « Mesurées pendant `chore(scripts): add a fake hub…` »). Le seul message reçu en vrai est celui d'un faux hub.
- **Les doublures `vi.fn()` masquent les rejets non capturés** 🟡 : `vi.fn()` attache un gestionnaire aux promesses qu'il retourne ; un test sur « pas de rejet non capturé » doit employer une fonction nue (c'est le cas du test « should stay silent… »). Le `refresh` du `beforeEach` est resté un `vi.fn` : un futur test de ce type doit le remplacer, pas s'y fier.

## Mesurées pendant `feat(websocket): send the refreshed token to the hub`

- **Un `send` qui lève est traité comme un refresh en échec** 🟡 : le `catch` couvre aussi l'envoi de `auth_refresh`. Une socket fermée entre l'annonce et la fin du refresh n'envoie plus et ne relance plus (garde `isClosed`, décision #25), mais un `send` qui lèverait sur une socket encore ouverte (`InvalidStateError` pendant la connexion) déclencherait une relance de refresh. Non observé, non testé.
- **Le token renvoyé est relu au retour du refresh, pas celui que ce refresh a obtenu** 🟡 : le port `refresh()` ne retourne rien, `getToken()` donne le dernier token stocké. Avec deux refresh concurrents (voir la dette sur les appels concurrents), le dernier arrivé gagne ; un `getToken()` à `null` serait envoyé tel quel.
- **`auth_refresh` n'a jamais été reçu d'un vrai hub** 🟠 : le hub l'ignore une fois la session authentifiée (US-021 non implémentée). Le `auth_success` qui doit le suivre n'a aucun traitement propre côté Angular (CA-14, décision #26 : le timer est celui du hub).

## Mesurées pendant `chore(scripts): add a fake hub to smoke-test the token refresh`

- **Le hub n'implémente pas US-021** 🟠 : `ws-route.ts` (hub, `deb5465`) n'émet ni `token_expiring_soon` ni `token_expired` et ne traite pas `auth_refresh` ; la fermeture `4002` n'existe qu'à l'authentification initiale. CA-12, CA-13, CA-15 et CA-16 ne peuvent pas être observés sur un vrai hub avant cette implémentation (session du dépôt `quiz-live-server`). Le handoff précédent supposait le contraire (« hub avec `JWT_EXPIRATION_TIME` court »).
- **Le faux hub prouve le câblage, pas le hub** 🟡 : `scripts/fake-hub.mjs` joue la lecture de US-021 par Claude (annonce après `auth_success`, `auth_success` en réponse à `auth_refresh`). Il ne couvre ni `TOKEN_MISMATCH`, ni `TOKEN_EXPIRED` avec fermeture `4002`, ni `token_expired`. Son verdict `--fail-refresh` (3 tentatives, fermeture 1000, reconnexion) est validé par un client Node jetable, pas par un vrai navigateur avant le smoke test d'Olivier. Écart possible avec le vrai hub non détectable ici.
- **Le faux hub n'est validé que par un client Node jetable** 🟡 : 5 cas rejoués hors dépôt (nominal, échec voulu, client muet, ancien token, échec voulu avec client nominal) ; le verdict n'est confronté à un navigateur qu'au smoke test d'Olivier.
- **Un onglet a reçu `token_expiring_soon` sans émettre de `POST`** 🟡 : smoke test du 2026-11-08, scénario `--fail-refresh` : `WS #1` (onglet resté ouvert du scénario précédent, reconnecté avec `fake-token-2`) reçoit l'annonce à 11:13:24 ; le hub ne voit aucun `POST /api/v1/token` avant le rechargement de 11:13:30. Non reproduit ni expliqué (onglet en arrière-plan ? requête perdue par le proxy de dev ? refresh non appelé ?). À rejouer avec un seul onglet, la console d'Edge ouverte, avant de s'appuyer sur CA-12 en conditions réelles.

## Mesurées pendant `feat(websocket): retry the token refresh three times before reconnecting`

- **« Jusqu'à 3 fois » lu comme 3 tentatives au total** 🟠 : CA-15 dit « nouvelle tentative après 5 s, jusqu'à 3 fois » puis « après 3 échecs » ; lecture retenue : 3 appels à `refresh()` (2 relances), fermeture au 3e échec (décision #25). Si Olivier voulait 3 relances (4 appels), c'est une constante (`REFRESH_MAX_ATTEMPTS`) et un test à changer.
- **Les relances de plusieurs annonces se cumulent** 🟡 : deux `token_expiring_soon` rapprochés lancent deux boucles de relances indépendantes (même cause que l'absence de dédoublonnage, décision #22). Aucun cas observé.
- **Les minuteries de relance ne sont pas annulées à la fermeture** 🟡 : la garde `isClosed` les neutralise au tir (≤ 5 s après), mais elles gardent la socket fermée en mémoire jusque-là. Négligeable.
- **La fermeture après 3 échecs repart avec le token courant** 🟠 : le hub refuse un token expiré (`4002`) ; ce `4002` relance un `refresh()` (CA-11) puis une reconnexion : la boucle est bornée par le seul backoff (voir l'entrée sur le refresh en échec au `4002`).
- **Le code de fermeture 1000 est un choix** 🟡 : le code est libre pour une fermeture volontaire côté client (le hub n'en définit aucun pour ce cas) ; `4000-4999` appartient aux codes applicatifs du hub. Non confirmé côté US-021 / US-ANG-010.
- **CA-15 n'a pas été observé sur un vrai hub** 🟠 : le smoke test se fait contre le faux hub (voir « Le hub n'implémente pas US-021 »).

## Mesurées pendant `docs(decisions): record that the refresh timer lives on the hub`

- **`US-ANG-010` CA-34 parle encore de « nouveau `expires_in` »** 🟡 : le scénario mocké `token_expiring_soon` → `refresh()` → `auth_refresh` → `auth_success` est cohérent avec la décision #26, mais le résultat attendu « nouveau `expires_in` » n'a rien d'observable côté Angular. À reformuler quand CA-34 sera traité.

## Mesurées pendant `test(websocket): lock the token_expired then 4002 sequence`

- **Un `token_expired` sans fermeture `4002` ne ferait rien côté Angular** 🟠 : CA-16 repose sur la fermeture `4002` que le hub envoie juste après (US-021, décision #27). Si le hub n'implémentait que le message, la socket resterait ouverte avec un token expiré. À reconsidérer quand US-021 sera implémentée côté hub (alors CA-16 sera observable, voir « Le hub n'implémente pas US-021 »).
- **Le type de commit `test` n'est ajouté que dans ce dépôt** 🟡 : `CLAUDE.md` et `docs/method/WORKFLOW.md` (copie « identique dans chaque dépôt ») divergent désormais de ceux de `quiz-live-server` et `quiz-live-buzzer`. À propager, une session par dépôt.

## Mesurées pendant `feat(error): explain that the session was taken over by another tab`

- **« Retour à l'accueil » mène à un tableau de bord sans socket** 🟠 : session prête, donc `goHome()` efface l'erreur et `/` ouvre `/dashboard`, alors que la socket est fermée (`4004`, aucune reconnexion). L'utilisateur croit avoir repris la main ; le message dit pourtant « rechargez la page ». Le tableau de bord n'utilise pas encore la socket, donc rien ne casse aujourd'hui. Piste : pas de bouton, ou « Recharger la page » pour cette variante (décision de conception non prise). Observé le 2026-11-08 (smoke test d'Olivier) : le clic mène bien au tableau de bord.
- **Texte, icône et couleur de `session-replaced` choisis sans maquette** 🟡 : seul le message est validé par Olivier ; le surtitre « Session remplacée », le titre « Un autre onglet a pris la main », l'icône `app-window` et le ton ambre (comme `connection-lost`) sont des choix de Claude. `docs/quiz-buzzer-error-page.html` et le design system sont muets (même cas que `invalid-credentials`). À compléter dans un commit `docs` dédié.
- **`error.service.spec.ts` ne couvre pas `invalid-credentials`** 🟡 : la table `it.each` des variantes s'arrête à `game-corrupted` (plus `session-replaced` désormais) ; `invalidCredentials()` n'est testé qu'à travers `AuthService` et la page d'erreur. Test né vert à prouver par mutation quand on l'ajoutera.
- **Le remplacement de session n'est pas journalisé côté hub** 🟡 : le hub ne laisse aucune trace (`DEBTS.md` du hub, « Remplacement de session silencieux dans les logs »). Le smoke test ne peut donc s'appuyer que sur l'écran du premier onglet, pas sur les logs du hub. Confirmé au smoke test du 2026-11-08 : le journal du hub n'a aucune ligne de remplacement ou de fermeture, seulement `WEBSOCKET_CONNECTED` / `WEBSOCKET_AUTHENTICATED` (`admin_connected` reste à 1).


## Mesurées pendant `docs(themes): align the themes list mockup and spec with the hub API`

- **Thème enrichi retiré de la maquette (description, icône choisie, compteurs, répartition par niveau)** 🟠 : le hub ne porte que `name`, `created_at` et `last_updated_at` (US-004, décision #29). À rouvrir si l'on veut ces champs : une US côté hub d'abord (champs `description` et `icon`, compteurs de questions et de quiz), puis la maquette et la spec Angular.
- **Recherche, filtres et tri de la liste des thèmes retirés** 🟡 : ils dépendaient des compteurs, et la liste est limitée à 100 thèmes sans paramètre de recherche côté hub. À rouvrir avec le thème enrichi ci-dessus.
- **Une seule icône pour tous les thèmes** 🟡 : `folder-tree`, celle de la navigation, faute d'icône stockée. Les cartes sont distinguées par le seul nom.
- **Compteurs de la barre latérale (Thèmes 12, Questions 147, Quiz 8, Jingles 23) toujours dans la maquette** 🟡 : le shell n'est pas touché ici, et aucun endpoint ne fournit ces totaux sans charger chaque liste. À trancher dans la session `feat(layout)`.
- **Dates de la maquette fictives, état vide montré en dessous de la grille** 🟡 : la maquette n'est pas un rendu fidèle du comportement (l'état vide remplace la grille dans l'application).


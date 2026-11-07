# Décisions : quiz-live-angular

Une entrée = un titre `## #N`. Les plus récentes en bas.

## #1 — Source de vérité du CDC : `docs/specs/`
`quiz-buzzer-docs` est archivé : les spécifications vivent désormais dans ce dépôt (`docs/specs/`). Toute modification de CA se fait dans la PR de la session qui l'exige. (2026-11-01)

## #2 — Une seule erreur « connexion perdue » hors 401 au démarrage (CA-25)
`POST /api/v1/token` : 401 → identifiants invalides ; toute autre cause (délai, serveur injoignable, autre non-2xx) → connexion perdue. Choix d'Olivier (« plus parlant »). Contrepartie : le proxy de dev renvoie 500 quand le hub est éteint, un vrai 500 du hub et un hub éteint sont indiscernables. La variante « erreur serveur » n'est plus utilisée au démarrage. (#14)

## #3 — Pas de `provideHttpClient` tant que le CA-4 n'est pas traité
L'hypothèse du récap (injection de `HttpClient` en échec au lancement) est fausse : `HttpClient` est `providedIn: 'root'` en Angular 21.2. `provideHttpClient(withInterceptors([authInterceptor]))` n'a d'effet observable qu'avec une requête authentifiée ; il viendra avec le CA-4. (#14)

## #4 — Délai maximal de 10 s sur le POST initial (CA-24)
Valeur choisie par Olivier parmi 5, 10, 15 et 30 s. Pas de mesure de référence : mesuré à 10,07 s en navigateur (Edge, proxy de dev). Pas de retry automatique (CDC). (#14)

## #5 — `initialize()` en `Promise<void>`, échec absorbé
Le CDC (l.98, l.185) impose une `Promise` pour que l'initialiseur soit strictement bloquant. L'échec est absorbé (erreur posée dans `ErrorService`) : un rejet empêcherait le démarrage de l'application. La navigation vers `/error` reste au CA-3. (#14)

## #6 — Numérotation des critères ajoutés
CA-24 et CA-25 de US-ANG-001 sont numérotés en fin de série (aucune renumérotation, aucune référence cassée) mais placés après le CA-3 qu'ils précisent. (#14)

## #7 — Matrice CA × couches par dépôt dans le gabarit de handoff
Le gabarit (Repository / Service / Route) était celui du hub. Ici : Service / Câblage / Guards, plus trois règles de relevé (partir du réel, associer par titres de tests, dire ce qui n'est pas exécuté). `session-close.ps1` ne lit pas cette section : il n'est pas modifié. Olivier veut propager : on propage les **règles de relevé**, les colonnes restent propres à chaque dépôt (une matrice Angular n'a pas de sens pour un hub ou un firmware). Une session par dépôt. (2026-11-01)

## #8 — `scripts/smoke.ps1` reste hors dépôt
Le smoke test de #14 (Edge headless + faux hub Node) n'est pas versionné, choix d'Olivier. Contrepartie : il disparaît avec le poste ; une session `chore` pourra le reprendre si le besoin revient. (2026-11-01)

## #9 — Le token n'est lu que par `getToken()`, le signal reste privé
CA-2 : `AuthService` expose `getToken()` et `isReady()` ; le signal n'est plus exposé. `authInterceptor` lit `getToken()`. `isReady()` est dérivé de la présence du token (pas d'état séparé, YAGNI). Choix d'Olivier de rendre le signal privé tout de suite, malgré le port `TokenProvider` du WebSocket qui n'est plus satisfait par `AuthService` (voir `DEBTS.md`). (chore(authentication): expose the session token and its readiness)

## #10 — `authInterceptor` branché globalement, sans filtre d'origine
CA-4 : `provideHttpClient(withInterceptors([authInterceptor]))` dans `appConfig` ; l'en-tête `Authorization` est posé sur toutes les requêtes `HttpClient` dès qu'un token existe, comme le CDC l'écrit. Lève la réserve de la décision #3. Le POST du token passe sans en-tête (`getToken()` vaut `null` à ce moment-là). Contrepartie, choix d'Olivier de suivre le CA tel quel : le JWT partirait aussi vers une origine tierce ; aucune n'existe aujourd'hui, la dette est tracée dans `DEBTS.md`. Commit `chore` : aucun effet observable en prod avant la première requête authentifiée. (chore(authentication): attach the session token to every request)

## #11 — La navigation vers `/error` est un effet de l'application, enregistré dans `appConfig`
CA-3 : un `effect` (via `provideEnvironmentInitializer`) navigue vers `/error` dès que `ErrorService.currentError()` est non nul. Ni dans `AuthService` ni dans `ErrorService` (état et routage restent séparés), ni dans `App` (le test de câblage n'instancie pas `App`). L'effet vaut pour toute erreur future (CA-5, `game-corrupted`…), pas seulement l'échec du token. La route `/error` est vide (`children: []`) pour le moment : `<app-error-page />` reste dans `app.html`, un rendu par la route le doublerait. Elle n'a pas de guard (CA-23). Retrait de `app.html` : session suivante. (feat(error): navigate to the error page when the session cannot be opened)

## #12 — La racine mène au tableau de bord par une redirection déclarative, pas par une navigation après l'init
CA-21 (« après initialisation réussie, le Router navigue vers `/dashboard` ») et CA-22 (« une URL protégée au démarrage est accessible directement ») : une navigation impérative inconditionnelle après l'initialisation écraserait l'URL d'un rechargement (CA-22). Route `{ path: '', pathMatch: 'full', redirectTo: 'dashboard' }` : elle ne touche que `/`, et la navigation initiale du Router attend l'initialiseur bloquant (CA-1) — vérifié au navigateur (faux hub) : le guard laisse passer à la première navigation. Aucun code d'orchestration. Contrepartie : « Retour à l'accueil » mène à `/` donc à `/dashboard`, et si la session n'est pas prête (seul cas où la page d'erreur apparaît aujourd'hui) le guard renvoie vers `/error`, page vide : le bouton reste un cul-de-sac (voir `DEBTS.md`). (feat(routing): open the dashboard when the application starts at the root)


## #13 — « Retour à l'accueil » ne perd pas la cause de l'erreur tant que la session n'est pas prête
Option B retenue par Olivier. `ErrorPage.goHome()` n'efface l'erreur que si `AuthService.isReady()` est vrai ; sinon la variante d'origine (`invalid-credentials` ou `connection-lost`) reste affichée quand le guard renvoie vers `/error`. Option A écartée : un `authGuard` qui signale `connectionLost()` aurait rendu la page lisible mais faux (un 401 au démarrage serait affiché « connexion perdue »). Contreparties : `ErrorPage` dépend d'`AuthService` (voir `DEBTS.md`), et le bouton reboucle sur `/error` tant que la session n'est pas prête. Lève le choix laissé ouvert par la décision #12. (fix(error): explain why the dashboard is unavailable when the session is not ready)


## #14 — Le message « connexion perdue » ne promet pas de reconnexion et ne donne pas de consigne
Choix d'Olivier : retirer la dernière phrase (« Nous tentons une reconnexion automatique. »), le CDC interdisant tout retry de l'initialisation (CA-24). Variante écartée : la remplacer par une consigne (« Rechargez la page ») : une promesse de plus tant que le bouton de la page ne relance rien (voir `DEBTS.md`). Le texte reste valable pour le démarrage ; le WebSocket (US-ANG-010) aura besoin d'un message propre. Aucun CA ne cite le texte : le CDC n'est pas modifié. (fix(error): remove the automatic reconnection promise at startup)


## #15 — La variante `invalid-credentials` est rouge (`--semantic-danger`), le CDC étant muet
Le CDC (CA-25), la maquette de la page d'erreur (4 variantes) et la section 14 du design system ne disent rien de la couleur de cette variante, ajoutée avec CA-25. Choix d'Olivier : `--semantic-danger` (rouge), au sens que le design system donne à ce jeton (« invalidation, suppression ») ; un refus d'authentification rend l'application inutilisable, ce qui exclut l'ambre (« alertes douces »). Bloc calqué sur `server-error`. Variante écartée : `--semantic-warning` (ambre, comme `connection-lost`). Contrepartie : `server-error` partage la même couleur, seuls l'icône (`shield-x`), l'eyebrow et le titre les distinguent. Le design system et la maquette ne sont pas modifiés (voir `DEBTS.md`). (fix(error): make the invalid credentials title readable)


## #16 — Le port `TokenProvider` lit le token par `getToken()`, pas par un signal
Réconcilie la dette ouverte par la décision #9 : on adapte le consommateur (`WebSocketService`) plutôt que de rouvrir le signal d'`AuthService`. Port : `getToken(): string | null` (CA-10 : « lu depuis `AuthService.getToken()` au moment de la reconnexion »). Choix d'Olivier : renommage minimal. Variante écartée : scinder le port en lecture et refresh, pour qu'`AuthService` en satisfasse déjà une moitié ; un paramètre de constructeur de plus avant que le besoin existe. Contrepartie : `AuthService` ne satisfait toujours pas le port (`refresh()` manquant, CA-11/12) et aucun test ne le prouve (voir `DEBTS.md`). Commit `chore` : `WebSocketService` n'est injecté nulle part, aucun effet observable. (chore(websocket): align the token port with the authentication service)


## #17 — `refresh()` obtient un nouveau token sans rien signaler : l'échec revient à l'appelant, le token courant est conservé
Le port `TokenProvider` (`refresh(): Promise<void>`) est satisfait par `AuthService.refresh()`, qui rejoue le `POST /api/v1/token` d'`initialize()` (même corps, même délai de 10 s, via une méthode privée commune). Succès : le nouveau token remplace l'ancien. Échec (401, 5xx, réseau, délai) : la promesse est rejetée avec l'erreur d'origine ; le token courant et `isReady()` ne changent pas ; `ErrorService` n'est pas appelé, contrairement à `initialize()`. Choix d'Olivier : conserver le token et `isReady()`. Raison : la gestion de l'échec (3 tentatives à 5 s, puis fermeture et reconnexion complète) appartient à CA-15, et `refresh()` ne doit pas décider seul d'afficher `/error` pendant une partie. Variante écartée : effacer le token à l'échec, qui aurait fait basculer `isReady()` à faux et le guard vers `/error` au premier raté. Contreparties : un token déjà refusé reste « prêt » (voir `DEBTS.md`) ; deux `refresh()` simultanés émettent deux requêtes. Commit `chore` : `refresh()` n'a aucun appelant en production (`WebSocketService` n'est injecté nulle part). (chore(authentication): refresh the session token on demand)


## #18 — Le message `auth` part à l'ouverture de la socket, et le token est lu à ce moment
CA-7 : un vrai `WebSocket` lève `InvalidStateError` si `send()` est appelé avant l'ouverture. `SocketLike` gagne `onopen`, et `connect()` n'envoie plus rien tant qu'il n'est pas déclenché. Le token est lu dans `onopen`, pas à la construction : après un `refresh()` ou un backoff, c'est la valeur la plus fraîche (CA-10 : « au moment de la reconnexion »). Choix d'Olivier : cadrage validé à la porte 1. Variante écartée : lire le token à la construction et l'envoyer plus tard, qui garde une valeur potentiellement périmée au moment de l'envoi. Contreparties : `onopen` ne prouve pas l'authentification (seul `auth_success`, CA-8, le fait), et le service n'a toujours pas tourné sur une vraie socket (voir `DEBTS.md`). Commit `fix` : correction d'un défaut réel, sans changement de comportement observable depuis l'application, faute d'appelant. (fix(websocket): send the auth message once the socket is open)


## #19 — La socket s'ouvre à la fin du démarrage, sans le bloquer, et seulement si la session est prête
`provideAppInitializer` enchaîne `AuthService.initialize()` puis, si `isReady()`, `WebSocketService.connect()` ; il n'attend pas l'ouverture de la socket ni `auth_success`. Le service est fourni par une fabrique (`new WebSocketService(WEB_SOCKET_CONSTRUCTOR, environment.wsUrl, AuthService, navigateur d'erreur)`) ; `WEB_SOCKET_CONSTRUCTOR` (`providedIn: 'root'`, `WebSocket` natif) permet de substituer la socket dans les tests. `SocketLike.onopen` reçoit un `Event` : sans cela, le `WebSocket` natif n'était pas assignable au contrat (constaté au compilateur). Choix d'Olivier : cible A seule, initialiseur non bloquant, `wsUrl` de développement `ws://localhost:3000/ws` (le proxy de `ng serve` ne couvre que `/api`, la socket joint donc le hub directement). Écart signalé à la porte 1 : la valeur de production est `wss://set-by-ci.invalid/ws` et non `set-by-ci`, qui n'est pas une URL (`new WebSocket` lèverait `SyntaxError` au démarrage) ; le domaine `.invalid` est réservé et ne résout jamais, la connexion échoue donc proprement jusqu'à l'injection par la CI/CD. Variantes écartées : un initialiseur qui attend `auth_success` (un hub muet retarderait l'écran, alors que CA-24 borne déjà le démarrage à 10 s) ; un proxy `/ws` avec `ws: true` (plus de configuration, et `new WebSocket` exige de toute façon une URL absolue). Contreparties : l'`ErrorNavigator` est factice (code `4004` muet), une exception synchrone du constructeur de socket empêcherait le démarrage, et le service n'a toujours pas tourné sur un vrai `WebSocket` (voir `DEBTS.md`). (feat(websocket): connect to the hub once the session is ready)

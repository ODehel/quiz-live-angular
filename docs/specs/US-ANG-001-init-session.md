# US-ANG-001 — Initialisation de l'application et gestion de session

## 📋 Contexte projet

Voir [VISION.md](https://github.com/ODehel/quiz-live-server/blob/main/docs/shared/VISION.md) pour la description complète du projet et de ses quatre applications.

L'application Angular est l'interface de gestion des parties du maître de jeu. Elle communique avec le serveur Node.js exclusivement via l'API REST (Bearer JWT) et le WebSocket (authentification post-connexion).

---

## 🎯 User Story

> **En tant que** maître de jeu,
> **je veux** que l'application démarre et se connecte automatiquement au serveur sans écran de connexion,
> **afin de** pouvoir utiliser immédiatement l'interface sans friction d'authentification.

---

## ✅ Critères d'acceptance

> 🧪 **Exigence de couverture** — Voir [CONVENTIONS-TECHNIQUES-ANGULAR.md](CONVENTIONS-TECHNIQUES-ANGULAR.md) pour la stack, les principes KISS/DRY/YAGNI/SOLID et la couverture des tests. Chaque CA doit être couvert par au moins un test automatisé. Couverture `AuthService` ≥ 90 %, `WebSocketService` ≥ 90 %, guards 100 %.

### Auto-connexion au démarrage — `APP_INITIALIZER`

| # | Critère | Résultat attendu |
|---|---|---|
| CA-1 | Au démarrage, avant toute navigation, `AuthService.initialize()` appelle `POST /api/v1/token` avec les credentials de `environment.ts` | Appel bloquant — le Router ne résout aucune route tant que `APP_INITIALIZER` n'a pas terminé |
| CA-2 | En cas de succès (`200 OK`), le token JWT est stocké dans un signal privé de `AuthService` | `AuthService.getToken()` retourne le token ; `AuthService.isReady()` passe à `true` |
| CA-3 | En cas d'échec réseau ou de réponse non-2xx, l'application navigue vers `/error` avec un message explicite | Aucune autre navigation n'est tentée ; l'utilisateur voit une page d'erreur bloquante |
| CA-24 | Si `POST /api/v1/token` n'a reçu aucune réponse au bout de 10 s, la requête est abandonnée et l'échec est traité comme un échec réseau (CA-3) | Le démarrage n'attend jamais plus de 10 s ; aucun retry automatique |
| CA-25 | Le message de la page d'erreur dépend de la cause de l'échec du `POST /api/v1/token` : `401` → identifiants invalides ; toute autre cause (délai dépassé, serveur injoignable, autre réponse non-2xx) → connexion perdue | L'utilisateur n'est jamais informé d'« identifiants invalides » pour une panne réseau ou serveur |
| CA-4 | `authInterceptor` injecte automatiquement le header `Authorization: Bearer <token>` sur toutes les requêtes `HttpClient` | L'injection ne se produit pas si `AuthService.getToken()` retourne `null` |
| CA-5 | `authGuard` bloque l'accès à toutes les routes protégées si `AuthService.isReady()` est `false` | Redirection vers `/error` |

### Connexion WebSocket initiale

| # | Critère | Résultat attendu |
|---|---|---|
| CA-6 | Après obtention du token, `WebSocketService` établit une connexion WebSocket vers `environment.wsUrl` | Connexion sur `ws://<serverUrl>/ws` |
| CA-7 | Le premier message envoyé est `{ "type": "auth", "token": "<JWT>" }` | Conforme au protocole US-009 |
| CA-8 | À la réception de `auth_success`, `WebSocketService` émet le message sur `messages$` | `GameStateService` reçoit le signal et peut s'initialiser |
| CA-9 | Si la connexion WebSocket échoue ou est perdue, `WebSocketService` tente de se reconnecter automatiquement avec un backoff exponentiel | Délais : 1 s, 2 s, 4 s, 8 s… jusqu'à 30 s maximum — reprise indéfinie |
| CA-10 | À chaque reconnexion, le premier message envoyé est `{ "type": "auth", "token": "<token_courant>" }` | Le token courant est lu depuis `AuthService.getToken()` au moment de la reconnexion |
| CA-11 | Si le code de fermeture WebSocket est `4002` (token expiré côté serveur), `WebSocketService` appelle `AuthService.refresh()` avant de reconnecter | Nouveau token obtenu avant d'envoyer le message d'auth |

### Refresh automatique du token

| # | Critère | Résultat attendu |
|---|---|---|
| CA-12 | À la réception de `token_expiring_soon` via WebSocket, `AuthService.refresh()` est appelé silencieusement | Appel à `POST /api/v1/token` en arrière-plan — aucune interruption visible |
| CA-13 | En cas de succès du refresh, `WebSocketService` envoie `{ "type": "auth_refresh", "token": "<nouveau_token>" }` sur la connexion WebSocket existante | La connexion WebSocket n'est pas interrompue — conforme à l'US-021 |
| CA-14 | À la réception de `auth_success` après `auth_refresh`, le timer d'expiration est réinitialisé **côté hub** ; Angular n'a aucun timer à réarmer | Le nouveau `expires_in` repart de zéro côté hub ; côté Angular, le prochain refresh attend le prochain `token_expiring_soon` (décision #26) |
| CA-15 | En cas d'échec du refresh (réseau indisponible), une nouvelle tentative est effectuée après 5 secondes, jusqu'à 3 fois | Après 3 échecs, la connexion WebSocket est fermée et la reconnexion complète repart depuis CA-9 |
| CA-16 | À la réception de `token_expired`, Angular ne fait rien de plus : le hub ferme la connexion en `4002` juste après, et ce code déclenche un seul `AuthService.refresh()` puis la reconnexion complète (CA-11) | Un `token_expired` suivi de `4002` donne un seul `refresh()` et une seule reconnexion (décision #27) |

### Synchronisation de l'état initial

| # | Critère | Résultat attendu |
|---|---|---|
| CA-17 | ⛔ **Bloqué : `GET /api/v1/games` absent du hub (US-010), à rouvrir quand il existe.** Après `auth_success` WebSocket, `GameStateService.syncInitial()` appelle `GET /api/v1/games` pour détecter une partie active | Filtre côté serveur : parties en statut `PENDING` ou non-`COMPLETED`/`IN_ERROR` |
| CA-18 | ⛔ **Bloqué : `GET /api/v1/games` absent du hub (US-010), à rouvrir quand il existe.** Si une partie active existe, son statut et ses données sont chargés dans `GameStateService` via `signal.update()` | `GameStateService.isActive()` retourne `true` ; `activeGameGuard` laisse passer |
| CA-19 | ⛔ **Bloqué : `GET /api/v1/games` absent du hub (US-010), à rouvrir quand il existe.** Si aucune partie active n'existe, `GameStateService` reste à son état initial | `GameStateService.isActive()` retourne `false` ; `noActiveGameGuard` laisse passer le backoffice |
| CA-20 | À la réception d'un `game_state_sync` complet (avec `game_id` et `status`, US-019 CA-14), `GameStateService` le traite via `dispatch()` : l'état de la partie et la liste des buzzers sont mis à jour. Un sync complet porte `game_id` (chaîne), `status` (l'un des huit `GameStatus`), `question_index` (nombre), `quiz_id` (chaîne), `participants` (liste de `{ order, name, cumulative_score }`, avec `order` nombre, `name` chaîne et `cumulative_score` nombre) et `connected_buzzers` (liste de chaînes, CA-30) ; tous sont requis et bien typés. Un sync qui y manque ou en porte un mal typé (y compris un `status` hors des huit `GameStatus`) est rejeté en entier : état de partie et liste des buzzers inchangés (même référence, rien n'est notifié), aucune exception ne remonte du flux de messages (décision #42). `game_id` sans `status`, ou `status` sans `game_id`, est rejeté de la même façon, comme un sync qui porte au moins un autre champ de partie (`question_index`, `quiz_id`, `participants`, `started_at` ou `time_limit`) sans `game_id` ni `status` (décision #43). `started_at` (chaîne) et `time_limit` (nombre) restent optionnels : le hub les envoie pour `QUESTION_OPEN` et `QUESTION_BUZZED` seulement (US-019 CA-11 à CA-14), et présents ils doivent avoir ce type, sinon le sync est rejeté en entier. Un sync complet remplace `startedAt` et `timeLimit` par ce qu'il porte, et les remet à `null` quand il ne les porte pas (décision #40). Dans l'état, les champs reçus deviennent `gameId`, `status`, `questionIndex`, `quizId`, `participants`, `connectedBuzzers`, `startedAt` et `timeLimit`. Deux déclencheurs : le sync immédiat du hub après `auth_success` (reconnexion en cours de partie, US-019 CA-11 — non implémenté côté hub) ou la réponse à `request_game_state` (CA-27) | L'état est restauré depuis le message WebSocket — pas besoin d'un appel REST. Le rejet joue dans les deux sens : un `connected_buzzers` invalide (décision #41) bloque aussi l'état de partie, des champs de partie invalides bloquent le remplacement de la liste. Le hub n'envoie aucun sync pour `PENDING`, `IN_ERROR` ni `COMPLETED` (US-019 CA-15) |
| CA-26 | Quand le hub ferme la socket d'Angular avec le code `4004` (un autre onglet ou un autre client du même compte a repris la session, US-009 CA-17), `WebSocketService` signale l'erreur `session-replaced` (`ErrorService.sessionReplaced()`) et l'application navigue vers `/error` (CA-3). Le client ne tente aucune reconnexion, n'appelle pas `close()` sur la socket et ne demande aucun nouveau token (ni `refresh()`, ni `POST /api/v1/token`). La page affiche : « Votre session a été ouverte dans un autre onglet. Fermez celui-ci ou rechargez la page pour reprendre la main. » Pour cette variante seule, le bouton de la barre du haut s'intitule « Recharger la page » et remplace « Retour à l'accueil » ; son clic recharge l'application depuis la racine `/` (chargement complet de la page : nouveau token, nouvelle socket), puis le flux normal mène à `/dashboard` (CA-1, CA-6, CA-21). Il ne recharge pas `/error`. Les autres variantes d'erreur gardent « Retour à l'accueil », inchangé | Erreur non-retry : le second onglet a pris la main et la socket est déjà fermée par le hub (décisions #28 et #45). Le bouton ne mène plus à un tableau de bord sans socket (décision #46). La liste des buzzers est conservée (CA-33) |
| CA-27 | À chaque `auth_success` reçu, `GameStateService.requestSync()` envoie `{ "type": "request_game_state" }` sur la socket | La liste initiale des buzzers connectés arrive par `game_state_sync` (US-009 CA-29) ; un buzzer connecté avant l'ouverture d'Angular apparaît. Aucun envoi périodique : pas de polling (décision #34) |
| CA-28 | À la réception de `buzzer_connected` (`{ "type": "buzzer_connected", "username": "quiz_buzzer_01" }`, US-009 CA-27), `GameStateService` ajoute le username à la fin de `connectedBuzzers` s'il n'y figure pas ; s'il y figure déjà, il ne change rien (reconnexion d'un buzzer : le hub n'envoie pas `buzzer_disconnected` pour l'ancienne socket, décision #36) | `connectedBuzzers()` contient le username une seule fois ; son rang est celui de sa première arrivée, un message répété ne le déplace pas |
| CA-29 | À la réception de `buzzer_disconnected` (US-009 CA-28), `GameStateService` retire le username de `connectedBuzzers` ; si le username n'y figure pas, il ne change rien (décision #36) | `connectedBuzzers()` ne contient plus le username ; pour un username absent, la liste reste identique, sans erreur, sans resynchronisation et sans `request_game_state` |
| CA-30 | `connected_buzzers` d'un `game_state_sync` est une liste de chaînes (les usernames, US-019 CA-14) ; `GameStateService` la range telle quelle dans `connectedBuzzers: string[]`, en remplaçant la liste précédente en bloc | Le hub envoie aujourd'hui des objets `{ "username": … }` : écart à corriger côté hub (voir `DEBTS.md`), sans effet sur ce critère |
| CA-31 | Un `game_state_sync` partiel, c'est-à-dire sans aucun champ de partie (ni `game_id`, `status`, `question_index`, `quiz_id`, `participants`, `started_at` ni `time_limit` ; réponse à `request_game_state` sans partie active, US-009 CA-29), ne met à jour que la liste des buzzers ; sans `connected_buzzers`, il ne modifie rien (décision #41, point 2, limité aux syncs partiels par #42) | L'état de partie (`gameId`, `status`, participants…) reste intact. Un sync qui porte des champs de partie sans `game_id` ni `status` n'est pas partiel : il est rejeté en entier (CA-20, décision #43) |
| CA-32 | `request_game_state` part à chaque `auth_success`, y compris celui qui suit un `auth_refresh` (CA-14) | Un `auth_success` = un envoi : redondant après un refresh, mais idempotent |
| CA-33 | À la fermeture de la socket d'Angular, quel que soit le code (y compris `4004`), `connectedBuzzers` n'est pas modifié ; le prochain `game_state_sync` la remplace en bloc | La dernière liste est conservée pendant la coupure ; l'indicateur « Reconnexion… » (US-ANG-002 CA-24) signale qu'elle peut être périmée |
| CA-34 | Quand `/error` s'ouvre sans qu'aucune erreur ne soit posée (`ErrorService.currentError()` nul) et que la session est prête (`AuthService.isReady()` vrai ; cas : rechargement de la page sur `/error`, URL saisie à la main), l'application redirige vers `/` (qui mène à `/dashboard`, CA-21) au lieu de rendre une page vide | Spécifié, non implémenté (décision #48). La redirection ne vaut que session prête : `/error` sans erreur posée et session non prête n'est pas spécifié (voir `DEBTS.md`). CA-23 est inchangé : la condition porte sur l'absence d'erreur et sur `isReady()`, pas sur un guard |

### Navigation initiale

| # | Critère | Résultat attendu |
|---|---|---|
| CA-21 | Après initialisation réussie, le Router navigue vers `/dashboard` | `APP_INITIALIZER` terminé — navigation débloquée |
| CA-22 | Si l'URL courante au démarrage est une route protégée valide (ex. rechargement de page sur `/content/questions`), le Router y accède directement après init | Les guards évaluent l'état post-initialisation |
| CA-23 | La route `/error` est accessible sans guard — elle ne dépend pas de `AuthService.isReady()` | Accessible même si l'auto-login a échoué |

---

## 🔧 Spécifications techniques

Voir [CONVENTIONS-TECHNIQUES-ANGULAR.md](CONVENTIONS-TECHNIQUES-ANGULAR.md) pour la stack complète, les principes KISS/DRY/YAGNI/SOLID et les conventions de code.

### `environment.ts`

```typescript
export const environment = {
  production:     false,
  serverUrl:      'http://192.168.1.10:3000',
  wsUrl:          'ws://192.168.1.10:3000/ws',
  adminUsername:  'admin',
  adminPassword:  'MonSuperMotDePasse!'
  // ⚠️ Ne pas versionner le fichier .env — utiliser environment.prod.ts
  //    avec des valeurs lues depuis la CI/CD en production
};
```

### `AuthService` — interface publique

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isReady = signal(false);   // true après init réussie

  async initialize(): Promise<void>;  // appelé par APP_INITIALIZER
  async refresh(): Promise<void>;     // appelé sur token_expiring_soon / 4002
  getToken(): string | null;          // lu par authInterceptor et WebSocketService
}
```

### `WebSocketService` — interface publique

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  readonly messages$: Observable<InboundMessage>; // partagé (shareReplay)

  connect(): void;                    // appelé par APP_INITIALIZER
  send(msg: OutboundMessage): void;   // appelé par composants et services
}
```

### Flux d'initialisation complet

```
APP_INITIALIZER (bloquant)
  1. AuthService.initialize()
       → POST /api/v1/token
         → Succès : token stocké, isReady = true
         → Échec  : navigate('/error') — fin de l'initialisation

  2. WebSocketService.connect()
       → new WebSocket(environment.wsUrl)
       → send { type: 'auth', token }
       → réception auth_success → messages$ émet

  3. GameStateService écoute messages$
       → auth_success (chaque fois, y compris après auth_refresh)
           → requestSync() : send { type: 'request_game_state' }        (CA-27, CA-32)
       → game_state_sync (réponse à request_game_state, ou sync immédiat du hub
         après auth_success si une partie est active, US-019 CA-11)
           → dispatch() : sync complet (game_id et status présents) = partie et
             liste appliquées ensemble, ou rejet entier s'il est incomplet ou mal
             typé ; sync partiel (aucun champ de partie) = liste seulement
                                                                        (CA-20, CA-30, CA-31, #42)
       → buzzer_connected / buzzer_disconnected
           → ajoute (une seule fois) / retire (sans effet si absent)    (CA-28, CA-29)
       → ⛔ syncInitial() : GET /api/v1/games — bloqué, absent du hub   (CA-17 à CA-19)

  4. Router débloqué → navigate('/dashboard')
```

### Backoff exponentiel WebSocket

```typescript
// Dans WebSocketService.buildStream()
retryWhen(errors =>
  errors.pipe(
    scan((attempt, err) => {
      if (err?.code === 4002) { /* refresh token avant retry */ }
      return attempt + 1;
    }, 0),
    delayWhen(attempt => timer(Math.min(1000 * Math.pow(2, attempt), 30_000)))
  )
)
```

### `authInterceptor`

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);
  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
```

---

## 📐 Périmètre

| Inclus | Exclu |
|---|---|
| Auto-login silencieux via `POST /api/v1/token` | Écran de connexion utilisateur |
| Stockage du token JWT en mémoire (signal) | Stockage du token en `localStorage` / `sessionStorage` |
| Connexion WebSocket avec authentification post-connexion | Gestion des messages métier WebSocket (→ `GameStateService`) |
| Reconnexion automatique avec backoff exponentiel | Reconnexion infinie sans backoff |
| Refresh silencieux sur `token_expiring_soon` via `auth_refresh` | Refresh token REST (YAGNI) |
| Synchronisation initiale de l'état de la partie et liste des buzzers connectés, tenue à jour par événements (sans polling) | Affichage du dashboard (→ US-ANG-002) |
| `authGuard`, `activeGameGuard`, `noActiveGameGuard` | Logique de routing métier (→ US dédiées) |
| Page d'erreur bloquante en cas d'échec d'initialisation | Retry automatique de l'initialisation |
| Délai maximal de 10 s sur le `POST /api/v1/token` initial, message d'erreur selon la cause | |
| Tests unitaires et d'intégration (couverture ≥ 90 %) | Déploiement / CI-CD |

---

## 🔍 Points de vigilance

### `APP_INITIALIZER` doit être strictement bloquant

Angular résout les routes immédiatement après la fin de `APP_INITIALIZER`. Si `initialize()` ne retourne pas une `Promise` résolue, les guards s'exécuteront avec un état non initialisé. `AuthService.isReady()` doit impérativement être `true` avant que le Router ne commence à évaluer les guards.

### Pas de token en `localStorage`

Le token est stocké **uniquement en mémoire** via un `signal` privé dans `AuthService`. Un rechargement de page (F5) relance l'`APP_INITIALIZER` et obtient un nouveau token — c'est le comportement attendu. Stocker en `localStorage` introduirait un risque XSS et une complexité non justifiée (YAGNI).

### `messages$` doit être `shareReplay`

Plusieurs services (`GameStateService`, éventuellement d'autres) s'abonnent à `messages$`. Sans `shareReplay({ bufferSize: 1, refCount: true })`, chaque abonné créerait une nouvelle connexion WebSocket. Le `shareReplay` garantit qu'un seul socket est ouvert et que les nouveaux abonnés reçoivent le dernier message émis.

### Race condition `game_state_sync` vs `GET /api/v1/games`

Tant que CA-17 à CA-19 sont bloqués (`GET /api/v1/games` absent du hub), la seule source de l'état initial est le WebSocket : pas de course à arbitrer. À la réouverture de ces critères, `WebSocketService.connect()` et `GameStateService.syncInitial()` s'exécuteront en parallèle ; `game_state_sync` pourra alors arriver avant que `GET /api/v1/games` ne réponde. `dispatch()` dans `GameStateService` prendra toujours le dessus : il met à jour le signal avec les données les plus fraîches du serveur, quelle que soit leur source. L'ordre d'arrivée est sans importance grâce aux Signals.

### Un `game_state_sync` n'est pas toujours complet

Le hub répond à `request_game_state` même sans partie active, par un `game_state_sync` qui ne porte que `connected_buzzers` (US-009 CA-29). Ce sync partiel ne met à jour que la liste des buzzers (CA-31) : traiter son absence de partie comme « plus de partie » effacerait une partie en cours. Un sync qui porte des champs de partie sans `game_id` ni `status` n'est pas partiel : il est rejeté en entier (décision #43).

### Liste des buzzers pendant une coupure

Une coupure de la socket d'Angular ne vide pas la liste (CA-33) : elle peut être périmée tant que « Reconnexion… » est affiché. Pendant ce temps, un `buzzer_connected` ou `buzzer_disconnected` émis par le hub est perdu ; le `request_game_state` qui suit la reconnexion (CA-27) remplace la liste en bloc.

### Cas `4004` (session replaced)

Si l'application est ouverte dans deux onglets, le serveur ferme la première connexion avec `4004`. `WebSocketService` doit traiter ce code comme une erreur non-retry (le second onglet a pris la main) et naviguer vers `/error` plutôt que de tenter une reconnexion infinie. Le comportement complet est fixé par le CA-26 (aucun `close()`, aucune demande de token, décision #45 ; bouton « Recharger la page » dans la barre du haut, qui recharge l'application depuis `/`, décision #46).

---

## 🔗 Documents liés

| Document | Contenu |
|---|---|
| [VISION.md](https://github.com/ODehel/quiz-live-server/blob/main/docs/shared/VISION.md) | Description complète du projet |
| [CONVENTIONS-TECHNIQUES-ANGULAR.md](CONVENTIONS-TECHNIQUES-ANGULAR.md) | Stack, principes, conventions de code Angular |
| [US-003 — Authentification JWT (serveur)](https://github.com/ODehel/quiz-live-server/blob/main/docs/specs/US-003-authentication-token.md) | Endpoint `POST /api/v1/token` |
| [US-009 — Connexion WebSocket (serveur)](https://github.com/ODehel/quiz-live-server/blob/main/docs/specs/US-009-websocket-connection.md) | Protocole d'auth WebSocket |
| [US-019 — Reprise après crash (serveur)](https://github.com/ODehel/quiz-live-server/blob/main/docs/specs/US-019-game-recovery.md) | Format `game_state_sync` |
| [US-021 — Refresh JWT WebSocket (serveur)](https://github.com/ODehel/quiz-live-server/blob/main/docs/specs/US-021-token-refresh.md) | Protocole `token_expiring_soon` / `auth_refresh` |

---

**Dernière mise à jour** : 2026-11-23
**Statut** : Implémentée — 40 tests, couverture ≥ 97 %
**Sprint** : 0

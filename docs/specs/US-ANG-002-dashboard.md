# US-ANG-002 — Tableau de bord

## 📋 Contexte projet

Voir [VISION.md](https://github.com/ODehel/quiz-live-server/blob/main/docs/shared/VISION.md) pour la description complète du projet et de ses quatre applications.

---

## 🎯 User Story

> **En tant que** maître de jeu,
> **je veux** voir en un coup d'œil l'état du système dès l'ouverture de l'application,
> **afin de** savoir immédiatement si une partie est en cours, combien de buzzers sont connectés, et accéder rapidement à n'importe quelle section.

---

## ✅ Critères d'acceptance

> 🧪 **Exigence de couverture** — Voir [CONVENTIONS-TECHNIQUES-ANGULAR.md](CONVENTIONS-TECHNIQUES-ANGULAR.md). Couverture `DashboardComponent` ≥ 70 %. Couverture `GameService` ≥ 80 %.

### Chargement initial des données

| # | Critère | Résultat attendu |
|---|---|---|
| CA-1 | ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Au chargement du composant, `GET /api/v1/games?page=1&limit=4` est appelé pour charger les 4 dernières parties | Tri serveur par date décroissante — les 4 premières entrées de la réponse sont affichées. En attendant : aucun appel à `games` (CA-13, décision #68) |
| CA-2 | ⛔ **Bloqué : route `GET /api/v1/quizzes` absente du hub (US-008), à rouvrir quand elle existe.** `GET /api/v1/quizzes` et `GET /api/v1/questions?limit=1` sont appelés en parallèle pour obtenir les compteurs | Appel simultané via `forkJoin` — aucun appel n'attend l'autre. Le `forkJoin` est suspendu et revient à la réouverture. **Part non bloquée, en attendant (décision #69) :** au chargement, seul `GET /api/v1/questions?limit=1` est appelé, seul son `total` est affiché (métrique « Questions », CA-3) ; aucun appel à `quizzes` |
| CA-3 | Les 4 métriques affichées sont : buzzers connectés, nombre de quiz, nombre de questions, nombre de parties jouées | Buzzers : depuis `GameStateService.connectedBuzzers()` (signal, temps réel ; liste de chaînes : les usernames, US-ANG-001 CA-30) — questions : depuis le `total` de la réponse de `GET /api/v1/questions?limit=1` (CA-2). ⛔ **Bloqué : route `GET /api/v1/quizzes` absente du hub (US-008), à rouvrir quand elle existe.** Quiz : depuis la réponse REST de `quizzes`. En attendant (décision #67) : la métrique « Quiz » affiche `—`, sans appel (un `0` serait faux, précédent des CA-27 et CA-31). ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Parties jouées : depuis la réponse REST de `games`. En attendant (décision #67) : la métrique « Parties jouées » affiche `—`, sans appel, pour la même raison |
| CA-4 | Pendant le chargement, un état de chargement est affiché à la place des métriques et de la liste | Indicateur visuel — pas de skeleton élaboré (KISS). S'applique à l'appel `GET /api/v1/questions?limit=1` : pendant cet appel, l'indicateur remplace la métrique « Questions » (décision #69). Les métriques « Quiz » et « Parties jouées » n'attendent aucun appel : elles affichent `—` dès l'ouverture (CA-3). ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Part « et de la liste » : l'état de chargement de la liste revient avec l'appel à `games` ; en attendant, la liste est vide sans indicateur (CA-13) |
| CA-5 | En cas d'erreur sur un appel REST, les métriques concernées affichent `—` sans bloquer le reste de l'affichage | Chaque appel gère son erreur indépendamment. S'applique à l'appel `GET /api/v1/questions?limit=1` : sur erreur, « Questions » affiche `—` (décision #69). ⛔ **Bloqué : route `GET /api/v1/quizzes` absente du hub (US-008), à rouvrir quand elle existe.** Part « erreur sur l'appel à `quizzes` » : aucun appel, donc aucune erreur ; le `—` de « Quiz » est celui du CA-3. ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Part « erreur sur l'appel à `games` » : même chose pour « Parties jouées » et la liste (CA-13) |

### Bannière de partie active

| # | Critère | Résultat attendu |
|---|---|---|
| CA-6 | Si `GameStateService.isPiloting()` est `true`, la bannière bleue de partie active est affichée avec le nom du quiz, le statut et la progression (`question_index / total`) | `GameStateService.state()` fournit `gameId`, `status`, `questionIndex`, `quizId`. Exception : en état « Déconnecté », la bannière est absente quel que soit `isPiloting()` (CA-28) |
| CA-7 | Si `GameStateService.isPiloting()` est `false`, la bannière est absente | Aucun élément résiduel dans le DOM |
| CA-8 | Le bouton "Reprendre le pilotage" de la bannière navigue vers `/pilot/lobby` si `status === 'PENDING'`, vers `/pilot/play` si `status` est `OPEN` ou un état `QUESTION_*` | Routage conditionnel sur le signal `GameStateService.status()` |
| CA-9 | La bannière se met à jour en temps réel si une partie est créée ou démarrée depuis un autre onglet | `GameStateService` est mis à jour par `dispatch()` d'un `game_state_sync` complet (US-ANG-001 CA-20 : sync du hub après `auth_success` ou réponse à `request_game_state`) — le composant réagit via `computed`. Un `game_state_sync` sans champs de partie ne touche pas la bannière (US-ANG-001 CA-31) |

### Compteur de buzzers en temps réel

| # | Critère | Résultat attendu |
|---|---|---|
| CA-10 | La métrique "Buzzers connectés" reflète `GameStateService.connectedBuzzers().length` | Mise à jour instantanée sur tout changement du signal — aucun polling : liste initiale par `request_game_state`, puis `buzzer_connected` / `buzzer_disconnected` (US-ANG-001 CA-27 à CA-29). Exceptions : en état « Déconnecté », la métrique affiche `—` (CA-27) ; tant que la liste n'a jamais été reçue, elle affiche `—` aussi (CA-31) |
| CA-11 | Le sous-titre de la métrique liste les usernames des buzzers connectés, séparés par une virgule, tronqués à 3 noms si plus de 3 | Au-delà : `alice, bob, charlie +2` |
| CA-12 | La liste des buzzers connectés dans la carte dédiée se met à jour en temps réel | Même source : `GameStateService.connectedBuzzers()` (usernames, US-ANG-001 CA-30). Pendant une coupure de la socket, la dernière liste reste affichée et « Reconnexion… » (CA-24) signale qu'elle peut être périmée (US-ANG-001 CA-33). En état « Déconnecté », la carte est vide (CA-27), comme tant que la liste n'a jamais été reçue (CA-31) |

### Liste des dernières parties

| # | Critère | Résultat attendu |
|---|---|---|
| CA-13 | ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** La liste affiche les 4 dernières parties avec nom de la partie (quiz name), statut, date formatée | Statut rendu par `StatusBadgeComponent` avec couleur appropriée par statut. En attendant (décision #68) : le widget « Dernières parties » reste visible, sa liste est vide sans aucun message (pas de texte du type « aucune partie ») et `games` n'est pas appelé ; cohérent avec la carte vide du CA-31 |
| CA-14 | ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Un clic sur "Voir" redirige vers `/games/:id/results` si la partie est `COMPLETED` | Navigation Angular Router |
| CA-15 | ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Un clic sur "Voir" redirige vers `/pilot/play` si la partie est `OPEN` ou un état `QUESTION_*` | Navigation Angular Router |
| CA-16 | ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Un clic sur "Voir" redirige vers `/pilot/lobby` si la partie est `PENDING` | Navigation Angular Router |

### Bouton "Nouvelle partie"

| # | Critère | Résultat attendu |
|---|---|---|
| CA-17 | Le bouton "Nouvelle partie" est visible en permanence dans l'en-tête de la page | Toujours présent |
| CA-18 | Si `GameStateService.isPiloting()` est `true`, un clic sur "Nouvelle partie" affiche un toast d'avertissement "Une partie est déjà en cours" et ne navigue pas | Aucune navigation — le toast disparaît après 4 secondes. Exception : en état « Déconnecté », `isPiloting()` est ignoré (CA-29) |
| CA-19 | Si `GameStateService.isPiloting()` est `false`, un clic navigue vers `/games/new` | Navigation Angular Router |

### Navigation latérale

| # | Critère | Résultat attendu |
|---|---|---|
| CA-20 | La sidebar affiche les liens vers Tableau de bord, Thèmes, Questions, Quiz, Jingles, Toutes les parties | Lien actif mis en évidence selon la route courante |
| CA-21 | Les liens du groupe Contenu (Thèmes, Questions, Quiz, Jingles) sont visuellement désactivés et non cliquables si `GameStateService.isPiloting()` est `true` | Style `opacity: 0.4; pointer-events: none` — un tooltip explique "Indisponible pendant une partie". Exception : en état « Déconnecté », `isPiloting()` est ignoré (CA-29) |
| CA-22 | Si une tentative de navigation directe vers une route `/content/*` est effectuée alors qu'une partie est active, `noActiveGameGuard` redirige vers `/pilot/play` | Le guard est évalué par le Router, pas par la sidebar. Exception : en état « Déconnecté », aucune partie n'est connue (CA-29) |

### Statut de connexion serveur

| # | Critère | Résultat attendu |
|---|---|---|
| CA-23 | La topbar affiche l'adresse du serveur et un indicateur vert "Connecté" quand la session est authentifiée : la socket est ouverte et `auth_success` a été reçu | État lu depuis `WebSocketService.isConnected()` (signal), vrai à `auth_success`, faux dès que la socket se ferme. Une socket ouverte dont `auth_success` n'est pas encore reçu n'est pas « Connecté » (CA-24). Le renouvellement de token d'une session déjà authentifiée ne change pas le vert (CA-34) |
| CA-24 | L'indicateur est l'orange "Reconnexion…" dès que l'ouverture de la socket est appelée et tant que `auth_success` n'est pas reçu, quelle qu'en soit la raison : premier démarrage, démarrage avec hub éteint (boucle de reprise, US-ANG-001 CA-9), reprise après coupure. Il l'est aussi pendant l'attente du backoff entre deux tentatives, la reprise étant alors en cours | État lu depuis `WebSocketService.isReconnecting()` (signal) : vrai de l'appel d'ouverture de la socket jusqu'à `auth_success`, d'une tentative à la suivante (reprise indéfinie, US-ANG-001 CA-9) ; jamais vrai en même temps que `isConnected()`. Trois états et pas de quatrième : vert = authentifié (CA-23), rouge « Déconnecté » = cause permanente (CA-26), orange = tout le reste. Au tout premier démarrage, le libellé « Reconnexion… » est un peu imprécis (rien n'a été perdu) : assumé (décision #61) |
| CA-25 | ⛔ **Bloqué : route `GET /api/v1/health` absente du hub (US-020), à rouvrir quand elle existe.** `GET /api/v1/health` est appelé une fois au chargement du composant, sans auth | Affichage discret de la version du serveur dans le footer de la topbar si disponible. En attendant (décision #70) : aucun appel et aucune version affichée ; on ne vise pas `/health`, route du hub qui n'est pas celle du CDC (US-020) |
| CA-26 | Quand aucune socket n'est ouverte et qu'aucune reprise n'est en cours, c'est-à-dire quand l'ouverture de la socket a levé une exception (US-ANG-001 CA-35), au démarrage comme dans la reprise du CA-9, la topbar affiche l'adresse du serveur et un indicateur rouge « Déconnecté » | Troisième état, distinct du vert « Connecté » (CA-23) et de l'orange « Reconnexion… » (CA-24), qui ne changent pas. État lu depuis `WebSocketService.isDisconnected()` (signal), vrai à partir de l'exception et jusqu'au rechargement de l'application : aucune reprise ne le fait retomber |
| CA-27 | En état « Déconnecté », la métrique « Buzzers connectés » affiche `—` (précédent du CA-5), la carte de la liste des buzzers (CA-12) est vide et le sous-titre de la métrique (CA-11) ne liste aucun nom | Vaut dans tous les cas « Déconnecté », y compris après une reprise du CA-9 qui a levé l'exception : aucune dernière liste n'est conservée à l'affichage. Le dashboard n'affiche pas `GameStateService.connectedBuzzers()` dans cet état ; la donnée tenue par le service n'est pas modifiée (US-ANG-001 CA-33 reste valable pour la simple coupure avec reprise en cours, CA-12). Les métriques et la liste issues du REST (CA-1 à CA-5, CA-13 ; certaines sont bloquées ou réduites à un `—` tant que des routes manquent, voir leur marquage) ne dépendent pas de l'état de la socket |
| CA-28 | En état « Déconnecté », la bannière de partie active est absente | Dérogation au CA-6 : la bannière est absente même si `GameStateService.isPiloting()` est `true`, le dashboard ignorant un état périmé. Aucun élément résiduel dans le DOM (CA-7) |
| CA-29 | En état « Déconnecté », le dashboard lit CA-18, CA-21 et CA-22 comme si aucune partie n'était connue, quelle que soit la valeur de `GameStateService.isPiloting()` ou de `state()` | Dérogation au CA-18 : « Nouvelle partie » reste visible (CA-17), n'affiche pas le toast « Une partie est déjà en cours » et navigue vers `/games/new` (CA-19). Dérogation au CA-21 : les liens du groupe Contenu restent actifs. `noActiveGameGuard` (CA-22) est lu de même : aucune redirection vers `/pilot/play`. Un éventuel conflit avec une partie réellement active est arbitré par le hub (réponse 409 `ACTIVE_GAME_EXISTS`, US-010 CA-7 du hub) |
| CA-30 | L'indicateur « Déconnecté » est un libellé seul | Sans action, sans infobulle et sans bouton « Réessayer » : cohérent avec US-ANG-001 CA-35, la cause étant permanente et aucune reprise n'étant tentée |
| CA-31 | Au premier démarrage, tant qu'aucun `game_state_sync` portant `connected_buzzers` n'a été accepté (CA-32), la liste des buzzers est inconnue : la métrique « Buzzers connectés » affiche `—`, la carte de la liste (CA-12) est vide, le sous-titre de la métrique (CA-11) ne liste aucun nom et la bannière est absente | Aligné sur CA-27 et CA-28 : un `0` serait faux tant que la liste est inconnue (précédent du CA-5). Vaut quelle que soit la couleur de l'indicateur, orange (CA-24) ou vert entre `auth_success` et le premier sync. Vaut seulement avant la première liste connue : ensuite CA-12 (dernière liste conservée pendant une coupure) s'applique. Les métriques et la liste issues du REST ne dépendent pas de cet état (CA-5, CA-27) : y compris le `—` des métriques « Quiz » et « Parties jouées » (CA-3) et la liste vide (CA-13) tant que leurs routes sont absentes |
| CA-32 | Ce qui lève l'état du CA-31 : tout `game_state_sync` accepté qui porte `connected_buzzers`, complet ou partiel au sens d'US-ANG-001 CA-31, même si la liste est vide | Liste vide : la métrique affiche alors `0`, correct car la liste est connue. Ne le lèvent pas : un sync sans `connected_buzzers`, un sync rejeté (US-ANG-001 CA-20, décisions #41 à #43, qui ne change rien) ni un `buzzer_connected` ou `buzzer_disconnected` seul. La bannière, elle, dépend toujours d'un sync complet (CA-6, CA-9). Une fois la liste connue, l'état du CA-31 ne retombe jamais (CA-12 s'applique), sauf « Déconnecté » (CA-27), qui prime |
| CA-33 | Si `auth_success` n'arrive jamais (hub éteint avec reprise indéfinie, ou hub qui accepte la socket sans répondre), l'indicateur reste orange « Reconnexion… » sans limite de durée, et le `—` et la carte vide du CA-31 restent | Cohérent avec US-ANG-001 CA-9 (reprise indéfinie). Aucun délai maximal n'est spécifié : ni passage au rouge, ni page d'erreur. Le hub muet après l'ouverture de la socket n'a pas de garde-fou : dette (`DEBTS.md`), décision #63 |
| CA-34 | Pendant le renouvellement de token d'une session authentifiée (`auth_refresh` envoyé, `auth_success` à venir, US-ANG-001 CA-13, CA-14 et CA-32), l'indicateur reste vert « Connecté » | La socket est ouverte et déjà authentifiée : `isReconnecting()` ne dépend que des ouvertures de socket, jamais de `auth_refresh`, et `isConnected()` reste vrai. Un échec du refresh qui ferme la socket (US-ANG-001 CA-15) passe par la reprise, donc par l'orange (CA-24) |

---

## 🔧 Spécifications techniques

Voir [CONVENTIONS-TECHNIQUES-ANGULAR.md](CONVENTIONS-TECHNIQUES-ANGULAR.md) pour la stack complète, les principes et les conventions de code.

### `DashboardComponent` — interface et chargement

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, PaginatorComponent, /* ... */]
})
export class DashboardComponent {
  private readonly questionService = inject(QuestionService);
  protected readonly gs         = inject(GameStateService);
  private readonly router       = inject(Router);

  // Métriques REST
  protected readonly questionCount = signal<number | null>(null);
  protected readonly isLoading     = signal(true);
  // ⛔ Bloqués (route absente du hub, à rouvrir quand elle existe) :
  //   recentGames (GET /api/v1/games, US-010, CA-1 et CA-13 à CA-16) et quizCount
  //   (GET /api/v1/quizzes, US-008, CA-2). En attendant : « Quiz » et « Parties jouées »
  //   affichent `—` sans appel (CA-3), la liste du widget est vide sans message (CA-13).
  //   Pas d'inject(GameService) ni d'inject(QuizService) dans le dashboard tant que bloqué.

  // Computed depuis GameStateService
  protected readonly activeBannerRoute = computed(() => {
    const s = this.gs.status();
    if (!s || s === 'COMPLETED' || s === 'IN_ERROR') return null;
    return s === 'PENDING' ? '/pilot/lobby' : '/pilot/play';
  });

  constructor() {
    this.loadDashboardData();
  }

  // Tant que quizzes est bloqué (CA-2, décision #69) : un seul appel,
  // GET /api/v1/questions?limit=1, dont on lit `total` ; erreur → `—` (CA-5).
  // Le forkJoin { games, quizCount, questionCount } revient à la réouverture,
  // chaque observable protégé par catchError(() => of(null)) (voir « Points de vigilance »).
  private loadDashboardData(): void {
    // La forme exacte de l'appel (filtres, service) est un choix d'implémentation, non observable.
    this.questionService.getAll({ limit: 1 })
      .pipe(map((page) => page.total), takeUntilDestroyed())
      .subscribe({
        next: (total) => {
          this.questionCount.set(total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false) // questionCount reste null → `—`
      });
  }

  protected onNewGameClick(): void {
    if (this.gs.isPiloting()) {
      // afficher toast
      return;
    }
    this.router.navigate(['/games/new']);
  }

  // ⛔ Bloqué avec CA-14 à CA-16 (aucune partie n'est listée tant que `games` est absent)
  protected gameDetailRoute(game: Game): string {
    const s = game.status;
    if (s === 'COMPLETED' || s === 'IN_ERROR') return `/games/${game.id}/results`;
    if (s === 'PENDING') return '/pilot/lobby';
    return '/pilot/play';
  }
}
```

### `GameService` — méthodes utilisées par ce composant

> ⛔ **Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe.** Tant qu'elle est absente, le dashboard n'appelle aucune de ces deux méthodes (CA-1, CA-3, CA-13, décisions #67 et #68). Elles sont décrites pour la réouverture ; `getCount()` est la lecture du total des parties pour « Parties jouées ».

```typescript
// Retourne les N parties les plus récentes (tri serveur, page 1)
getRecent(limit: number): Observable<Game[]>;

// Retourne uniquement le total depuis la réponse paginée (limit=1)
getCount(): Observable<number>;
```

### `WebSocketService` — signals supplémentaires requis

```typescript
// Ajoutés pour l'indicateur de connexion dans la topbar
readonly isConnected    = signal(false);
readonly isReconnecting = signal(false);
// Comportement observable (CA-23, CA-24, CA-34), sans présumer de l'endroit où il est codé :
// - isConnected : vrai à auth_success, faux dès que la socket se ferme ;
// - isReconnecting : vrai de l'appel d'ouverture de la socket (le tout premier compris)
//   jusqu'à auth_success, y compris pendant l'attente du backoff entre deux tentatives ;
//   jamais modifié par auth_refresh ;
// - jamais vrais en même temps.

// État « Déconnecté » (CA-26) : vrai quand l'ouverture de la socket a levé une exception
// (US-ANG-001 CA-35), jamais remis à faux sans rechargement de l'application
readonly isDisconnected = signal(false);
```

### Liste des buzzers « inconnue » ou « vide »

Le dashboard distingue une liste inconnue (aucun `game_state_sync` portant `connected_buzzers` n'a été accepté, CA-31) d'une liste connue et vide (`0`, CA-32). `GameStateService.connectedBuzzers()` vaut `[]` dans les deux cas : l'information « connue ou non » ne s'y lit pas. Sa forme (signal, valeur `null`, autre) n'est pas observable et n'est pas spécifiée : choix d'implémentation, à trancher à la session du dashboard.

### Appels REST au chargement

Le hub n'expose aujourd'hui que les routes `themes`, `questions`, `POST /api/v1/token`, `/ws` et `/health` (squelette, sans version). Les routes `games` (US-010), `quizzes` (US-008) et `GET /api/v1/health` (US-020) y sont absentes : les appels qui les visent sont bloqués et le dashboard ne les émet pas.

| Appel | Endpoint | Justification | État |
|---|---|---|---|
| Dernières parties | `GET /api/v1/games?page=1&limit=4` | 4 lignes dans le widget "Dernières parties" | ⛔ Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe. Aucun appel ; widget visible, liste vide sans message (CA-13) |
| Nombre de quiz | `GET /api/v1/quizzes?page=1&limit=1` → `total` | Métrique dashboard | ⛔ Bloqué : route `GET /api/v1/quizzes` absente du hub (US-008), à rouvrir quand elle existe. Aucun appel ; « Quiz » affiche `—` (CA-3) |
| Nombre de parties jouées | `GET /api/v1/games` → `total` | Métrique dashboard | ⛔ Bloqué : route `GET /api/v1/games` absente du hub (US-010), à rouvrir quand elle existe. Aucun appel ; « Parties jouées » affiche `—` (CA-3) |
| Nombre de questions | `GET /api/v1/questions?limit=1` → `total` | Métrique dashboard | Actif. Appel seul tant que `quizzes` est bloqué ; le `forkJoin` du CA-2 revient à la réouverture (décision #69) |
| Health check | `GET /api/v1/health` | Version serveur — sans Bearer | ⛔ Bloqué : route `GET /api/v1/health` absente du hub (US-020), à rouvrir quand elle existe. Aucun appel, aucune version affichée (CA-25, décision #70) ; `/health` du hub n'est pas visé |

### Format de date affiché

```typescript
// Formatage des dates dans la liste des parties
// Aujourd'hui : "Auj. HH:mm"
// Hier : "Hier HH:mm"
// Autre : "DD MMM" (ex. : "26 mars")
// Basé sur Intl.DateTimeFormat — pas de dépendance externe (YAGNI)
```

### `StatusBadgeComponent` — mapping des statuts

| Statut | Couleur | Libellé |
|---|---|---|
| `PENDING` | Ambre | En attente |
| `OPEN` | Bleu | En cours |
| `QUESTION_TITLE` / `QUESTION_OPEN` / `QUESTION_BUZZED` / `QUESTION_CLOSED` | Bleu | En cours |
| `COMPLETED` | Vert | Terminée |
| `IN_ERROR` | Rouge | Erreur |

---

## 📐 Périmètre

| Inclus | Exclu |
|---|---|
| Chargement des 4 dernières parties et affichage (⛔ bloqué : `games` absent du hub, CA-1 et CA-13 à CA-16) | Pagination de la liste complète (→ US-ANG-006) |
| Métriques quiz, questions, parties, buzzers (⛔ « Quiz » et « Parties jouées » bloquées : `—`, CA-3) | Graphiques ou visualisations avancées (YAGNI) |
| Bannière de partie active avec lien contextuel | Détail de la question en cours sur le dashboard |
| Mise à jour temps réel des buzzers via Signals | Abonnement à d'autres messages WebSocket (→ US-ANG-008/009) |
| Indicateur de connexion WebSocket | Health check détaillé (YAGNI) |
| Navigation contextuelle "Nouvelle partie" | Gestion d'erreur REST avec retry automatique (YAGNI) |
| Désactivation visuelle des liens Contenu si partie active | Blocage router (`noActiveGameGuard` — déjà dans US-ANG-001) |
| Tests unitaires et d'intégration (couverture ≥ 70 %) | Déploiement / CI-CD |

---

## 🔍 Points de vigilance

### `forkJoin` et gestion partielle des erreurs

> ⛔ Applicable à la réouverture de `quizzes` et `games` : tant qu'ils sont bloqués, le dashboard n'appelle que `GET /api/v1/questions?limit=1`, sans `forkJoin` (CA-2, décision #69). L'appel unique gère son erreur seul (`—`, CA-5).

`forkJoin` annule tous les observables si l'un d'eux échoue. Pour afficher les données disponibles même en cas d'erreur partielle, chaque observable doit être protégé par `catchError(() => of(null))` avant d'entrer dans le `forkJoin`. Le composant affiche `—` pour les métriques dont la valeur est `null`.

### Buzzers connectés — source unique de vérité

Le compteur de buzzers ne doit **jamais** être lu depuis la réponse REST `GET /api/v1/games`. Il est exclusivement alimenté par `GameStateService.connectedBuzzers()`, lui-même alimenté par le `game_state_sync` qui répond à `request_game_state` (liste initiale), puis par les événements `buzzer_connected` et `buzzer_disconnected` (US-ANG-001 CA-27 à CA-33). Cette distinction est critique : la réponse REST représente l'état persisté, pas l'état temps réel des connexions. Deux exceptions d'affichage : en état « Déconnecté » (CA-26), le dashboard n'affiche plus cette source (CA-27) ; au premier démarrage, tant qu'aucun `game_state_sync` portant `connected_buzzers` n'a été accepté, il ne l'affiche pas non plus (CA-31, CA-32).

### Indicateur de connexion : trois états, deux fenêtres qui ne coïncident pas

L'indicateur suit le signal `WebSocketService.isConnected()` (vert, authentifié), `isReconnecting()` (orange, de l'appel d'ouverture de la socket jusqu'à `auth_success`, backoff compris) ou `isDisconnected()` (rouge, cause permanente, CA-26) : il n'y a pas de quatrième état (CA-24). Deux fenêtres sont voisines mais distinctes : l'orange dure jusqu'à `auth_success`, le `—` des buzzers jusqu'au premier `game_state_sync` portant `connected_buzzers` (CA-31, CA-32). Entre les deux, l'indicateur est vert et la métrique affiche encore `—` ; Angular envoie `request_game_state` à chaque `auth_success` (US-ANG-001 CA-32), la fenêtre est donc courte quand le hub répond. Elle ne l'est pas quand le hub réel envoie `connected_buzzers` en objets : le sync est rejeté (US-ANG-001 CA-30, décision #41) et le `—` reste jusqu'à la correction du hub (`DEBTS.md`). Un `4004` mène à `/error`, pas au dashboard : il ne produit aucun état de l'indicateur.

### Bannière et `game_state_sync`

La bannière réagit à `GameStateService.isPiloting()` qui est un `computed` dérivé de `GameStateService.status()`. Ce signal est mis à jour lors de chaque `game_state_sync` complet reçu via WebSocket (un sync sans champs de partie ne le modifie pas, US-ANG-001 CA-31). Il n'est pas nécessaire d'écouter les événements WebSocket dans `DashboardComponent` — la réactivité est assurée par la chaîne Signal → `computed` → template `@if`.

### État « Déconnecté » et état périmé de `GameStateService`

Après une reprise du CA-9 dont l'ouverture lève l'exception (US-ANG-001 CA-35), `GameStateService` garde la dernière liste de buzzers et la dernière partie (US-ANG-001 CA-33 ne touche à rien à la fermeture) : `isPiloting()` peut rester `true`. En état « Déconnecté », le dashboard ignore ces données (CA-27 à CA-29) au lieu de les effacer : le service n'est pas modifié. Au démarrage (exception avant toute socket), le service est vide et le cas ne se pose pas.

### Accès sans auth à `GET /api/v1/health`

> ⛔ **Bloqué : route `GET /api/v1/health` absente du hub (US-020), à rouvrir quand elle existe.** Aucun appel n'est émis tant qu'elle est absente (CA-25, décision #70) : ce qui suit vaut à la réouverture.

`GET /api/v1/health` est un endpoint public qui ne nécessite pas de Bearer token. L'`authInterceptor` n'injecte le header que si `AuthService.getToken()` retourne une valeur non-null — le health check, appelé sans token explicite, recevra quand même le header si le token est disponible. Ce comportement est acceptable : le serveur ignore le header sur cet endpoint.

---

## 🔗 Documents liés

| Document | Contenu |
|---|---|
| [VISION.md](https://github.com/ODehel/quiz-live-server/blob/main/docs/shared/VISION.md) | Description complète du projet |
| [CONVENTIONS-TECHNIQUES-ANGULAR.md](CONVENTIONS-TECHNIQUES-ANGULAR.md) | Stack, principes, conventions de code |
| [US-ANG-001 — Initialisation](US-ANG-001-init-session.md) | `AuthService`, `WebSocketService`, `GameStateService` |
| [US-010 — CRUD des parties (serveur)](https://github.com/ODehel/quiz-live-server/blob/main/docs/specs/US-010-game-crud.md) | Format `GET /api/v1/games` (route absente du hub : CA-1, CA-3, CA-13 à CA-16 bloqués) |
| [US-020 — Health check (serveur)](https://github.com/ODehel/quiz-live-server/blob/main/docs/specs/US-020-health-check.md) | Format `GET /api/v1/health` (route absente du hub : CA-25 bloqué) |

---

**Dernière mise à jour** : 2026-11-24
**Statut** : Spécifiée, non implémentée (le dashboard n'est qu'une coquille). Bloqués (route absente du hub) : CA-1, CA-13 à CA-16 (`games`, US-010) et CA-25 (`/api/v1/health`, US-020), en entier ; CA-2 (`forkJoin`, `quizzes` US-008), CA-3, CA-4 et CA-5 pour leur part « Quiz », « Parties jouées » et liste. Non bloqué : l'appel `GET /api/v1/questions?limit=1` et la métrique « Questions »
**Sprint** : 1

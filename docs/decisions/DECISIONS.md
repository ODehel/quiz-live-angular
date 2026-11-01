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

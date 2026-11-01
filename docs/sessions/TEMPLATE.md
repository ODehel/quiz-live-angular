# Handoff : <titre de la session>

> Le handoff est une hypothèse de continuité, pas l'état réel. La prochaine ouverture
> le confronte au réel (`git status`, `git log`, tests).

## Session
- **Titre** (= titre du commit) : `<type(scope): description>`
- **HEAD de départ** : `<sha>`
- **HEAD d'arrivée** : `<sha>`

## Résultat des vérifications
| Vérification | Résultat |
|---|---|
| Tests | |
| Type-check | |
| Lint | |
| Mutations | |

## Diff de `DEBTS.md`
```diff
<diff, ou « aucun changement »>
```

## Leçons de méthode
- <ce qui a bien marché, ce qui a coincé, ce qu'on change>

## Prochaine cible proposée
<cible, US ou CA visés, et pourquoi>

## Matrice CA × couches : <US-XXX>
> Recalculée sur le réel à chaque clôture. Jamais recopiée du handoff précédent.
> Colonnes propres à chaque dépôt. Angular : **Service** (testé en isolation), **Câblage**
> (`app.config.ts`, providers), **Guards** (guards et routing dans `app.routes.ts`).

Règles de relevé :
- Partir du réel : `git diff --stat <HEAD de départ>..HEAD`, puis un `grep` hors specs des symboles propres à chaque CA. Zéro occurrence = ❌ au câblage.
- Associer un CA à un test par les **titres des tests** et le dire dans la note (aucun libellé `CA-n` dans les specs).
- ✅ testé à cette couche · 🟡 partiel · ❌ à faire · — non applicable.
- Dire ce qui est lu mais non exécuté (navigateur, hub réel).

| CA | Service | Câblage | Guards | Note |
|---|---|---|---|---|
| CA-1 | | | | |
| CA-2 | | | | |

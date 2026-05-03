# Quiz Buzzer — Inventaire des écrans & décisions

> État du prototypage et règles métier validées.
> **MISE À JOUR** : 22 maquettes complètes (terminées le 27 avril 2026)

---

## 1. Métier — Règles fondamentales

### Architecture du système

L'application Quiz Buzzer comprend 4 composants :

1. **Buzzers ESP32-S3** (matériel) — boîtiers physiques avec NFC reader, 4 boutons physiques, LED RGB programmable
2. **Application Android NFC** — pour configurer les badges joueurs avant la partie
3. **Application Angular maître de jeu** — l'interface qu'on a maquettée (sujet de ce document)
4. **Serveur Node.js hub** — orchestration WebSocket entre buzzers et app maître de jeu

### Contraintes hardware → règles UX

| Contrainte | Conséquence |
|---|---|
| **10 buzzers max** | 10 joueurs max par partie. Layout des écrans calibré pour 10. |
| **4 boutons par buzzer** | **Maximum 4 propositions** dans une question MCQ (pas 6, pas 8). |
| **LED RGB par buzzer** | Chaque buzzer a une couleur unique. 10 couleurs harmonieuses définies (voir design system). |
| **NFC reader sur buzzer** | Onboarding par scan de badge personnel. Lobby = écran d'attente NFC. |

### Types de questions

**MCQ (Multiple Choice Questions)** :
- 2 à 4 propositions
- Vote silencieux par bouton physique du buzzer
- Le maître de jeu valide la fin du vote (ou le chrono le fait automatiquement)
- Les joueurs corrects gagnent les points de la question

**SPEED (Buzz)** :
- Réponse libre, donnée **oralement**
- Premier qui buzze a la main pour répondre
- Le maître de jeu juge à l'oreille (pas de comparaison automatique)
- Les "formulations équivalentes" saisies dans le formulaire sont une **aide-mémoire** pour le maître de jeu, pas une règle de validation système
- Si validé : le joueur prend les points. Si invalidé : on continue (selon paramètres : autres peuvent buzzer, ou on passe).

### Statuts de quiz

- **Brouillon** (ambre) — incomplet, ne peut pas être lancé
- **Prêt** (vert) — peut être lancé pour une partie
- **Archivé** (gris, opacité 55%) — historique, restauration possible

### Statuts de question dans le pilotage

- **PENDING** (avant d'être ouverte)
- **QUESTION_OPEN** (en cours de vote/buzz)
- **QUESTION_CLOSED** (vote fermé, en attente de correction)
- **CORRECTED** (correction terminée)

### Points et scoring

- Plage 50-500 pts par question, paliers de 50
- Tous les joueurs corrects en MCQ reçoivent les points (pas de bonus rapidité explicite — mais ça pourrait être ajouté)
- En SPEED, seul le buzzer validé gagne

---

## 2. Décisions de design validées

### Identité visuelle

- **Mode dark par défaut**, light optionnel
- **3 accents** : violet primary `#9d6bff`, cyan secondary `#4dd4e8`, magenta vivid `#ff4d8f`
- **Typographie** : Geist (UI) + Bricolage Grotesque (display) + Geist Mono
- Style : "moderne, géométrique, énergique"

### Sidebar

- **Largeur fixe 252px**
- **Sous-navigation latérale** dans Contenu (pas de tabs en haut de page)
- Item parent expandable avec sous-items indentés
- État "active-game-card" épinglé en haut quand une partie est en cours

### Listes du backoffice

- **Format cards** uniforme pour Questions / Quiz / Thèmes
- **Format hybride** pour Jingles : cards avec waveform inline
- Filtres inline en haut + popover pour avancés
- 5 dots colorés pour les niveaux (pas étoiles)

### Pilotage

- Sidebar visible en mode normal (pas masquée pour l'immersion)
- Footer avec actions du maître de jeu
- Chrono = **gauge horizontale** (jamais circulaire)
- En MCQ : visible dans cards de choix avec pastilles voters + temps de réponse
- En SPEED : spotlight central + bandeau des autres joueurs

### Couleurs des buzzers

- **10 couleurs distinctes** harmonieuses sur fond sombre
- Cyan / Bleu / Violet / Magenta / Corail / Ambre / Lime / Vert / Turquoise / Indigo
- Chaque slot/avatar/pastille reprend la couleur du buzzer

### Catégories de jingles

- **8 catégories fixes prédéfinies** (pas libres) : Intro / Question / Suspense / Bonne réponse / Mauvaise réponse / Transition / Victoire / Outro
- Chaque catégorie a sa couleur dédiée
- Filtre rapide par chips horizontales

### Composer de quiz

- **Dual-pane** : banque (gauche) + quiz en composition (droite)
- Ajout par bouton "+" depuis la banque
- Réorganisation par drag-and-drop dans le quiz
- Cards aérées des deux côtés
- Stats bar sticky en haut (composition live)

### Création de partie

- **2 écrans distincts** : Setup → Lobby
- Stepper visuel 3 étapes (Setup / Lobby / Pilotage)
- Setup en colonne unique max-width 920px
- Lobby en grille 5x2 (10 joueurs max)

### Formulaire question

- Layout **2 colonnes** : formulaire (1.4fr) + aperçu live (1fr)
- Toggle MCQ/SPEED en grandes cards visuelles
- Sections numérotées "Étape 1/2/3/4"
- Footer fixe avec sauvegarde auto + actions

### Choix MCQ et boutons buzzer

- **Maximum 4 propositions** (contrainte hardware : 4 boutons physiques)
- **Pas de comparaison automatique** en SPEED — le maître de jeu juge oralement
- Les "formulations équivalentes" sont un aide-mémoire visuel pour le maître de jeu

### États des votants en MCQ closed

3 catégories distinctes :
- **Gagnants** : pastille verte avec badge `+pts`
- **Perdants** : pastille grisée avec X rouge
- **Non-votants** : section dédiée séparée avec badge `0 pt`

### Écrans d'erreur

**Page d'erreur générique** avec 4 variantes contextuelle (plutôt qu'une page par erreur) :
- `404` (Page non trouvée) — violet neutre
- `connection-lost` (Connexion au hub perdue) — ambre, tentative de reconnexion auto
- `server-error` (Erreur serveur 500) — rouge, incident enregistré
- `game-corrupted` (Partie corrompue) — rouge critique, scores conservés

Chaque variante affiche :
- Icône d'erreur + eyebrow + titre + message
- Encart contextuel avec détails (code, timestamps, request ID)
- Actions : "Réessayer" + "Retour accueil"
- Panneau "Détails techniques" dépliable pour diagnostic

### Modales de confirmation

**Modale générique réutilisable** avec 3 variantes :
- `destructive` (rouge) — annulation de partie, suppression quiz, reset scores
  - Inclut **confirmation par typing** pour les cas ultra-critiques ("Tapez ANNULER pour confirmer")
  - Affiche contexte détaillé (progression, joueurs, scores perdus)
- `warning` (ambre) — quitter sans sauvegarder, perte de données récupérable
  - Modification + boutons "Continuer" / "Quitter quand même"
- `info` (cyan/violet) — choix neutre comme "Lancer la partie maintenant ?"
  - Confirmer un choix sans appréhension

Comportement :
- Modal centrée, overlay sombre + flou de l'arrière-plan
- Fermeture via Esc ou bouton de croix
- Animations smooth (scale + fade)

### Toasts & notifications

**Stack en bas-droite**, **auto-dismiss ~5s avec barre de progression visible**.

4 variantes visuelles :
- `success` (vert) — "Hugo s'est connecté", "Quiz sauvegardé"
- `info` (cyan) — "3 joueurs ont rejoint", événements neutres
- `warning` (ambre) — "Buzzer batterie faible", alertes non-bloquantes
- `error` (rouge) — "Échec connexion hub", erreurs récupérables + "Tentative 2/5"

Caractéristiques :
- Liseré coloré 3px à gauche (pas en haut)
- Barre de progression 2px en bas qui se réduit sur 5s
- Icône + titre + description + actions optionnelles
- Toast avec **avatar joueur** pour connexions (couleur buzzer + lettre + badge de statut)
- Boutons d'action : "Annuler" (undo), "Réessayer", "Voir détails"
- Animations : slide-in depuis la droite + stagger sequencé (les plus anciens en haut, plus pâles)

Gestion du cycle de vie :
- Auto-dismiss pour `success` et `info` (durée configurable, défaut 5s)
- Persistant pour `warning` et `error` (l'utilisateur doit fermer ou cliquer une action)
- Fermeture manuelle via bouton ✕

---

## 3. Inventaire des écrans — COMPLET

### ✅ Tous les écrans maquettés et validés (22 maquettes)

| # | Écran | Fichier HTML | Type | Notes |
|---|---|---|---|---|
| 1 | Foundations / design system | `quiz-buzzer-fondations.html` | Système | Palette, typographie, composants |
| 2 | Shell complet (sidebar + topbar) | `quiz-buzzer-shell.html` | Layout | Pattern réutilisé partout |
| 3 | Dashboard | `quiz-buzzer-dashboard.html` | Page | Vue d'accueil maître de jeu |
| 4 | Liste des questions | `quiz-buzzer-questions-list.html` | Page | Cards 3 par ligne, filtres inline + popover |
| 5 | Liste des quiz | `quiz-buzzer-quiz-list.html` | Page | Cards 3 par ligne avec mini-graph composition |
| 6 | Liste des thèmes | `quiz-buzzer-themes-list.html` | Page | Cards avec icônes Lucide, modal de création |
| 7 | Liste des jingles | `quiz-buzzer-jingles-list.html` | Page | Cards avec waveform SVG, catégories chips |
| 8 | Formulaire question MCQ | `quiz-buzzer-question-form.html` | Page | 2 colonnes formulaire + aperçu live |
| 9 | Formulaire question SPEED | `quiz-buzzer-question-form-speed.html` | Page | Variante avec formulations équivalentes |
| 10 | Quiz composer | `quiz-buzzer-quiz-composer.html` | Page | Dual-pane drag-and-drop, stats sticky |
| 11 | Setup partie | `quiz-buzzer-game-setup.html` | Page | Sélection quiz + paramètres + options |
| 12 | Lobby (10 joueurs final) | `quiz-buzzer-lobby-10p.html` | Page | Grille 5x2, palette 10 couleurs, NFC wait |
| 13 | **Pilotage SPEED open** | `quiz-buzzer-pilotage-speed-open.html` | Pilotage | 10 joueurs ready, attente du buzz |
| 14 | **Pilotage SPEED après buzz** | `quiz-buzzer-pilotage-speed-buzzed.html` | Pilotage | Spotlight central, aide à la décision |
| 15 | **Pilotage MCQ open** | `quiz-buzzer-pilotage-mcq-open.html` | Pilotage | 7/10 votes, pastilles dans cards |
| 16 | **Pilotage MCQ closed** | `quiz-buzzer-pilotage-mcq-closed.html` | Pilotage | Correction, gagnants verts, non-votants |
| 17 | **Transition entre questions** | `quiz-buzzer-pilotage-transition.html` | Pilotage | Recap Q.8 + aperçu Q.9 + actions maître |
| 18 | **Ranking intermédiaire** | `quiz-buzzer-pilotage-ranking.html` | Pilotage | Overlay fullscreen, classement après chaque Q |
| 19 | **Résultats finaux** | `quiz-buzzer-pilotage-results.html` | Pilotage | Podium 3D (Charlie/Nina/Maya) + table 4-10 |
| 20 | **Page d'erreur** | `quiz-buzzer-error-page.html` | Overlay | 4 variantes : 404, connection-lost, server-error, game-corrupted |
| 21 | **Modale de confirmation** | `quiz-buzzer-modal-confirmation.html` | Overlay | 3 variantes : destructive, warning, info + typing |
| 22 | **Toasts & notifications** | `quiz-buzzer-toasts.html` | Overlay | Stack bas-droite, 4 variantes, auto-dismiss 5s |

---

## 4. Continuité narrative des maquettes

Pour cohérence pédagogique, les maquettes runtime suivent un même quiz :

- **Quiz** : "Soirée découverte du monde" (12 questions, 8 MCQ + 4 SPEED, durée ~8'30)
- **10 joueurs** : Charlie (b1, cyan), Théo (b2, bleu), Nina (b3, violet, leader), Maya (b4, magenta), Léo (b5, corail), Sam (b6, ambre), Emma (b7, lime), Hugo (b8, vert), Zoé (b9, turquoise), Ali (b10, indigo, dernier)

### Scénario des questions 7-8 (en cours dans pilotage)

- **Question 7** (SPEED Cinéma, "Quel est ce film d'auteur sorti en 1995 ?", réponse Pulp Fiction)
  - Open : tous prêts, chrono à 18s/30s, aucun buzz
  - Buzzed : Ali (dernier au classement, indigo) buzze à 1.34s

- **Question 8** (MCQ Géographie, "Quelle est la capitale de l'Australie ?", réponse Canberra)
  - Open : 7/10 votes, chrono à 12s/30s
  - Closed : 3 gagnants (Nina, Léo, Sam), 4 perdants, 3 non-votants
  - **Scores après Q.8** : Nina 1450, Maya 1300, Charlie 1200, Léo 1100, Théo 950, Emma 850, Sam 800, Hugo 650, Zoé 500, Ali 350

### Scénario des questions 9-12 (vers les résultats)

- **Question 9** (SPEED Histoire, 25s, 250pts) — Léo buzze et gagne
- **Question 10** (MCQ Sciences, 200pts) — Nina, Maya, Théo, Charlie correctes
- **Question 11** (SPEED Cinéma, 30s, 300pts, niveau 5) — Charlie buzze et gagne
- **Question 12** (MCQ Musique, 150pts) — Nina, Maya, Charlie, Hugo correctes

### Classement final (pour l'écran Résultats)

| Rang | Joueur | Score | Fun fact |
|---|---|---|---|
| 1 | **Charlie** | 1850 | Spécialiste du buzz tardif — 3 SPEED gagnés en fin de partie |
| 2 | **Nina** | 1800 | Reine du MCQ — 8 bonnes réponses sur 8 |
| 3 | **Maya** | 1650 | La plus régulière — toujours dans le top 3 |
| 4 | Léo | 1350 | +250 (jump) |
| 5 | Théo | 1150 | +200 |
| 6 | Emma | 850 | 0 (stable) |
| 7 | Sam | 800 | 0 (stable) — ex-aequo avec Hugo |
| 8 | Hugo | 800 | +150 (rejoint Sam) — ex-aequo avec Sam |
| 9 | Zoé | 500 | 0 (stable) |
| 10 | Ali | 350 | 0 (stable) |

Cette continuité permet aux maquettes de se lire comme une histoire — utile pour valider que les transitions sont naturelles.

---

## 5. Points en suspens / questions ouvertes

À discuter ou à décider lors de l'implémentation :

1. **Bouton "Lancer une partie" depuis le composer** : raccourci vers Setup ou directement vers Lobby ?
2. **Bouton "Aperçu" sur la card quiz dans Setup** : montrerait quoi (preview du déroulé ? liste des questions ?)
3. **Question bonus en cas d'égalité finale** : règles précises non définies
4. **Mélange de l'ordre des questions** : option dans Setup, pas encore d'écran qui le matérialise
5. **Bouton "Annuler ce buzz" en SPEED** : cas d'usage à clarifier (faux buzz / bug NFC ?)
6. **Skip joueur** : peut-on exclure un joueur en cours de partie ? Pas encore défini.
7. **Reprise de partie après crash** : pas encore couvert dans les maquettes
8. **Mode rejouage / replay** : pas encore exploré
9. **Statistiques de partie / historique** : non maquettées
10. **Light mode** : décidé en option mais pas maquetté

---

## 6. Comment réutiliser ces maquettes

### Pour démarrer l'implémentation Angular

1. Ouvrir le fichier HTML pertinent dans le navigateur
2. Inspecter le code source pour récupérer **structures HTML et CSS exactes**
3. Reproduire les **variables CSS** dans un fichier global (ex: `styles/_tokens.scss`)
4. Construire les **composants Angular** correspondants (voir Doc 3)

### Pour valider un nouvel écran

Si un écran n'est pas dans l'inventaire :
1. Vérifier qu'il s'inscrit dans la grammaire des écrans existants
2. Réutiliser les patterns identifiés (cards, slots, footer fixe, etc.)
3. Garder les couleurs de buzzers cohérentes
4. Suivre les règles d'animation et de spacing

### Pour modifier le design

Toute modification du design system doit être documentée :
- Mise à jour du Doc 1 (tokens)
- Mise à jour du Doc 2 (décisions validées)
- Régénération des maquettes impactées si visuellement significatif

---

## 7. Fichiers générés (27 avril 2026)

Tous les fichiers HTML maquettés sont disponibles dans `/mnt/user-data/outputs/` :

**Filtrées par catégorie** :

**Pages backoffice** : `quiz-buzzer-{dashboard, questions-list, quiz-list, themes-list, jingles-list, question-form, question-form-speed, quiz-composer, game-setup, lobby-10p}.html`

**Écrans pilotage runtime** : `quiz-buzzer-pilotage-{speed-open, speed-buzzed, mcq-open, mcq-closed, transition, ranking, results}.html`

**Overlays / patterns** : `quiz-buzzer-{error-page, modal-confirmation, toasts}.html`

**Système & layout** : `quiz-buzzer-{fondations, shell}.html`

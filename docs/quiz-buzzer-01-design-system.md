# Quiz Buzzer — Design System

> Document de référence pour l'implémentation Angular.
> Toutes les valeurs de ce document ont été validées au cours du prototypage HTML.
> **MISE À JOUR** : Sections 14-16 ajoutées pour toasts, modales et patterns d'erreur.

---

## 1. Philosophie de design

**Ambiance hybride** : sober pour le backoffice (admin/contenu), énergétique pour le pilotage (runtime).

**Mode dark par défaut**, light mode optionnel à prévoir.

**Cible** : PC/laptop principalement (le pilotage est piloté par le maître de jeu sur son écran personnel — pas de display public prévu).

**Typographie hiérarchique** :
- Geist (UI body, sans-serif moderne)
- Bricolage Grotesque (display, titres, chiffres importants — variable font)
- Geist Mono (techniques, codes, métadonnées)

---

## 2. Tokens CSS — Mode sombre

### Couleurs de base

```css
:root {
  /* Backgrounds */
  --bg-base: #0b0a10;          /* Fond global, near-black teinté violet */
  --bg-surface: #141221;        /* Cards, panels */
  --bg-surface-2: #1c192e;      /* Élements internes aux cards */
  --bg-surface-3: #252238;      /* Élements internes plus profonds */

  /* Texts */
  --text-primary: #f4f3f8;
  --text-secondary: #a8a3bd;
  --text-muted: #6b6680;

  /* Borders */
  --border-subtle: #2a2740;
  --border-default: #3a3654;
  --border-strong: #4f4a70;
}
```

### Accents (couleurs de marque)

```css
:root {
  --accent-primary: #9d6bff;          /* Violet — couleur principale */
  --accent-primary-hover: #8a52ff;
  --accent-primary-soft: rgba(157, 107, 255, 0.12);
  --accent-primary-glow: rgba(157, 107, 255, 0.35);

  --accent-secondary: #4dd4e8;        /* Cyan — info, liens */
  --accent-secondary-soft: rgba(77, 212, 232, 0.12);
  --accent-secondary-glow: rgba(77, 212, 232, 0.35);

  --accent-vivid: #ff4d8f;            /* Magenta — moments forts, SPEED, points */
  --accent-vivid-soft: rgba(255, 77, 143, 0.15);
  --accent-vivid-glow: rgba(255, 77, 143, 0.35);
}
```

### Sémantiques

```css
:root {
  --semantic-success: #4ade80;        /* Vert — bonne réponse, validation */
  --semantic-success-soft: rgba(74, 222, 128, 0.12);
  --semantic-success-glow: rgba(74, 222, 128, 0.4);

  --semantic-warning: #fbbf24;        /* Ambre — brouillon, alertes douces */
  --semantic-warning-soft: rgba(251, 191, 36, 0.12);
  --semantic-warning-glow: rgba(251, 191, 36, 0.35);

  --semantic-danger: #ef4444;         /* Rouge — invalidation, suppression */
  --semantic-danger-soft: rgba(239, 68, 68, 0.12);
  --semantic-danger-glow: rgba(239, 68, 68, 0.35);

  --semantic-critical: #dc2626;       /* Rouge sombre — critiques (partie corrompue) */
  --semantic-critical-soft: rgba(220, 38, 38, 0.15);
  --semantic-critical-glow: rgba(220, 38, 38, 0.4);
}
```

### Couleurs des niveaux de difficulté (1 à 5)

```css
:root {
  --level-1: #4dd4e8;   /* cyan, plus doux */
  --level-2: #6ba6f0;
  --level-3: #9d6bff;
  --level-4: #d946ef;
  --level-5: #ff4d8f;   /* magenta, plus intense */
}
```

Utilisé dans : mini-graph de composition (liste quiz, composer), dots de niveau dans questions/quiz.

### Couleurs des 10 buzzers

> **Règle métier** : il y a jusqu'à 10 buzzers physiques, donc 10 joueurs maximum par partie.
> Chaque buzzer a une couleur LED unique qui sert d'identifiant visuel partout dans l'app.

```css
:root {
  --buzzer-1:  #4dd4e8;   /* Cyan      */
  --buzzer-2:  #5b8def;   /* Bleu      */
  --buzzer-3:  #9d6bff;   /* Violet    */
  --buzzer-4:  #ff4d8f;   /* Magenta   */
  --buzzer-5:  #ff7a59;   /* Corail    */
  --buzzer-6:  #fbbf24;   /* Ambre     */
  --buzzer-7:  #a3e635;   /* Lime      */
  --buzzer-8:  #4ade80;   /* Vert      */
  --buzzer-9:  #34d399;   /* Turquoise */
  --buzzer-10: #7c5cf5;   /* Indigo    */
}
```

Glows dérivés :

```css
--buzzer-1-glow:  rgba(77, 212, 232, 0.4);
--buzzer-2-glow:  rgba(91, 141, 239, 0.4);
--buzzer-3-glow:  rgba(157, 107, 255, 0.4);
--buzzer-4-glow:  rgba(255, 77, 143, 0.4);
--buzzer-5-glow:  rgba(255, 122, 89, 0.4);
--buzzer-6-glow:  rgba(251, 191, 36, 0.4);
--buzzer-7-glow:  rgba(163, 230, 53, 0.4);
--buzzer-8-glow:  rgba(74, 222, 128, 0.4);
--buzzer-9-glow:  rgba(52, 211, 153, 0.4);
--buzzer-10-glow: rgba(124, 92, 245, 0.4);
```

### Catégories de jingles (8 fixes)

Ces catégories sont **prédéfinies** et se mappent aux moments naturels d'une partie.

```css
:root {
  --cat-intro:      #4ade80;   /* Vert vif      */
  --cat-question:   #4dd4e8;   /* Cyan          */
  --cat-suspense:   #fbbf24;   /* Ambre         */
  --cat-correct:    #22d985;   /* Vert succès   */
  --cat-wrong:      #f87171;   /* Rouge         */
  --cat-transition: #b8a4ff;   /* Violet doux   */
  --cat-victory:    #d946ef;   /* Violet vif    */
  --cat-outro:      #8b8499;   /* Gris          */
}
```

---

## 3. Typographie

### Familles

```css
--font-ui: "Geist", system-ui, sans-serif;
--font-display: "Bricolage Grotesque", "Geist", sans-serif;
--font-mono: "Geist Mono", "Menlo", monospace;
```

### Import Google Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap" rel="stylesheet">
```

### Échelle d'usage

| Élément | Famille | Taille | Weight |
|---|---|---|---|
| Titres de page (H1 dashboard) | display | 32px | 700 |
| Titres d'écran (Lobby, etc.) | display | 26-32px | 700 |
| Titres de section | display | 16-18px | 600 |
| Titres de cards | display | 14-22px | 600 |
| Body text | ui | 14px | 400 |
| Subtitle / desc | ui | 12-13px | 400 |
| Labels (eyebrow, mono) | mono | 10-12px | 500 |
| Compteurs / chiffres | display | varie | 700 |
| Codes / IDs | mono | 10-13px | 400 |

### Letter-spacing

- Titres display : `-0.02em` à `-0.03em` (resserré)
- Body Geist : default
- Mono uppercase : `0.1em` à `0.15em` (aéré)

---

## 4. Layout & Shell

### Variables structurelles

```css
--sidebar-width: 252px;
--topbar-height: 52px;
```

### Structure générale (toutes pages)

```
┌─────────┬───────────────────────────────────┐
│ SIDEBAR │ TOPBAR (sticky)                   │
│  252px  ├───────────────────────────────────┤
│         │ CONTENT                            │
│ sticky  │  (max-width selon contexte)       │
│ 100vh   │                                    │
│         ├───────────────────────────────────┤
│         │ FOOTER FIXE (si nécessaire)       │
└─────────┴───────────────────────────────────┘
```

### Max-widths du content

- Backoffice listes : pleine largeur (auto-fill grid)
- Setup partie : **920px max-width centré** (focalisé)
- Lobby / Pilotage : **1100-1400px max-width centré**
- Formulaires : pleine largeur (les colonnes internes gèrent la lecture)

### Background ambiant

Toutes les pages utilisent un fond avec **2 radial gradients** subtils, pour donner de la profondeur :

```css
.app {
  background-image:
    radial-gradient(ellipse 80% 60% at 50% -10%, var(--accent-primary-soft), transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 100%, var(--accent-secondary-soft), transparent 60%);
  background-attachment: fixed;
}
```

Variantes contextuelles :
- **MCQ closed** : remplacer le 1er gradient par `rgba(74, 222, 128, 0.12)` (teinté vert)
- **SPEED après buzz** : 1er gradient avec couleur du buzzeur (ex: indigo)
- **Résultats finaux** : gradient or + violet + magenta pour l'ambiance festive

---

## 5. Sidebar

### Structure

```
SIDEBAR-HEADER (logo + brand)
  ↓
[active-game-card] (visible uniquement si partie en cours)
  ↓
SIDEBAR-NAV
  - Group "Général" → Tableau de bord
  - Group "Contenu" → Item parent expandable avec sous-items
    └─ Thèmes / Questions / Quiz / Jingles (avec compteurs)
  - Group "Parties" → Toutes les parties / Nouvelle partie / Pilotage
  ↓
SIDEBAR-FOOTER (user-card)
```

### Logo

Carré 36x36 avec **gradient violet → magenta** :

```css
background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-vivid) 100%);
box-shadow: 0 4px 12px var(--accent-primary-glow);
border-radius: 8px;
```

Icône Lucide `zap` blanche au centre.

### Brand

- "Quiz Buzzer" en `font-display`, 18px, 700, letter-spacing -0.02em
- Tagline "Hub de pilotage" en `font-mono`, 10px, uppercase, letter-spacing 0.12em

### Navigation : items et sous-items

Item normal :
- Padding 8-10px horizontal, 8px vertical
- Font 13px, weight 400-500
- Color `--text-secondary`, icône 14px
- Hover : background `--bg-surface-2`, color `--text-primary`
- Radius 7-8px

Item active :
- Background `--accent-primary-soft`
- Color `--accent-primary`
- Accent left border 3px (optionnel)

Sous-item :
- Indent 16px à gauche (padding-left)
- Font 12px
- Moins de poids visuel que parent

---

## 6. Topbar

### Layout

```
[Active game card (si partie en cours)] | Title + breadcrumb | Actions dropdowns
```

### Titre + meta

- Font display, 13-14px
- Color secondary
- Breadcrumb : `Pilotage · Soirée découverte · Q.8/12`

### Pills / badges

- Background surface, border 1px subtle
- Font mono 10px uppercase, color muted
- Padding 4px 10px
- Border-radius 999px

Variante "live" :
- Background success-soft, border rgba(success, 0.3)
- Color success
- Pulsing dot avant le texte

---

## 7. Composants de base

### Cards

```css
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: 12-14px;
padding: 16-20px;
display: flex;
flex-direction: column;
gap: 12-16px;
```

Hover (si interactive) :
- Border `--border-default`
- Box-shadow 0 8px 24px rgba(0,0,0,0.2)
- Transform translateY(-2px)

### Tags / chips

Fond soft de la variante colorée, border 1px semi-transparent, padding 3-4px 8-10px, border-radius 6px.

- **Primary** (violet) : background `--accent-primary-soft`, border `rgba(primary, 0.25)`, color `--accent-primary`
- **Secondary** (cyan) : background `--accent-secondary-soft`, border `rgba(cyan, 0.25)`, color `--accent-secondary`
- **Success** : background `--semantic-success-soft`, border `rgba(green, 0.3)`, color `--semantic-success`
- **Warning** : background `--semantic-warning-soft`, border `rgba(amber, 0.3)`, color `--semantic-warning`
- **Danger** : background `--semantic-danger-soft`, border `rgba(red, 0.3)`, color `--semantic-danger`

---

## 8. Boutons

### Boutons standard

Padding 10-11px 16-18px, border-radius 8-10px, font-weight 500-600.

**Variantes** :

- **Default** : background `--bg-surface-2`, border `--border-default`, color `--text-primary`
  - Hover : background `--bg-surface-3`, border `--border-strong`

- **Primary** : background `--accent-primary`, border transparent, color white
  - Hover : box-shadow 0 0 24px `--accent-primary-glow`, transform translateY(-1px)
  - Disabled : opacity 0.4, cursor not-allowed

- **Vivid** (SPEED actions) : background `--accent-vivid`, color white

### Décision buttons (Valider / Invalider en SPEED après buzz)

Plus gros que les boutons standard :
- Font display 16px bold
- Padding 16px
- Border-radius 12px
- Layout grid 1fr 1fr
- "Invalider" en rouge soft (sobre)
- "Valider" en vert plein (incitatif, lift au hover)

---

## 9. Formulaires

### Section card

```css
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: 12-14px;
padding: 20-22px;
display: flex;
flex-direction: column;
gap: 16-18px;
```

Header de section :
- Icône 28x28 dans carré violet soft
- Titre en `font-display` 16-17px, weight 600
- Hint "Étape N" en mono à droite

### Champs de saisie

```css
background: var(--bg-base);
border: 1px solid var(--border-default);
border-radius: 8px;
padding: 10px 12px;
font-family: var(--font-ui);
font-size: 14px;
:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-soft);
}
```

### Labels

`font-mono`, 11px, uppercase, letter-spacing 0.1em, `--text-secondary`.

### Switch (toggle on/off)

Pattern iOS-like :
- Track 38x22, border-radius 999px
- Thumb 16x16 qui glisse de `left: 2px` (off) à `left: 18px` (on)
- État actif : background `--accent-primary`, thumb blanc

### Number stepper (min/max joueurs)

- 2 boutons - et + de 36x36
- Valeur centrale en `font-display` 28px violet
- Boutons hover : violet soft + border violet

### Range sliders

Pour filtres avancés (niveau, durée, points). Layout :
- Label + valeur courante en violet à droite
- Track 6px de haut, fill avec gradient violet→magenta
- 2 thumbs blancs avec halo violet
- Marks (échelle) en mono petit

### Sélecteur d'icônes (modal de thème)

Grille 8 colonnes d'icônes Lucide, 18px de large dans un carré de 1:1, hover = bg surface-2, sélectionné = violet soft + bord violet + couleur violette.

---

## 10. Patterns runtime (pilotage)

### Header pilotage

Bandeau supérieur 2px coloré selon le type :
- MCQ : violet
- SPEED : magenta
- Corrected : vert

Tag "MCQ" / "SPEED" plein avec halo lumineux. Tag "thème" sobre. Question N/12 avec **dots de progression** (12 cercles 6x6 : `completed` = violet plein, `current` = pulsé, `future` = gris).

### Chrono

**Format horizontal** (jamais circulaire — décision validée).

État actif :
```
Label "Temps restant" (mono) | Valeur 30px gradient violet→magenta + /30s mono gris
[========================================>] (gradient avec shimmer à droite)
```

État figé (après buzz / vote clôturé) :
```
icône timer-off, label "Chrono" + badge cyan "GELÉ AU BUZZ" ou "VOTE CLÔTURÉ"
Valeur en gris terne (--text-secondary)
[========================================>] (background --text-muted, opacity 0.6)
```

### Stats bar (composer / lobby)

Sticky, plusieurs blocs séparés par dividers verticaux 1px de hauteur 36px :
- Block "label mono small + valeur display large"
- Block composition avec mini-graph et ratio MCQ/SPEED
- Indicateur de cohérence ("Bon équilibre" en pilule verte)

### Mini-graph de composition par niveau

Barre horizontale 5-6px de haut, divisée en 5 segments proportionnels. Couleurs cyan→magenta selon `--level-1` à `--level-5`. Segments à 0 deviennent `empty` (opacity 0.3).

### Slot joueur (lobby + pilotage)

**Pattern partagé** :
- Bandeau coloré 3px en haut (couleur du buzzer)
- Avatar carré 48-64px avec gradient buzzer + halo + ombre projetée
- Nom du joueur (éditable inline dans lobby)
- Footer compact avec score / status / NFC ID
- Variable CSS `--player-color` injectée selon `data-buzzer="N"`

### États de slot

| État | Visuel |
|---|---|
| **Connecté** (lobby) | Bordure normale, avatar coloré, footer avec NFC ID + statut "Connecté" |
| **Waiting** (lobby) | Bordure pointillée, indicateur NFC pulsant central, "En attente" |
| **Ready** (SPEED open) | Animation `ready-breath` (scale 1.02 + halo qui pulse), pill "Prêt" + status |
| **Locked** (SPEED après buzz autres joueurs) | Opacity 0.7, grayscale 0.4, icône cadenas |
| **Spotlight** (SPEED après buzz, joueur qui a buzzé) | Animation `spotlight-glow`, gradient halo, taille augmentée (avatar 96px), nom 38px en gradient |

### Pastilles voters (MCQ)

```html
<span class="voter-pill" data-buzzer="N">
  <span class="voter-mini-avatar bN">X</span>
  <span class="voter-name">Nom</span>
  <span class="voter-time">5.1s</span>
</span>
```

Bordure et halo de la couleur du buzzer. Hover : lift + ombre colorée.

Variantes :
- **`.winner`** : bordure verte, fond success-soft, badge `+200` en vert
- **`.loser`** : opacity 0.6, grayscale 0.4, badge `voter-cross` X rouge

---

## 11. Animations

```css
@keyframes pulse-soft {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
/* Durée : 1.5-2s ease-in-out infinite */

@keyframes nfc-wave {
  0% { transform: scale(1); opacity: 0.5-0.6; }
  100% { transform: scale(1.6-1.8); opacity: 0; }
}
/* Pour les indicateurs NFC en attente, 2 ondes décalées de 1s */

@keyframes ready-breath {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
  50% { transform: scale(1.02); box-shadow: 0 0 16px var(--player-glow); }
}
/* Pour les avatars en SPEED open */

@keyframes spotlight-glow {
  0%, 100% { box-shadow: 0 0 60px -10px rgba(buzzer, 0.6), 0 0 0 1px var(--buzzer-color); }
  50% { box-shadow: 0 0 80px -10px rgba(buzzer, 0.8), 0 0 0 1px var(--buzzer-color); }
}
/* 2.5s ease-in-out infinite, pour le spotlight du joueur qui a buzzé */

@keyframes correct-glow {
  0%, 100% { box-shadow: 0 0 0 1px var(--semantic-success), 0 0 30px -8px var(--semantic-success-glow); }
  50% { box-shadow: 0 0 0 1px var(--semantic-success), 0 0 50px -8px var(--semantic-success-glow); }
}
/* 2.5s ease-in-out infinite, pour la card de la bonne réponse en MCQ closed */

@keyframes pending-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(168, 163, 189, 0.3); }
  50% { box-shadow: 0 0 0 4px transparent; }
}
/* Pour les avatars en attente de vote */

@keyframes chrono-pulse {
  0%, 100% { box-shadow: inset 0 0 0 0 transparent; }
  50% { box-shadow: inset 0 0 12px var(--accent-primary-soft); }
}
/* Halo intérieur subtil sur la barre de chrono active */

@keyframes toast-slide-in {
  from { opacity: 0; transform: translateX(40px) scale(0.96); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}
/* Pour les toasts en bas-droite */

@keyframes progress-shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}
/* Barre de progression des toasts sur ~5s */

@keyframes dialog-pop-in {
  from { opacity: 0; transform: scale(0.94) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
/* Modale de confirmation apparition */

@keyframes overlay-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Fond sombre overlay (toasts, modales, erreurs) */
```

---

## 12. Iconographie

**Lucide** comme bibliothèque unique d'icônes. Import via CDN ou paquet npm `lucide-angular`.

Tailles standard :
- 11px (mini, dans les chips/pills)
- 13-14px (boutons, inline)
- 16-18px (sidebar, headers)
- 20-22px (illustrations dans les cards)

Icônes utilisées (référence) :

| Contexte | Icône |
|---|---|
| Logo app | `zap` |
| Tableau de bord | `layout-dashboard` |
| Contenu | `folder-open` |
| Thèmes | `folder-tree` |
| Questions | `circle-help` |
| Quiz | `book-open` |
| Jingles | `music-2` |
| Parties | `trophy` |
| Pilotage | `play-circle` |
| MCQ | `list` |
| SPEED | `zap` |
| Chrono | `timer` / `timer-off` |
| Validation | `check` / `check-circle` |
| Erreur | `x` / `x-circle` |
| Verrouillé | `lock` |
| Drag handle | `grip-vertical` |
| Plein écran | `maximize-2` |
| Drop zone audio | `music` |
| Drop zone image | `image` |
| Lecture | `play` / `pause` |
| Édition | `pencil` |
| Suppression | `trash-2` |
| Recherche | `search` |
| NFC | `nfc` |
| Alerte | `alert-triangle` / `alert-circle` |
| Info | `info` |
| Utilisateurs | `users-round` |
| Batterie | `battery` / `battery-low` |
| Médailles | `medal` / `award` |
| Couronne | `crown` |
| Trophée | `trophy` |

Pour les **icônes de thèmes**, large catalogue : `globe`, `landmark`, `music`, `clapperboard`, `flask-conical`, `trophy`, `book-open`, `brain`, `paw-print`, `gift`, `megaphone`, `vote`, `utensils`, `chef-hat`, etc.

---

## 13. Spacing & rhythm

Unités courantes en px : 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32.

Border-radius : 4 (mini chips), 6-8 (boutons, inputs), 10-12 (cards moyennes), 14-16 (grandes scènes).

Gaps standard :
- Inter-cards en grilles : 10-16px
- Inter-sections dans une page : 16-24px
- Inter-éléments dans une card : 8-14px

---

## 14. Patterns : Page d'erreur (4 variantes)

### Architecture générale

**Plein écran sans sidebar** (mode bloquant). Overlay sombre semi-transparent + flou subtil du contexte si on vient d'une autre page.

Layout :
```
┌────────────────────────────────────┐
│ MINI-BARRE : Logo Quiz + Retour    │
├────────────────────────────────────┤
│                                    │
│       [Icône d'erreur 124x124]     │
│                                    │
│       Eyebrow "404" / "Erreur"     │
│                                    │
│       Titre principal (32-44px)    │
│       Message explicatif (13px)    │
│                                    │
│       Encart contextuel (détails)  │
│                                    │
│       [Bouton Réessayer]           │
│       [Bouton Retour / Détails]    │
│                                    │
│       Détails techniques (dépli.)  │
│                                    │
└────────────────────────────────────┘
```

### Variante 404 — Page non trouvée

- **Couleur** : violet primary
- **Icône** : `map-off`
- **Eyebrow** : "Erreur 404" + dot pulsant
- **Titre** : "Cette page n'existe pas (encore)"
- **Message** : "Le lien est cassé ou la ressource a été supprimée."
- **Encart** : URL demandée, code `RESOURCE_NOT_FOUND`, request ID
- **Boutons** : "Page précédente" + "Aller à l'accueil" (primary)
- **Détails fermés par défaut** (moins urgent)

### Variante connection-lost — Connexion au hub perdue

- **Couleur** : ambre (warning, pas critique immédiat)
- **Icône** : `wifi-off`
- **Eyebrow** : "Connexion perdue" + animation 3 points pulsants
- **Titre** : "Le hub ne répond plus"
- **Message** : "L'application n'arrive plus à communiquer avec le serveur. Tentative de reconnexion auto en cours."
- **Encart** : URL du hub, dernière réponse (ex: "il y a 18 secondes"), compteur tentatives "4/10"
- **Boutons** : "Modifier l'URL du hub" + "Réessayer maintenant" (primary ambre)
- **Détails ouverts par défaut** (urgent, diagnostique)
- **Actions secondaires** : "Copier les détails" + "Voir les logs"

### Variante server-error — Erreur serveur 500

- **Couleur** : rouge (dangerous)
- **Icône** : `server-crash` (avec "scan-line" animé optionnel)
- **Eyebrow** : "Erreur 500 · Serveur"
- **Titre** : "Le serveur a rencontré un problème"
- **Message** : "Une erreur inattendue s'est produite côté hub. L'incident a été enregistré dans les logs."
- **Encart** : HTTP status 500, endpoint exact (ex: POST /api/games/g_42/start), timestamp, request ID
- **Buttons** : "Retour accueil" + "Réessayer" (primary rouge)
- **Détails ouverts** avec **stack trace** TypeScript dans boîte mono scrollable
- **Actions secondaires** : "Copier les détails" + "Voir les logs" + "Signaler un bug"

### Variante game-corrupted — Partie corrompue

- **Couleur** : rouge critique `#dc2626` (+ magenta subtil)
- **Icône** : `alert-octagon` (avec animation `icon-shake` légère)
- **Eyebrow** : "Incident critique"
- **Titre** : "Cette partie est corrompue"
- **Message** : "L'état de la partie est devenu incohérent et ne peut pas être restauré. Les scores jusqu'ici sont conservés."
- **Encart** : Game ID, Quiz name, dernière question atteinte, état "missing-snapshot"
- **Buttons** : "Voir l'historique" + "Relancer une partie" (primary rouge sombre)
- **Détails fermés** (pédagogique, pas diagnostic système)

### Design détail pour toutes les variantes

**Icône conteneur** (124×124px) :
- Background : `--variant-soft`
- Border : 1px `rgba(variant-color, 0.25)`
- Radius : 28px
- Halo : radial-gradient pulsant de `--variant-glow`
- Icône : 56px, couleur variante

**Eyebrow** :
- Inline-flex, gap 8px
- Background `--variant-soft`, border, radius 999px
- Font mono 11px uppercase
- Pulsing dot 6×6 avant le texte

**Titre** :
- Font display 44px, weight 700
- Letter-spacing -0.03em
- Possiblement un mot en `em` avec gradient variante

**Encart contextuel** :
- Background surface-2, border subtle
- Radius 10px, padding 12-14px
- Grid 2 colonnes : key (mono 11px muted) + value (primary)
- Ligne `message` avec couleur danger le cas échéant

**Détails techniques** :
- Dépliable via `<details>` ou clicked state
- Header avec icône terminal + label "Détails techniques"
- Body en grille clé-valeur (mono petite)
- Optional : stack trace dans boîte mono scrollable (max-height 120px)
- Optional : boutons "Copier les détails" + "Voir les logs" + "Signaler un bug"

---

## 15. Patterns : Modale de confirmation (3 variantes)

### Architecture générale

**Centrée à l'écran**, overlay sombre + flou du contexte (backdrop-filter blur 4px).

Layout :
```
┌─────────────────────────────────┐
│ (3px accent border en haut)      │
│                                 │
│ [Icône] │ Titre       │ [✕]     │
│         │ Message                │
│                                 │
│ Encart contextuel (optionnel)   │
│                                 │
│ Input de typing (si required)   │
│                                 │
│ [Annuler] │ [Confirmer primary] │
│                                 │
│ Rappel clavier Esc              │
└─────────────────────────────────┘
```

Max-width : 460px

### Variante destructive — Annulation de partie

- **Couleur** : rouge danger
- **Icône** : `alert-triangle`
- **Titre** : "Annuler la partie en cours ?"
- **Message** : "Cette action est irréversible. Scores et progression seront perdus définitivement."
- **Encart** : Quiz name, Progression "8/12" (ambre), Joueurs "10 connectés", Scores "Seront supprimés" (rouge)
- **Typing required** : "Tapez ANNULER pour confirmer"
  - Input de saisie (mono 14px, font-weight 600)
  - Validation : classe `.match` quand input = "ANNULER"
  - Hint avec checkmark vert "Confirmation valide"
  - Bouton confirmer désactivé jusqu'à typing correct
- **Boutons** : "Continuer la partie" (secondary) + "Oui, annuler" (primary rouge, icône trash)
- **Rappel clavier** : "Esc pour annuler"

### Variante warning — Quitter sans sauvegarder

- **Couleur** : ambre warning
- **Icône** : `alert-circle`
- **Titre** : "Quitter sans sauvegarder ?"
- **Message** : "Vous avez des modifications non enregistrées. Si vous quittez maintenant, elles seront perdues."
- **Encart** : Question "Q.5 MCQ Cinéma", Modifications "Énoncé + 2 réponses modifiées" (ambre), Dernière sauvegarde "il y a 4 minutes"
- **Pas de typing required** (perte de données ≠ destructif irréversible)
- **Boutons** : "Continuer l'édition" (secondary) + "Quitter quand même" (primary ambre, icône log-out)
- **Rappel clavier** : "Esc pour rester"

### Variante info — Choix neutre

- **Couleur** : cyan secondary
- **Icône** : `play-circle`
- **Titre** : "Lancer la partie maintenant ?"
- **Message** : "Un joueur n'est pas encore connecté. Vous pouvez démarrer sans lui : il pourra rejoindre dès que son buzzer sera détecté."
- **Encart** : Connectés "9/10 buzzers", En attente "Ali · b10 · Indigo" (ambre), Quiz name
- **Pas de typing required** (action positive)
- **Boutons** : "Attendre encore" (secondary) + "Lancer maintenant" (primary cyan→violet gradient, icône play)
- **Rappel clavier** : "Esc pour attendre"

### Design détail

**Header** :
- Icône 40×40 background soft, border semi-transparent, radius 10px
- Titre 18px display weight 700
- Message 13px secondary
- Bouton close ✕ subtle, hover lift

**Encart contextuel** :
- Background surface-2, border subtle, radius 10px
- Grid 2 colonnes : key (mono 11px muted) + value
- Valeurs en tone différent : ambre, rouge, etc. selon contexte

**Input typing** :
- Background base, border default
- Font mono 14px, font-weight 600, letter-spacing 0.04em
- Focus : border variante, glow soft
- Class `.match` : border variante, bg soft, text variante
- Hint 10px mono : "Tapez ANNULER" avec checkmark animation

**Boutons** :
- Secondary : background surface-2, border default
- Primary : background variante, color white, font-weight 600
- Hover primary : glow variante, lift -1px
- Disabled : opacity 0.4, cursor not-allowed

**Animations** :
- Dialog pop-in : scale 0.94 → 1 + opacity 0→1, 250ms cubic-bezier(0.16, 1, 0.3, 1)
- Overlay fade : opacity 0→1, 200ms ease-out

---

## 16. Patterns : Toasts & notifications

### Architecture générale

**Container positif** : fixed bottom-right 20px gap, `flex-direction: column-reverse` (le plus récent en bas).

Max-width : 380px. Layout par toast :
```
[Liseré 3px] │ [Icône] │ Titre + Description + Actions │ [✕]
                                                           [Barre progress 2px en bas]
```

### Variantes (4 types)

| Variante | Couleur | Icône | Cas d'usage |
|---|---|---|---|
| **success** | Vert 4ade80 | `check-circle-2` | "Hugo s'est connecté", "Quiz sauvegardé" |
| **info** | Cyan 4dd4e8 | `info` ou custom | "3 joueurs rejoint", événements neutres |
| **warning** | Ambre fbbf24 | `alert-circle` | "Batterie faible", alertes non-bloquantes |
| **error** | Rouge ef4444 | `x-circle` | "Échec connexion hub", erreurs récupérables |

### Composants d'un toast

**Liseré gauche 3px** :
- Positionnement absolu, inset top/bottom/left
- Couleur variante, border-radius 12px 0 0 12px
- Purpose : identifier la variante en un coup d'œil

**Icône conteneur** (32×32px) :
- Background soft variante, radius 9px
- Border 1px soft transparent
- Flex-shrink: 0

Variante spéciale `player-avatar` :
- Background `--player-color`
- Avatar 32×32 avec lettre joueur
- Badge check/plus en coin bas-droite (16×16)
- Glow sur joueur (box-shadow 0 0 14px glow)

**Body texte** :
- Flex: 1, column layout
- Titre 14px font-display weight 600
- Description 12px secondary
- Optional : balise `meta` 10px mono muted (ex: "Tentative 2/5" avec icône repeat)

**Boutons d'action** :
- Flex row, gap 6px
- Padding 4px 10px, border 1px default, radius 6px
- Font 12px weight 500
- Bouton primary : background soft variante, color variante, font-weight 600, hover lift

Cas d'usage :
- Undo : "Annuler" (undo-2 icon)
- Retry : "Réessayer" (rotate-ccw icon) + "Détails"
- View : "Voir le buzzer" (external-link)
- Contact : "Voir détails" / "Signaler" (secondary buttons)

**Bouton close** (✕) :
- 22×22px, transparent, radius 6px
- Color muted, hover : background surface-2 + color primary

**Barre de progression** (2px en bas) :
- Background surface-2
- Bar interne : background variante, glow 0 0 8px
- Transform: scaleX() animée sur 5s (`progress-shrink` keyframe)
- Transform-origin: left center

### Comportement & lifecycle

**Animation entrée** : `toast-slide-in` — translateX(40px) + scale(0.96) → 0/1 en 350ms cubic-bezier(0.16, 1, 0.3, 1)
- Délai sequencé : toast N=1..5 → delay 0, 0.08s, 0.16s, 0.24s, 0.32s

**Auto-dismiss** : ~5000ms (configurable)
- Barre progress : `progress-shrink` 5s ease-in (scaleX 1→0)
- À la fin : fade-out + slideX(40px)
- Suppression du DOM

**Persistance** : cas `warning` et `error` n'ont pas auto-dismiss (l'utilisateur doit cliquer action ou ✕)

**Stacking** : les toasts plus anciens sont visuellement moins proéminents (opacity légèrement plus basse, position plus haut)

### Cas spéciaux

**Toast joueur connecté** :
```
[Icône player H vert+badge] | "Hugo s'est connecté" | 
                             "Buzzer b8 · 9/10 connectés"
                             [✕]
```

**Toast erreur avec tentatives** :
```
[Icône x-circle rouge] | "Échec connexion hub" |
                       "Serveur 192.168.1.42:8080 ne répond pas" |
                       "↻ Tentative 2 / 5" |
                       [Réessayer primary] [Détails secondary]
                       [✕]
```

**Toast avec undo** :
```
[Icône check vert] | "Quiz sauvegardé" |
                   "12 questions enregistrées" |
                   [Annuler secondary]
```

---

## 17. Conventions de nommage CSS

Pas de préfixe BEM strict, mais convention par préfixe sémantique :
- `.btn`, `.btn-primary`, `.btn-cta`
- `.tag`, `.tag-mcq`, `.tag-speed`
- `.player-card`, `.quiz-card`, `.theme-card`
- `.slot`, `.slot.connected`, `.slot.waiting`
- `.voter-pill`, `.voter-pill.winner`, `.voter-pill.loser`
- `.toast`, `.toast.success`, `.toast.warning`
- `.dialog`, `.dialog.destructive`, `.dialog.warning`
- `.error-page`, `.error-screen.variant-404`

Variables custom utilisées dans les composants :
- `--player-color`, `--player-glow` (injectées par `data-buzzer="N"`)
- `--buzzer-color`, `--buzzer-glow` (selon position)
- `--variant-color`, `--variant-soft`, `--variant-glow` (pour toasts et dialogs)
- `--progress` (pour barres de progression individuelles)

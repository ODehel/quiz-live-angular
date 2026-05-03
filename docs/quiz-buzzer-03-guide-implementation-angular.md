# Quiz Buzzer — Guide d'implémentation Angular

> Pratiques recommandées pour traduire les maquettes HTML en application Angular 21.
> **MISE À JOUR** : Sections 10-16 ajoutées pour services de toasts, modales et gestion d'erreur.

---

## 1. Stack technique cible

- **Angular 21 LTS**
- **TypeScript** strict mode
- **Signals** comme primitive de state principale
- **RxJS** réservé aux flux temps-réel (WebSocket)
- **Standalone components** partout (pas de NgModule)
- **OnPush** change detection par défaut
- **Signal inputs / outputs** (pas `@Input` / `@Output` classiques)
- **Tests** : Jest + Angular Testing Library (ATL)
- **Lucide Angular** pour les icônes
- **Wavesurfer.js** pour les waveforms de jingles
- **Angular CDK** pour overlays, drag-and-drop

---

## 2. Structure de projet recommandée

```
src/
├── app/
│   ├── core/                          # Services globaux singletons
│   │   ├── auth/
│   │   ├── websocket/                 # Connexion temps réel au hub
│   │   ├── api/                       # HTTP services
│   │   ├── toast/                     # Service toasts
│   │   ├── confirmation/              # Service modales confirmation
│   │   └── error/                     # Gestion errors + error page
│   │
│   ├── shared/                        # Composants/utils réutilisables
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── tag/
│   │   │   ├── chrono/                # Composant chrono horizontal
│   │   │   ├── level-bar/             # Mini-graph composition
│   │   │   ├── level-dots/            # 5 dots pour niveau
│   │   │   ├── status-pill/
│   │   │   ├── icon/                  # Wrapper Lucide
│   │   │   ├── toast/                 # Composant toast individuel
│   │   │   ├── toast-container/       # Conteneur toasts (bas-droite)
│   │   │   ├── dialog/                # Composant modale générique
│   │   │   └── error-page/            # Page d'erreur (4 variantes)
│   │   ├── domain/                    # Composants métier réutilisables
│   │   │   ├── player-slot/           # Slot de joueur (lobby + pilotage)
│   │   │   ├── player-avatar/         # Avatar avec gradient buzzer
│   │   │   ├── voter-pill/            # Pastille de votant en MCQ
│   │   │   ├── question-card/         # Card question dans listes
│   │   │   ├── quiz-card/             # Card quiz dans listes
│   │   │   └── jingle-card/           # Card jingle avec waveform
│   │   └── pipes/
│   │
│   ├── features/                      # Pages / routes principales
│   │   ├── dashboard/
│   │   ├── content/
│   │   │   ├── themes/                # Liste, formulaire
│   │   │   ├── questions/             # Liste, formulaire MCQ + SPEED
│   │   │   ├── quizzes/               # Liste, composer
│   │   │   └── jingles/               # Liste, formulaire
│   │   └── games/
│   │       ├── setup/                 # Création partie
│   │       ├── lobby/                 # Lobby NFC
│   │       ├── pilotage/              # Pilotage runtime
│   │       │   ├── mcq-open/
│   │       │   ├── mcq-closed/
│   │       │   ├── speed-open/
│   │       │   ├── speed-buzzed/
│   │       │   ├── transition/
│   │       │   ├── ranking/           # Classement intermédiaire
│   │       │   └── results/           # Résultats finaux
│   │       └── error/                 # Error page wrapper (routing)
│   │
│   ├── layout/                        # Shell principal
│   │   ├── shell/                     # Sidebar + topbar
│   │   ├── sidebar/
│   │   ├── topbar/
│   │   └── active-game-card/
│   │
│   └── styles/
│       ├── _tokens.scss               # Variables CSS du design system
│       ├── _animations.scss           # @keyframes
│       ├── _typography.scss
│       └── styles.scss
│
└── assets/
    └── icons/
```

---

## 3. Tokens CSS → SCSS

Créer `src/app/styles/_tokens.scss` qui reproduit exactement les variables du Doc 1 :

```scss
:root {
  /* Backgrounds */
  --bg-base: #0b0a10;
  --bg-surface: #141221;
  --bg-surface-2: #1c192e;
  --bg-surface-3: #252238;

  /* Texts */
  --text-primary: #f4f3f8;
  --text-secondary: #a8a3bd;
  --text-muted: #6b6680;

  /* Borders */
  --border-subtle: #2a2740;
  --border-default: #3a3654;
  --border-strong: #4f4a70;

  /* Accents */
  --accent-primary: #9d6bff;
  --accent-primary-soft: rgba(157, 107, 255, 0.12);
  --accent-primary-glow: rgba(157, 107, 255, 0.35);

  --accent-secondary: #4dd4e8;
  --accent-secondary-soft: rgba(77, 212, 232, 0.12);
  --accent-secondary-glow: rgba(77, 212, 232, 0.35);

  --accent-vivid: #ff4d8f;
  --accent-vivid-soft: rgba(255, 77, 143, 0.15);
  --accent-vivid-glow: rgba(255, 77, 143, 0.35);

  /* Semantics */
  --semantic-success: #4ade80;
  --semantic-success-soft: rgba(74, 222, 128, 0.12);
  --semantic-success-glow: rgba(74, 222, 128, 0.4);

  --semantic-warning: #fbbf24;
  --semantic-warning-soft: rgba(251, 191, 36, 0.12);
  --semantic-warning-glow: rgba(251, 191, 36, 0.35);

  --semantic-danger: #ef4444;
  --semantic-danger-soft: rgba(239, 68, 68, 0.12);
  --semantic-danger-glow: rgba(239, 68, 68, 0.35);

  --semantic-critical: #dc2626;
  --semantic-critical-soft: rgba(220, 38, 38, 0.15);
  --semantic-critical-glow: rgba(220, 38, 38, 0.4);

  /* Buzzers */
  --buzzer-1:  #4dd4e8;
  --buzzer-2:  #5b8def;
  --buzzer-3:  #9d6bff;
  --buzzer-4:  #ff4d8f;
  --buzzer-5:  #ff7a59;
  --buzzer-6:  #fbbf24;
  --buzzer-7:  #a3e635;
  --buzzer-8:  #4ade80;
  --buzzer-9:  #34d399;
  --buzzer-10: #7c5cf5;

  /* Fonts */
  --font-ui: "Geist", system-ui, sans-serif;
  --font-display: "Bricolage Grotesque", "Geist", sans-serif;
  --font-mono: "Geist Mono", "Menlo", monospace;

  /* Layout */
  --sidebar-width: 252px;
  --topbar-height: 52px;
}
```

---

## 4. Service de state — GameStateService

État centralisé avec Signals. C'est le hub de communication :

```typescript
// game-state.service.ts
import { Injectable, signal } from '@angular/core';

export type GameState =
  | { phase: 'setup' }
  | { phase: 'lobby'; gameId: string; players: Player[] }
  | { phase: 'playing'; gameId: string; currentQuestion: number; state: 'mcq-open' | 'mcq-closed' | 'speed-open' | 'speed-buzzed' }
  | { phase: 'results'; gameId: string; finalScores: ScoreEntry[] }
  | { phase: 'error'; error: ErrorContext };

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly _gameState = signal<GameState>({ phase: 'setup' });
  readonly gameState = this._gameState.asReadonly();

  // Conveniences
  readonly isPlaying = computed(() => this.gameState().phase === 'playing');
  readonly currentQuestion = computed(() => {
    const state = this.gameState();
    return state.phase === 'playing' ? state.currentQuestion : null;
  });

  updatePhase(newPhase: GameState): void {
    this._gameState.set(newPhase);
  }
}
```

---

## 5. Service de toasts — ToastService

Permet d'afficher des toasts de n'importe où dans l'app :

```typescript
// core/toast/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  variant: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  icon?: string;
  meta?: { icon: string; text: string };  // ex: "Tentative 2/5"
  player?: { name: string; color: string; letter: string };  // avatar joueur
  actions?: ToastAction[];
  persistent?: boolean;  // pas auto-dismiss
  duration?: number;  // ms, défaut 5000
  createdAt: number;
}

export interface ToastAction {
  label: string;
  icon?: string;
  primary?: boolean;
  handler: () => void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(title: string, options?: Partial<Toast>): string {
    return this.show({ ...options, variant: 'success', title });
  }

  info(title: string, options?: Partial<Toast>): string {
    return this.show({ ...options, variant: 'info', title });
  }

  warning(title: string, options?: Partial<Toast>): string {
    return this.show({ ...options, variant: 'warning', title, persistent: true });
  }

  error(title: string, options?: Partial<Toast>): string {
    return this.show({ ...options, variant: 'error', title, persistent: true });
  }

  private show(options: Partial<Toast> & { title: string; variant: Toast['variant'] }): string {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = {
      id,
      createdAt: Date.now(),
      duration: 5000,
      persistent: false,
      ...options
    };

    this._toasts.update(toasts => [toast, ...toasts]);

    if (!toast.persistent) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }

    return id;
  }

  dismiss(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this._toasts.set([]);
  }
}
```

Usage :

```typescript
// Dans n'importe quel composant
constructor(private toast: ToastService) {}

onPlayerConnected(player: Player) {
  this.toast.success(`${player.name} s'est connecté`, {
    description: `Buzzer ${player.buzzerId} · ${player.buzzerName} · ${this.connectedCount}/10`,
    player: { name: player.name, color: `var(--buzzer-${player.buzzerId})`, letter: player.name[0] }
  });
}

onError(err: any) {
  this.toast.error('Échec de connexion au hub', {
    description: 'Le serveur ne répond pas sur 192.168.1.42:8080',
    meta: { icon: 'repeat', text: 'Tentative 2 / 5' },
    actions: [
      { label: 'Réessayer', icon: 'rotate-ccw', primary: true, handler: () => this.retry() },
      { label: 'Détails', handler: () => this.showDetails() }
    ]
  });
}
```

---

## 6. Service de confirmation — ConfirmationService

Pattern pour les modales de confirmation réutilisables :

```typescript
// core/confirmation/confirmation.service.ts
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Dialog } from '@angular/cdk/dialog';

export interface ConfirmOptions {
  variant: 'destructive' | 'warning' | 'info';
  title: string;
  message: string;
  context?: { key: string; value: string; tone?: 'normal' | 'warning' | 'danger' }[];
  requireTyping?: string;  // ex: "ANNULER"
  confirmLabel?: string;
  confirmIcon?: string;
  cancelLabel?: string;
  cancelIcon?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly dialog = inject(Dialog);

  ask(options: ConfirmOptions): Promise<boolean> {
    return firstValueFrom(
      this.dialog.open<boolean>(ConfirmDialogComponent, {
        data: options,
        disableClose: false,
        panelClass: `dialog-${options.variant}`
      }).closed
    );
  }
}
```

Usage :

```typescript
constructor(private confirm: ConfirmationService) {}

async cancelGame() {
  const ok = await this.confirm.ask({
    variant: 'destructive',
    title: 'Annuler la partie en cours ?',
    message: 'Cette action est irréversible. Scores et progression seront perdus définitivement.',
    context: [
      { key: 'Quiz', value: 'Soirée découverte du monde' },
      { key: 'Progression', value: '8 / 12 questions jouées', tone: 'warning' },
      { key: 'Scores', value: 'Seront supprimés', tone: 'danger' }
    ],
    requireTyping: 'ANNULER',
    confirmLabel: 'Oui, annuler',
    confirmIcon: 'trash-2',
    cancelLabel: 'Continuer la partie'
  });

  if (ok) {
    this.gameService.cancelCurrentGame();
  }
}
```

---

## 7. Gestion des erreurs — ErrorService & ErrorPageComponent

Pattern pour les pages d'erreur (4 variantes) :

```typescript
// core/error/error.service.ts
import { Injectable, signal } from '@angular/core';

export type ErrorVariant = 'not-found' | 'connection-lost' | 'server-error' | 'game-corrupted';

export interface TechnicalErrorInfo {
  code: string;
  timestamp: string;
  requestId: string;
  message: string;
  endpoint?: string;
  httpStatus?: number;
  stackTrace?: string;
  meta?: Record<string, any>;
}

export interface ErrorContext {
  variant: ErrorVariant;
  title: string;
  message: string;
  contextRows?: { key: string; value: string; tone?: 'normal' | 'warning' | 'danger' }[];
  technical?: TechnicalErrorInfo;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly _currentError = signal<ErrorContext | null>(null);
  readonly currentError = this._currentError.asReadonly();

  showError(error: ErrorContext): void {
    this._currentError.set(error);
  }

  clearError(): void {
    this._currentError.set(null);
  }

  // Helpers pour variantes courantes
  notFound(path: string): void {
    this.showError({
      variant: 'not-found',
      title: 'Cette page n\'existe pas (encore)',
      message: 'Le lien est cassé ou la ressource a été supprimée.',
      contextRows: [{ key: 'URL demandée', value: path }],
      technical: {
        code: 'RESOURCE_NOT_FOUND',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        message: `Resource ${path} not found`
      }
    });
  }

  connectionLost(hubUrl: string): void {
    this.showError({
      variant: 'connection-lost',
      title: 'Le hub ne répond plus',
      message: 'L\'application n\'arrive plus à communiquer avec le serveur. Tentative de reconnexion automatique en cours.',
      contextRows: [{ key: 'URL du hub', value: hubUrl }],
      technical: {
        code: 'HUB_DISCONNECTED',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        message: 'WebSocket connection closed unexpectedly'
      }
    });
  }

  serverError(endpoint: string, status: number, message: string, stackTrace?: string): void {
    this.showError({
      variant: 'server-error',
      title: 'Le serveur a rencontré un problème',
      message: 'Une erreur inattendue s\'est produite côté hub. L\'incident a été enregistré dans les logs.',
      contextRows: [
        { key: 'Endpoint', value: endpoint },
        { key: 'HTTP Status', value: status.toString() }
      ],
      technical: {
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        httpStatus: status,
        message,
        stackTrace
      }
    });
  }

  gameCorrupted(gameId: string, lastQuestion: number): void {
    this.showError({
      variant: 'game-corrupted',
      title: 'Cette partie est corrompue',
      message: 'L\'état de la partie est devenu incohérent et ne peut pas être restauré. Les scores jusqu\'ici sont conservés.',
      contextRows: [
        { key: 'Game ID', value: gameId },
        { key: 'Dernière question', value: `Q.${lastQuestion}` }
      ],
      technical: {
        code: 'GAME_STATE_CORRUPTED',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        message: 'Game state inconsistent: missing snapshot'
      }
    });
  }
}
```

Composant :

```typescript
// shared/ui/error-page/error-page.component.ts
@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  template: `
    @if (error(); as err) {
      <div class="error-screen" [class]="'variant-' + err.variant">
        <div class="error-bar">
          <div class="error-bar-brand">
            <div class="error-bar-brand-icon">
              <lucide-icon name="zap"></lucide-icon>
            </div>
            <div class="error-bar-brand-text">Quiz Buzzer</div>
          </div>
          <button class="bar-btn" (click)="goHome()">
            <lucide-icon name="home"></lucide-icon>
            Retour à l'accueil
          </button>
        </div>

        <div class="error-content">
          <div class="error-icon-wrap">
            <lucide-icon [name]="getIcon(err.variant)!" class="error-icon-svg"></lucide-icon>
          </div>

          <span class="error-eyebrow">
            <span class="error-eyebrow-dot"></span>
            {{ getEyebrow(err.variant) }}
          </span>

          <h1 class="error-title">{{ err.title }}</h1>
          <p class="error-message">{{ err.message }}</p>

          @if (err.contextRows?.length) {
            <div class="error-context">
              @for (row of err.contextRows; track row.key) {
                <div class="error-context-row">
                  <span class="key">{{ row.key }}</span>
                  <span class="value" [ngClass]="row.tone">{{ row.value }}</span>
                </div>
              }
            </div>
          }

          <div class="error-actions">
            <button class="error-btn" (click)="retry()">
              <lucide-icon name="rotate-ccw"></lucide-icon>
              Réessayer
            </button>
            <button class="error-btn primary" (click)="goHome()">
              <lucide-icon name="home"></lucide-icon>
              Aller à l'accueil
            </button>
          </div>

          @if (err.technical) {
            <details class="tech-details" [open]="showTech">
              <summary (click)="showTech = !showTech">
                <div class="tech-details-header-title">
                  <lucide-icon name="terminal"></lucide-icon>
                  Détails techniques
                </div>
              </summary>
              <div class="tech-details-body">
                <div class="tech-details-grid">
                  <span class="key">Code</span>
                  <span class="value"><span class="badge">{{ err.technical.code }}</span></span>

                  <span class="key">Timestamp</span>
                  <span class="value">{{ err.technical.timestamp }}</span>

                  <span class="key">Request ID</span>
                  <span class="value">{{ err.technical.requestId }}</span>

                  <span class="key">Message</span>
                  <span class="value">{{ err.technical.message }}</span>

                  @if (err.technical.stackTrace) {
                    <span class="key">Stack</span>
                    <pre class="stack">{{ err.technical.stackTrace }}</pre>
                  }
                </div>
              </div>
            </details>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    /* CSS du design system pour les 4 variantes — voir doc 01 sections 14 */
  `]
})
export class ErrorPageComponent {
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  readonly error = this.errorService.currentError;
  showTech = false;

  getIcon(variant: ErrorVariant): string {
    return {
      'not-found': 'map-off',
      'connection-lost': 'wifi-off',
      'server-error': 'server-crash',
      'game-corrupted': 'alert-octagon'
    }[variant];
  }

  getEyebrow(variant: ErrorVariant): string {
    return {
      'not-found': 'Erreur 404',
      'connection-lost': 'Connexion perdue',
      'server-error': 'Erreur 500 · Serveur',
      'game-corrupted': 'Incident critique'
    }[variant];
  }

  retry(): void {
    // Context-specific retry logic
    location.reload();
  }

  goHome(): void {
    this.errorService.clearError();
    this.router.navigate(['/']);
  }
}
```

---

## 8. Toast et Dialog — Composants UI

### ToastComponent (individuel)

```typescript
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="toast" [class]="variant()">
      <div class="toast-icon" [class.player-avatar]="player()">
        @if (player(); as p) {
          <span class="player-letter">{{ p.letter }}</span>
          <span class="player-badge" [style.background]="p.color">
            <lucide-icon name="check"></lucide-icon>
          </span>
        } @else {
          <lucide-icon [name]="icon()!"></lucide-icon>
        }
      </div>

      <div class="toast-body">
        <div class="toast-title">{{ title() }}</div>
        @if (description()) {
          <div class="toast-description">{{ description() }}</div>
        }
        @if (meta()) {
          <div class="toast-meta">
            <lucide-icon [name]="meta()!.icon"></lucide-icon>
            {{ meta()!.text }}
          </div>
        }
        @if (actions().length) {
          <div class="toast-action-row">
            @for (action of actions(); track action.label) {
              <button class="toast-action" [class.primary]="action.primary" (click)="action.handler()">
                @if (action.icon) { <lucide-icon [name]="action.icon"></lucide-icon> }
                {{ action.label }}
              </button>
            }
          </div>
        }
      </div>

      <button class="toast-close" (click)="close.emit()">
        <lucide-icon name="x"></lucide-icon>
      </button>

      <div class="toast-progress">
        <div class="toast-progress-bar"></div>
      </div>
    </div>
  `,
  styles: [`
    /* CSS du design system pour les toasts — voir doc 01 section 16 */
  `]
})
export class ToastComponent {
  readonly title = input.required<string>();
  readonly variant = input.required<Toast['variant']>();
  readonly description = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly meta = input<{ icon: string; text: string } | null>(null);
  readonly player = input<{ name: string; color: string; letter: string } | null>(null);
  readonly actions = input<ToastAction[]>([]);

  readonly close = output<void>();
}
```

### ToastContainerComponent (stack bas-droite)

```typescript
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <app-toast
          [title]="toast.title"
          [variant]="toast.variant"
          [description]="toast.description || null"
          [icon]="toast.icon || null"
          [meta]="toast.meta || null"
          [player]="toast.player || null"
          [actions]="toast.actions || []"
          (close)="dismiss(toast.id)"
        />
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      width: 380px;
      max-width: calc(100vw - 40px);
      z-index: 100;
      pointer-events: none;
    }

    :host ::ng-deep .toast-container app-toast {
      pointer-events: auto;
    }
  `]
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
```

Placer ce composant **une seule fois** dans le shell :

```typescript
// layout/shell/shell.component.ts
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, ToastContainerComponent],
  template: `
    <div class="shell">
      <app-sidebar></app-sidebar>
      <app-topbar></app-topbar>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-toast-container></app-toast-container>
  `
})
export class ShellComponent {}
```

---

## 9. ConfirmDialogComponent

Utiliser `@angular/cdk/dialog` pour l'overlay :

```typescript
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="dialog" [class]="data().variant">
      <div class="dialog-header">
        <div class="dialog-icon">
          <lucide-icon [name]="getIcon(data().variant)"></lucide-icon>
        </div>
        <div class="dialog-header-text">
          <div class="dialog-title">{{ data().title }}</div>
          <div class="dialog-message">{{ data().message }}</div>
        </div>
        <button class="dialog-close" (click)="close(false)">
          <lucide-icon name="x"></lucide-icon>
        </button>
      </div>

      <div class="dialog-body">
        @if (data().contextRows?.length) {
          <div class="dialog-context">
            @for (row of data().contextRows; track row.key) {
              <div class="dialog-context-row">
                <span class="key">{{ row.key }}</span>
                <span class="value" [ngClass]="row.tone">{{ row.value }}</span>
              </div>
            }
          </div>
        }

        @if (data().requireTyping) {
          <div class="dialog-typing">
            <div class="dialog-typing-label">
              Pour confirmer, tapez <code>{{ data().requireTyping }}</code> ci-dessous.
            </div>
            <input
              type="text"
              class="dialog-typing-input"
              [class.match]="inputValue() === data().requireTyping"
              [(ngModel)]="typingInput"
              placeholder="Tapez ici…"
              autocomplete="off"
              spellcheck="false"
            >
            <div class="dialog-typing-hint" [class.matched]="inputValue() === data().requireTyping">
              <span class="check">
                @if (inputValue() === data().requireTyping) {
                  <lucide-icon name="check"></lucide-icon>
                }
              </span>
              {{ inputValue() === data().requireTyping ? 'Confirmation valide' : 'Continue typing' }}
            </div>
          </div>
        }
      </div>

      <div class="dialog-footer">
        <span class="dialog-keyboard-hint">
          <kbd>Esc</kbd> pour annuler
        </span>
        <div class="dialog-buttons">
          <button class="dialog-btn" (click)="close(false)">
            {{ data().cancelLabel || 'Annuler' }}
          </button>
          <button
            class="dialog-btn confirm"
            [disabled]="data().requireTyping && inputValue() !== data().requireTyping"
            (click)="close(true)"
          >
            @if (data().confirmIcon) {
              <lucide-icon [name]="data().confirmIcon"></lucide-icon>
            }
            {{ data().confirmLabel || 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* CSS du design system pour les dialogs — voir doc 01 section 15 */
  `]
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(DialogRef<boolean>);

  readonly data = input.required<ConfirmOptions>();
  typingInput = '';
  readonly inputValue = computed(() => this.typingInput);

  getIcon(variant: ConfirmOptions['variant']): string {
    return {
      destructive: 'alert-triangle',
      warning: 'alert-circle',
      info: 'play-circle'
    }[variant];
  }

  close(result: boolean): void {
    this.dialogRef.close(result);
  }

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(e => e.key === 'Escape'),
        takeUntilDestroyed()
      )
      .subscribe(() => this.close(false));
  }
}
```

---

## 10. Intégration dans le routing

Route pour la page d'erreur :

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'error', component: ErrorPageComponent },
      // ... autres routes
    ]
  }
];
```

À utiliser via ErrorService :

```typescript
// Détection d'erreur HTTP globale
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private error: ErrorService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.error.notFound(req.url);
        } else if (err.status === 500) {
          this.error.serverError(req.method + ' ' + req.url, 500, err.message);
        }
        this.router.navigate(['/error']);
        return throwError(() => err);
      })
    );
  }
}
```

---

## 11. Tests

Tests des services avec Jest :

```typescript
describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('affiche un toast success', () => {
    service.success('Test', { description: 'Détails' });
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]!.variant).toBe('success');
  });

  it('auto-dismiss après duration', fakeAsync(() => {
    const id = service.info('Test');
    expect(service.toasts().length).toBe(1);
    tick(5000);
    expect(service.toasts().length).toBe(0);
  }));

  it('ne pas auto-dismiss si persistent', fakeAsync(() => {
    const id = service.error('Test');
    tick(5000);
    expect(service.toasts().length).toBe(1);
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  }));
});

describe('ConfirmationService', () => {
  let service: ConfirmationService;
  let dialog: Dialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfirmationService]
    });
    service = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(Dialog);
  });

  it('retourne true si utilisateur confirme', async () => {
    const promise = service.ask({
      variant: 'destructive',
      title: 'Supprimer ?',
      message: 'Êtes-vous sûr ?'
    });

    // Simuler confirmation (tricky avec CDK Dialog, voir ATL docs)
    expect(await promise).toBe(true);
  });
});
```

---

## 12. Recommandations finales

### Performance

- Tous les composants en **OnPush**
- `trackBy` ou `track` syntax dans les `@for` (track buzzerId pour les joueurs)
- Lazy load des routes feature
- Toast container : max 5 toasts affichés (les anciens défilent)

### Accessibilité

- Tous les boutons ont un `aria-label` explicite
- Focus visible sur les dialogs (inert le reste de la page)
- ARIA live region pour les annonces toast (role="status")

### WebSocket

Utiliser `webSocket()` de RxJS. Reconnexion automatique avec backoff exponential. États : connecté / reconnexion / déconnecté → afficher toast warning si déconnecté.

---

## 13. Checklist finale

Quand on reprend ce projet :

1. ☐ Lire les 3 docs markdown
2. ☐ Ouvrir les 22 HTML maquettées
3. ☐ Reproduire tokens dans _tokens.scss
4. ☐ Créer GameStateService avec Signals
5. ☐ Implémenter ToastService + composants
6. ☐ Implémenter ConfirmationService + dialog
7. ☐ Implémenter ErrorService + error-page
8. ☐ Construire les composants UI (Button, Card, etc.)
9. ☐ Construire les composants domain (PlayerSlot, VoterPill, etc.)
10. ☐ Implémenter le shell + routing
11. ☐ Feature par feature (Dashboard → Content → Games)
12. ☐ Tests au fur et à mesure
13. ☐ WebSocket + state sync
14. ☐ Validation & QA

---

## 14. Bibliothèques recommandées

| Usage | Lib | Notes |
|---|---|---|
| Icônes | `lucide-angular` | Standard design system |
| Drag-and-drop | `@angular/cdk/drag-drop` | Composer |
| Dialog/Overlay | `@angular/cdk/dialog` | Modales, toasts |
| Formulaires | Angular Reactive Forms | Strictly typed |
| Tests | Jest + ATL | Selon vos prefs |
| Audio | `wavesurfer.js` | Waveforms jingles |
| State | Signals + RxJS | Pour WebSocket |


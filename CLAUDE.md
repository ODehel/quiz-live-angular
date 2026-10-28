# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server on http://localhost:4200 (proxies /api → http://localhost:3000)
npm run build      # Production build
npm test           # Run all tests with Vitest
ng test --include="**/game-state.service.spec.ts"  # Run a single test file
```

Prettier is configured in `package.json` (printWidth 100, singleQuote, Angular HTML parser). Run `npx prettier --write .` to format.

## Environment setup

`src/environments/environment.ts` is gitignored, so on a fresh clone `npm start`, `npm run build` and `npm test` all fail until you copy `src/environments/environment.example.ts` to `src/environments/environment.ts` and fill in the backend credentials:

```ts
export const environment = {
  username: '...',
  password: '...',
};
```

`AuthService.initialize()` is called at app startup via `provideAppInitializer` and POSTs to `/api/v1/token` with these credentials to obtain a JWT.

## Architecture

**Angular 21 standalone components** — no NgModules anywhere. All components use `ChangeDetectionStrategy.OnPush` and Angular signals for state.

### Core services (`src/app/core/`)

| Service | Role |
|---|---|
| `AuthService` | Fetches JWT on startup, exposes `token` as a readonly signal |
| `authInterceptor` | Functional HTTP interceptor — attaches `Authorization: Bearer <token>` to every outgoing request when a token is available |
| `WebSocketService` | Not Angular-injectable by default; constructed manually with a socket constructor, URL, `TokenProvider` and `ErrorNavigator`. On close it reconnects with exponential backoff (capped at 30 s), refreshes the token on code 4002, and navigates to the error page on code 4004. Known limitations: `attempt` is never reset after a successful connection (delays only grow), `send()` is called right after construction without waiting for `onopen` (would throw on a real browser WebSocket; tests use a fake `SocketLike`), and a rejected `refresh()` leaves no reconnect scheduled |
| `GameStateService` | `state` is a `Signal<{ phase: Phase }>` (object, not a bare string); `Phase` is `setup \| lobby \| playing \| results \| error`. Change it only through `transitionTo(phase)`, which accepts any phase (no transition rules enforced) |
| `ErrorService` | Signal holding the active `ErrorContext` variant; consumed by `ErrorPage` overlay in `App` |
| `ToastService` | Signal-based queue (max 5). A toast is auto-removed only if it has a `duration` (ms, via the `TIMER` token); without one it stays until `remove()` is called. `add()` returns `false` and drops the toast when 5 are already queued |
| `ConfirmationService` | Opens CDK Dialog and returns `Promise<boolean>` |
| `TIMER` | `InjectionToken<Timer>` — defaults to `BrowserTimer` (wraps `setTimeout`); swap in tests to avoid real timers |

### Error overlay pattern

`App` imports `ErrorPage` alongside `RouterOutlet`. When `ErrorService.currentError` is non-null, `ErrorPage` renders over the router content. Each variant (`not-found`, `connection-lost`, `invalid-credentials`, `server-error`, `game-corrupted`) has a config object in `VariantConfigurationService` with icon, eyebrow, title segments, and a French-language message.

### Testability conventions

- Dependencies that require real timers or browser APIs are abstracted behind injection tokens (`TIMER`) or interfaces (`SocketLike`, `TokenProvider`) to allow unit-test substitutes.
- Test files use a host component pattern to test components in composition (see `button.spec.ts`).
- Vitest globals are available in spec files without explicit imports (`describe`, `it`, `expect`) — configured via `tsconfig.spec.json`.

### Icons

Lucide icons are registered in `app.config.ts` via `LucideAngularModule.pick({...})`. Add new icons to that pick list before using them in templates.

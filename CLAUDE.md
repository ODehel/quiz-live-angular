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

Copy `src/environments/environment.example.ts` to `src/environments/environment.ts` and fill in the backend credentials:

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
| `WebSocketService` | Not Angular-injectable by default; constructed manually so callers inject a `WebSocketCtor`, `TokenProvider`, and `ErrorNavigator`. Handles exponential-backoff reconnect (up to 30 s), re-auth on close code 4002, and fatal navigation on code 4004 |
| `GameStateService` | Single signal holding the current `Phase` (`setup` → `lobby` → `playing` → `results` \| `error`) |
| `ErrorService` | Signal holding the active `ErrorContext` variant; consumed by `ErrorPage` overlay in `App` |
| `ToastService` | Signal-based queue (max 5), auto-removes after `duration` ms via the `TIMER` injection token |
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

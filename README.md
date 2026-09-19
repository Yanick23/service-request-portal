# Service Request Portal

A single-page application for managing customer service requests: browse, search, filter and sort
requests, view details, create new ones, and move a request through its status lifecycle.
Authentication is delegated to an external OIDC provider (Auth0).

## Solution overview

The app is a React + TypeScript SPA built with Vite. All data access goes through a typed API
client generated against an OpenAPI 3 contract (`api-spec/openapi.yaml`). In local development the
API is simulated with Mock Service Worker (MSW), so the whole feature set — including validation
errors and optimistic-concurrency conflicts — can be exercised without a running backend.

Users sign in through Auth0 before seeing any content; the app is gated behind that authentication
state, and the resulting access token is attached to every API request.

## Technology and library choices

| Concern | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript | Required by the brief. |
| Build tool | Vite | Fast dev server/HMR, first-class TS + React support. |
| Routing | react-router-dom v7 | De facto standard client-side router for React SPAs. |
| Server state | @tanstack/react-query | Handles caching, pagination, retries and cache invalidation for API data, so components stay declarative. |
| Styling | Tailwind CSS v4 | Utility-first styling with no separate stylesheet maintenance burden. |
| UI components | shadcn/ui (Radix primitives) | Accessible, unstyled-by-default primitives (Select, Table, Alert, etc.) copied into the repo rather than imported from an opaque package, so they stay fully editable and themeable with Tailwind. |
| Authentication | react-oidc-context + oidc-client-ts, against Auth0 | Standards-compliant OIDC/PKCE flow for SPAs; works with any compliant provider (Auth0, Keycloak, ...) by swapping env vars. |
| API mocking | MSW (Mock Service Worker) | Intercepts real `fetch` calls in the browser and in tests, so the same handlers back local dev and the test suite — no separate mocking layer to keep in sync. |
| Types | openapi-typescript | Generates TypeScript types directly from the OpenAPI spec, so API and domain types can't drift out of sync. |
| Testing | Vitest + React Testing Library + MSW (node) | Fast, Vite-native test runner; RTL encourages testing behavior over implementation; reusing the same MSW handlers keeps mocked test data consistent with dev mocks. |
| CI | GitHub Actions | Required by the brief; runs lint, type check, tests and build on every push/PR. |

## Architecture summary

```
src/
├── api/         # Typed HTTP client (fetch wrapper, ApiError, validation-error mapping)
├── auth/        # OIDC wiring: AuthProvider config, AuthGate (loading/error/sign-in states)
├── components/  # Shared, presentational UI (StatusBadge, PriorityBadge, Alert, Field)
│   └── ui/      # shadcn/ui primitives (Button, Input, Select, Table, ...)
├── hooks/       # React Query hooks per operation (list/get/create/update-status)
├── mocks/       # MSW request handlers + in-memory seed data
├── pages/       # One component per route; composes hooks + components
├── types/       # api.generated.ts (from OpenAPI) + domain types/enums
├── test/        # Vitest setup, MSW test server, render helpers
├── App.tsx      # Routes + app shell (header, sign-out)
└── Root.tsx     # Auth/query/router provider wiring
```

Data flows in one direction: **pages** call **hooks**, hooks call the **api client**, the api client
talks to `/api/*` (real backend, or MSW in dev/tests). Presentational **components** never fetch data
themselves, which keeps them trivially testable and reusable across pages.

## Local setup

Requires **Node.js 20+** (Vite 8's bundler uses a `node:util` API not available on Node 18).

```bash
npm install
cp .env.example .env   # then fill in the OIDC values, see below
npm run dev
```

The app runs at `http://localhost:5173`.

## OIDC provider configuration

This project is wired up against **Auth0**, but `react-oidc-context` works with any standards-compliant
OIDC provider (Keycloak, Okta, ...) — just point the env vars at it.

To configure Auth0:

1. Create an application of type **Single Page Application** in the Auth0 dashboard.
2. In its **Settings**, set:
   - **Allowed Callback URLs**: `http://localhost:5173`
   - **Allowed Logout URLs**: `http://localhost:5173`
   - **Allowed Web Origins**: `http://localhost:5173`
   - Save changes.
3. Copy the **Domain** and **Client ID** from the same page into `.env` (see below).

No client secret is used or required — SPAs authenticate with PKCE.

## Environment-variable configuration

See `.env.example` for the full list with comments. Summary:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL the app calls for the Service Request API. Defaults to `/api`. |
| `VITE_USE_MOCKS` | When `true`, MSW intercepts API calls in the browser instead of hitting a real backend. |
| `VITE_OIDC_AUTHORITY` | OIDC issuer URL, e.g. `https://your-tenant.eu.auth0.com`. |
| `VITE_OIDC_CLIENT_ID` | OIDC client ID (not a secret — it's exposed in the browser bundle regardless). |
| `VITE_OIDC_SCOPE` | Requested scopes, defaults to `openid profile email`. |

`.env` is git-ignored; `.env.example` documents the shape without real values.

## API-mocking approach

`src/mocks/handlers.ts` implements the same endpoints described in the OpenAPI spec (list with
pagination/search/filter/sort, get by id, create with server-side validation, and status update with
optimistic-concurrency via a `version` field returning `409` on conflict) against an in-memory array
(`src/mocks/data.ts`). `src/main.tsx` starts the MSW browser worker only when `VITE_USE_MOCKS=true`;
the same handlers are reused in tests via `msw/node` (see Testing strategy), so dev and test behavior
can't drift apart.

## Development, lint, test and build commands

```bash
npm run dev         # start the Vite dev server
npm run build       # type-check (tsc -b) and build for production
npm run preview     # preview the production build locally
npm run lint         # eslint .
npm run test         # run the test suite once (vitest run)
npm run test:watch  # run the test suite in watch mode
```

## Testing strategy

Tests run with **Vitest** (jsdom environment) and **React Testing Library**, at three levels:

- **Unit** — pure logic, e.g. `ApiError`'s status-based getters and the validation-error mapping
  helper (`src/api/client.test.ts`).
- **Component** — shared UI in isolation, e.g. `StatusBadge`/`PriorityBadge` render the expected
  label for every enum value (`src/components/Badge.test.tsx`).
- **Integration** — full pages rendered with real React Query + router providers, against an MSW
  node server reusing the app's own mock handlers, covering the loading/empty/error/validation states
  the brief calls out explicitly (`src/pages/*.test.tsx`).

`src/test/setup.ts` starts/stops the MSW server and resets both Testing Library's DOM and the mock
in-memory data between tests, so tests don't leak state into each other.

## GitHub Actions workflow

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests: `npm ci`, then lint,
`tsc --noEmit`, the test suite, and finally the production build — so a broken build, a failing test,
or a lint/type error is caught before merge.

## Security and accessibility considerations

**Security**
- Authentication uses the OIDC Authorization Code flow with PKCE (no implicit flow, no client secret
  in the SPA).
- The access token is held in memory by `oidc-client-ts` and attached as a `Bearer` header only to
  outgoing API requests (`setAccessTokenGetter` in `src/api/client.ts`); it isn't logged or rendered.
- `.env` (real credentials/config) is git-ignored; only `.env.example` (no secrets) is committed.
- The API client distinguishes 401 (unauthenticated), 409 (conflict) and 422/400 (validation) so the
  UI never has to guess at error meaning from a generic message.

**Accessibility**
- Interactive controls (`Select`, `Button`, dialogs where used) are Radix primitives, which provide
  correct roles, keyboard navigation and focus management out of the box.
- Form fields pair every input with a `<Label htmlFor>` (`src/components/Field.tsx`).
- Error and conflict messages use `role="alert"` so assistive tech announces them.
- Layout is responsive from mobile widths up (tested at 375/768/1280px), with no fixed-width
  containers that would force horizontal scrolling of the page itself.

## Known limitations

- No end-to-end (browser-driven) tests — coverage stops at component/integration level with a
  simulated API; there's no Playwright/Cypress suite exercising a real backend.
- The requests table scrolls horizontally on narrow screens rather than reflowing into cards; at
  375px width two of five columns require a horizontal scroll to reach.
- 401 responses from the mock API are surfaced as a generic API error rather than automatically
  triggering a re-login; only the initial sign-in flow (not mid-session token expiry) is handled.
- The production bundle exceeds Vite's default 500 kB chunk-size warning; it isn't code-split further
  since this app has a small, single-purpose route tree.
- Mock data lives in memory only (via MSW) and resets on every full page reload.

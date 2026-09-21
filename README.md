# Service Request Portal

A single-page app for managing customer service requests. You can browse the list, search and
filter it, sort by date, open a request to see its details, create new ones, and move a request
through its status lifecycle. Sign-in is handled by an external OIDC provider (Auth0 in this setup,
but any standards-compliant provider works).


## Solution overview

It's a React + TypeScript SPA, built with Vite. Everything the app knows about the API comes from an
OpenAPI 3 contract (`api-spec/openapi.yaml`), which also generates the TypeScript types used
throughout — so if the contract changes, the compiler tells you where the app broke instead of
finding out at runtime.

There's no backend running locally. Mock Service Worker (MSW) intercepts the API calls in the
browser and serves them from an in-memory dataset, which means the whole feature set — including
validation errors and version-conflict handling — works out of the box without anyone standing up a
server.

Auth0 sits in front of everything: you don't see any app content until you're signed in, and the
resulting access token rides along on every request to the API.

## Why these libraries

- **React 19 + TypeScript** — the brief's baseline.
- **Vite** — fast dev server and a build setup that doesn't need much configuration.
- **react-router-dom v7** for routing — it's the default choice for an SPA at this point.
- **@tanstack/react-query** for server state. Pagination, caching, retries and invalidation are
  handled by the library instead of hand-rolled `useEffect`s, which keeps the page components mostly
  about rendering.
- **Tailwind CSS v4** for styling, paired with **shadcn/ui** (built on Radix primitives). shadcn
  components get copied into the repo rather than pulled in as an opaque dependency, so they're
  ordinary editable components — accessible by default, styled with Tailwind, no fighting a library's
  API to change something small.
- **react-oidc-context + oidc-client-ts** for auth. It's a standards-based OIDC/PKCE client, so
  swapping Auth0 for Keycloak or another provider is a matter of changing env vars, not code.
- **axios** for HTTP, behind a small `HttpClient` interface (`src/api/httpClient.ts`) that
  `serviceRequestApi` (`src/api/client.ts`) depends on instead of axios directly — interceptors
  handle attaching the bearer token and mapping failures to `ApiError`, and swapping the transport
  later (a different library, a test double) means writing a new class, not touching any page or
  hook.
- **MSW** for mocking. It intercepts network traffic at the browser/Node level regardless of which
  HTTP client makes the call, which means the same handlers work in the browser during development
  and in tests under Node — one set of mocks, not two things that can drift apart.
- **openapi-typescript** to generate types from the spec, for the reason mentioned above.
- **Vitest + React Testing Library** for testing — fast, integrates natively with Vite, and RTL
  nudges you toward testing what the user sees rather than implementation details.
- **GitHub Actions** for CI, per the brief.

## Architecture

```
src/
├── api/         # httpClient.ts (HttpClient port + axios adapter, ApiError), client.ts (serviceRequestApi)
├── auth/        # OIDC wiring: AuthProvider config, AuthGate (loading/error/sign-in states)
├── components/  # Shared, presentational UI (StatusBadge, PriorityBadge, Alert, Field)
│   └── ui/      # shadcn/ui primitives (Button, Input, Select, Table, ...)
├── hooks/       # React Query hooks per operation (list/get/create/update-status)
├── lib/         # cn() helper, shared service-request field validation
├── mocks/       # MSW request handlers + in-memory seed data
├── pages/       # One component per route; composes hooks + components
├── types/       # api.generated.ts (from OpenAPI) + domain types/enums
├── tests/       # All specs, grouped by kind rather than colocated with source
│   ├── unit/        # Plain functions/classes, no rendering
│   ├── component/   # A single UI component in isolation, no providers or network
│   ├── integration/ # Whole pages, real React Query/router providers, MSW-backed network
│   └── support/     # Vitest setup, MSW test server, render helpers used by the above
├── App.tsx      # Routes + app shell (header, sign-out)
└── Root.tsx     # Auth/query/router provider wiring
```

The dependency direction is one-way: pages call hooks, hooks call the API client, and the client
talks to `/api/*` — a real backend if there is one, MSW otherwise. Components under `components/`
don't fetch anything themselves; they just render what they're given, which is what makes them easy
to test and reuse.

## Getting it running locally

### You'll need

- **Node.js 20+** and **npm 10+** — Vite 8's bundler relies on a `node:util` API that isn't in Node
  18. `node -v` / `npm -v` to check.
- **Git**.
- An Auth0 (or other OIDC) application. Unlike the API, sign-in isn't mocked — `Root.tsx` refuses to
  render the app until `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID` are set, so you'll need at
  least a free Auth0 tenant to get past the login screen. See
  [OIDC provider configuration](#oidc-provider-configuration) below.

### Steps

```bash
git clone https://github.com/Yanick23/service-request-portal.git
cd service-request-portal
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The API is mocked by default (`VITE_USE_MOCKS=true`), so no backend is
needed — but you do need real Auth0 values in `.env` (`VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`;
see below) before the app will get past sign-in, since only the API is faked, not authentication.
Once you have a real backend, flip `VITE_USE_MOCKS=false` and point `VITE_API_BASE_URL` at it.


## OIDC provider configuration

Wired up for **Auth0** here, but `react-oidc-context` doesn't care which standards-compliant provider
sits behind it — Keycloak or Okta would work the same way, just different env values.

To set up Auth0:

1. Create an application of type **Single Page Application**.
2. Under its **Settings**, set these to `http://localhost:5173`:
   - Allowed Callback URLs
   - Allowed Logout URLs
   - Allowed Web Origins
3. Copy the **Domain** and **Client ID** into your `.env`.

No client secret involved — SPAs use PKCE instead, so there's nothing secret to leak.

## Environment variables

Full list with comments in `.env.example`. Short version:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Where the app looks for the Service Request API. Defaults to `/api`. |
| `VITE_USE_MOCKS` | `true` routes API calls through MSW instead of a real backend. |
| `VITE_OIDC_AUTHORITY` | The OIDC issuer URL, e.g. `https://your-tenant.eu.auth0.com`. |
| `VITE_OIDC_CLIENT_ID` | OIDC client ID — not secret, it ends up in the browser bundle either way. |
| `VITE_OIDC_SCOPE` | Requested scopes, defaults to `openid profile email`. |

`.env` is git-ignored. `.env.example` has the shape but none of the real values.

## How the API mocking works

`src/mocks/handlers.ts` implements the same endpoints as the OpenAPI spec — list with
pagination/search/filter/sort, get-by-id, create with server-side validation, and a status update
that does optimistic concurrency via a `version` field (returns `409` on conflict) — against an
in-memory array in `src/mocks/data.ts`. `main.tsx` only spins up the MSW browser worker when
`VITE_USE_MOCKS=true`, and falls back to rendering without mocks if the worker fails to start rather
than leaving a blank page. Tests reuse the exact same handlers through `msw/node`, so what you see in
dev is what gets tested — there's no separate "test version" of the mock data to keep in sync.

The create-request field rules (min/max lengths, email format) live once in
`src/lib/serviceRequestValidation.ts` and are imported by both the mock's POST handler and the
`NewRequestPage` form, so client-side and "server-side" validation can't quietly drift apart.

## Commands

```bash
npm run dev         # start the Vite dev server
npm run build        # type-check (tsc -b) and build for production
npm run preview      # preview the production build locally
npm run lint          # eslint .
npm run test          # run the test suite once (vitest run)
npm run test:watch   # run the test suite in watch mode
```

## Testing strategy

Vitest + React Testing Library, in jsdom, at three levels, each living under its own folder in
`src/tests/` instead of sitting next to the source file:

- **Unit** — plain logic, no rendering: `ApiError`'s status-based getters and the validation-error
  mapping (`src/tests/unit/api/httpClient.test.ts`), and the service-request field rules
  (`src/tests/unit/requests/serviceRequestValidation.test.ts`).
- **Component** — shared UI in isolation, e.g. that `StatusBadge`/`PriorityBadge` render the right
  label for every enum value (`src/tests/component/requests/StatusBadge.test.tsx` and
  `PriorityBadge.test.tsx`).
- **Integration** — whole pages rendered with real React Query and router providers, against an MSW
  server on the Node side reusing the same handlers as dev. This is where the loading/empty/error/
  validation states the brief asks for actually get exercised
  (`src/tests/integration/requests/*.test.tsx`).

`src/tests/support/setup.ts` starts and stops the MSW server and resets both the DOM and the
in-memory mock data between tests, so one test can't leak state into the next.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests: install, lint, type
check (`tsc --noEmit`), test suite, build. If any of those fail, the PR shows it before it gets
merged.

## Security and accessibility

**Security**
- Auth uses the OIDC Authorization Code flow with PKCE — no implicit flow, no client secret sitting
  in browser code.
- The access token lives in memory (`oidc-client-ts`) and only gets attached as a `Bearer` header to
  outgoing API requests (`setAccessTokenGetter` in `src/api/httpClient.ts`, applied through an axios
  request interceptor). It's never logged or rendered anywhere.
- `.env` is git-ignored; only `.env.example`, with no real values, is committed.
- The API client tells 401 (not signed in), 409 (conflict) and 422/400 (validation) apart, so the UI
  can show something meaningful instead of a generic "something went wrong." A 401 also triggers
  `auth.signinRedirect()` (wired up in `AuthGate.tsx`), so a session that expires mid-use sends the
  user back through login instead of stalling on a dead request.

**Accessibility**
- Interactive bits (`Select`, `Button`, dialogs) are Radix primitives underneath, which already get
  roles, keyboard navigation and focus handling right.
- Every form field is paired with a `<Label htmlFor>` (`src/components/Field.tsx`).
- Errors and conflicts use `role="alert"` so screen readers actually announce them.
- Responsive from mobile widths up — checked at 375/768/1280px — with nothing fixed-width that would
  force the page itself to scroll horizontally. The requests list reflows into cards below the `sm`
  breakpoint instead of a table that needs horizontal scrolling.

## Known limitations

- No browser-driven end-to-end tests. Coverage stops at component/integration level against the
  mocked API; there's no Playwright/Cypress suite hitting a real backend.
  tree is small and single-purpose — didn't seem worth splitting further for this.
- Mock data is in-memory only, so it resets on every full page reload.

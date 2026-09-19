# Service Request Portal

A single-page app for managing customer service requests. You can browse the list, search and
filter it, sort by date, open a request to see its details, create new ones, and move a request
through its status lifecycle. Sign-in is handled by an external OIDC provider (Auth0 in this setup,
but any standards-compliant provider works).

This was built as a technical challenge, so a few sections below (tech choices, limitations) are more
explicit than you'd normally write for a "just get the job done" README — the idea is to make the
reasoning behind decisions visible, not just the decisions themselves.

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
- **MSW** for mocking. It intercepts real `fetch` calls, which means the same handlers work in the
  browser during development and in tests under Node — one set of mocks, not two things that can
  drift apart.
- **openapi-typescript** to generate types from the spec, for the reason mentioned above.
- **Vitest + React Testing Library** for testing — fast, integrates natively with Vite, and RTL
  nudges you toward testing what the user sees rather than implementation details.
- **GitHub Actions** for CI, per the brief.

## Architecture

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

The dependency direction is one-way: pages call hooks, hooks call the API client, and the client
talks to `/api/*` — a real backend if there is one, MSW otherwise. Components under `components/`
don't fetch anything themselves; they just render what they're given, which is what makes them easy
to test and reuse.

## Getting it running locally

### You'll need

- **Node.js 20+** and **npm 10+** — Vite 8's bundler relies on a `node:util` API that isn't in Node
  18. `node -v` / `npm -v` to check.
- **Git**.
- An Auth0 (or other OIDC) application, but only if you actually want to sign in against a real
  provider — see [OIDC provider configuration](#oidc-provider-configuration). You don't need this
  just to run the app, since the default mock setup fakes sign-in too.

### Steps

```bash
git clone https://github.com/Yanick23/service-request-portal.git
cd service-request-portal
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. Out of the box (`VITE_USE_MOCKS=true`) it runs fully mocked, no
provider or backend needed. If you want to try it against a real Auth0 tenant, fill in
`VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID` in `.env` (details below), and flip
`VITE_USE_MOCKS=false` once you've also got a real API for `VITE_API_BASE_URL` to point at.

Worth running once to make sure everything's in order:

```bash
npm run lint
npm run test
npm run build
```

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
`VITE_USE_MOCKS=true`. Tests reuse the exact same handlers through `msw/node`, so what you see in dev
is what gets tested — there's no separate "test version" of the mock data to keep in sync.

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

Vitest + React Testing Library, in jsdom, at three levels:

- **Unit** — plain logic, like `ApiError`'s status-based getters and the validation-error mapping
  (`src/api/client.test.ts`).
- **Component** — shared UI in isolation, e.g. that `StatusBadge`/`PriorityBadge` render the right
  label for every enum value (`src/components/Badge.test.tsx`).
- **Integration** — whole pages rendered with real React Query and router providers, against an MSW
  server on the Node side reusing the same handlers as dev. This is where the loading/empty/error/
  validation states the brief asks for actually get exercised (`src/pages/*.test.tsx`).

`src/test/setup.ts` starts and stops the MSW server and resets both the DOM and the in-memory mock
data between tests, so one test can't leak state into the next.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests: install, lint, type
check (`tsc --noEmit`), test suite, build. If any of those fail, the PR shows it before it gets
merged.

## Security and accessibility

**Security**
- Auth uses the OIDC Authorization Code flow with PKCE — no implicit flow, no client secret sitting
  in browser code.
- The access token lives in memory (`oidc-client-ts`) and only gets attached as a `Bearer` header to
  outgoing API requests (`setAccessTokenGetter` in `src/api/client.ts`). It's never logged or
  rendered anywhere.
- `.env` is git-ignored; only `.env.example`, with no real values, is committed.
- The API client tells 401 (not signed in), 409 (conflict) and 422/400 (validation) apart, so the UI
  can show something meaningful instead of a generic "something went wrong."

**Accessibility**
- Interactive bits (`Select`, `Button`, dialogs) are Radix primitives underneath, which already get
  roles, keyboard navigation and focus handling right.
- Every form field is paired with a `<Label htmlFor>` (`src/components/Field.tsx`).
- Errors and conflicts use `role="alert"` so screen readers actually announce them.
- Responsive from mobile widths up — checked at 375/768/1280px — with nothing fixed-width that would
  force the page itself to scroll horizontally.

## Known limitations

- No browser-driven end-to-end tests. Coverage stops at component/integration level against the
  mocked API; there's no Playwright/Cypress suite hitting a real backend.
- The requests table scrolls horizontally on narrow screens instead of reflowing into cards — at
  375px, two of the five columns need that scroll to reach.
- A 401 from the mock API just shows as a generic API error rather than kicking off a re-login
  automatically. Only the initial sign-in is handled, not a token expiring mid-session.
- The production bundle trips Vite's default 500 kB chunk-size warning. Left as-is since the route
  tree is small and single-purpose — didn't seem worth splitting further for this.
- Mock data is in-memory only, so it resets on every full page reload.

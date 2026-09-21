# Service Request Portal

A single-page app for managing customer service requests. You can browse the list, search and
filter it, sort by date, open a request to see its details, create new ones, and move a request
through its status lifecycle. Sign-in is handled by an external OIDC provider (Auth0 in this setup,
but any standards-compliant provider works).

**Live:** [production](https://yanick23.github.io/service-request-portal/) ·
[staging](https://yanick23.github.io/service-request-portal/staging/) — both deploy automatically, see
[CI/CD](#cicd).


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
2. Under its **Settings**, add both of these (comma-separated) to:
   - Allowed Callback URLs
   - Allowed Logout URLs
   - Allowed Web Origins

   ```
   http://localhost:5173/, https://<your-github-username>.github.io/service-request-portal/staging/, https://<your-github-username>.github.io/service-request-portal/
   ```

   Local dev, staging, and production (see [CI/CD](#cicd)) respectively. Note the trailing slash on
   both GitHub Pages URLs — it's part of `BASE_URL` and the callback won't match without it.
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

**Mocking under a subpath (GitHub Pages):** a Service Worker can only intercept requests within the
path it's registered from. On GitHub Pages the app lives at `/service-request-portal/`, not the domain
root, so `main.tsx` registers the worker explicitly at `${BASE_URL}mockServiceWorker.js` (not the
default `/mockServiceWorker.js`) — otherwise the registration itself fails outright. That alone isn't
enough: the mocked requests also have to *land* inside that scope, so `httpClient.ts` falls back to
`${BASE_URL}api` instead of a bare `/api` when `VITE_API_BASE_URL` isn't set. `handlers.ts` matches
against `*/api/...` (wildcard prefix) rather than a fixed `/api/...`, so the same handler file keeps
working whether the request path is `/api/requests` (dev, tests) or
`/service-request-portal/api/requests` (GitHub Pages) — no environment-specific branching needed.

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

## CI/CD

`.github/workflows/ci.yml` has three jobs, matching the four environments this app runs in:

- **Development** — local only, never touches CI. `npm run dev` against your own `.env`.
- **Test** — the `test` job. Runs on every push to `main`/`develop` and on every pull request: install,
  lint, type check (`tsc -b`), test suite. Doesn't need any of the `VITE_*` env vars — the test suite
  never renders `AuthGate`/`Root`, and everything network-shaped goes through MSW (see
  [Testing strategy](#testing-strategy)), so there's nothing environment-specific to inject here.
- **Staging** — the `deploy-staging` job. Runs on a push to `develop`, only after `test` passes, and
  publishes to [https://yanick23.github.io/service-request-portal/staging/](https://yanick23.github.io/service-request-portal/staging/).
  This is the "does it work for real" environment — point its `VITE_*` variables at a staging backend
  (or leave `VITE_USE_MOCKS=true` if there isn't one yet) before merging into `main`.
- **Production** — the `deploy-production` job. Same shape, triggered by a push to `main`, publishing
  to the site root ([https://yanick23.github.io/service-request-portal/](https://yanick23.github.io/service-request-portal/)).

Both deploy jobs build with `vite build` directly (skipping `tsc -b` — `test` already checked types on
the same commit) and push straight to the `gh-pages` branch via `peaceiris/actions-gh-pages`, each into
its own `destination_dir` (`.` for production, `staging` for staging) with `keep_files: true` — so a
staging deploy doesn't wipe out production's files on the same branch, and vice versa.

Before building, each deploy job runs a **"Check required environment variables"** step that fails
fast (with a clear `::error::` message naming the missing variable and where to set it) if
`VITE_OIDC_AUTHORITY`/`VITE_OIDC_CLIENT_ID` are empty, instead of silently deploying a broken build.

After building, each job also copies `dist/index.html` to `dist/404.html`. GitHub Pages is a static
file host — reloading a client-side route like `/requests` sends a real request for that path, which
doesn't exist as a file, so Pages 404s. Serving the SPA's own `index.html` for any unmatched path lets
React Router pick up from `location.pathname` once it loads. **This only fully works for production**:
GitHub Pages recognizes a single site-wide `404.html` at the branch root, so a deep-linked reload under
`/staging/...` falls back to the *production* `index.html` instead (wrong `BASE_URL`, wrong router
`basename`). Navigating inside the app (clicking links, no reload) works fine in both — only a direct
reload/bookmark on a staging sub-route is affected, and there's no fix for that without different
hosting per environment.

To make both deploy jobs work, three things need setting up by hand — none of them are files in this
repo:

1. **Repo settings → Pages → Source: "Deploy from a branch"**, branch `gh-pages`, folder `/ (root)`.
   `peaceiris/actions-gh-pages` creates that branch on its first run if it doesn't exist yet.
2. **Repo settings → Environments → two new environments, `staging` and `production`**, each with its
   own copy of these variables (repo **Variables**, not **Secrets** — none of these are actually
   secret; the client ID and API URL end up in the bundle either way):

   | Variable | Example |
   |---|---|
   | `VITE_API_BASE_URL` | `https://api.example.com` |
   | `VITE_USE_MOCKS` | `false` |
   | `VITE_OIDC_AUTHORITY` | `https://your-tenant.eu.auth0.com` |
   | `VITE_OIDC_CLIENT_ID` | your Auth0 SPA client ID — same one for both environments unless you're running separate Auth0 apps per stage |
   | `VITE_OIDC_SCOPE` | `openid profile email` |

   A GitHub `environment:` per stage also means you can turn on a required-reviewer protection rule on
   `production` later, without touching the workflow file.
3. **Auth0** (or whichever OIDC provider) needs the staging callback URL added too — see
   [OIDC provider configuration](#oidc-provider-configuration).

GitHub Pages serves the production build from `/service-request-portal/` and staging from
`/service-request-portal/staging/` — neither is the domain root. `vite.config.ts`, `main.tsx`'s
`BrowserRouter` and the OIDC `redirect_uri` all derive their base path from Vite's `BASE_URL` (which
the staging build overrides with `vite build --base=...`) instead of hardcoding `/`, so the same code
works locally, in staging and in production without a build-time branch in the app code itself.

## Security and accessibility

**Security**
- Auth uses the OIDC Authorization Code flow with PKCE — no implicit flow, no client secret sitting
  in browser code.
- The access token lives in `sessionStorage` (`oidc-client-ts`'s default) and only gets attached as a
  `Bearer` header to outgoing API requests (`setAccessTokenGetter` in `src/api/httpClient.ts`, applied
  through an axios request interceptor). It's never logged or rendered anywhere.
  - **Limitation:** like any client-side storage, it's readable by an XSS payload already executing on
    the page — that script can read the token directly, or just monkeypatch `fetch`/`XMLHttpRequest`
    before a legitimate request goes out. No client-side storage choice closes that gap; only an
    `httpOnly` cookie set by a backend (a BFF in front of the SPA) keeps the token out of JavaScript's
    reach entirely, and that's a bigger architectural change than this project currently makes.
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
- The session doesn't survive closing the browser tab/window — `sessionStorage` (where the OIDC token
  lives, see "Security and accessibility" above) is cleared with it, so reopening the app means signing
  in again. Switching to `localStorage` would fix that but keeps the token around for longer if the
  page is ever compromised by XSS; an in-memory store with a `signinSilent()` restore on load would
  narrow that window back down, at the cost of depending on the IdP's session cookie (and falling back
  to a full sign-in redirect on browsers that block third-party cookies for a silent iframe renewal,
  e.g. Safari's ITP).

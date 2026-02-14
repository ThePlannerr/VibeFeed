# VibeFeed MVP

Expo React Native MVP for swipe-first TV/movie discovery with transparent recommendation reasoning.

## Implemented Product Scope

- Scope: `Swipe + Save + Why`
- Monetization: Freemium with Pro-gated precision controls
- Onboarding: fast setup (favorites + vibe chips + 10 seed swipes)
- Catalog: TV + Movies only (TMDB-style metadata fixture)
- Recommendation model: lightweight hybrid scoring + diversification + exploration labeling
- Data posture: minimal, explicit, local persistence
- North-star KPI: watch-through conversion (`saved -> watched within 14 days`)

## Screen Map

- `app/onboarding-start.tsx`
- `app/taste-seeder.tsx`
- `app/swipe-feed.tsx`
- `app/title/[id].tsx`
- `app/watchlist.tsx`
- `app/profile-preferences.tsx`
- `app/pro-upsell.tsx`
- `app/post-watch-pulse.tsx`

## Core Contracts And Types

- API route map: `lib/api-contract.ts`
- API request/response shapes: `types/api.ts`
- Domain models (`RecommendationCard`, `UserTasteProfile`, `InteractionEvent`): `types/domain.ts`

## Recommendation Engine

Implemented in `lib/recommendation.ts`:

- Weighted blend of:
  - content similarity (genre + vibe overlap),
  - explicit preference fit (like/pass/super-like/save),
  - behavior recency signal
- Rule constraints:
  - blocked genres
  - runtime bounds
  - language preference
- Diversification:
  - near-duplicate consecutive primary genres penalized
- Explainability:
  - up to 3 `why_tags`
  - minimum 2 tags per card
  - low confidence cards marked as `exploration_pick`

## Data, Events, KPIs

State and persistence: `context/app-state.tsx`

- Session: anonymous-first, with optional Supabase email auth
- Persistence: `@react-native-async-storage/async-storage`, partitioned by identity (`guest` vs `user:<id>`)
- Events tracked:
  - `onboarding_completed`
  - `card_swiped`
  - `title_saved`
  - `watch_pulse_submitted`
  - `rec_clicked`
  - `pro_paywall_viewed`
  - `pro_upgraded`
- KPI snapshot includes:
  - watch-through conversion
  - save rate per 100 swipes
  - skip-to-like ratio
  - D1/D7 retention proxies
  - Pro conversion and paywall bounce

## Auth and Account Lifecycle

- App auth provider: Supabase email/password (`lib/auth.ts` + `context/app-state.tsx`)
- Account creation/sign-in UI: `app/onboarding-start.tsx`
- Sign out + permanent delete UI: `app/profile-preferences.tsx`
- Server-side delete endpoint: `POST /v1/auth/delete-account` in `proxy/server.mjs`
- Delete account requires:
  - valid user bearer token
  - explicit confirmation string `DELETE_MY_ACCOUNT`
  - backend-only `SUPABASE_SERVICE_ROLE_KEY`

## Pro Gating

Free users:

- full onboarding
- unlimited core swipes
- watchlist + save/unsave
- baseline personalization and why-tags

Pro users:

- runtime window
- language preference
- mood intensity tuning
- more-like / less-like controls

Controls are visible to free users but locked until upgrade.

## Run

```bash
npm install
npm run start
```

## Environment

Create a local env file before running:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Variables:

- `EXPO_PUBLIC_ENABLE_LLM_EXPLANATIONS`: enables optional LLM why-tag enrichment.
- `EXPO_PUBLIC_LLM_PROXY_URL`: base URL for your backend/proxy (default in example is local).
- `EXPO_PUBLIC_API_PROXY_URL`: API base URL for app-to-proxy calls (account deletion uses this; defaults to LLM proxy URL if omitted).
- `EXPO_PUBLIC_LLM_REQUEST_TIMEOUT_MS`: request timeout for proxy calls.
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL for client auth.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key for client auth.

Important: this Expo client only uses `EXPO_PUBLIC_*` values, which are visible in the app bundle. Do not put provider secret API keys in `.env`; keep those in your backend/proxy.

### LLM Proxy Contract

When LLM explanations are enabled, the app posts to:

- `POST {EXPO_PUBLIC_LLM_PROXY_URL}/v1/recs/why-tags`

Expected response shape:

```json
{
  "cards": [
    { "title_id": "tt123", "why_tags": ["Tense mystery", "Matches your dark vibe"] }
  ]
}
```

If the endpoint is unavailable or returns invalid data, the app automatically falls back to local recommendation why-tags.

### Local Proxy Quickstart

1. Create `proxy/.env` from the sample:

```powershell
Copy-Item proxy/.env.sample proxy/.env
```

2. Set proxy env values in `proxy/.env`:
   - `OPENAI_API_KEY` (optional, for LLM why-tags)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for account deletion)
3. Start the proxy:

```bash
npm run proxy:start
```

4. Confirm health:

- `GET http://localhost:8787/health`

5. In app `.env`, set:

- `EXPO_PUBLIC_ENABLE_LLM_EXPLANATIONS=true`
- `EXPO_PUBLIC_LLM_PROXY_URL=http://localhost:8787`
- `EXPO_PUBLIC_API_PROXY_URL=http://localhost:8787`
- `EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`

Without `OPENAI_API_KEY`, the proxy still runs and returns deterministic fallback tags.

Lint:

```bash
npm run lint
```

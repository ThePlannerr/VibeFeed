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

- Session: anonymous-first
- Persistence: `@react-native-async-storage/async-storage`
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

Lint:

```bash
npm run lint
```

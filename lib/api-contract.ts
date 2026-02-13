export const API_V1_ROUTES = {
  sessionStart: 'POST /v1/session/start',
  onboardingSeed: 'POST /v1/onboarding/seed',
  recsFeed: 'GET /v1/recs/feed?cursor=...',
  recsInteraction: 'POST /v1/recs/interaction',
  watchPulse: 'POST /v1/watch/pulse',
  watchlist: 'GET /v1/watchlist',
  titleById: 'GET /v1/title/:id',
  search: 'GET /v1/search?q=...',
  profilePreferences: 'GET /v1/profile/preferences',
  patchProfilePreferences: 'PATCH /v1/profile/preferences',
} as const;

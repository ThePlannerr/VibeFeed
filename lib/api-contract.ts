export const API_V1_ROUTES = {
  authDeleteAccount: 'POST /v1/auth/delete-account',
  sessionStart: 'POST /v1/session/start',
  onboardingSeed: 'POST /v1/onboarding/seed',
  recsFeed: 'GET /v1/recs/feed?cursor=...',
  recsWhyTags: 'POST /v1/recs/why-tags',
  recsInteraction: 'POST /v1/recs/interaction',
  watchPulse: 'POST /v1/watch/pulse',
  watchlist: 'GET /v1/watchlist',
  titleById: 'GET /v1/title/:id',
  search: 'GET /v1/search?q=...',
  profilePreferences: 'GET /v1/profile/preferences',
  patchProfilePreferences: 'PATCH /v1/profile/preferences',
} as const;

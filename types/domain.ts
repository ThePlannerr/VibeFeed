export type RecConfidence = 'high' | 'medium' | 'low';

export type SwipeAction = 'like' | 'pass' | 'super_like' | 'save' | 'unsave';

export type WatchReaction = 'loved_it' | 'good' | 'meh' | 'not_for_me';

export type AnalyticsEventName =
  | 'onboarding_completed'
  | 'card_swiped'
  | 'title_saved'
  | 'watch_pulse_submitted'
  | 'rec_clicked'
  | 'pro_paywall_viewed'
  | 'pro_upgraded';

export type RuntimePreference = {
  min: number;
  max: number;
};

export type UserTasteProfile = {
  favorite_title_ids: string[];
  vibe_chips: string[];
  blocked_genres: string[];
  runtime_pref: RuntimePreference | null;
  language_pref: string[];
  mood_intensity: number;
  more_like_title_id: string | null;
  less_like_title_id: string | null;
};

export type InteractionEvent = {
  user_id: string;
  title_id: string;
  action: SwipeAction;
  timestamp: string;
  context: {
    screen: string;
    card_rank?: number;
  };
};

export type AnalyticsEvent = {
  event: AnalyticsEventName;
  timestamp: string;
  payload: Record<string, string | number | boolean | null>;
};

export type Title = {
  id: string;
  title_name: string;
  year: number;
  genres: string[];
  runtime: number;
  language: string;
  moods: string[];
  popularity: number;
  synopsis: string;
  cast: string[];
  poster_url: string;
  availability_hint: string;
};

export type RecommendationCard = {
  id: string;
  title_id: string;
  title_name: string;
  poster_url: string;
  year: number;
  genres: string[];
  runtime: number;
  match_score: number;
  why_tags: string[];
  confidence: RecConfidence;
  availability_hint: string;
  exploration_pick: boolean;
};

export type WatchPulse = {
  title_id: string;
  watched: boolean;
  reaction: WatchReaction;
  timestamp: string;
};

export type SessionState = {
  session_id: string;
  user_id: string;
  anonymous: boolean;
  created_at: string;
};

export type AppStateSnapshot = {
  session: SessionState | null;
  onboarding_complete: boolean;
  profile: UserTasteProfile;
  interactions: InteractionEvent[];
  watchlist: string[];
  watch_pulses: WatchPulse[];
  analytics: AnalyticsEvent[];
  is_pro: boolean;
};

export const DEFAULT_PROFILE: UserTasteProfile = {
  favorite_title_ids: [],
  vibe_chips: [],
  blocked_genres: [],
  runtime_pref: null,
  language_pref: ['en'],
  mood_intensity: 50,
  more_like_title_id: null,
  less_like_title_id: null,
};
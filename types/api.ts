import {
  InteractionEvent,
  RecommendationCard,
  SessionState,
  UserTasteProfile,
  WatchPulse,
} from '@/types/domain';

export type SessionStartResponse = SessionState;

export type OnboardingSeedRequest = {
  favorite_title_ids: string[];
  vibe_chips: string[];
  seed_swipes: Pick<InteractionEvent, 'title_id' | 'action'>[];
};

export type OnboardingSeedResponse = {
  onboarding_complete: boolean;
};

export type FeedResponse = {
  cards: RecommendationCard[];
  next_cursor: string | null;
};

export type RecsInteractionRequest = {
  title_id: string;
  action: InteractionEvent['action'];
  context: InteractionEvent['context'];
};

export type WatchPulseRequest = {
  title_id: string;
  watched: boolean;
  reaction: WatchPulse['reaction'];
};

export type ProfilePreferencesResponse = UserTasteProfile;

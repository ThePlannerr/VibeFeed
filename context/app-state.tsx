import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { TITLES } from '@/constants/catalog';
import { buildRecommendationFeed } from '@/lib/recommendation';
import {
  FeedResponse,
  OnboardingSeedRequest,
  OnboardingSeedResponse,
  ProfilePreferencesResponse,
  RecsInteractionRequest,
  SessionStartResponse,
  WatchPulseRequest,
} from '@/types/api';
import {
  AnalyticsEventName,
  AppStateSnapshot,
  DEFAULT_PROFILE,
  InteractionEvent,
  SessionState,
  Title,
} from '@/types/domain';

const STORAGE_KEY = 'vibefeed:mvp:state:v1';
const FEED_PAGE_SIZE = 8;

const EMPTY_STATE: AppStateSnapshot = {
  session: null,
  onboarding_complete: false,
  profile: DEFAULT_PROFILE,
  interactions: [],
  watchlist: [],
  watch_pulses: [],
  analytics: [],
  is_pro: false,
};

type KpiSummary = {
  watch_through_conversion_pct: number;
  save_rate_per_100_swipes: number;
  skip_to_like_ratio: number;
  onboarding_completion_rate_pct: number;
  d1_retention_pct: number;
  d7_retention_pct: number;
  pro_conversion_pct: number;
  paywall_bounce_rate_pct: number;
};

type PatchProfileResult = {
  ok: boolean;
  pro_required: boolean;
};

type AppStateContextValue = {
  hydrated: boolean;
  state: AppStateSnapshot;
  catalog: Title[];
  startSession: () => Promise<SessionStartResponse>;
  submitOnboardingSeed: (seed: OnboardingSeedRequest) => Promise<OnboardingSeedResponse>;
  fetchFeed: (cursor?: string | null) => Promise<FeedResponse>;
  submitInteraction: (request: RecsInteractionRequest) => Promise<void>;
  submitWatchPulse: (request: WatchPulseRequest) => Promise<void>;
  getWatchlistTitles: () => Title[];
  getTitleById: (id: string) => Title | undefined;
  searchTitles: (query: string) => Title[];
  getProfilePreferences: () => ProfilePreferencesResponse;
  patchProfilePreferences: (patch: Partial<ProfilePreferencesResponse>) => Promise<PatchProfileResult>;
  upgradeToPro: () => Promise<void>;
  getKpis: () => KpiSummary;
  trackEvent: (
    event: AnalyticsEventName,
    payload: Record<string, string | number | boolean | null>,
  ) => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

const newId = (prefix: string) => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
};

const isProField = (key: keyof ProfilePreferencesResponse) => {
  return (
    key === 'runtime_pref' ||
    key === 'language_pref' ||
    key === 'mood_intensity' ||
    key === 'more_like_title_id' ||
    key === 'less_like_title_id'
  );
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppStateSnapshot>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as AppStateSnapshot;
          setState({
            ...EMPTY_STATE,
            ...parsed,
            profile: { ...DEFAULT_PROFILE, ...parsed.profile },
          });
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Non-blocking persistence path; app still works in-memory.
    });
  }, [hydrated, state]);

  const updateState = (updater: (previous: AppStateSnapshot) => AppStateSnapshot) => {
    setState((previous) => updater(previous));
  };

  const trackEvent: AppStateContextValue['trackEvent'] = async (event, payload) => {
    updateState((previous) => ({
      ...previous,
      analytics: [
        ...previous.analytics,
        {
          event,
          timestamp: new Date().toISOString(),
          payload,
        },
      ],
    }));
  };

  const startSession = async () => {
    if (state.session) {
      return state.session;
    }

    const session: SessionState = {
      session_id: newId('session'),
      user_id: newId('anon'),
      anonymous: true,
      created_at: new Date().toISOString(),
    };

    updateState((previous) => ({ ...previous, session }));
    return session;
  };

  const submitOnboardingSeed = async (seed: OnboardingSeedRequest) => {
    const ensuredSession = state.session ?? (await startSession());
    const now = new Date().toISOString();

    const seedInteractions: InteractionEvent[] = seed.seed_swipes.map((swipe) => ({
      user_id: ensuredSession.user_id,
      title_id: swipe.title_id,
      action: swipe.action,
      timestamp: now,
      context: { screen: 'TasteSeeder' },
    }));

    updateState((previous) => ({
      ...previous,
      onboarding_complete: true,
      profile: {
        ...previous.profile,
        favorite_title_ids: seed.favorite_title_ids,
        vibe_chips: seed.vibe_chips,
      },
      interactions: [...previous.interactions, ...seedInteractions],
    }));

    await trackEvent('onboarding_completed', {
      favorites_count: seed.favorite_title_ids.length,
      vibe_count: seed.vibe_chips.length,
      seed_swipe_count: seed.seed_swipes.length,
    });

    return { onboarding_complete: true };
  };

  const fetchFeed = async (cursor?: string | null) => {
    const offset = Number.parseInt(cursor ?? '0', 10) || 0;
    const cards = buildRecommendationFeed({
      titles: TITLES,
      profile: state.profile,
      interactions: state.interactions,
      watchlist: state.watchlist,
      limit: FEED_PAGE_SIZE,
      offset,
    });

    return {
      cards,
      next_cursor: cards.length < FEED_PAGE_SIZE ? null : `${offset + FEED_PAGE_SIZE}`,
    };
  };

  const submitInteraction = async (request: RecsInteractionRequest) => {
    const ensuredSession = state.session ?? (await startSession());
    const now = new Date().toISOString();
    const interaction: InteractionEvent = {
      user_id: ensuredSession.user_id,
      title_id: request.title_id,
      action: request.action,
      timestamp: now,
      context: request.context,
    };

    updateState((previous) => {
      const nextWatchlist =
        request.action === 'save'
          ? [...new Set([...previous.watchlist, request.title_id])]
          : request.action === 'unsave'
            ? previous.watchlist.filter((id) => id !== request.title_id)
            : previous.watchlist;

      return {
        ...previous,
        interactions: [...previous.interactions, interaction],
        watchlist: nextWatchlist,
      };
    });

    if (request.action === 'save') {
      await trackEvent('title_saved', { title_id: request.title_id, source: request.context.screen });
    }

    if (request.action === 'like' || request.action === 'pass' || request.action === 'super_like') {
      await trackEvent('card_swiped', {
        action: request.action,
        title_id: request.title_id,
        screen: request.context.screen,
      });
    }
  };

  const submitWatchPulse = async (request: WatchPulseRequest) => {
    updateState((previous) => ({
      ...previous,
      watch_pulses: [
        ...previous.watch_pulses,
        {
          ...request,
          timestamp: new Date().toISOString(),
        },
      ],
    }));

    await trackEvent('watch_pulse_submitted', {
      title_id: request.title_id,
      watched: request.watched,
      reaction: request.reaction,
    });
  };

  const getWatchlistTitles = () => {
    const index = new Set(state.watchlist);
    return TITLES.filter((title) => index.has(title.id));
  };

  const getTitleById = (id: string) => TITLES.find((title) => title.id === id);

  const searchTitles = (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      return TITLES.slice(0, 8);
    }

    return TITLES.filter((title) => title.title_name.toLowerCase().includes(clean)).slice(0, 12);
  };

  const getProfilePreferences = () => state.profile;

  const patchProfilePreferences: AppStateContextValue['patchProfilePreferences'] = async (patch) => {
    const patchKeys = Object.keys(patch) as Array<keyof ProfilePreferencesResponse>;
    const requiresPro = patchKeys.some((key) => isProField(key));
    if (requiresPro && !state.is_pro) {
      await trackEvent('pro_paywall_viewed', { source: 'profile_preferences' });
      return { ok: false, pro_required: true };
    }

    updateState((previous) => ({
      ...previous,
      profile: {
        ...previous.profile,
        ...patch,
      },
    }));
    return { ok: true, pro_required: false };
  };

  const upgradeToPro = async () => {
    if (state.is_pro) {
      return;
    }

    updateState((previous) => ({ ...previous, is_pro: true }));
    await trackEvent('pro_upgraded', { plan: 'monthly_mvp' });
  };

  const getKpis = () => {
    const swipeEvents = state.interactions.filter((item) =>
      ['like', 'pass', 'super_like'].includes(item.action),
    );
    const saveEvents = state.interactions.filter((item) => item.action === 'save');
    const passCount = swipeEvents.filter((item) => item.action === 'pass').length;
    const positiveCount = swipeEvents.filter((item) => item.action !== 'pass').length;

    const saveMap = saveEvents.reduce<Record<string, string>>((acc, event) => {
      acc[event.title_id] = acc[event.title_id] ?? event.timestamp;
      return acc;
    }, {});

    const watchedWithin14 = Object.entries(saveMap).filter(([titleId, saveTimestamp]) => {
      const pulse = state.watch_pulses.find((item) => item.title_id === titleId && item.watched);
      if (!pulse) {
        return false;
      }

      const deltaMs = new Date(pulse.timestamp).getTime() - new Date(saveTimestamp).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      return deltaMs >= 0 && deltaMs <= 14 * dayMs;
    }).length;

    const sessionDay = state.session ? new Date(state.session.created_at).toDateString() : null;
    const interactionDays = new Set(state.interactions.map((entry) => new Date(entry.timestamp).toDateString()));
    const hasD1 = sessionDay ? interactionDays.has(sessionDay) : false;
    const hasD7 = interactionDays.size >= 2;

    const paywallViews = state.analytics.filter((entry) => entry.event === 'pro_paywall_viewed').length;
    const upgrades = state.analytics.filter((entry) => entry.event === 'pro_upgraded').length;

    return {
      watch_through_conversion_pct:
        Object.keys(saveMap).length === 0 ? 0 : Number(((watchedWithin14 / Object.keys(saveMap).length) * 100).toFixed(2)),
      save_rate_per_100_swipes:
        swipeEvents.length === 0 ? 0 : Number(((saveEvents.length / swipeEvents.length) * 100).toFixed(2)),
      skip_to_like_ratio: positiveCount === 0 ? passCount : Number((passCount / positiveCount).toFixed(2)),
      onboarding_completion_rate_pct: state.onboarding_complete ? 100 : 0,
      d1_retention_pct: hasD1 ? 100 : 0,
      d7_retention_pct: hasD7 ? 100 : 0,
      pro_conversion_pct: paywallViews === 0 ? 0 : Number(((upgrades / paywallViews) * 100).toFixed(2)),
      paywall_bounce_rate_pct:
        paywallViews === 0 ? 0 : Number((((paywallViews - upgrades) / paywallViews) * 100).toFixed(2)),
    };
  };

  const value: AppStateContextValue = useMemo(
    () => ({
      hydrated,
      state,
      catalog: TITLES,
      startSession,
      submitOnboardingSeed,
      fetchFeed,
      submitInteraction,
      submitWatchPulse,
      getWatchlistTitles,
      getTitleById,
      searchTitles,
      getProfilePreferences,
      patchProfilePreferences,
      upgradeToPro,
      getKpis,
      trackEvent,
    }),
    [hydrated, state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
};


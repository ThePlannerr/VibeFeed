import { RecommendationCard, Title, UserTasteProfile } from '@/types/domain';

import { APP_ENV } from '@/lib/env';

const WHY_TAGS_ENDPOINT_PATH = '/v1/recs/why-tags';

type WhyTagsRequestItem = {
  title_id: string;
  title_name: string;
  year: number;
  genres: string[];
  moods: string[];
  synopsis: string;
  match_score: number;
  confidence: RecommendationCard['confidence'];
  exploration_pick: boolean;
  base_why_tags: string[];
};

type WhyTagsRequest = {
  profile: Pick<
    UserTasteProfile,
    'favorite_title_ids' | 'vibe_chips' | 'blocked_genres' | 'language_pref' | 'mood_intensity'
  >;
  cards: WhyTagsRequestItem[];
};

type WhyTagsResponse = {
  cards: Array<{
    title_id: string;
    why_tags: string[];
  }>;
};

const makeEndpointUrl = () => {
  if (!APP_ENV.llmProxyUrl) {
    return null;
  }

  return `${APP_ENV.llmProxyUrl}${WHY_TAGS_ENDPOINT_PATH}`;
};

const normalizeTags = (incoming: string[], fallback: string[]) => {
  const deduped = Array.from(
    new Set(
      incoming
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
  ).slice(0, 3);

  if (deduped.length < 2) {
    return fallback;
  }

  return deduped;
};

const isWhyTagsResponse = (value: unknown): value is WhyTagsResponse => {
  if (!value || typeof value !== 'object' || !('cards' in value)) {
    return false;
  }

  const cards = (value as WhyTagsResponse).cards;
  if (!Array.isArray(cards)) {
    return false;
  }

  return cards.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.title_id === 'string' &&
      Array.isArray(item.why_tags) &&
      item.why_tags.every((tag) => typeof tag === 'string'),
  );
};

type EnrichWhyTagsInput = {
  cards: RecommendationCard[];
  titles: Title[];
  profile: UserTasteProfile;
};

export const enrichWhyTagsWithLlm = async (input: EnrichWhyTagsInput): Promise<RecommendationCard[]> => {
  const endpoint = makeEndpointUrl();
  if (!APP_ENV.llmExplanationsEnabled || !endpoint || input.cards.length === 0) {
    return input.cards;
  }

  const titleMap = new Map(input.titles.map((title) => [title.id, title]));
  const payload: WhyTagsRequest = {
    profile: {
      favorite_title_ids: input.profile.favorite_title_ids,
      vibe_chips: input.profile.vibe_chips,
      blocked_genres: input.profile.blocked_genres,
      language_pref: input.profile.language_pref,
      mood_intensity: input.profile.mood_intensity,
    },
    cards: input.cards.map((card) => {
      const title = titleMap.get(card.title_id);
      return {
        title_id: card.title_id,
        title_name: card.title_name,
        year: card.year,
        genres: card.genres,
        moods: title?.moods ?? [],
        synopsis: title?.synopsis ?? '',
        match_score: card.match_score,
        confidence: card.confidence,
        exploration_pick: card.exploration_pick,
        base_why_tags: card.why_tags,
      };
    }),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_ENV.llmRequestTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return input.cards;
    }

    const json: unknown = await response.json();
    if (!isWhyTagsResponse(json)) {
      return input.cards;
    }

    const tagsByTitle = new Map(json.cards.map((entry) => [entry.title_id, entry.why_tags]));
    return input.cards.map((card) => {
      const candidate = tagsByTitle.get(card.title_id);
      if (!candidate) {
        return card;
      }

      return {
        ...card,
        why_tags: normalizeTags(candidate, card.why_tags),
      };
    });
  } catch {
    return input.cards;
  } finally {
    clearTimeout(timeoutId);
  }
};

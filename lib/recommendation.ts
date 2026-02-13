import { Title } from '@/types/domain';
import {
  InteractionEvent,
  RecommendationCard,
  RecConfidence,
  UserTasteProfile,
} from '@/types/domain';

type BuildFeedInput = {
  titles: Title[];
  profile: UserTasteProfile;
  interactions: InteractionEvent[];
  watchlist: string[];
  limit: number;
  offset: number;
};

const ACTION_WEIGHT: Record<InteractionEvent['action'], number> = {
  like: 1,
  pass: -0.7,
  super_like: 1.4,
  save: 1.2,
  unsave: -0.5,
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const confidenceFromScore = (score: number): RecConfidence => {
  if (score >= 0.72) {
    return 'high';
  }
  if (score >= 0.48) {
    return 'medium';
  }
  return 'low';
};

const buildRecentActionMap = (interactions: InteractionEvent[]) => {
  return interactions.reduce<Record<string, number>>((acc, interaction) => {
    const actionWeight = ACTION_WEIGHT[interaction.action];
    const ageMs = Date.now() - new Date(interaction.timestamp).getTime();
    const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
    const recency = 1 / (1 + ageDays / 7);
    acc[interaction.title_id] = (acc[interaction.title_id] ?? 0) + actionWeight * recency;
    return acc;
  }, {});
};

const scoreTitle = (
  title: Title,
  profile: UserTasteProfile,
  actionMap: Record<string, number>,
  favoriteTitles: Title[],
) => {
  if (profile.blocked_genres.some((genre) => title.genres.includes(genre))) {
    return { score: 0, hardBlocked: true, reasons: ['Blocked genre preference'] };
  }

  if (profile.runtime_pref) {
    const { min, max } = profile.runtime_pref;
    if (title.runtime < min || title.runtime > max) {
      return { score: 0, hardBlocked: true, reasons: ['Outside runtime preference'] };
    }
  }

  if (profile.language_pref.length > 0 && !profile.language_pref.includes(title.language)) {
    return { score: 0, hardBlocked: true, reasons: ['Outside language preference'] };
  }

  const likedIds = new Set(
    favoriteTitles
      .map((entry) => entry.id)
      .concat(Object.keys(actionMap).filter((id) => actionMap[id] > 0)),
  );

  const favoriteGenres = new Set(favoriteTitles.flatMap((entry) => entry.genres));
  const favoriteMoods = new Set(profile.vibe_chips);

  const genreOverlap = title.genres.filter((genre) => favoriteGenres.has(genre)).length;
  const moodOverlap = title.moods.filter((mood) => favoriteMoods.has(mood)).length;

  const contentSimilarity = clamp(
    genreOverlap / Math.max(1, title.genres.length) * 0.6 +
      moodOverlap / Math.max(1, profile.vibe_chips.length || 1) * 0.4,
    0,
    1,
  );

  const explicitPreferenceFit = clamp((actionMap[title.id] ?? 0 + 1) / 2, 0, 1);
  const recencySignal = clamp(
    Object.entries(actionMap).reduce((score, [id, actionScore]) => {
      if (id === title.id) {
        return score + actionScore;
      }

      const source = favoriteTitles.find((entry) => entry.id === id);
      if (!source) {
        return score;
      }

      const sharedGenres = source.genres.filter((genre) => title.genres.includes(genre)).length;
      return score + sharedGenres * actionScore * 0.2;
    }, 0),
    -1,
    1,
  );

  let score = contentSimilarity * 0.45 + explicitPreferenceFit * 0.35 + ((recencySignal + 1) / 2) * 0.2;

  if (likedIds.has(profile.more_like_title_id ?? '')) {
    const source = favoriteTitles.find((entry) => entry.id === profile.more_like_title_id);
    if (source && source.genres.some((genre) => title.genres.includes(genre))) {
      score += 0.07;
    }
  }

  if (profile.less_like_title_id) {
    const source = favoriteTitles.find((entry) => entry.id === profile.less_like_title_id);
    if (source && source.genres.some((genre) => title.genres.includes(genre))) {
      score -= 0.08;
    }
  }

  score += clamp(title.popularity / 100, 0, 1) * 0.08;
  score = clamp(score, 0, 1);

  const reasons: string[] = [];
  if (genreOverlap > 0) {
    reasons.push(`${title.genres.find((genre) => favoriteGenres.has(genre))} match`);
  }
  if (moodOverlap > 0) {
    reasons.push(`${title.moods.find((mood) => favoriteMoods.has(mood))} vibe`);
  }
  if (explicitPreferenceFit > 0.7) {
    reasons.push('Fits your recent likes');
  }
  if (title.runtime <= 50) {
    reasons.push('Quick watch runtime');
  }
  if (title.popularity >= 90) {
    reasons.push('Trending in catalog');
  }

  return { score, hardBlocked: false, reasons };
};

const ensureWhyTags = (raw: string[], exploration: boolean) => {
  const base = [...new Set(raw)].slice(0, 3);
  if (base.length >= 2) {
    return base;
  }

  if (exploration) {
    const fallback = ['Exploration pick', 'Broadening your feed'];
    return [...base, ...fallback].slice(0, 3);
  }

  const fallback = ['Aligned with your selected vibes', 'Balanced genre coverage'];
  return [...base, ...fallback].slice(0, 3);
};

export const buildRecommendationFeed = (input: BuildFeedInput): RecommendationCard[] => {
  const favoriteTitles = input.titles.filter((title) =>
    input.profile.favorite_title_ids.includes(title.id),
  );
  const actionMap = buildRecentActionMap(input.interactions);
  const savedSet = new Set(input.watchlist);

  const scored = input.titles
    .filter((title) => !savedSet.has(title.id))
    .map((title) => ({ title, scored: scoreTitle(title, input.profile, actionMap, favoriteTitles) }))
    .filter((entry) => !entry.scored.hardBlocked)
    .sort((a, b) => b.scored.score - a.scored.score);

  const diversified: Array<{ title: Title; score: number; reasons: string[] }> = [];
  let previousPrimaryGenre = '';
  for (const entry of scored) {
    const primaryGenre = entry.title.genres[0] ?? '';
    let adjusted = entry.scored.score;
    if (primaryGenre === previousPrimaryGenre) {
      adjusted -= 0.12;
    }

    diversified.push({ title: entry.title, score: clamp(adjusted, 0, 1), reasons: entry.scored.reasons });
    previousPrimaryGenre = primaryGenre;
  }

  const sliced = diversified.slice(input.offset, input.offset + input.limit);
  return sliced.map((entry, index) => {
    const confidence = confidenceFromScore(entry.score);
    const explorationPick = confidence === 'low';

    return {
      id: `${entry.title.id}-${input.offset + index}`,
      title_id: entry.title.id,
      title_name: entry.title.title_name,
      poster_url: entry.title.poster_url,
      year: entry.title.year,
      genres: entry.title.genres,
      runtime: entry.title.runtime,
      match_score: Number(entry.score.toFixed(3)),
      why_tags: ensureWhyTags(entry.reasons, explorationPick),
      confidence,
      availability_hint: entry.title.availability_hint,
      exploration_pick: explorationPick,
    };
  });
};


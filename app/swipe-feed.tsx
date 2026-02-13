import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  AppShell,
  GhostButton,
  InlineValue,
  Label,
  Pill,
  PrimaryButton,
  Row,
  Section,
} from '@/components/vf-ui';
import { VibeTheme } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';
import { RecommendationCard } from '@/types/domain';

export default function SwipeFeedScreen() {
  const router = useRouter();
  const { fetchFeed, submitInteraction, trackEvent, state } = useAppState();
  const [cards, setCards] = useState<RecommendationCard[]>([]);
  const [cursor, setCursor] = useState<string | null>('0');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  const current = cards[currentIndex];
  const savedSet = useMemo(() => new Set(state.watchlist), [state.watchlist]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const response = await fetchFeed('0');
    setCards(response.cards);
    setCursor(response.next_cursor);
    setCurrentIndex(0);
    setLoading(false);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (!cursor || fetchingMore) {
      return;
    }

    setFetchingMore(true);
    const response = await fetchFeed(cursor);
    setCards((previous) => [...previous, ...response.cards]);
    setCursor(response.next_cursor);
    setFetchingMore(false);
  }, [cursor, fetchingMore, fetchFeed]);

  useEffect(() => {
    if (!state.onboarding_complete) {
      router.replace('/taste-seeder');
      return;
    }

    loadInitial();
  }, [state.onboarding_complete, router, loadInitial]);

  useEffect(() => {
    if (cards.length - currentIndex <= 3) {
      loadMore();
    }
  }, [currentIndex, cards, cursor, loadMore]);

  const handleSwipe = async (action: 'pass' | 'like' | 'super_like') => {
    if (!current) {
      return;
    }

    await submitInteraction({
      title_id: current.title_id,
      action,
      context: { screen: 'SwipeFeed', card_rank: currentIndex },
    });
    setCurrentIndex((value) => value + 1);
  };

  const handleSave = async () => {
    if (!current) {
      return;
    }

    const saved = savedSet.has(current.title_id);
    await submitInteraction({
      title_id: current.title_id,
      action: saved ? 'unsave' : 'save',
      context: { screen: 'SwipeFeed', card_rank: currentIndex },
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: VibeTheme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={VibeTheme.accent} />
      </View>
    );
  }

  if (!current) {
    return (
      <AppShell title="Swipe Feed" subtitle="No more recommendations in the current pool.">
        <Section title="Feed status">
          <Text>We reached the end of your current feed slice. Pull more or refine preferences.</Text>
          <Row>
            <PrimaryButton label="Refresh Feed" onPress={loadInitial} />
            <GhostButton label="Preferences" onPress={() => router.push('/profile-preferences')} />
          </Row>
        </Section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Swipe Feed"
      subtitle="Every recommendation includes why-tags. Low-confidence cards are clearly labeled as exploration picks.">
      <Section title="Navigation">
        <Row>
          <GhostButton label="Watchlist" onPress={() => router.push('/watchlist')} />
          <GhostButton label="Profile" onPress={() => router.push('/profile-preferences')} />
          <GhostButton label={state.is_pro ? 'Pro Active' : 'Go Pro'} onPress={() => router.push('/pro-upsell')} />
        </Row>
      </Section>

      <Section title={`${current.title_name} (${current.year})`}>
        <Text>
          {current.genres.join(', ')} | {current.runtime}m
        </Text>
        <Label>
          Match score <InlineValue>{Math.round(current.match_score * 100)}%</InlineValue> | Confidence{' '}
          <InlineValue>{current.confidence}</InlineValue>
        </Label>
        {current.exploration_pick ? (
          <Text style={{ color: VibeTheme.accentAlt, fontWeight: '700' }}>Exploration pick</Text>
        ) : null}
        <Row>
          {current.why_tags.slice(0, 3).map((tag) => (
            <Pill key={tag} label={tag} onPress={() => {}} selected />
          ))}
        </Row>
        <Text>{current.availability_hint}</Text>
        <Pressable
          style={{ paddingVertical: 6 }}
          onPress={async () => {
            await trackEvent('rec_clicked', {
              title_id: current.title_id,
              source: 'SwipeFeed',
              card_rank: currentIndex,
            });
            router.push({ pathname: '/title/[id]', params: { id: current.title_id } });
          }}>
          <Text style={{ color: VibeTheme.accent, textDecorationLine: 'underline', fontWeight: '700' }}>
            Open title detail
          </Text>
        </Pressable>
        <Row>
          <GhostButton label="Pass" onPress={() => handleSwipe('pass')} />
          <GhostButton label="Like" onPress={() => handleSwipe('like')} />
          <PrimaryButton label="Super Like" onPress={() => handleSwipe('super_like')} />
          <GhostButton
            label={savedSet.has(current.title_id) ? 'Unsave' : 'Save'}
            onPress={handleSave}
          />
        </Row>
      </Section>

      {fetchingMore ? <Text>Fetching more recommendations...</Text> : null}
    </AppShell>
  );
}

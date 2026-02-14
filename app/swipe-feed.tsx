import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppShell,
  BodyText,
  FormRow,
  GhostButton,
  InlineValue,
  Label,
  MutedText,
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
  const [interactionBusy, setInteractionBusy] = useState(false);

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
    if (!current || interactionBusy) {
      return;
    }

    setInteractionBusy(true);
    try {
      await submitInteraction({
        title_id: current.title_id,
        action,
        context: { screen: 'SwipeFeed', card_rank: currentIndex },
      });
      setCurrentIndex((value) => value + 1);
    } finally {
      setInteractionBusy(false);
    }
  };

  const handleSave = async () => {
    if (!current || interactionBusy) {
      return;
    }

    setInteractionBusy(true);
    const saved = savedSet.has(current.title_id);
    try {
      await submitInteraction({
        title_id: current.title_id,
        action: saved ? 'unsave' : 'save',
        context: { screen: 'SwipeFeed', card_rank: currentIndex },
      });
    } finally {
      setInteractionBusy(false);
    }
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
        <Section title="Feed status" delayMs={40}>
          <BodyText>We reached the end of your current feed slice. Pull more or refine preferences.</BodyText>
          <Row>
            <PrimaryButton label="Refresh Feed" onPress={loadInitial} loading={loading} />
            <GhostButton label="Preferences" onPress={() => router.push('/profile-preferences')} />
          </Row>
        </Section>
      </AppShell>
    );
  }

  return (
    <AppShell
      keyboardAware={false}
      title="Swipe Feed"
      subtitle="Every recommendation includes why-tags. Low-confidence cards are clearly labeled as exploration picks.">
      <Section title="Navigation" delayMs={30}>
        <Row>
          <GhostButton label="Watchlist" onPress={() => router.push('/watchlist')} />
          <GhostButton label="Profile" onPress={() => router.push('/profile-preferences')} />
          <GhostButton label={state.is_pro ? 'Pro Active' : 'Go Pro'} onPress={() => router.push('/pro-upsell')} />
        </Row>
      </Section>

      <Section title={`${current.title_name} (${current.year})`} delayMs={80}>
        <MutedText>
          {current.genres.join(', ')} | {current.runtime}m
        </MutedText>
        <Label>
          Match score <InlineValue>{Math.round(current.match_score * 100)}%</InlineValue> | Confidence{' '}
          <InlineValue>{current.confidence}</InlineValue>
        </Label>
        {current.exploration_pick ? (
          <Text style={styles.exploration}>Exploration pick</Text>
        ) : null}
        <Row>
          {current.why_tags.slice(0, 3).map((tag) => (
            <Pill key={tag} label={tag} selected />
          ))}
        </Row>
        <BodyText>{current.availability_hint}</BodyText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open detail for ${current.title_name}`}
          style={styles.detailLink}
          onPress={async () => {
            await trackEvent('rec_clicked', {
              title_id: current.title_id,
              source: 'SwipeFeed',
              card_rank: currentIndex,
            });
            router.push({ pathname: '/title/[id]', params: { id: current.title_id } });
          }}>
          <Text style={styles.detailLinkText}>Open title detail</Text>
        </Pressable>
        <FormRow>
          <GhostButton label="Pass" onPress={() => handleSwipe('pass')} disabled={interactionBusy} />
          <GhostButton label="Like" onPress={() => handleSwipe('like')} disabled={interactionBusy} />
          <PrimaryButton
            label="Super Like"
            onPress={() => handleSwipe('super_like')}
            loading={interactionBusy}
            disabled={interactionBusy}
          />
          <GhostButton
            label={savedSet.has(current.title_id) ? 'Unsave' : 'Save'}
            onPress={handleSave}
            disabled={interactionBusy}
          />
        </FormRow>
      </Section>

      {fetchingMore ? <MutedText>Fetching more recommendations...</MutedText> : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  exploration: {
    color: VibeTheme.accentAlt,
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
  },
  detailLink: {
    paddingVertical: VibeTheme.space.xs,
  },
  detailLinkText: {
    color: VibeTheme.accent,
    textDecorationLine: 'underline',
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
  },
});

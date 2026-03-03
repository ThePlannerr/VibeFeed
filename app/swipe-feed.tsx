import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PosterCard } from '@/components/poster-card';
import { SwipeCard, SwipeCardRef } from '@/components/swipe-card';
import { ActionBar } from '@/components/action-bar';
import { VibeTheme } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';
import { RecommendationCard } from '@/types/domain';

export default function SwipeFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { fetchFeed, submitInteraction, trackEvent, state } = useAppState();
  const [cards, setCards] = useState<RecommendationCard[]>([]);
  const [cursor, setCursor] = useState<string | null>('0');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [interactionBusy, setInteractionBusy] = useState(false);

  const swipeRef = useRef<SwipeCardRef>(null);

  const current = cards[currentIndex];
  const next = cards[currentIndex + 1];
  const savedSet = useMemo(() => new Set(state.watchlist), [state.watchlist]);

  const CARD_HEIGHT = screenHeight * 0.62;

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const response = await fetchFeed('0');
    setCards(response.cards);
    setCursor(response.next_cursor);
    setCurrentIndex(0);
    setLoading(false);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (!cursor || fetchingMore) return;
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
    if (!current || interactionBusy) return;
    setInteractionBusy(true);
    try {
      await submitInteraction({
        title_id: current.title_id,
        action,
        context: { screen: 'SwipeFeed', card_rank: currentIndex },
      });
      setCurrentIndex((v) => v + 1);
    } finally {
      setInteractionBusy(false);
    }
  };

  const handleSave = async () => {
    if (!current || interactionBusy) return;
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

  // Loading state
  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#03040A', '#071022', '#0D1A33', '#03040A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={VibeTheme.accent} />
          <Text style={styles.loadingText}>Building your feed...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!current) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#03040A', '#071022', '#0D1A33', '#03040A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyState}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.emptyEmoji}>🔥</Text>
            <Text style={styles.emptyTitle}>Stack cleared</Text>
            <Text style={styles.emptySubtitle}>You swiped through everything. Reload for fresh heat.</Text>
          </Animated.View>
          <View style={styles.emptyActions}>
            <Pressable style={styles.reloadButton} onPress={loadInitial}>
              <Ionicons name="refresh" size={20} color={VibeTheme.colors.onAccent} />
              <Text style={styles.reloadText}>Reload Picks</Text>
            </Pressable>
            <Pressable style={styles.tuneButton} onPress={() => router.push('/profile-preferences')}>
              <Text style={styles.tuneText}>Tune Taste</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#03040A', '#071022', '#0D1A33', '#03040A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
        <View>
          <Text style={styles.brandTitle}>VibeFeed</Text>
          <Text style={styles.cardCount}>
            {currentIndex + 1} of {cards.length}
          </Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            onPress={() => router.push('/watchlist')}
            hitSlop={8}
            accessibilityLabel="Watchlist">
            <Ionicons name="bookmark-outline" size={24} color={VibeTheme.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/profile-preferences')}
            hitSlop={8}
            accessibilityLabel="Preferences">
            <Ionicons name="options-outline" size={24} color={VibeTheme.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/pro-upsell')}
            hitSlop={8}
            accessibilityLabel={state.is_pro ? 'Pro active' : 'Go Pro'}>
            <Ionicons
              name={state.is_pro ? 'diamond' : 'diamond-outline'}
              size={24}
              color={state.is_pro ? '#FFD166' : VibeTheme.textMuted}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* Card deck */}
      <View style={[styles.deckContainer, { height: CARD_HEIGHT }]}>
        {/* Next card preview (behind) */}
        {next ? (
          <View style={[styles.nextCardWrapper, { transform: [{ scale: 0.95 }] }]}>
            <PosterCard
              titleId={next.title_id}
              titleName={next.title_name}
              year={next.year}
              genres={next.genres}
              runtime={next.runtime}
              posterUrl={next.poster_url}
              matchScore={next.match_score}
              whyTags={next.why_tags}
              explorationPick={next.exploration_pick}
              cardHeight={CARD_HEIGHT}
            />
          </View>
        ) : null}

        {/* Current card (on top, swipeable) */}
        <SwipeCard
          ref={swipeRef}
          onSwipe={handleSwipe}
          enabled={!interactionBusy}>
          <Pressable
            onPress={async () => {
              await trackEvent('rec_clicked', {
                title_id: current.title_id,
                source: 'SwipeFeed',
                card_rank: currentIndex,
              });
              router.push({ pathname: '/title/[id]', params: { id: current.title_id } });
            }}
            accessibilityRole="link"
            accessibilityLabel={`Open detail for ${current.title_name}`}>
            <PosterCard
              titleId={current.title_id}
              titleName={current.title_name}
              year={current.year}
              genres={current.genres}
              runtime={current.runtime}
              posterUrl={current.poster_url}
              matchScore={current.match_score}
              whyTags={current.why_tags}
              explorationPick={current.exploration_pick}
              cardHeight={CARD_HEIGHT}
            />
          </Pressable>
        </SwipeCard>
      </View>

      {/* Availability hint */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.availabilityRow}>
        <Ionicons name="tv-outline" size={14} color={VibeTheme.textMuted} />
        <Text style={styles.availabilityText}>{current.availability_hint}</Text>
      </Animated.View>

      {/* Action bar */}
      <ActionBar
        onPass={() => swipeRef.current?.swipeLeft()}
        onLike={() => swipeRef.current?.swipeRight()}
        onSuperLike={() => swipeRef.current?.swipeUp()}
        onSave={handleSave}
        isSaved={savedSet.has(current.title_id)}
        disabled={interactionBusy}
      />

      {/* Loading more indicator */}
      {fetchingMore ? (
        <View style={styles.fetchingMore}>
          <ActivityIndicator size="small" color={VibeTheme.textMuted} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VibeTheme.bg,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.textMuted,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: VibeTheme.space.lg,
    paddingVertical: VibeTheme.space.sm,
  },
  brandTitle: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.xl,
    color: VibeTheme.text,
    letterSpacing: 0.5,
  },
  cardCount: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.xs,
    color: VibeTheme.textMuted,
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
  },
  deckContainer: {
    marginHorizontal: VibeTheme.space.md,
    position: 'relative',
  },
  nextCardWrapper: {
    position: 'absolute',
    width: '100%',
    opacity: 0.6,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: VibeTheme.space.lg,
    paddingTop: VibeTheme.space.sm,
  },
  availabilityText: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    color: VibeTheme.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: VibeTheme.space.xl,
    gap: 28,
  },
  emptyEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.xxl,
    color: VibeTheme.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyActions: {
    gap: 12,
    alignItems: 'center',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: VibeTheme.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: VibeTheme.radius.md,
  },
  reloadText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.colors.onAccent,
  },
  tuneButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tuneText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.textMuted,
  },
  fetchingMore: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
  },
});

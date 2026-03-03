import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { VIBE_CHIPS } from '@/constants/catalog';
import { Input, Label, InlineValue, MutedText } from '@/components/vf-ui';
import { VibeTheme, glows } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';
import { SwipeAction } from '@/types/domain';

type SeedSwipe = {
  title_id: string;
  action: Extract<SwipeAction, 'like' | 'pass' | 'super_like'>;
};

const MIN_FAVORITES = 3;
const MAX_FAVORITES = 5;
const REQUIRED_VIBES = 3;
const REQUIRED_SEED_SWIPES = 10;

export default function TasteSeederScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { searchTitles, catalog, submitOnboardingSeed, state } = useAppState();
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(state.profile.favorite_title_ids);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(state.profile.vibe_chips);
  const [seedSwipes, setSeedSwipes] = useState<SeedSwipe[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const searchResults = useMemo(() => searchTitles(query), [query, searchTitles]);
  const seedCandidates = useMemo(
    () => catalog.filter((title) => !favoriteIds.includes(title.id)).slice(0, 16),
    [catalog, favoriteIds],
  );
  const currentSeed = seedCandidates[seedSwipes.length % Math.max(seedCandidates.length, 1)];

  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavoriteIds((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id);
      if (previous.length >= MAX_FAVORITES) return previous;
      return [...previous, id];
    });
  };

  const toggleVibe = (vibe: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVibes((previous) =>
      previous.includes(vibe) ? previous.filter((item) => item !== vibe) : [...previous, vibe],
    );
  };

  const registerSeedSwipe = (action: SeedSwipe['action']) => {
    if (!currentSeed || seedSwipes.length >= REQUIRED_SEED_SWIPES) return;
    Haptics.impactAsync(
      action === 'super_like' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium,
    );
    setSeedSwipes((previous) => [...previous, { title_id: currentSeed.id, action }]);
  };

  const canContinue =
    favoriteIds.length >= MIN_FAVORITES &&
    selectedVibes.length >= REQUIRED_VIBES &&
    seedSwipes.length >= REQUIRED_SEED_SWIPES;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    await submitOnboardingSeed({
      favorite_title_ids: favoriteIds,
      vibe_chips: selectedVibes.slice(0, REQUIRED_VIBES),
      seed_swipes: seedSwipes,
    });
    setSubmitting(false);
    router.replace('/swipe-feed');
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#03040A', '#071022', '#0D1A33', '#03040A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + VibeTheme.space.lg, paddingBottom: insets.bottom + VibeTheme.space.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.screenTitle}>Set Your Vibe</Text>
          <Text style={styles.screenSubtitle}>Quick setup so your feed feels personal from the first swipe.</Text>
        </Animated.View>

        {/* Step 1: Favorites with poster thumbnails */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>01</Text>
            <Text style={styles.stepTitle}>Pick 3-5 favorites</Text>
          </View>
          <Input value={query} onChangeText={setQuery} placeholder="Search movies or series..." />
          <View style={styles.posterGrid}>
            {searchResults.map((title) => {
              const selected = favoriteIds.includes(title.id);
              return (
                <Pressable
                  key={title.id}
                  onPress={() => toggleFavorite(title.id)}
                  disabled={!selected && favoriteIds.length >= MAX_FAVORITES}
                  style={({ pressed }) => [
                    styles.posterThumb,
                    selected ? styles.posterThumbSelected : undefined,
                    pressed ? styles.posterThumbPressed : undefined,
                  ]}>
                  <Image
                    source={{ uri: title.poster_url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  {/* Fallback gradient */}
                  <LinearGradient
                    colors={['#1C1F4A', '#2E2A7D']}
                    style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                  />
                  {selected ? (
                    <View style={styles.checkOverlay}>
                      <Ionicons name="checkmark-circle" size={28} color={VibeTheme.colors.accentAlt} />
                    </View>
                  ) : null}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.posterThumbGradient}
                  />
                  <Text style={styles.posterThumbName} numberOfLines={2}>{title.title_name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Label>
            Selected <InlineValue>{favoriteIds.length}</InlineValue> / {MAX_FAVORITES}
          </Label>
        </Animated.View>

        {/* Step 2: Vibe chips */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>02</Text>
            <Text style={styles.stepTitle}>Choose 3+ mood tags</Text>
          </View>
          <View style={styles.chipGrid}>
            {VIBE_CHIPS.map((chip) => {
              const selected = selectedVibes.includes(chip);
              return (
                <Pressable
                  key={chip}
                  onPress={() => toggleVibe(chip)}
                  style={({ pressed }) => [
                    styles.vibeChip,
                    selected ? styles.vibeChipSelected : undefined,
                    pressed ? styles.vibeChipPressed : undefined,
                  ]}>
                  <Text style={[styles.vibeChipText, selected ? styles.vibeChipTextSelected : undefined]}>
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Label>
            Selected <InlineValue>{selectedVibes.length}</InlineValue> / {REQUIRED_VIBES}+
          </Label>
        </Animated.View>

        {/* Step 3: Seed swipes with mini poster card */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>03</Text>
            <Text style={styles.stepTitle}>Quick seed swipes</Text>
          </View>

          {currentSeed && seedSwipes.length < REQUIRED_SEED_SWIPES ? (
            <View style={styles.seedCardContainer}>
              <View style={styles.seedPoster}>
                <Image
                  source={{ uri: currentSeed.poster_url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['#28174A', '#4A1B6E']}
                  style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(4, 5, 10, 0.9)']}
                  start={{ x: 0.5, y: 0.4 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.seedPosterContent}>
                  <Text style={styles.seedTitle}>{currentSeed.title_name}</Text>
                  <Text style={styles.seedMeta}>
                    {currentSeed.year} · {currentSeed.genres.join(', ')} · {currentSeed.runtime}m
                  </Text>
                  <Text style={styles.seedSynopsis} numberOfLines={3}>
                    {currentSeed.synopsis}
                  </Text>
                </View>
              </View>
              <View style={styles.seedActions}>
                <Pressable
                  style={({ pressed }) => [styles.seedBtn, styles.seedBtnPass, pressed && styles.seedBtnPressed]}
                  onPress={() => registerSeedSwipe('pass')}>
                  <Ionicons name="close" size={22} color="#96A6C6" />
                  <Text style={styles.seedBtnPassText}>Pass</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.seedBtn, styles.seedBtnLike, pressed && styles.seedBtnPressed]}
                  onPress={() => registerSeedSwipe('like')}>
                  <Ionicons name="heart" size={22} color={VibeTheme.colors.accentAlt} />
                  <Text style={styles.seedBtnLikeText}>Like</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.seedBtn, styles.seedBtnFire, pressed && styles.seedBtnPressed]}
                  onPress={() => registerSeedSwipe('super_like')}>
                  <Ionicons name="flame" size={22} color={VibeTheme.colors.accent} />
                  <Text style={styles.seedBtnFireText}>Must Watch</Text>
                </Pressable>
              </View>
            </View>
          ) : seedSwipes.length >= REQUIRED_SEED_SWIPES ? (
            <View style={styles.seedDone}>
              <Text style={styles.seedDoneText}>All set! 🎯</Text>
            </View>
          ) : (
            <MutedText>No candidates found. Adjust your favorites.</MutedText>
          )}

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(seedSwipes.length / REQUIRED_SEED_SWIPES) * 100}%` }]} />
          </View>
          <Label>
            Completed <InlineValue>{seedSwipes.length}</InlineValue> / {REQUIRED_SEED_SWIPES}
          </Label>
        </Animated.View>

        {/* Continue button */}
        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            !canContinue || submitting ? styles.continueBtnDisabled : undefined,
            pressed && canContinue ? styles.continueBtnPressed : undefined,
          ]}
          onPress={handleContinue}
          disabled={!canContinue || submitting}>
          <Text style={styles.continueBtnText}>
            {submitting ? 'Building your feed...' : 'Start swiping'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VibeTheme.bg,
  },
  scrollContent: {
    paddingHorizontal: VibeTheme.space.md,
    gap: VibeTheme.space.lg,
  },
  screenTitle: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.hero,
    lineHeight: VibeTheme.type.lineHeight.hero,
    color: VibeTheme.text,
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
    color: VibeTheme.textMuted,
    marginTop: 4,
  },
  stepCard: {
    backgroundColor: 'rgba(10, 16, 28, 0.72)',
    borderRadius: VibeTheme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 170, 255, 0.15)',
    padding: VibeTheme.space.md,
    gap: VibeTheme.space.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  stepNumber: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.xxl,
    color: 'rgba(255, 42, 61, 0.4)',
    letterSpacing: 1,
  },
  stepTitle: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.lg,
    color: VibeTheme.text,
  },
  // Step 1 - poster grid
  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  posterThumb: {
    width: '30%',
    flexGrow: 1,
    aspectRatio: 2 / 3,
    borderRadius: VibeTheme.radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  posterThumbSelected: {
    borderColor: VibeTheme.colors.accentAlt,
  },
  posterThumbPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  posterThumbGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  posterThumbName: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: 11,
    color: '#FFFFFF',
    padding: 6,
  },
  checkOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  // Step 2 - vibe chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibeChip: {
    borderWidth: 1,
    borderColor: VibeTheme.border,
    paddingVertical: 10,
    paddingHorizontal: VibeTheme.space.md,
    borderRadius: VibeTheme.radius.pill,
    backgroundColor: 'rgba(9, 14, 24, 0.92)',
  },
  vibeChipSelected: {
    backgroundColor: 'rgba(39, 232, 167, 0.18)',
    borderColor: 'rgba(39, 232, 167, 0.95)',
  },
  vibeChipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  vibeChipText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    color: VibeTheme.text,
  },
  vibeChipTextSelected: {
    color: VibeTheme.colors.accentAlt,
  },
  // Step 3 - seed card
  seedCardContainer: {
    gap: VibeTheme.space.sm,
  },
  seedPoster: {
    height: 220,
    borderRadius: VibeTheme.radius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  seedPosterContent: {
    padding: VibeTheme.space.md,
    gap: 4,
  },
  seedTitle: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.xl,
    color: '#FFFFFF',
  },
  seedMeta: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.xs,
    color: 'rgba(247, 250, 255, 0.7)',
  },
  seedSynopsis: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
    color: 'rgba(247, 250, 255, 0.6)',
    marginTop: 4,
  },
  seedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  seedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: VibeTheme.radius.md,
    borderWidth: 1,
  },
  seedBtnPass: {
    backgroundColor: 'rgba(150, 166, 198, 0.08)',
    borderColor: 'rgba(150, 166, 198, 0.25)',
  },
  seedBtnLike: {
    backgroundColor: 'rgba(39, 232, 167, 0.08)',
    borderColor: 'rgba(39, 232, 167, 0.3)',
  },
  seedBtnFire: {
    backgroundColor: 'rgba(255, 42, 61, 0.08)',
    borderColor: 'rgba(255, 42, 61, 0.3)',
  },
  seedBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  seedBtnPassText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    color: '#96A6C6',
  },
  seedBtnLikeText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    color: VibeTheme.colors.accentAlt,
  },
  seedBtnFireText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    color: VibeTheme.colors.accent,
  },
  seedDone: {
    paddingVertical: VibeTheme.space.lg,
    alignItems: 'center',
  },
  seedDoneText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.lg,
    color: VibeTheme.colors.accentAlt,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(42, 60, 96, 0.5)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: VibeTheme.colors.accentAlt,
  },
  continueBtn: {
    backgroundColor: VibeTheme.accent,
    paddingVertical: 16,
    borderRadius: VibeTheme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 130, 140, 0.75)',
    ...glows.accent,
  },
  continueBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  continueBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  continueBtnText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.colors.onAccent,
    letterSpacing: 0.3,
  },
});

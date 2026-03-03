import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { VibeTheme, gradients } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';

const FALLBACK_GRADIENT = ['#1C1F4A', '#2E2A7D', '#FF2A3D'] as const;

export default function TitleDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { getTitleById, submitInteraction, state } = useAppState();
  const title = getTitleById(params.id);

  if (!title) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#03040A', '#071022', '#0D1A33', '#03040A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Title not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.replace('/swipe-feed')}>
            <Text style={styles.backBtnText}>Back to Feed</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isSaved = state.watchlist.includes(title.id);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await submitInteraction({
      title_id: title.id,
      action: isSaved ? 'unsave' : 'save',
      context: { screen: 'TitleDetail' },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + VibeTheme.space.xl }}
        bounces>
        {/* Hero poster header */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: title.poster_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={FALLBACK_GRADIENT}
            style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
          />
          <LinearGradient
            colors={gradients.cardOverlay}
            start={{ x: 0.5, y: 0.2 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Title info at bottom of hero */}
          <View style={[styles.heroContent, { paddingTop: insets.top + 60 }]}>
            <Text style={styles.heroTitle}>{title.title_name}</Text>
            <Text style={styles.heroMeta}>
              {title.year} · {title.runtime}m · {title.language.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Content sections */}
        <View style={styles.body}>
          {/* Genre + mood tags */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tagSection}>
            <View style={styles.tagRow}>
              {title.genres.map((genre) => (
                <View key={genre} style={styles.genreTag}>
                  <Text style={styles.genreTagText}>{genre}</Text>
                </View>
              ))}
              {title.moods.map((mood) => (
                <View key={mood} style={styles.moodTag}>
                  <Text style={styles.moodTagText}>{mood}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Synopsis */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.sectionLabel}>Synopsis</Text>
            <Text style={styles.synopsis}>{title.synopsis}</Text>
          </Animated.View>

          {/* Cast */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.sectionLabel}>Cast</Text>
            <Text style={styles.castText}>{title.cast.join(' · ')}</Text>
          </Animated.View>

          {/* Availability */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.availRow}>
            <Ionicons name="tv-outline" size={16} color={VibeTheme.textMuted} />
            <Text style={styles.availText}>{title.availability_hint}</Text>
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.saveBtn,
                isSaved ? styles.saveBtnActive : undefined,
                pressed ? styles.actionBtnPressed : undefined,
              ]}
              onPress={handleSave}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? '#FFD166' : VibeTheme.textMuted}
              />
              <Text style={[styles.saveBtnText, isSaved ? styles.saveBtnTextActive : undefined]}>
                {isSaved ? 'Saved' : 'Save to Watchlist'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.watchedBtn,
                pressed ? styles.actionBtnPressed : undefined,
              ]}
              onPress={() => router.push({ pathname: '/post-watch-pulse', params: { titleId: title.id } })}>
              <Ionicons name="eye-outline" size={20} color={VibeTheme.colors.onAccent} />
              <Text style={styles.watchedBtnText}>I Watched This</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VibeTheme.bg,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundTitle: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.xl,
    color: VibeTheme.text,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: VibeTheme.accent,
    borderRadius: VibeTheme.radius.md,
  },
  backBtnText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.colors.onAccent,
  },
  heroContainer: {
    height: 420,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: VibeTheme.space.lg,
    gap: 6,
  },
  heroTitle: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.hero,
    lineHeight: VibeTheme.type.lineHeight.hero,
    color: '#FFFFFF',
  },
  heroMeta: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    color: 'rgba(247, 250, 255, 0.7)',
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: VibeTheme.space.lg,
    paddingTop: VibeTheme.space.lg,
    gap: VibeTheme.space.lg,
  },
  tagSection: {},
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: VibeTheme.radius.pill,
    backgroundColor: 'rgba(122, 171, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(122, 171, 255, 0.3)',
  },
  genreTagText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.xs,
    color: '#A5C2FF',
  },
  moodTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: VibeTheme.radius.pill,
    backgroundColor: 'rgba(39, 232, 167, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(39, 232, 167, 0.3)',
  },
  moodTagText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.xs,
    color: '#7DDFBE',
  },
  sectionLabel: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.xs,
    color: VibeTheme.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  synopsis: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
    color: 'rgba(247, 250, 255, 0.85)',
  },
  castText: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
    color: 'rgba(247, 250, 255, 0.75)',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availText: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    color: VibeTheme.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: VibeTheme.radius.md,
  },
  actionBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: 'rgba(94, 126, 181, 0.4)',
    backgroundColor: 'rgba(8, 13, 24, 0.9)',
  },
  saveBtnActive: {
    borderColor: 'rgba(255, 209, 102, 0.4)',
    backgroundColor: 'rgba(255, 209, 102, 0.08)',
  },
  saveBtnText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    color: VibeTheme.textMuted,
  },
  saveBtnTextActive: {
    color: '#FFD166',
  },
  watchedBtn: {
    backgroundColor: VibeTheme.accent,
  },
  watchedBtnText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    color: VibeTheme.colors.onAccent,
  },
});

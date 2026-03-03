import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { VibeTheme } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';
import { Title } from '@/types/domain';

const COLUMN_GAP = 12;

export default function WatchlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getWatchlistTitles, submitInteraction } = useAppState();
  const watchlistTitles = getWatchlistTitles();

  const handleUnsave = async (titleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await submitInteraction({
      title_id: titleId,
      action: 'unsave',
      context: { screen: 'Watchlist' },
    });
  };

  const renderItem = ({ item, index }: { item: Title; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(300)}
      style={styles.gridItem}>
      <Pressable
        style={({ pressed }) => [styles.posterCard, pressed ? styles.posterPressed : undefined]}
        onPress={() => router.push({ pathname: '/title/[id]', params: { id: item.id } })}
        accessibilityRole="link"
        accessibilityLabel={`${item.title_name} details`}>
        <Image
          source={{ uri: item.poster_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        {/* Fallback gradient */}
        <LinearGradient
          colors={['#1C1F4A', '#2E2A7D']}
          style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
        />
        {/* Bottom gradient for text */}
        <LinearGradient
          colors={['transparent', 'rgba(4, 5, 10, 0.85)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Unsave button */}
        <Pressable
          style={styles.unsaveBtn}
          onPress={() => handleUnsave(item.id)}
          hitSlop={8}
          accessibilityLabel={`Remove ${item.title_name}`}>
          <Ionicons name="close-circle" size={22} color="rgba(255, 255, 255, 0.7)" />
        </Pressable>

        <View style={styles.posterInfo}>
          <Text style={styles.posterTitle} numberOfLines={2}>{item.title_name}</Text>
          <Text style={styles.posterMeta}>{item.year} · {item.runtime}m</Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  const emptyComponent = (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={48} color="rgba(150, 166, 198, 0.4)" />
      <Text style={styles.emptyTitle}>No saved titles yet</Text>
      <Text style={styles.emptySubtitle}>Save titles from your feed to build a watchlist.</Text>
      <Pressable style={styles.feedBtn} onPress={() => router.replace('/swipe-feed')}>
        <Text style={styles.feedBtnText}>Back to Feed</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#03040A', '#071022', '#0D1A33', '#03040A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={watchlistTitles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + VibeTheme.space.xl },
          watchlistTitles.length === 0 ? styles.listContentEmpty : undefined,
        ]}
        ListEmptyComponent={emptyComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VibeTheme.bg,
  },
  listContent: {
    paddingHorizontal: VibeTheme.space.md,
    paddingTop: VibeTheme.space.md,
    gap: COLUMN_GAP,
  },
  listContentEmpty: {
    flex: 1,
  },
  columnWrapper: {
    gap: COLUMN_GAP,
  },
  gridItem: {
    flex: 1,
  },
  posterCard: {
    aspectRatio: 2 / 3,
    borderRadius: VibeTheme.radius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  posterPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  unsaveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  posterInfo: {
    padding: 10,
    gap: 2,
  },
  posterTitle: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    color: '#FFFFFF',
  },
  posterMeta: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.xs,
    color: 'rgba(247, 250, 255, 0.6)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: VibeTheme.space.xl,
  },
  emptyTitle: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.xl,
    color: VibeTheme.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.textMuted,
    textAlign: 'center',
  },
  feedBtn: {
    backgroundColor: VibeTheme.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: VibeTheme.radius.md,
    marginTop: 8,
  },
  feedBtnText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.colors.onAccent,
  },
});

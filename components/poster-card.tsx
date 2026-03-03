import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { VibeTheme, gradients, glows } from '@/constants/vf-theme';
import { MatchBadge } from './match-badge';

const CARD_GRADIENTS = [
  ['#1C1F4A', '#2E2A7D', '#FF2A3D'],
  ['#09274A', '#0D5A7A', '#27E8A7'],
  ['#28174A', '#4A1B6E', '#F9468E'],
  ['#121A3E', '#3655A9', '#7AABFF'],
] as const;

const getGradient = (id: string) => {
  const hash = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length];
};

type PosterCardProps = {
  titleId: string;
  titleName: string;
  year: number;
  genres: string[];
  runtime: number;
  posterUrl: string;
  matchScore: number;
  whyTags: string[];
  explorationPick: boolean;
  cardHeight: number;
};

export function PosterCard({
  titleId,
  titleName,
  year,
  genres,
  runtime,
  posterUrl,
  matchScore,
  whyTags,
  explorationPick,
  cardHeight,
}: PosterCardProps) {
  const fallbackGradient = getGradient(titleId);

  return (
    <View style={[styles.container, { height: cardHeight }, glows.card]}>
      {/* Gradient fallback behind poster */}
      <LinearGradient
        colors={fallbackGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Poster image */}
      <Image
        source={{ uri: posterUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
        recyclingKey={titleId}
      />

      {/* Bottom gradient overlay for text readability */}
      <LinearGradient
        colors={gradients.cardOverlay}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.overlay}
      />

      {/* Top-right badge area */}
      <View style={styles.badgeRow}>
        <MatchBadge score={matchScore} delayMs={200} />
        {explorationPick ? (
          <View style={styles.wildCardBadge}>
            <Text style={styles.wildCardText}>WILD CARD</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        <Text style={styles.title} numberOfLines={2}>
          {titleName}
        </Text>
        <Text style={styles.meta}>
          {year} · {genres.slice(0, 2).join(' · ')} · {runtime}m
        </Text>
        {whyTags.length > 0 ? (
          <View style={styles.tagRow}>
            {whyTags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: VibeTheme.radius.lg,
    overflow: 'hidden',
    backgroundColor: VibeTheme.colors.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeRow: {
    position: 'absolute',
    top: VibeTheme.space.md,
    right: VibeTheme.space.md,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  wildCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: VibeTheme.radius.pill,
    backgroundColor: 'rgba(255, 42, 61, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 61, 0.6)',
  },
  wildCardText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#FF6D6D',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: VibeTheme.space.lg,
    gap: 6,
  },
  title: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.xxl,
    lineHeight: VibeTheme.type.lineHeight.xxl,
    color: '#FFFFFF',
  },
  meta: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
    color: 'rgba(247, 250, 255, 0.7)',
    letterSpacing: 0.3,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: VibeTheme.radius.pill,
    backgroundColor: 'rgba(39, 232, 167, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(39, 232, 167, 0.4)',
  },
  tagText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.xs,
    lineHeight: VibeTheme.type.lineHeight.xs,
    color: '#7DDFBE',
  },
});

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';

import { VibeTheme, springs } from '@/constants/vf-theme';

type MatchBadgeProps = {
  /** 0-1 score */
  score: number;
  /** Optional delay before entrance animation */
  delayMs?: number;
};

export function MatchBadge({ score, delayMs = 0 }: MatchBadgeProps) {
  const pct = Math.round(score * 100);
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(delayMs, withSpring(1, springs.bouncy));
  }, [delayMs, entrance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: entrance.value }],
    opacity: entrance.value,
  }));

  // Color based on score: red < 60, accent-alt 60-84, bright green 85+
  const bgColor =
    pct >= 85
      ? 'rgba(39, 232, 167, 0.22)'
      : pct >= 60
        ? 'rgba(39, 232, 167, 0.14)'
        : 'rgba(255, 42, 61, 0.18)';

  const borderColor =
    pct >= 85
      ? 'rgba(39, 232, 167, 0.8)'
      : pct >= 60
        ? 'rgba(39, 232, 167, 0.5)'
        : 'rgba(255, 42, 61, 0.5)';

  const textColor =
    pct >= 85 ? '#27E8A7' : pct >= 60 ? '#7DDFBE' : '#FF6D6D';

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: bgColor, borderColor },
        animatedStyle,
      ]}>
      <Text style={[styles.text, { color: textColor }]}>{pct}%</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: VibeTheme.radius.pill,
    borderWidth: 1,
  },
  text: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
  },
});

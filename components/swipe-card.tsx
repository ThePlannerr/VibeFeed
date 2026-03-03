import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { VibeTheme, springs } from '@/constants/vf-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_UP_THRESHOLD = -120;
const MAX_ROTATION = 12; // degrees

type SwipeAction = 'pass' | 'like' | 'super_like';

export type SwipeCardRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
  swipeUp: () => void;
};

type SwipeCardProps = {
  children: React.ReactNode;
  onSwipe: (action: SwipeAction) => void;
  enabled?: boolean;
};

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  function SwipeCard({ children, onSwipe, enabled = true }, ref) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isGone = useSharedValue(false);

    const triggerHaptic = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, []);

    const fireSwipe = useCallback(
      (action: SwipeAction) => {
        onSwipe(action);
      },
      [onSwipe],
    );

    const animateOut = useCallback(
      (action: SwipeAction) => {
        'worklet';
        isGone.value = true;

        const dest =
          action === 'pass'
            ? -SCREEN_WIDTH * 1.5
            : action === 'like'
              ? SCREEN_WIDTH * 1.5
              : 0;

        const destY = action === 'super_like' ? -SCREEN_WIDTH : 0;

        translateX.value = withTiming(dest, { duration: 300, easing: Easing.out(Easing.cubic) });
        translateY.value = withTiming(destY, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
          runOnJS(fireSwipe)(action);
        });

        runOnJS(triggerHaptic)();
      },
      [translateX, translateY, isGone, fireSwipe, triggerHaptic],
    );

    useImperativeHandle(ref, () => ({
      swipeLeft: () => {
        animateOut('pass');
      },
      swipeRight: () => {
        animateOut('like');
      },
      swipeUp: () => {
        animateOut('super_like');
      },
    }));

    const pan = Gesture.Pan()
      .enabled(enabled)
      .onUpdate((e) => {
        if (isGone.value) return;
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd((e) => {
        if (isGone.value) return;

        // Super like: swipe up
        if (e.translationY < SWIPE_UP_THRESHOLD) {
          animateOut('super_like');
          return;
        }

        // Like: swipe right
        if (e.translationX > SWIPE_THRESHOLD) {
          animateOut('like');
          return;
        }

        // Pass: swipe left
        if (e.translationX < -SWIPE_THRESHOLD) {
          animateOut('pass');
          return;
        }

        // Snap back
        translateX.value = withSpring(0, springs.snappy);
        translateY.value = withSpring(0, springs.snappy);
      });

    const cardStyle = useAnimatedStyle(() => {
      const rotate = interpolate(
        translateX.value,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-MAX_ROTATION, 0, MAX_ROTATION],
      );

      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate}deg` },
        ],
      };
    });

    // Swipe direction overlays
    const likeOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    }));

    const passOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], 'clamp'),
    }));

    const superLikeOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(translateY.value, [0, SWIPE_UP_THRESHOLD], [0, 1], 'clamp'),
    }));

    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          {children}

          {/* LIKE overlay label */}
          <Animated.View style={[styles.labelContainer, styles.labelRight, likeOpacity]}>
            <View style={styles.likeLabelBg}>
              <Text style={styles.likeLabel}>LIKE</Text>
            </View>
          </Animated.View>

          {/* PASS overlay label */}
          <Animated.View style={[styles.labelContainer, styles.labelLeft, passOpacity]}>
            <View style={styles.passLabelBg}>
              <Text style={styles.passLabel}>NOPE</Text>
            </View>
          </Animated.View>

          {/* SUPER LIKE overlay label */}
          <Animated.View style={[styles.labelContainer, styles.labelTop, superLikeOpacity]}>
            <View style={styles.superLikeLabelBg}>
              <Text style={styles.superLikeLabel}>FIRE</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    position: 'absolute',
  },
  labelContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  labelLeft: {
    top: 40,
    right: 24,
  },
  labelRight: {
    top: 40,
    left: 24,
  },
  labelTop: {
    bottom: 100,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  likeLabelBg: {
    borderWidth: 3,
    borderColor: VibeTheme.colors.accentAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '-15deg' }],
  },
  likeLabel: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: 32,
    letterSpacing: 3,
    color: VibeTheme.colors.accentAlt,
  },
  passLabelBg: {
    borderWidth: 3,
    borderColor: '#96A6C6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '15deg' }],
  },
  passLabel: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: 32,
    letterSpacing: 3,
    color: '#96A6C6',
  },
  superLikeLabelBg: {
    borderWidth: 3,
    borderColor: VibeTheme.colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  superLikeLabel: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: 36,
    letterSpacing: 4,
    color: VibeTheme.colors.accent,
  },
});

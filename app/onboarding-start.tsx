import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Input, Label, MutedText, PrimaryButton, GhostButton, Row, Section } from '@/components/vf-ui';
import { VibeTheme, glows } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';
import { TITLES } from '@/constants/catalog';

const TAGLINES = [
  'Hidden gems. Instant hits.',
  'Your next obsession in 60 seconds.',
  'Swipe. Discover. Binge.',
  'No dead scroll. Pure vibes.',
  'Dangerously accurate picks.',
];

// Pick 6 posters for the collage background
const COLLAGE_POSTERS = TITLES.slice(0, 6);

export default function OnboardingStartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { auth, signInWithEmail, signUpWithEmail, startSession, state } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busyAction, setBusyAction] = useState<'guest' | 'sign_up' | 'sign_in' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  // Cycling tagline
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Subtle glow pulse on CTA
  const glowPulse = useSharedValue(0);
  useEffect(() => {
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glowPulse]);

  const ctaGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + glowPulse.value * 0.3,
    shadowRadius: 16 + glowPulse.value * 10,
  }));

  const startOnboarding = async () => {
    await startSession();
    router.replace('/taste-seeder');
  };

  const onStartGuest = async () => {
    setBusyAction('guest');
    setMessage(null);
    await startOnboarding();
    setBusyAction(null);
  };

  const onSignUp = async () => {
    setBusyAction('sign_up');
    const result = await signUpWithEmail(email, password);
    setMessage(result.message);
    setBusyAction(null);
    if (result.ok && !result.requiresEmailVerification) {
      await startOnboarding();
    }
  };

  const onSignIn = async () => {
    setBusyAction('sign_in');
    const result = await signInWithEmail(email, password);
    setMessage(result.message);
    setBusyAction(null);
    if (result.ok) {
      await startOnboarding();
    }
  };

  if (state.onboarding_complete) {
    router.replace('/swipe-feed');
    return null;
  }

  return (
    <View style={styles.screen}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#03040A', '#071022', '#0D1A33', '#03040A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Poster collage background */}
      <View style={styles.collageGrid}>
        {COLLAGE_POSTERS.map((title, i) => (
          <Animated.View
            key={title.id}
            entering={FadeIn.delay(i * 150).duration(800)}
            style={styles.collagePoster}>
            <Image
              source={{ uri: title.poster_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(4, 5, 10, 0.4)', 'rgba(4, 5, 10, 0.8)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ))}
      </View>

      {/* Dark overlay over collage */}
      <LinearGradient
        colors={['rgba(4, 5, 10, 0.3)', 'rgba(4, 5, 10, 0.85)', 'rgba(4, 5, 10, 0.98)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        {/* Hero area */}
        <View style={styles.heroArea}>
          <Animated.Text entering={FadeInDown.duration(600)} style={styles.brandName}>
            VibeFeed
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(200).duration(500)}
            key={taglineIndex}
            style={styles.tagline}>
            {TAGLINES[taglineIndex]}
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.featureRow}>
            <View style={styles.featurePill}>
              <Text style={styles.featurePillText}>🔥 Binge Radar</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featurePillText}>⚡ No Dead Scroll</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featurePillText}>🎯 Fresh Every Night</Text>
            </View>
          </Animated.View>
        </View>

        {/* CTA area */}
        <View style={styles.ctaArea}>
          <Animated.View style={[styles.ctaWrapper, ctaGlowStyle]}>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed ? styles.ctaPressed : undefined,
              ]}
              onPress={onStartGuest}
              disabled={busyAction !== null}
              accessibilityRole="button"
              accessibilityLabel="Start Swiping">
              <Text style={styles.ctaText}>
                {busyAction === 'guest' ? 'Opening feed...' : 'Start Swiping'}
              </Text>
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={() => setShowAuth((v) => !v)}
            style={styles.authToggle}>
            <Text style={styles.authToggleText}>
              {showAuth ? 'Hide Sign In' : 'I Have an Account'}
            </Text>
          </Pressable>

          {showAuth ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.authSection}>
              <Label>Email</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                disabled={busyAction !== null || !auth.enabled}
                accessibilityLabel="Email address"
              />
              <Label>Password</Label>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                disabled={busyAction !== null || !auth.enabled}
                accessibilityLabel="Password"
              />
              <Row>
                <PrimaryButton
                  label={busyAction === 'sign_up' ? 'Creating...' : 'Create'}
                  onPress={onSignUp}
                  disabled={busyAction !== null || !auth.enabled}
                  loading={busyAction === 'sign_up'}
                />
                <GhostButton
                  label={busyAction === 'sign_in' ? 'Signing in...' : 'Sign In'}
                  onPress={onSignIn}
                  disabled={busyAction !== null || !auth.enabled}
                  loading={busyAction === 'sign_in'}
                />
              </Row>
              {auth.enabled ? null : <MutedText>Sign-in is disabled.</MutedText>}
              {auth.status === 'signed_in' ? (
                <MutedText>Signed in as {auth.email ?? auth.userId}</MutedText>
              ) : null}
              {message ? <MutedText>{message}</MutedText> : null}
            </Animated.View>
          ) : null}

          <Text style={styles.privacyNote}>Privacy controls in profile.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VibeTheme.bg,
  },
  collageGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collagePoster: {
    width: '33.33%',
    height: '50%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: VibeTheme.space.lg,
  },
  heroArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  brandName: {
    fontFamily: VibeTheme.type.family.display,
    fontSize: VibeTheme.type.size.mega,
    lineHeight: VibeTheme.type.lineHeight.mega,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.lg,
    lineHeight: VibeTheme.type.lineHeight.lg,
    color: 'rgba(247, 250, 255, 0.8)',
    textAlign: 'center',
    maxWidth: 300,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: VibeTheme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  featurePillText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.xs,
    color: 'rgba(247, 250, 255, 0.7)',
  },
  ctaArea: {
    gap: 14,
    alignItems: 'center',
    paddingBottom: 10,
  },
  ctaWrapper: {
    width: '100%',
    shadowColor: VibeTheme.accent,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  ctaButton: {
    backgroundColor: VibeTheme.accent,
    paddingVertical: 16,
    borderRadius: VibeTheme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 130, 140, 0.75)',
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.lg,
    color: VibeTheme.colors.onAccent,
    letterSpacing: 0.5,
  },
  authToggle: {
    paddingVertical: 8,
  },
  authToggleText: {
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.md,
    color: VibeTheme.textMuted,
  },
  authSection: {
    width: '100%',
    gap: VibeTheme.space.sm,
    backgroundColor: 'rgba(10, 16, 28, 0.8)',
    borderRadius: VibeTheme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 170, 255, 0.2)',
    padding: VibeTheme.space.md,
  },
  privacyNote: {
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.xs,
    color: 'rgba(150, 166, 198, 0.6)',
  },
});

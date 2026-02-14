import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppShell,
  BodyText,
  GhostButton,
  Input,
  Label,
  MutedText,
  PrimaryButton,
  Row,
  Section,
} from '@/components/vf-ui';
import { VibeTheme } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';

export default function OnboardingStartScreen() {
  const router = useRouter();
  const { auth, signInWithEmail, signUpWithEmail, startSession, state } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busyAction, setBusyAction] = useState<'guest' | 'sign_up' | 'sign_in' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    <AppShell
      title="VibeFeed"
      subtitle="Cinematic discovery for TV and movies. Swipe, save, and get clear reasons for every pick.">
      <Section title="MVP Focus" delayMs={40}>
        <View style={styles.copyList}>
          <BodyText>Scope: Swipe + Save + Why</BodyText>
          <BodyText>Catalog: TV + Movies</BodyText>
          <BodyText>Free: Unlimited core swipes and watchlist</BodyText>
          <BodyText>Pro: Advanced discovery controls and tuning</BodyText>
        </View>
      </Section>
      <Section title="Privacy First" delayMs={90}>
        <BodyText>Minimal telemetry with explicit consent and an in-profile deletion path.</BodyText>
      </Section>

      <Section title="Account (Optional)" delayMs={130}>
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
          placeholder="At least 8 chars with upper/lower/number"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          disabled={busyAction !== null || !auth.enabled}
          accessibilityLabel="Password"
        />
        <Row>
          <PrimaryButton
            label={busyAction === 'sign_up' ? 'Creating account...' : 'Create Account'}
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
        {auth.enabled ? null : <MutedText>Auth is disabled. Add Supabase env vars to enable login.</MutedText>}
        {auth.status === 'signed_in' ? <MutedText>Signed in as {auth.email ?? auth.userId}</MutedText> : null}
        {message ? <BodyText>{message}</BodyText> : null}
      </Section>

      <PrimaryButton
        label={busyAction === 'guest' ? 'Starting session...' : 'Continue as Guest'}
        onPress={onStartGuest}
        disabled={busyAction !== null}
        loading={busyAction === 'guest'}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  copyList: {
    gap: VibeTheme.space.xs,
  },
});

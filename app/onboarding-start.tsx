import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { AppShell, GhostButton, Input, Label, PrimaryButton, Row, Section } from '@/components/vf-ui';
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
      subtitle="Find TV and movies that feel right, quickly. Swipe, save, and see why each pick matches.">
      <Section title="MVP Focus">
        <Text>Scope: Swipe + Save + Why</Text>
        <Text>Catalog: TV + Movies</Text>
        <Text>Free: Unlimited core swipes and watchlist</Text>
        <Text>Pro: Advanced discovery controls and tuning</Text>
      </Section>
      <Section title="Privacy First">
        <Text>Minimal telemetry with explicit consent and in-profile deletion path.</Text>
      </Section>

      <Section title="Account (Optional)">
        <Label>Email</Label>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          disabled={busyAction !== null || !auth.enabled}
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
        />
        <Row>
          <PrimaryButton
            label={busyAction === 'sign_up' ? 'Creating account...' : 'Create Account'}
            onPress={onSignUp}
            disabled={busyAction !== null || !auth.enabled}
          />
          <GhostButton
            label={busyAction === 'sign_in' ? 'Signing in...' : 'Sign In'}
            onPress={onSignIn}
            disabled={busyAction !== null || !auth.enabled}
          />
        </Row>
        {auth.enabled ? null : <Text>Auth disabled: add Supabase env vars to enable account login.</Text>}
        {auth.status === 'signed_in' ? <Text>Signed in as {auth.email ?? auth.userId}</Text> : null}
        {message ? <Text>{message}</Text> : null}
      </Section>

      <PrimaryButton
        label={busyAction === 'guest' ? 'Starting session...' : 'Continue as Guest'}
        onPress={onStartGuest}
        disabled={busyAction !== null}
      />
    </AppShell>
  );
}

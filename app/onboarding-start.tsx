import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { AppShell, PrimaryButton, Section } from '@/components/vf-ui';
import { useAppState } from '@/context/app-state';

export default function OnboardingStartScreen() {
  const router = useRouter();
  const { startSession, state } = useAppState();
  const [starting, setStarting] = useState(false);

  const onStart = async () => {
    setStarting(true);
    await startSession();
    setStarting(false);
    router.replace('/taste-seeder');
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
      <PrimaryButton label={starting ? 'Starting session...' : 'Start in 10 Seconds'} onPress={onStart} disabled={starting} />
    </AppShell>
  );
}

import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppState } from '@/context/app-state';
import { VibeTheme } from '@/constants/vf-theme';

export default function IndexScreen() {
  const { hydrated, state } = useAppState();

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: VibeTheme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={VibeTheme.accent} size="large" />
      </View>
    );
  }

  if (!state.session || !state.onboarding_complete) {
    return <Redirect href="/onboarding-start" />;
  }

  return <Redirect href="/swipe-feed" />;
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { AppStateProvider } from '@/context/app-state';

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding-start" options={{ headerShown: false }} />
        <Stack.Screen name="taste-seeder" options={{ headerShown: false }} />
        <Stack.Screen name="swipe-feed" options={{ headerShown: false }} />
        <Stack.Screen name="title/[id]" options={{ title: 'Title Detail', headerBackTitle: 'Back' }} />
        <Stack.Screen name="watchlist" options={{ title: 'Watchlist' }} />
        <Stack.Screen
          name="profile-preferences"
          options={{ title: 'Profile and Preferences', headerBackTitle: 'Back' }}
        />
        <Stack.Screen name="pro-upsell" options={{ title: 'VibeFeed Pro', headerBackTitle: 'Back' }} />
        <Stack.Screen
          name="post-watch-pulse"
          options={{ title: 'Post Watch Pulse', presentation: 'modal', headerBackTitle: 'Back' }}
        />
      </Stack>
      <StatusBar style="dark" />
    </AppStateProvider>
  );
}

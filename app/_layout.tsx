import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { VibeTheme } from '@/constants/vf-theme';
import { AppStateProvider } from '@/context/app-state';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore splash race conditions during hot reload.
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'SourceSans3-Regular': require('../assets/fonts/SourceSans3-Regular.ttf'),
    'SourceSans3-SemiBold': require('../assets/fonts/SourceSans3-SemiBold.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        // No-op.
      });
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0B1220',
            },
            headerTintColor: VibeTheme.text,
            headerTitleStyle: {
              fontFamily: VibeTheme.type.family.bodyStrong,
              fontSize: VibeTheme.type.size.md,
              letterSpacing: 0.25,
            },
            headerBackTitleStyle: {
              fontFamily: VibeTheme.type.family.body,
              fontSize: VibeTheme.type.size.sm,
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: VibeTheme.colors.background },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-start" options={{ headerShown: false }} />
          <Stack.Screen name="taste-seeder" options={{ headerShown: false }} />
          <Stack.Screen name="swipe-feed" options={{ headerShown: false }} />
          <Stack.Screen name="title/[id]" options={{ title: 'Details', headerBackTitle: 'Back' }} />
          <Stack.Screen name="watchlist" options={{ title: 'Watchlist' }} />
          <Stack.Screen
            name="profile-preferences"
            options={{ title: 'Profile & Preferences', headerBackTitle: 'Back' }}
          />
          <Stack.Screen name="pro-upsell" options={{ title: 'Go Pro', headerBackTitle: 'Back' }} />
          <Stack.Screen
            name="post-watch-pulse"
            options={{ title: 'Quick Feedback', presentation: 'modal', headerBackTitle: 'Back' }}
          />
        </Stack>
        <StatusBar style="light" />
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}

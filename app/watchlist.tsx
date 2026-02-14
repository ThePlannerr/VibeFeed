import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppShell, BodyText, GhostButton, PrimaryButton, Row, Section } from '@/components/vf-ui';
import { VibeTheme } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';

export default function WatchlistScreen() {
  const router = useRouter();
  const { getWatchlistTitles, submitInteraction } = useAppState();
  const watchlistTitles = getWatchlistTitles();

  return (
    <AppShell title="Watchlist" subtitle="Saved titles are available offline from local storage in MVP mode.">
      {watchlistTitles.length === 0 ? (
        <Section title="No saved titles yet" delayMs={40}>
          <BodyText>Save titles from swipe feed or detail to build your watchlist.</BodyText>
          <PrimaryButton label="Back to Swipe Feed" onPress={() => router.replace('/swipe-feed')} />
        </Section>
      ) : null}

      {watchlistTitles.map((title) => (
        <Section key={title.id} title={`${title.title_name} (${title.year})`} delayMs={90}>
          <Text style={styles.metaText}>
            {title.genres.join(', ')} | {title.runtime}m
          </Text>
          <BodyText>{title.availability_hint}</BodyText>
          <Row>
            <GhostButton
              label="Details"
              onPress={() => router.push({ pathname: '/title/[id]', params: { id: title.id } })}
            />
            <GhostButton
              label="Unsave"
              onPress={async () => {
                await submitInteraction({
                  title_id: title.id,
                  action: 'unsave',
                  context: { screen: 'Watchlist' },
                });
              }}
            />
            <PrimaryButton
              label="Mark Watched"
              onPress={() => router.push({ pathname: '/post-watch-pulse', params: { titleId: title.id } })}
            />
          </Row>
        </Section>
      ))}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metaText: {
    color: VibeTheme.textMuted,
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
  },
});

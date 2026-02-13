import { useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { AppShell, GhostButton, PrimaryButton, Row, Section } from '@/components/vf-ui';
import { useAppState } from '@/context/app-state';

export default function WatchlistScreen() {
  const router = useRouter();
  const { getWatchlistTitles, submitInteraction } = useAppState();
  const watchlistTitles = getWatchlistTitles();

  return (
    <AppShell title="Watchlist" subtitle="Saved titles are available offline from local storage in MVP mode.">
      {watchlistTitles.length === 0 ? (
        <Section title="No saved titles yet">
          <Text>Save titles from swipe feed or detail to build your watchlist.</Text>
          <PrimaryButton label="Back to Swipe Feed" onPress={() => router.replace('/swipe-feed')} />
        </Section>
      ) : null}

      {watchlistTitles.map((title) => (
        <Section key={title.id} title={`${title.title_name} (${title.year})`}>
          <Text>
            {title.genres.join(', ')} | {title.runtime}m
          </Text>
          <Text>{title.availability_hint}</Text>
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

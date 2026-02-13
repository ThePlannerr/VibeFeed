import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { AppShell, GhostButton, Pill, PrimaryButton, Row, Section } from '@/components/vf-ui';
import { useAppState } from '@/context/app-state';

export default function TitleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { getTitleById, submitInteraction, state } = useAppState();
  const title = getTitleById(params.id);

  if (!title) {
    return (
      <AppShell title="Title Detail" subtitle="Title not found.">
        <PrimaryButton label="Back to Feed" onPress={() => router.replace('/swipe-feed')} />
      </AppShell>
    );
  }

  const isSaved = state.watchlist.includes(title.id);

  return (
    <AppShell title={title.title_name} subtitle={`${title.year} | ${title.runtime}m`}>
      <Section title="Synopsis">
        <Text>{title.synopsis}</Text>
      </Section>
      <Section title="Tags">
        <Row>
          {title.genres.map((genre) => (
            <Pill key={genre} label={genre} onPress={() => {}} />
          ))}
          {title.moods.map((mood) => (
            <Pill key={mood} label={mood} onPress={() => {}} />
          ))}
        </Row>
      </Section>
      <Section title="Cast">
        <Text>{title.cast.join(', ')}</Text>
      </Section>
      <Section title="Availability and Trailer">
        <Text>{title.availability_hint}</Text>
        <Text>Trailer link placeholder (streaming integration deferred in MVP).</Text>
      </Section>
      <Row>
        <GhostButton
          label={isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
          onPress={async () => {
            await submitInteraction({
              title_id: title.id,
              action: isSaved ? 'unsave' : 'save',
              context: { screen: 'TitleDetail' },
            });
          }}
        />
        <PrimaryButton
          label="I Watched This"
          onPress={() => router.push({ pathname: '/post-watch-pulse', params: { titleId: title.id } })}
        />
      </Row>
    </AppShell>
  );
}

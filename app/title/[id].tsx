import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppShell, BodyText, GhostButton, Pill, PrimaryButton, Row, Section } from '@/components/vf-ui';
import { VibeTheme } from '@/constants/vf-theme';
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
      <Section title="Synopsis" delayMs={40}>
        <BodyText>{title.synopsis}</BodyText>
      </Section>
      <Section title="Tags" delayMs={90}>
        <Row>
          {title.genres.map((genre) => (
            <Pill key={genre} label={genre} />
          ))}
          {title.moods.map((mood) => (
            <Pill key={mood} label={mood} />
          ))}
        </Row>
      </Section>
      <Section title="Cast" delayMs={120}>
        <BodyText>{title.cast.join(', ')}</BodyText>
      </Section>
      <Section title="Availability and Trailer" delayMs={150}>
        <BodyText>{title.availability_hint}</BodyText>
        <Text style={styles.metaText}>Trailer link placeholder (streaming integration deferred in MVP).</Text>
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

const styles = StyleSheet.create({
  metaText: {
    color: VibeTheme.textMuted,
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
  },
});

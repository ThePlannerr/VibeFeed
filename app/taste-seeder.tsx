import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { VIBE_CHIPS } from '@/constants/catalog';
import {
  AppShell,
  BodyText,
  FormRow,
  GhostButton,
  InlineValue,
  Input,
  Label,
  MutedText,
  Pill,
  PrimaryButton,
  Row,
  Section,
} from '@/components/vf-ui';
import { VibeTheme } from '@/constants/vf-theme';
import { useAppState } from '@/context/app-state';
import { SwipeAction } from '@/types/domain';

type SeedSwipe = {
  title_id: string;
  action: Extract<SwipeAction, 'like' | 'pass' | 'super_like'>;
};

const MIN_FAVORITES = 3;
const MAX_FAVORITES = 5;
const REQUIRED_VIBES = 3;
const REQUIRED_SEED_SWIPES = 10;

export default function TasteSeederScreen() {
  const router = useRouter();
  const { searchTitles, catalog, submitOnboardingSeed, state } = useAppState();
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(state.profile.favorite_title_ids);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(state.profile.vibe_chips);
  const [seedSwipes, setSeedSwipes] = useState<SeedSwipe[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const searchResults = useMemo(() => searchTitles(query), [query, searchTitles]);
  const seedCandidates = useMemo(
    () => catalog.filter((title) => !favoriteIds.includes(title.id)).slice(0, 16),
    [catalog, favoriteIds],
  );
  const currentSeed = seedCandidates[seedSwipes.length % Math.max(seedCandidates.length, 1)];

  const toggleFavorite = (id: string) => {
    setFavoriteIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }
      if (previous.length >= MAX_FAVORITES) {
        return previous;
      }
      return [...previous, id];
    });
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((previous) =>
      previous.includes(vibe) ? previous.filter((item) => item !== vibe) : [...previous, vibe],
    );
  };

  const registerSeedSwipe = (action: SeedSwipe['action']) => {
    if (!currentSeed || seedSwipes.length >= REQUIRED_SEED_SWIPES) {
      return;
    }

    setSeedSwipes((previous) => [...previous, { title_id: currentSeed.id, action }]);
  };

  const canContinue =
    favoriteIds.length >= MIN_FAVORITES &&
    selectedVibes.length >= REQUIRED_VIBES &&
    seedSwipes.length >= REQUIRED_SEED_SWIPES;

  const handleContinue = async () => {
    if (!canContinue) {
      return;
    }

    setSubmitting(true);
    await submitOnboardingSeed({
      favorite_title_ids: favoriteIds,
      vibe_chips: selectedVibes.slice(0, REQUIRED_VIBES),
      seed_swipes: seedSwipes,
    });
    setSubmitting(false);
    router.replace('/swipe-feed');
  };

  return (
    <AppShell
      title="Taste Seeder"
      subtitle="Under 90 seconds: pick favorites, set mood chips, and complete 10 seed swipes.">
      <Section title="Step 1: Pick 3 to 5 favorites" delayMs={40}>
        <Input value={query} onChangeText={setQuery} placeholder="Search TV or movies..." />
        <Row>
          {searchResults.map((title) => (
            <Pill
              key={title.id}
              label={title.title_name}
              selected={favoriteIds.includes(title.id)}
              onPress={() => toggleFavorite(title.id)}
              disabled={!favoriteIds.includes(title.id) && favoriteIds.length >= MAX_FAVORITES}
            />
          ))}
        </Row>
        <Label>
          Selected <InlineValue>{favoriteIds.length}</InlineValue> / {MAX_FAVORITES}
        </Label>
      </Section>

      <Section title="Step 2: Choose 3 mood chips" delayMs={90}>
        <Row>
          {VIBE_CHIPS.map((chip) => (
            <Pill
              key={chip}
              label={chip}
              selected={selectedVibes.includes(chip)}
              onPress={() => toggleVibe(chip)}
            />
          ))}
        </Row>
        <Label>
          Selected <InlineValue>{selectedVibes.length}</InlineValue> / {REQUIRED_VIBES}+
        </Label>
      </Section>

      <Section title="Step 3: Seed swipes (10)" delayMs={130}>
        {currentSeed ? (
          <View style={styles.seedCard}>
            <Text style={styles.seedTitle}>{currentSeed.title_name}</Text>
            <MutedText>
              {currentSeed.year} | {currentSeed.genres.join(', ')} | {currentSeed.runtime}m
            </MutedText>
            <BodyText>{currentSeed.synopsis}</BodyText>
            <FormRow>
              <GhostButton label="Pass" onPress={() => registerSeedSwipe('pass')} />
              <GhostButton label="Like" onPress={() => registerSeedSwipe('like')} />
              <PrimaryButton label="Super Like" onPress={() => registerSeedSwipe('super_like')} />
            </FormRow>
          </View>
        ) : (
          <MutedText>No candidates found. Adjust your favorites.</MutedText>
        )}
        <Label>
          Completed <InlineValue>{seedSwipes.length}</InlineValue> / {REQUIRED_SEED_SWIPES}
        </Label>
      </Section>

      <PrimaryButton
        label={submitting ? 'Building your feed...' : 'Enter Swipe Feed'}
        onPress={handleContinue}
        disabled={!canContinue || submitting}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  seedCard: {
    gap: VibeTheme.space.sm,
  },
  seedTitle: {
    color: VibeTheme.text,
    fontFamily: VibeTheme.type.family.bodyStrong,
    fontSize: VibeTheme.type.size.xl,
    lineHeight: VibeTheme.type.lineHeight.xl,
  },
});

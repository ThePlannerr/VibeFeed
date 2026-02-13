import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Text } from 'react-native';

import { GENRES } from '@/constants/catalog';
import {
  AppShell,
  GhostButton,
  Input,
  Label,
  Pill,
  PrimaryButton,
  Row,
  Section,
} from '@/components/vf-ui';
import { useAppState } from '@/context/app-state';

export default function ProfilePreferencesScreen() {
  const router = useRouter();
  const { state, patchProfilePreferences, getKpis } = useAppState();
  const [blockedGenres, setBlockedGenres] = useState<string[]>(state.profile.blocked_genres);
  const [runtimeMin, setRuntimeMin] = useState(
    state.profile.runtime_pref ? `${state.profile.runtime_pref.min}` : '',
  );
  const [runtimeMax, setRuntimeMax] = useState(
    state.profile.runtime_pref ? `${state.profile.runtime_pref.max}` : '',
  );
  const [languagePref, setLanguagePref] = useState(state.profile.language_pref.join(','));
  const [moodIntensity, setMoodIntensity] = useState(state.profile.mood_intensity);
  const [moreLike, setMoreLike] = useState(state.profile.more_like_title_id ?? '');
  const [lessLike, setLessLike] = useState(state.profile.less_like_title_id ?? '');
  const [saving, setSaving] = useState(false);

  const kpis = getKpis();
  const candidateTitles = useMemo(
    () =>
      state.profile.favorite_title_ids
        .concat(state.watchlist)
        .filter((value, index, array) => array.indexOf(value) === index),
    [state.profile.favorite_title_ids, state.watchlist],
  );

  const toggleBlockedGenre = (genre: string) => {
    setBlockedGenres((previous) =>
      previous.includes(genre) ? previous.filter((value) => value !== genre) : [...previous, genre],
    );
  };

  const savePreferences = async () => {
    setSaving(true);
    await patchProfilePreferences({ blocked_genres: blockedGenres });

    const hasRuntime = runtimeMin.trim() && runtimeMax.trim();
    const runtimePatch = hasRuntime
      ? { min: Number.parseInt(runtimeMin, 10) || 0, max: Number.parseInt(runtimeMax, 10) || 999 }
      : null;

    const proResult = await patchProfilePreferences({
      runtime_pref: runtimePatch,
      language_pref: languagePref
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      mood_intensity: moodIntensity,
      more_like_title_id: moreLike || null,
      less_like_title_id: lessLike || null,
    });

    setSaving(false);
    if (proResult.pro_required) {
      router.push('/pro-upsell');
    }
  };

  return (
    <AppShell title="Profile and Preferences" subtitle="Minimal and explicit data controls, with Pro discovery tuning.">
      <Section title="Core Preferences (Free)">
        <Label>Blocked genres</Label>
        <Row>
          {GENRES.map((genre) => (
            <Pill
              key={genre}
              label={genre}
              selected={blockedGenres.includes(genre)}
              onPress={() => toggleBlockedGenre(genre)}
            />
          ))}
        </Row>
      </Section>

      <Section title={`Advanced Discovery Controls (${state.is_pro ? 'Pro Active' : 'Pro'})`}>
        <Label>Runtime window (minutes)</Label>
        <Row>
          <Input
            value={runtimeMin}
            onChangeText={setRuntimeMin}
            placeholder="Min"
            keyboardType="numeric"
            disabled={!state.is_pro}
          />
          <Input
            value={runtimeMax}
            onChangeText={setRuntimeMax}
            placeholder="Max"
            keyboardType="numeric"
            disabled={!state.is_pro}
          />
        </Row>

        <Label>Language preference (comma separated, example: en,es)</Label>
        <Input
          value={languagePref}
          onChangeText={setLanguagePref}
          placeholder="en"
          keyboardType="default"
          disabled={!state.is_pro}
        />

        <Label>Mood intensity: {moodIntensity}</Label>
        <Row>
          <GhostButton
            label="-10"
            onPress={() => setMoodIntensity((value) => Math.max(0, value - 10))}
            disabled={!state.is_pro}
          />
          <GhostButton
            label="+10"
            onPress={() => setMoodIntensity((value) => Math.min(100, value + 10))}
            disabled={!state.is_pro}
          />
        </Row>

        <Label>More like title id</Label>
        <Input
          value={moreLike}
          onChangeText={setMoreLike}
          placeholder={candidateTitles[0] ?? 'title-id'}
          keyboardType="default"
          disabled={!state.is_pro}
        />
        <Label>Less like title id</Label>
        <Input
          value={lessLike}
          onChangeText={setLessLike}
          placeholder={candidateTitles[1] ?? 'title-id'}
          keyboardType="default"
          disabled={!state.is_pro}
        />
        {!state.is_pro ? (
          <Text>Controls are visible in free tier but locked until upgrade.</Text>
        ) : null}
      </Section>

      <Section title="KPI Dashboard Snapshot">
        <Text>Watch-through conversion (14d): {kpis.watch_through_conversion_pct}%</Text>
        <Text>Save rate /100 swipes: {kpis.save_rate_per_100_swipes}</Text>
        <Text>Skip-to-like ratio: {kpis.skip_to_like_ratio}</Text>
        <Text>D1 retention: {kpis.d1_retention_pct}%</Text>
        <Text>D7 retention: {kpis.d7_retention_pct}%</Text>
        <Text>Pro conversion: {kpis.pro_conversion_pct}%</Text>
      </Section>

      <Row>
        <PrimaryButton label={saving ? 'Saving...' : 'Save Preferences'} onPress={savePreferences} disabled={saving} />
        {!state.is_pro ? <GhostButton label="Upgrade to Pro" onPress={() => router.push('/pro-upsell')} /> : null}
      </Row>
    </AppShell>
  );
}

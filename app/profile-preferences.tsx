import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { GENRES } from '@/constants/catalog';
import {
  AppShell,
  BodyText,
  FormRow,
  GhostButton,
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
import { DELETE_ACCOUNT_CONFIRMATION } from '@/lib/auth';

export default function ProfilePreferencesScreen() {
  const router = useRouter();
  const { auth, deleteAccount, getKpis, patchProfilePreferences, signOut, state } = useAppState();
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
  const [accountBusy, setAccountBusy] = useState<'sign_out' | 'delete' | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

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

  const onSignOut = async () => {
    setAccountBusy('sign_out');
    const result = await signOut();
    setAccountMessage(result.message);
    setAccountBusy(null);
    if (result.ok) {
      router.replace('/onboarding-start');
    }
  };

  const onDeleteAccount = async () => {
    setAccountBusy('delete');
    const result = await deleteAccount(deleteConfirmation);
    setAccountMessage(result.message);
    setAccountBusy(null);
    if (result.ok) {
      router.replace('/onboarding-start');
    }
  };

  return (
    <AppShell title="Profile and Preferences" subtitle="Minimal and explicit data controls, with Pro discovery tuning.">
      <Section title="Account" delayMs={40}>
        {auth.status === 'signed_in' ? (
          <>
            <BodyText>Signed in as: {auth.email ?? auth.userId}</BodyText>
            <MutedText>
              Email verification: {auth.emailConfirmedAt ? `confirmed at ${auth.emailConfirmedAt}` : 'pending'}
            </MutedText>
            <Row>
              <GhostButton
                label={accountBusy === 'sign_out' ? 'Signing out...' : 'Sign Out'}
                onPress={onSignOut}
                disabled={accountBusy !== null}
                loading={accountBusy === 'sign_out'}
              />
            </Row>
            <Label>Type {DELETE_ACCOUNT_CONFIRMATION} to permanently delete account</Label>
            <Input
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder={DELETE_ACCOUNT_CONFIRMATION}
              keyboardType="default"
              autoCapitalize="characters"
              autoCorrect={false}
              disabled={accountBusy !== null}
              accessibilityLabel="Delete account confirmation"
            />
            <GhostButton
              label={accountBusy === 'delete' ? 'Deleting account...' : 'Delete Account Permanently'}
              onPress={onDeleteAccount}
              disabled={accountBusy !== null}
              loading={accountBusy === 'delete'}
            />
          </>
        ) : (
          <>
            <BodyText>Guest session active. Sign in on onboarding to attach your data to an account.</BodyText>
            <GhostButton label="Go to Sign In" onPress={() => router.replace('/onboarding-start')} />
          </>
        )}
        {accountMessage ? <Text style={styles.accountMessage}>{accountMessage}</Text> : null}
      </Section>

      <Section title="Core Preferences (Free)" delayMs={80}>
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

      <Section title={`Advanced Discovery Controls (${state.is_pro ? 'Pro Active' : 'Pro'})`} delayMs={120}>
        <Label>Runtime window (minutes)</Label>
        <FormRow>
          <Input
            value={runtimeMin}
            onChangeText={setRuntimeMin}
            placeholder="Min"
            keyboardType="numeric"
            disabled={!state.is_pro}
            accessibilityLabel="Minimum runtime in minutes"
          />
          <Input
            value={runtimeMax}
            onChangeText={setRuntimeMax}
            placeholder="Max"
            keyboardType="numeric"
            disabled={!state.is_pro}
            accessibilityLabel="Maximum runtime in minutes"
          />
        </FormRow>

        <Label>Language preference (comma separated, example: en,es)</Label>
        <Input
          value={languagePref}
          onChangeText={setLanguagePref}
          placeholder="en"
          keyboardType="default"
          disabled={!state.is_pro}
          accessibilityLabel="Language preference"
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
          accessibilityLabel="More like title id"
        />
        <Label>Less like title id</Label>
        <Input
          value={lessLike}
          onChangeText={setLessLike}
          placeholder={candidateTitles[1] ?? 'title-id'}
          keyboardType="default"
          disabled={!state.is_pro}
          accessibilityLabel="Less like title id"
        />
        {!state.is_pro ? (
          <MutedText>Controls are visible in free tier but locked until upgrade.</MutedText>
        ) : null}
      </Section>

      <Section title="KPI Dashboard Snapshot" delayMs={160}>
        <Text style={styles.metricText}>Watch-through conversion (14d): {kpis.watch_through_conversion_pct}%</Text>
        <Text style={styles.metricText}>Save rate /100 swipes: {kpis.save_rate_per_100_swipes}</Text>
        <Text style={styles.metricText}>Skip-to-like ratio: {kpis.skip_to_like_ratio}</Text>
        <Text style={styles.metricText}>D1 retention: {kpis.d1_retention_pct}%</Text>
        <Text style={styles.metricText}>D7 retention: {kpis.d7_retention_pct}%</Text>
        <Text style={styles.metricText}>Pro conversion: {kpis.pro_conversion_pct}%</Text>
      </Section>

      <Row>
        <PrimaryButton
          label={saving ? 'Saving...' : 'Save Preferences'}
          onPress={savePreferences}
          disabled={saving}
          loading={saving}
        />
        {!state.is_pro ? <GhostButton label="Upgrade to Pro" onPress={() => router.push('/pro-upsell')} /> : null}
      </Row>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  accountMessage: {
    color: VibeTheme.text,
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
  },
  metricText: {
    color: VibeTheme.text,
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
  },
});

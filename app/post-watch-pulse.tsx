import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';

import { AppShell, BodyText, FormRow, GhostButton, Pill, PrimaryButton, Row, Section } from '@/components/vf-ui';
import { useAppState } from '@/context/app-state';
import { WatchReaction } from '@/types/domain';

const REACTIONS: WatchReaction[] = ['loved_it', 'good', 'meh', 'not_for_me'];

export default function PostWatchPulseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ titleId?: string }>();
  const { submitWatchPulse, getTitleById } = useAppState();
  const [watched, setWatched] = useState(true);
  const [reaction, setReaction] = useState<WatchReaction>('good');
  const [saving, setSaving] = useState(false);

  const title = params.titleId ? getTitleById(params.titleId) : undefined;

  const submit = async () => {
    if (!params.titleId) {
      return;
    }

    setSaving(true);
    await submitWatchPulse({
      title_id: params.titleId,
      watched,
      reaction,
    });
    setSaving(false);
    router.replace('/swipe-feed');
  };

  return (
    <AppShell title="Post Watch Pulse" subtitle="One-tap feedback to refine future recommendations.">
      <Section title="Title" delayMs={40}>
        <BodyText>{title ? title.title_name : params.titleId ?? 'Unknown title'}</BodyText>
      </Section>
      <Section title="Did you start watching?" delayMs={90}>
        <Row>
          <Pill label="Watched" selected={watched} onPress={() => setWatched(true)} />
          <Pill label="Not yet" selected={!watched} onPress={() => setWatched(false)} />
        </Row>
      </Section>
      <Section title="Quick reaction" delayMs={120}>
        <Row>
          {REACTIONS.map((item) => (
            <Pill
              key={item}
              label={item.replaceAll('_', ' ')}
              selected={reaction === item}
              onPress={() => setReaction(item)}
            />
          ))}
        </Row>
      </Section>
      <FormRow>
        <PrimaryButton
          label={saving ? 'Saving pulse...' : 'Submit Pulse'}
          onPress={submit}
          disabled={saving}
          loading={saving}
        />
        <GhostButton label="Skip" onPress={() => router.back()} />
      </FormRow>
    </AppShell>
  );
}

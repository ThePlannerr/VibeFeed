import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { AppShell, BodyText, GhostButton, PrimaryButton, Section } from '@/components/vf-ui';
import { useAppState } from '@/context/app-state';

export default function ProUpsellScreen() {
  const router = useRouter();
  const { state, trackEvent, upgradeToPro } = useAppState();
  const [upgrading, setUpgrading] = useState(false);
  const [paywallLogged, setPaywallLogged] = useState(false);

  useEffect(() => {
    if (paywallLogged) {
      return;
    }
    setPaywallLogged(true);
    trackEvent('pro_paywall_viewed', { source: 'pro_upsell_screen' });
  }, [paywallLogged, trackEvent]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    await upgradeToPro();
    setUpgrading(false);
    router.replace('/profile-preferences');
  };

  return (
    <AppShell
      title="VibeFeed Pro"
      subtitle="Monetization without trust tradeoff: core discovery remains free, precision controls are Pro.">
      <Section title="Pro unlocks" delayMs={40}>
        <BodyText>Runtime windows and language preference controls</BodyText>
        <BodyText>Mood intensity and recommendation tuning sliders</BodyText>
        <BodyText>Profile shift insights and top matched motifs</BodyText>
        <BodyText>Priority refresh frequency</BodyText>
      </Section>
      <Section title="Pricing assumption" delayMs={90}>
        <BodyText>Single monthly plan during MVP validation.</BodyText>
      </Section>
      {state.is_pro ? (
        <GhostButton label="Pro is already active" onPress={() => router.replace('/profile-preferences')} />
      ) : (
        <PrimaryButton
          label={upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
          onPress={handleUpgrade}
          disabled={upgrading}
          loading={upgrading}
        />
      )}
    </AppShell>
  );
}

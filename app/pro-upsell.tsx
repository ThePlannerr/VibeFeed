import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { AppShell, GhostButton, PrimaryButton, Section } from '@/components/vf-ui';
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
      <Section title="Pro unlocks">
        <Text>Runtime windows and language preference controls</Text>
        <Text>Mood intensity and recommendation tuning sliders</Text>
        <Text>Profile shift insights and top matched motifs</Text>
        <Text>Priority refresh frequency</Text>
      </Section>
      <Section title="Pricing assumption">
        <Text>Single monthly plan during MVP validation.</Text>
      </Section>
      {state.is_pro ? (
        <GhostButton label="Pro is already active" onPress={() => router.replace('/profile-preferences')} />
      ) : (
        <PrimaryButton label={upgrading ? 'Upgrading...' : 'Upgrade to Pro'} onPress={handleUpgrade} disabled={upgrading} />
      )}
    </AppShell>
  );
}

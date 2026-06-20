import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/brand';
import { SecretInput } from '@/components/secret-input';
import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { setApiKey } from '@/lib/token-store';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);

  async function connect() {
    const t = key.trim();
    if (!t) return;
    setSaving(true);
    await setApiKey(t);
    await refresh();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 80, paddingHorizontal: 20, paddingBottom: 40 }}>
        <Wordmark className="text-[34px]" />
        <Text className="text-secondaryLabel text-[17px] mt-4" style={{ lineHeight: 24 }}>
          A better Splitwise. Connect your account — your key stays on this device, nothing leaves it.
        </Text>
        <View className="h-8" />
        <Card className="gap-3">
          <Text className="text-label text-[15px]" style={{ fontWeight: '600' }}>
            Splitwise API key
          </Text>
          <Text className="text-secondaryLabel text-[13px]">dev.splitwise.com → register an app → your API key</Text>
          <SecretInput value={key} onChangeText={setKey} placeholder="paste your api key" />
          <Button label={saving ? 'Connecting…' : 'Connect Splitwise'} onPress={connect} disabled={saving} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

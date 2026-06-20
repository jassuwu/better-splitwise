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
    <Screen glow="volt">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 90, paddingHorizontal: 24, paddingBottom: 40 }}>
        <Wordmark className="text-4xl" />
        <Text className="text-muted text-base mt-4 leading-relaxed font-body">
          a faster splitwise. connect your account — your key stays on this device, nothing leaves it.
        </Text>
        <View className="h-9" />
        <Card className="gap-3">
          <Text className="text-text font-body-semibold">splitwise api key</Text>
          <Text className="text-faint text-xs font-body">dev.splitwise.com → register an app → your API key</Text>
          <SecretInput value={key} onChangeText={setKey} placeholder="paste your api key" />
          <Button label={saving ? 'connecting…' : 'connect splitwise'} onPress={connect} disabled={saving} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Wordmark } from '@/components/brand';
import { SecretInput } from '@/components/secret-input';
import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { avatarUri, displayName } from '@/lib/format';
import { useCurrentUser } from '@/lib/queries';
import { clearApiKey, clearGeminiKey, getApiKey, getGeminiKey, setApiKey, setGeminiKey } from '@/lib/token-store';

export default function You() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const user = useCurrentUser();
  const [swKey, setSwKey] = useState('');
  const [gemKey, setGemKey] = useState('');

  useEffect(() => {
    void getApiKey().then((k) => setSwKey(k ?? ''));
    void getGeminiKey().then((k) => setGemKey(k ?? ''));
  }, []);

  async function signOut() {
    await clearApiKey();
    await clearGeminiKey();
    await refresh();
    router.replace('/onboarding');
  }

  return (
    <Screen glow="none">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 150, paddingHorizontal: 20 }}>
        <View className="items-center mt-2 mb-7">
          {user.data && <Avatar name={displayName(user.data)} uri={avatarUri(user.data)} size={92} />}
          {user.data && <Text className="text-text text-xl font-display mt-3">{displayName(user.data)}</Text>}
          {user.data?.email ? <Text className="text-muted text-sm mt-0.5 font-body">{user.data.email}</Text> : null}
          {user.data?.default_currency ? (
            <Text className="text-faint text-xs mt-1 font-body">default currency · {user.data.default_currency}</Text>
          ) : null}
        </View>

        <Text className="text-muted text-[11px] uppercase mb-2 font-body-medium" style={{ letterSpacing: 1.4 }}>
          splitwise
        </Text>
        <Card className="gap-3">
          <SecretInput value={swKey} onChangeText={setSwKey} placeholder="splitwise api key" />
          <Button label="update key" onPress={() => void setApiKey(swKey.trim())} />
        </Card>

        <Text className="text-muted text-[11px] uppercase mb-2 mt-6 font-body-medium" style={{ letterSpacing: 1.4 }}>
          receipt scanning · gemini
        </Text>
        <Card className="gap-3">
          <SecretInput value={gemKey} onChangeText={setGemKey} placeholder="gemini api key" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="save key" onPress={() => void setGeminiKey(gemKey.trim())} disabled={!gemKey.trim()} />
            </View>
            <View className="flex-1">
              <Button
                label="clear"
                variant="ghost"
                onPress={() => {
                  setGemKey('');
                  void clearGeminiKey();
                }}
              />
            </View>
          </View>
        </Card>

        <View className="h-7" />
        <Button label="sign out" variant="danger" onPress={signOut} />

        <View className="items-center mt-12 gap-1.5">
          <Wordmark className="text-lg" />
          <Text className="text-faint text-xs font-body">faster splitwise · keep the account, lose the app</Text>
          <Text className="text-faint text-xs font-body">
            made by{' '}
            <Text className="text-volt" onPress={() => void Linking.openURL('https://jass.gg')}>
              jass
            </Text>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

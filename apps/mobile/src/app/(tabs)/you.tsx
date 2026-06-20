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
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 140, paddingHorizontal: 20 }}>
        <View className="items-center mt-2 mb-7">
          {user.data && <Avatar name={displayName(user.data)} uri={avatarUri(user.data)} size={88} />}
          {user.data && <Text className="text-white text-xl font-bold mt-3">{displayName(user.data)}</Text>}
          {user.data?.email ? <Text className="text-muted text-sm mt-0.5">{user.data.email}</Text> : null}
          {user.data?.default_currency ? (
            <Text className="text-muted text-xs mt-1">default currency · {user.data.default_currency}</Text>
          ) : null}
        </View>

        <Text className="text-muted text-xs uppercase tracking-wide mb-2">splitwise</Text>
        <Card className="gap-3">
          <SecretInput value={swKey} onChangeText={setSwKey} placeholder="splitwise api key" />
          <Button label="Update key" onPress={() => void setApiKey(swKey.trim())} />
        </Card>

        <Text className="text-muted text-xs uppercase tracking-wide mb-2 mt-6">receipt scanning · gemini</Text>
        <Card className="gap-3">
          <SecretInput value={gemKey} onChangeText={setGemKey} placeholder="gemini api key (aistudio.google.com)" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Save key" onPress={() => void setGeminiKey(gemKey.trim())} disabled={!gemKey.trim()} />
            </View>
            <View className="flex-1">
              <Button
                label="Clear"
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
        <Button label="Sign out" variant="danger" onPress={signOut} />

        <View className="items-center mt-12 gap-1">
          <Wordmark className="text-base" />
          <Text className="text-muted text-xs">a faster splitwise · built to replace the app, keep the account</Text>
          <Text className="text-muted text-xs">
            made by{' '}
            <Text className="text-brand-soft" onPress={() => void Linking.openURL('https://jass.gg')}>
              jass
            </Text>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

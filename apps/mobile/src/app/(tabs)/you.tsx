import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Wordmark } from '@/components/brand';
import { SecretInput } from '@/components/secret-input';
import { Button, Card, NavRow, Screen, Section } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { onCurrencyPicked } from '@/lib/currency-picker';
import { avatarUri, displayName } from '@/lib/format';
import { useCurrentUser } from '@/lib/queries';
import {
  clearApiKey,
  clearGeminiKey,
  getApiKey,
  getDefaultCurrency,
  getGeminiKey,
  setApiKey,
  setDefaultCurrency,
  setGeminiKey,
} from '@/lib/token-store';

export default function You() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const user = useCurrentUser();
  const [swKey, setSwKey] = useState('');
  const [gemKey, setGemKey] = useState('');
  const [defCur, setDefCur] = useState('');

  useEffect(() => {
    void getApiKey().then((k) => setSwKey(k ?? ''));
    void getGeminiKey().then((k) => setGemKey(k ?? ''));
    void getDefaultCurrency().then((c) => c && setDefCur(c));
  }, []);

  function pickCurrency() {
    const current = defCur || user.data?.default_currency || 'USD';
    onCurrencyPicked((code) => {
      setDefCur(code);
      void setDefaultCurrency(code);
    });
    router.push(`/currency?selected=${current}`);
  }

  async function signOut() {
    await clearApiKey();
    await clearGeminiKey();
    await refresh();
    router.replace('/onboarding');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }}>
        <Text className="text-label" style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>
          You
        </Text>

        <View className="items-center mb-7">
          {user.data && <Avatar name={displayName(user.data)} uri={avatarUri(user.data)} size={80} />}
          {user.data && (
            <Text className="text-label mt-3" style={{ fontSize: 20, fontWeight: '600' }}>
              {displayName(user.data)}
            </Text>
          )}
          {user.data?.email ? <Text className="text-secondaryLabel text-[15px] mt-0.5">{user.data.email}</Text> : null}
        </View>

        <Section header="Preferences">
          <NavRow title="Default currency" value={defCur || user.data?.default_currency || '—'} onPress={pickCurrency} />
        </Section>

        <Text className="text-secondaryLabel text-[13px] px-1 mb-2">Splitwise</Text>
        <Card className="gap-3 mb-6">
          <SecretInput value={swKey} onChangeText={setSwKey} placeholder="splitwise api key" />
          <Button label="Update key" onPress={() => void setApiKey(swKey.trim())} />
        </Card>

        <Text className="text-secondaryLabel text-[13px] px-1 mb-2">Receipt scanning · Gemini</Text>
        <Card className="gap-3 mb-6">
          <SecretInput value={gemKey} onChangeText={setGemKey} placeholder="gemini api key" />
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

        <Button label="Sign out" variant="danger" onPress={signOut} />

        <View className="items-center mt-10 gap-1.5">
          <Wordmark className="text-[17px]" />
          <Text className="text-tertiaryLabel text-[13px]">A better Splitwise · keep the account, lose the app</Text>
          <Text className="text-tertiaryLabel text-[13px]">
            Made by{' '}
            <Text className="text-tint" onPress={() => void Linking.openURL('https://jass.gg')}>
              jass
            </Text>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { setApiKey } from '@/lib/token-store';

export default function Onboarding() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);

  async function connect() {
    const trimmed = key.trim();
    if (!trimmed) return;
    setSaving(true);
    await setApiKey(trimmed);
    await refresh();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.six }]}>
        <ThemedText type="title">super{'\n'}splitwise</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          a faster Splitwise. connect your account — your key stays on this device.
        </ThemedText>
        <Card>
          <ThemedText type="small">Splitwise personal API key</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            dev.splitwise.com → register an app → API key
          </ThemedText>
          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder="api key"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <PrimaryButton label={saving ? 'connecting…' : 'Connect Splitwise'} onPress={connect} disabled={saving} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.two + 2 },
});

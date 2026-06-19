import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, PrimaryButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { displayName } from '@/lib/format';
import { useCurrentUser } from '@/lib/queries';
import { clearApiKey, clearGeminiKey, getGeminiKey, setGeminiKey } from '@/lib/token-store';

export default function You() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const user = useCurrentUser();
  const [geminiKey, setGeminiKeyInput] = useState('');
  const [hasGemini, setHasGemini] = useState(false);

  useEffect(() => {
    void getGeminiKey().then((k) => setHasGemini(!!k));
  }, []);

  async function saveGemini() {
    const trimmed = geminiKey.trim();
    if (!trimmed) return;
    await setGeminiKey(trimmed);
    setHasGemini(true);
    setGeminiKeyInput('');
  }

  async function removeGemini() {
    await clearGeminiKey();
    setHasGemini(false);
  }

  async function signOut() {
    await clearApiKey();
    await clearGeminiKey();
    await refresh();
    router.replace('/onboarding');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}>
        <ThemedText type="subtitle">You</ThemedText>

        {user.data && (
          <Card style={styles.profile}>
            <Avatar name={displayName(user.data)} size={56} />
            <ThemedText type="default">{displayName(user.data)}</ThemedText>
            {user.data.email && (
              <ThemedText type="small" themeColor="textSecondary">
                {user.data.email}
              </ThemedText>
            )}
            {user.data.default_currency && (
              <ThemedText type="small" themeColor="textSecondary">
                default currency · {user.data.default_currency}
              </ThemedText>
            )}
          </Card>
        )}

        <Card>
          <ThemedText type="smallBold">receipt scanning</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {hasGemini
              ? 'Gemini key set — receipt scanning is enabled.'
              : 'add a Gemini key (aistudio.google.com → API key) to scan receipts.'}
          </ThemedText>
          {hasGemini ? (
            <PrimaryButton label="Remove Gemini key" onPress={removeGemini} />
          ) : (
            <>
              <TextInput
                value={geminiKey}
                onChangeText={setGeminiKeyInput}
                placeholder="gemini api key"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
              <PrimaryButton label="Save Gemini key" onPress={saveGemini} />
            </>
          )}
        </Card>

        <Pressable onPress={signOut} style={styles.signOut}>
          <ThemedText type="smallBold" style={styles.signOutLabel}>
            Sign out
          </ThemedText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  profile: { alignItems: 'center', gap: Spacing.one },
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.two + 2 },
  signOut: {
    borderWidth: 1,
    borderColor: '#e5484d',
    borderRadius: 12,
    padding: Spacing.two + 2,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  signOutLabel: { color: '#e5484d' },
});

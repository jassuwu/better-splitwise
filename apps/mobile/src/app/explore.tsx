import { groups as groupsTable } from '@repo/db';
import type { Group } from '@repo/splitwise';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDb } from '@/lib/db';
import { createSplitwiseClient } from '@/lib/splitwise';
import { clearApiKey, getApiKey, setApiKey } from '@/lib/token-store';

interface LocalGroup {
  id: number;
  name: string;
}

export default function SplitwiseScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [apiGroups, setApiGroups] = useState<Group[]>([]);
  const [dbGroups, setDbGroups] = useState<LocalGroup[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const client = createSplitwiseClient();
      const [user, fetched] = await Promise.all([client.getCurrentUser(), client.getGroups()]);
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
      setUserName(name || `user ${user.id}`);
      setApiGroups(fetched);

      // Native only: round-trip the groups through local SQLite to prove the db chain.
      if (Platform.OS !== 'web') {
        const db = getDb();
        await db.delete(groupsTable);
        if (fetched.length > 0) {
          await db.insert(groupsTable).values(fetched.map((g) => ({ id: g.id, name: g.name })));
        }
        setDbGroups(await db.select().from(groupsTable));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      if (await getApiKey()) {
        setHasKey(true);
        await load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    await setApiKey(trimmed);
    setHasKey(true);
    setKeyInput('');
    await load();
  }

  async function handleReset() {
    await clearApiKey();
    setHasKey(false);
    setUserName(null);
    setApiGroups([]);
    setDbGroups([]);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}>
        <ThemedText type="subtitle">Splitwise</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          thin slice — paste your key, fetch your real groups, round-trip them through local SQLite.
        </ThemedText>

        {!hasKey && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small">personal API key (dev.splitwise.com → your app)</ThemedText>
            <TextInput
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="api key"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <Pressable onPress={handleConnect} style={styles.button}>
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                Connect
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {loading && <ActivityIndicator />}
        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        {userName && <ThemedText type="default">signed in as {userName}</ThemedText>}

        {apiGroups.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">from Splitwise · {apiGroups.length} groups</ThemedText>
            {apiGroups.map((g) => (
              <ThemedText key={g.id} type="small">
                {g.name}
              </ThemedText>
            ))}
          </ThemedView>
        )}

        {Platform.OS !== 'web' && dbGroups.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">from local SQLite · {dbGroups.length} groups</ThemedText>
            {dbGroups.map((g) => (
              <ThemedText key={g.id} type="small">
                {g.name}
              </ThemedText>
            ))}
          </ThemedView>
        )}

        {hasKey && (
          <Pressable onPress={handleReset} style={styles.reset}>
            <ThemedText type="link">clear key</ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  input: { borderWidth: 1, borderRadius: 8, padding: Spacing.two },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
  },
  buttonLabel: { color: '#ffffff' },
  error: { color: '#e5484d' },
  reset: { paddingVertical: Spacing.two },
});

import { computeSplit, toCents } from '@repo/split-core';
import {
  formatItemizationComment,
  toCreateExpenseParams,
  type Group,
  type SplitwiseUser,
} from '@repo/splitwise';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createSplitwiseClient } from '@/lib/splitwise';
import { clearApiKey, getApiKey, setApiKey } from '@/lib/token-store';

export default function SplitwiseScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SplitwiseUser | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<SplitwiseUser[]>([]);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [payerId, setPayerId] = useState<number | null>(null);
  const [description, setDescription] = useState('test from super-splitwise');
  const [amount, setAmount] = useState('300.00');
  const [currency, setCurrency] = useState('INR');
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const client = createSplitwiseClient();
      const [user, fetched] = await Promise.all([client.getCurrentUser(), client.getGroups()]);
      setCurrentUser(user);
      setGroups(fetched);
      if (user.default_currency) setCurrency(user.default_currency);
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
    setCurrentUser(null);
    setGroups([]);
    setSelectedGroup(null);
    setMembers([]);
  }

  async function selectGroup(group: Group) {
    setSelectedGroup(group);
    setMembers([]);
    setPushResult(null);
    setPushError(null);
    try {
      const full = await createSplitwiseClient().getGroup(group.id);
      setMembers(full.members);
      setIncluded(new Set(full.members.map((m) => m.id)));
      const payer = full.members.find((m) => m.id === currentUser?.id)?.id ?? full.members[0]?.id ?? null;
      setPayerId(payer);
    } catch (e) {
      setPushError(e instanceof Error ? e.message : String(e));
    }
  }

  function toggleInclude(id: number) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (payerId !== null && !next.has(payerId)) {
        setPayerId(next.values().next().value ?? null);
      }
      return next;
    });
  }

  async function pushExpense() {
    if (!selectedGroup || payerId === null) return;
    setPushing(true);
    setPushResult(null);
    setPushError(null);
    try {
      const people = members.filter((m) => included.has(m.id)).map((m) => String(m.id));
      if (people.length === 0) throw new Error('select at least one person');
      const userIds = Object.fromEntries(members.map((m) => [String(m.id), m.id]));
      const names = Object.fromEntries(members.map((m) => [String(m.id), m.first_name ?? `user ${m.id}`]));

      const split = computeSplit({
        currency,
        people,
        items: [{ id: 'bill', label: description, total: toCents(amount), assignees: people }],
      });

      const client = createSplitwiseClient();
      const expense = await client.createExpense(
        toCreateExpenseParams(split, {
          groupId: selectedGroup.id,
          description,
          payerId: String(payerId),
          userIds,
          currencyCode: currency,
        }),
      );
      await client.createComment(expense.id, formatItemizationComment(split, names));

      const breakdown = split.perPerson
        .map((p) => `${names[p.personId]} owes ${currency} ${(p.owed / 100).toFixed(2)}`)
        .join('\n');
      setPushResult(`pushed expense #${expense.id}\n${breakdown}\n\nopen Splitwise to confirm it landed.`);
    } catch (e) {
      setPushError(e instanceof Error ? e.message : String(e));
    } finally {
      setPushing(false);
    }
  }

  const includedMembers = members.filter((m) => included.has(m.id));

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}>
        <ThemedText type="subtitle">Splitwise</ThemedText>

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

        {currentUser && (
          <ThemedText type="small" themeColor="textSecondary">
            signed in as {currentUser.first_name ?? `user ${currentUser.id}`}
          </ThemedText>
        )}

        {groups.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">tap a group to push a test expense</ThemedText>
            {groups.map((g) => {
              const selected = selectedGroup?.id === g.id;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => selectGroup(g)}
                  style={[
                    styles.groupRow,
                    { borderColor: selected ? '#3c87f7' : theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small">{g.name}</ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        )}

        {selectedGroup && includedMembers.length >= 0 && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">push to {selectedGroup.name}</ThemedText>

            <ThemedText type="small" themeColor="textSecondary">
              split between
            </ThemedText>
            <ThemedView style={styles.chipRow}>
              {members.map((m) => {
                const on = included.has(m.id);
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => toggleInclude(m.id)}
                    style={[styles.chip, { borderColor: on ? '#3c87f7' : theme.backgroundSelected, opacity: on ? 1 : 0.5 }]}>
                    <ThemedText type="small">{m.first_name ?? `user ${m.id}`}</ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            <ThemedText type="small" themeColor="textSecondary">
              paid by
            </ThemedText>
            <ThemedView style={styles.chipRow}>
              {includedMembers.map((m) => {
                const on = payerId === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setPayerId(m.id)}
                    style={[styles.chip, { borderColor: on ? '#3c87f7' : theme.backgroundSelected, opacity: on ? 1 : 0.6 }]}>
                    <ThemedText type="small">{m.first_name ?? `user ${m.id}`}</ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="description"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <ThemedView style={styles.amountRow}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="amount"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, styles.amountInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
              <TextInput
                value={currency}
                onChangeText={setCurrency}
                placeholder="cur"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={3}
                style={[styles.input, styles.currencyInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </ThemedView>

            <Pressable onPress={pushExpense} disabled={pushing} style={[styles.button, pushing && styles.buttonDisabled]}>
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                {pushing ? 'pushing…' : 'Push expense'}
              </ThemedText>
            </Pressable>

            {pushResult && <ThemedText type="small">{pushResult}</ThemedText>}
            {pushError && (
              <ThemedText type="small" style={styles.error}>
                {pushError}
              </ThemedText>
            )}
          </ThemedView>
        )}

        {hasKey && Platform.OS !== 'web' && (
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
  section: { gap: Spacing.two },
  card: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  groupRow: { borderWidth: 1, borderRadius: 8, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  input: { borderWidth: 1, borderRadius: 8, padding: Spacing.two },
  amountRow: { flexDirection: 'row', gap: Spacing.two },
  amountInput: { flex: 1 },
  currencyInput: { width: 72, textAlign: 'center' },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonLabel: { color: '#ffffff' },
  error: { color: '#e5484d' },
  reset: { paddingVertical: Spacing.two },
});

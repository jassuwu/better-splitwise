import { computeSplit, toCents } from '@repo/split-core';
import { toCreateExpenseParams } from '@repo/splitwise';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ErrorText, PrimaryButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { firstName } from '@/lib/format';
import { useCreateExpense, useCurrentUser, useGroups } from '@/lib/queries';

export default function Settle() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const groups = useGroups();
  const create = useCreateExpense();

  const [groupId, setGroupId] = useState<number | null>(params.groupId ? Number(params.groupId) : null);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [error, setError] = useState<string | null>(null);

  const me = user.data?.id ?? null;
  const group = useMemo(() => groups.data?.find((g) => g.id === groupId) ?? null, [groups.data, groupId]);
  const members = group?.members ?? [];

  useEffect(() => {
    if (user.data?.default_currency) setCurrency(user.data.default_currency);
  }, [user.data?.default_currency]);

  useEffect(() => {
    if (group) {
      setFrom(group.members.find((m) => m.id === me)?.id ?? group.members[0]?.id ?? null);
      setTo(group.members.find((m) => m.id !== me)?.id ?? null);
    }
  }, [group, me]);

  function record() {
    setError(null);
    if (!group || from === null || to === null) {
      setError('pick who paid whom');
      return;
    }
    if (from === to) {
      setError('payer and payee must differ');
      return;
    }
    let cents: number;
    try {
      cents = toCents(amount);
    } catch {
      setError('enter a valid amount');
      return;
    }
    const userIds = { [String(from)]: from, [String(to)]: to };
    const split = computeSplit({
      currency,
      people: [String(from), String(to)],
      items: [{ id: 'settle', label: 'settlement', total: cents, assignees: [String(to)] }],
    });
    create.mutate(
      {
        params: toCreateExpenseParams(split, {
          groupId: group.id,
          description: 'settle up',
          payerId: String(from),
          userIds,
          currencyCode: currency,
          payment: true,
        }),
      },
      { onSuccess: () => router.back(), onError: (e) => setError(e instanceof Error ? e.message : String(e)) },
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        <ThemedText type="subtitle">Settle up</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          group
        </ThemedText>
        <View style={styles.chipRow}>
          {(groups.data ?? []).map((g) => (
            <Pressable
              key={g.id}
              onPress={() => setGroupId(g.id)}
              style={[styles.chip, { borderColor: groupId === g.id ? '#3c87f7' : theme.backgroundSelected }]}>
              <ThemedText type="small">{g.name}</ThemedText>
            </Pressable>
          ))}
        </View>
        {group && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              from (paid)
            </ThemedText>
            <View style={styles.chipRow}>
              {members.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setFrom(m.id)}
                  style={[styles.chip, { borderColor: from === m.id ? '#3c87f7' : theme.backgroundSelected, opacity: from === m.id ? 1 : 0.6 }]}>
                  <ThemedText type="small">{firstName(m)}</ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              to
            </ThemedText>
            <View style={styles.chipRow}>
              {members.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setTo(m.id)}
                  style={[styles.chip, { borderColor: to === m.id ? '#3c87f7' : theme.backgroundSelected, opacity: to === m.id ? 1 : 0.6 }]}>
                  <ThemedText type="small">{firstName(m)}</ThemedText>
                </Pressable>
              ))}
            </View>
            <View style={styles.amountRow}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="amount"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, styles.flex, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
              <TextInput
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={3}
                style={[styles.input, styles.cur, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>
          </>
        )}
        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton label={create.isPending ? 'recording…' : 'Record payment'} onPress={record} disabled={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.two },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  amountRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  input: { borderWidth: 1, borderRadius: 10, padding: Spacing.two + 2 },
  flex: { flex: 1 },
  cur: { width: 64, textAlign: 'center' },
});

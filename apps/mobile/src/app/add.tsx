import { computeSplit, toCents } from '@repo/split-core';
import { toCreateExpenseParams } from '@repo/splitwise';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ErrorText, PrimaryButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { firstName } from '@/lib/format';
import { setPendingReceipt } from '@/lib/pending-receipt';
import { useCreateExpense, useCurrentUser, useGroups } from '@/lib/queries';
import { scanReceipt } from '@/lib/scan';

export default function Add() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const groups = useGroups();
  const create = useCreateExpense();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<number | null>(params.groupId ? Number(params.groupId) : null);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [payerId, setPayerId] = useState<number | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = user.data?.id ?? null;
  const group = useMemo(() => groups.data?.find((g) => g.id === groupId) ?? null, [groups.data, groupId]);
  const members = group?.members ?? [];

  useEffect(() => {
    if (user.data?.default_currency) setCurrency(user.data.default_currency);
  }, [user.data?.default_currency]);

  useEffect(() => {
    if (group) {
      setIncluded(new Set(group.members.map((m) => m.id)));
      setPayerId(group.members.find((m) => m.id === me)?.id ?? group.members[0]?.id ?? null);
    }
  }, [group, me]);

  function toggle(id: number) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (payerId !== null && !next.has(payerId)) setPayerId(next.values().next().value ?? null);
      return next;
    });
  }

  async function onScan() {
    setError(null);
    setScanning(true);
    try {
      const receipt = await scanReceipt('library');
      if (receipt) {
        setAmount(receipt.total.toFixed(2));
        if (receipt.merchant) setDescription(receipt.merchant);
        if (receipt.currency) setCurrency(receipt.currency);
        setPendingReceipt(receipt);
        setScanned(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setScanning(false);
    }
  }

  function push() {
    setError(null);
    if (!group || payerId === null) {
      setError('pick a group');
      return;
    }
    const people = members.filter((m) => included.has(m.id)).map((m) => String(m.id));
    if (people.length === 0) {
      setError('select at least one person');
      return;
    }
    let cents: number;
    try {
      cents = toCents(amount);
    } catch {
      setError('enter a valid amount');
      return;
    }
    const userIds = Object.fromEntries(members.map((m) => [String(m.id), m.id] as const));
    const split = computeSplit({
      currency,
      people,
      items: [{ id: 'bill', label: description || 'expense', total: cents, assignees: people }],
    });
    create.mutate(
      {
        params: toCreateExpenseParams(split, {
          groupId: group.id,
          description: description || 'expense',
          payerId: String(payerId),
          userIds,
          currencyCode: currency,
        }),
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => setError(e instanceof Error ? e.message : String(e)),
      },
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          style={[styles.amount, { color: theme.text }]}
        />
        <View style={styles.currencyRow}>
          <TextInput
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={3}
            style={[styles.currency, { color: theme.textSecondary, borderColor: theme.backgroundSelected }]}
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="what for?"
            placeholderTextColor={theme.textSecondary}
            style={[styles.desc, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
        </View>

        <Pressable onPress={onScan} disabled={scanning} style={[styles.scan, { borderColor: theme.backgroundSelected }]}>
          {scanning ? <ActivityIndicator /> : <ThemedText type="small">＋ scan a receipt</ThemedText>}
        </Pressable>

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
              split between
            </ThemedText>
            <View style={styles.chipRow}>
              {members.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => toggle(m.id)}
                  style={[
                    styles.chip,
                    { borderColor: included.has(m.id) ? '#3c87f7' : theme.backgroundSelected, opacity: included.has(m.id) ? 1 : 0.5 },
                  ]}>
                  <ThemedText type="small">{firstName(m)}</ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              paid by
            </ThemedText>
            <View style={styles.chipRow}>
              {members
                .filter((m) => included.has(m.id))
                .map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setPayerId(m.id)}
                    style={[
                      styles.chip,
                      { borderColor: payerId === m.id ? '#3c87f7' : theme.backgroundSelected, opacity: payerId === m.id ? 1 : 0.6 },
                    ]}>
                    <ThemedText type="small">{firstName(m)}</ThemedText>
                  </Pressable>
                ))}
            </View>

            {scanned && (
              <Pressable onPress={() => router.push(`/assign?groupId=${group.id}`)}>
                <ThemedText type="link">split by item instead →</ThemedText>
              </Pressable>
            )}
          </>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton label={create.isPending ? 'adding…' : 'Add expense'} onPress={push} disabled={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  amount: { fontSize: 48, fontWeight: '700', textAlign: 'center', paddingVertical: Spacing.two },
  currencyRow: { flexDirection: 'row', gap: Spacing.two },
  currency: { width: 64, textAlign: 'center', borderWidth: 1, borderRadius: 10, padding: Spacing.two },
  desc: { flex: 1, borderWidth: 1, borderRadius: 10, padding: Spacing.two },
  scan: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
});

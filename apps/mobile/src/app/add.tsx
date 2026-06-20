import { computeSplit, toCents } from '@repo/split-core';
import { toCreateExpenseParams } from '@repo/splitwise';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, ErrorText, Screen } from '@/components/ui';
import { firstName } from '@/lib/format';
import { setPendingReceipt } from '@/lib/pending-receipt';
import { useCreateExpense, useCurrentUser, useGroups } from '@/lib/queries';
import { scanReceipt } from '@/lib/scan';

const LABEL = 'text-muted text-[11px] uppercase font-body-medium';

export default function Add() {
  const params = useLocalSearchParams<{ groupId?: string }>();
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
      { onSuccess: () => router.back(), onError: (e) => setError(e instanceof Error ? e.message : String(e)) },
    );
  }

  return (
    <Screen glow="volt">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 18 }}>
        <View className="items-center mt-3 flex-row justify-center">
          <TextInput
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={3}
            placeholderTextColor="#5B616C"
            className="text-faint font-mono text-xl mr-2"
            style={{ minWidth: 36, textAlign: 'right' }}
          />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#2A2F38"
            keyboardType="decimal-pad"
            className="text-text font-mono text-6xl"
            style={{ fontVariant: ['tabular-nums'], letterSpacing: -1.5 }}
          />
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="what for?"
          placeholderTextColor="#5B616C"
          className="bg-surface2 rounded-2xl px-4 py-3.5 text-text text-center font-body border border-hairline"
        />

        <Pressable
          onPress={onScan}
          disabled={scanning}
          className="flex-row items-center justify-center gap-2 border border-volt/40 rounded-2xl py-3.5 active:opacity-70">
          {scanning ? <ActivityIndicator color="#B8FF3C" /> : <Text className="text-volt font-body-medium">＋ scan a receipt</Text>}
        </Pressable>

        <View className="gap-2">
          <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
            group
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(groups.data ?? []).map((g) => (
              <Chip key={g.id} label={g.name} active={groupId === g.id} onPress={() => setGroupId(g.id)} />
            ))}
          </View>
        </View>

        {group && (
          <>
            <View className="gap-2">
              <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
                split between
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {members.map((m) => (
                  <Chip key={m.id} label={firstName(m)} active={included.has(m.id)} onPress={() => toggle(m.id)} />
                ))}
              </View>
            </View>
            <View className="gap-2">
              <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
                paid by
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {members
                  .filter((m) => included.has(m.id))
                  .map((m) => (
                    <Chip key={m.id} label={firstName(m)} active={payerId === m.id} onPress={() => setPayerId(m.id)} />
                  ))}
              </View>
            </View>
            {scanned && (
              <Pressable onPress={() => router.push(`/assign?groupId=${group.id}`)} className="active:opacity-70">
                <Text className="text-volt text-center font-body-medium">split by item instead →</Text>
              </Pressable>
            )}
          </>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <Button label={create.isPending ? 'adding…' : 'add expense'} onPress={push} disabled={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

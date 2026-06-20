import { computeSplit, toCents } from '@repo/split-core';
import { toCreateExpenseParams } from '@repo/splitwise';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, ErrorText, Screen } from '@/components/ui';
import { firstName } from '@/lib/format';
import { setPendingReceipt } from '@/lib/pending-receipt';
import { useCreateExpense, useCurrentUser, useGroups } from '@/lib/queries';
import { scanReceipt } from '@/lib/scan';

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
  const [done, setDone] = useState<number | null>(null);

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
    setDone(null);
    if (!group || payerId === null) {
      setError('Pick a group');
      return;
    }
    const people = members.filter((m) => included.has(m.id)).map((m) => String(m.id));
    if (people.length === 0) {
      setError('Select at least one person');
      return;
    }
    let cents: number;
    try {
      cents = toCents(amount);
    } catch {
      setError('Enter a valid amount');
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
        onSuccess: (expense) => {
          setAmount('');
          setDescription('');
          setScanned(false);
          setDone(expense.id);
        },
        onError: (e) => setError(e instanceof Error ? e.message : String(e)),
      },
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110, paddingHorizontal: 16, gap: 18 }}>
        <Text className="text-label" style={{ fontSize: 28, fontWeight: '700' }}>
          Add expense
        </Text>

        <View className="items-center flex-row justify-center mt-1">
          <TextInput
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={3}
            placeholderTextColor="rgba(235,235,245,0.3)"
            className="text-secondaryLabel mr-2"
            style={{ fontSize: 22, fontWeight: '600', minWidth: 36, textAlign: 'right' }}
          />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="rgba(235,235,245,0.3)"
            keyboardType="decimal-pad"
            className="text-label"
            style={{ fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'] }}
          />
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What for?"
          placeholderTextColor="rgba(235,235,245,0.3)"
          className="bg-cell2 rounded-2xl px-4 py-3.5 text-label text-center text-[17px]"
        />

        <Button
          label={scanning ? 'Scanning…' : 'Scan a receipt'}
          variant="ghost"
          systemImage="doc.viewfinder"
          onPress={onScan}
          disabled={scanning}
        />

        <View className="gap-2">
          <Text className="text-secondaryLabel text-[13px] px-1">Group</Text>
          <View className="flex-row flex-wrap gap-2">
            {(groups.data ?? []).map((g) => (
              <Chip key={g.id} label={g.name} active={groupId === g.id} onPress={() => setGroupId(g.id)} />
            ))}
          </View>
        </View>

        {group && (
          <>
            <View className="gap-2">
              <Text className="text-secondaryLabel text-[13px] px-1">Split between</Text>
              <View className="flex-row flex-wrap gap-2">
                {members.map((m) => (
                  <Chip key={m.id} label={firstName(m)} active={included.has(m.id)} onPress={() => toggle(m.id)} />
                ))}
              </View>
            </View>
            <View className="gap-2">
              <Text className="text-secondaryLabel text-[13px] px-1">Paid by</Text>
              <View className="flex-row flex-wrap gap-2">
                {members
                  .filter((m) => included.has(m.id))
                  .map((m) => (
                    <Chip key={m.id} label={firstName(m)} active={payerId === m.id} onPress={() => setPayerId(m.id)} />
                  ))}
              </View>
            </View>
          </>
        )}

        {scanned && group ? (
          <Pressable onPress={() => router.push(`/assign?groupId=${group.id}`)} className="active:opacity-60">
            <Text className="text-tint text-center text-[15px]">Split by item instead</Text>
          </Pressable>
        ) : null}
        {error && <ErrorText>{error}</ErrorText>}
        {done ? <Text className="text-green text-[15px] text-center">Added · expense #{done}</Text> : null}
        <Button label={create.isPending ? 'Adding…' : 'Add expense'} onPress={push} disabled={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

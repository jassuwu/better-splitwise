import { computeSplit, toCents } from '@repo/split-core';
import { toCreateExpenseParams } from '@repo/splitwise';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, ErrorText, Screen } from '@/components/ui';
import { firstName } from '@/lib/format';
import { useCreateExpense, useCurrentUser, useGroups } from '@/lib/queries';

export default function Settle() {
  const params = useLocalSearchParams<{ groupId?: string; friendId?: string }>();
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
  const friendId = params.friendId ? Number(params.friendId) : null;
  const group = useMemo(() => groups.data?.find((g) => g.id === groupId) ?? null, [groups.data, groupId]);
  const members = group?.members ?? [];

  useEffect(() => {
    if (user.data?.default_currency) setCurrency(user.data.default_currency);
  }, [user.data?.default_currency]);

  useEffect(() => {
    if (group) {
      setFrom(group.members.find((m) => m.id === me)?.id ?? group.members[0]?.id ?? null);
      setTo(group.members.find((m) => m.id === friendId)?.id ?? group.members.find((m) => m.id !== me)?.id ?? null);
    }
  }, [group, me, friendId]);

  function record() {
    setError(null);
    if (!group || from === null || to === null) {
      setError('Pick who paid whom');
      return;
    }
    if (from === to) {
      setError('Payer and payee must differ');
      return;
    }
    let cents: number;
    try {
      cents = toCents(amount);
    } catch {
      setError('Enter a valid amount');
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
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 18 }}>
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
              <Text className="text-secondaryLabel text-[13px] px-1">From (paid)</Text>
              <View className="flex-row flex-wrap gap-2">
                {members.map((m) => (
                  <Chip key={m.id} label={firstName(m)} active={from === m.id} onPress={() => setFrom(m.id)} />
                ))}
              </View>
            </View>
            <View className="gap-2">
              <Text className="text-secondaryLabel text-[13px] px-1">To</Text>
              <View className="flex-row flex-wrap gap-2">
                {members.map((m) => (
                  <Chip key={m.id} label={firstName(m)} active={to === m.id} onPress={() => setTo(m.id)} />
                ))}
              </View>
            </View>
            <View className="flex-row gap-2">
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount"
                placeholderTextColor="rgba(235,235,245,0.3)"
                keyboardType="decimal-pad"
                className="flex-1 bg-cell2 rounded-2xl px-4 py-3.5 text-label text-[17px]"
                style={{ fontVariant: ['tabular-nums'] }}
              />
              <TextInput
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={3}
                className="w-20 bg-cell2 rounded-2xl px-4 py-3.5 text-label text-center text-[17px]"
              />
            </View>
          </>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <Button label={create.isPending ? 'Recording…' : 'Record payment'} onPress={record} disabled={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

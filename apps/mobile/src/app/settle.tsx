import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Avatar } from '@/components/avatar';
import { Button, Chevron, Empty, Loading, Money, Row, Screen, Section } from '@/components/ui';
import { avatarUri, displayName, firstName, netBalance } from '@/lib/format';
import { useCurrentUser, useFriend, useGroups, useSettleUp } from '@/lib/queries';

export default function Settle() {
  const params = useLocalSearchParams<{ groupId?: string; friendId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const friendId = Number(params.friendId);
  const groupId = params.groupId !== undefined ? Number(params.groupId) : null;

  const user = useCurrentUser();
  const friend = useFriend(friendId);
  const groups = useGroups();
  const settle = useSettleUp();
  const me = user.data?.id ?? null;

  const groupName = (gid: number) =>
    gid === 0 ? 'Non-group' : (groups.data?.find((g) => g.id === gid)?.name ?? `Group ${gid}`);

  // the per-group balance for the chosen group — settle ONE currency at a time
  // (a pair can owe in multiple currencies; never sum across them). + = friend owes me.
  const balEntries = groupId !== null ? (friend.data?.groups?.find((g) => g.group_id === groupId)?.balance ?? []) : [];
  const primary = [...balEntries]
    .filter((b) => Math.abs(Number(b.amount)) > 0.005)
    .sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)))[0];
  const amountSigned = primary ? Number(primary.amount) : 0;
  const settleCurrency = primary?.currency_code ?? user.data?.default_currency ?? 'USD';
  const friendOwesMe = amountSigned > 0;
  const amountFull = Math.abs(amountSigned);

  const [amount, setAmount] = useState('');
  useEffect(() => {
    if (groupId !== null && amountFull > 0) setAmount(amountFull.toFixed(2));
  }, [groupId, amountFull]);

  const header = (
    <Stack.Screen
      options={{
        headerLeft: () => (
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color="#d4fd80" />
          </Pressable>
        ),
      }}
    />
  );

  if (user.isLoading || friend.isLoading) {
    return (
      <Screen>
        {header}
        <Loading />
      </Screen>
    );
  }

  // MODE 2 — no group chosen: pick which balance to settle (per-group, with amounts)
  if (groupId === null) {
    const balances = (friend.data?.groups ?? [])
      .map((g) => ({ gid: g.group_id, net: netBalance(g.balance) }))
      .filter((x) => Math.abs(x.net.amount) > 0.005);
    return (
      <Screen>
        {header}
        <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
          <Text className="text-secondaryLabel text-[15px] px-1 mb-3">
            {friend.data ? `Settle with ${firstName(friend.data)}` : 'Settle up'}
          </Text>
          {balances.length === 0 ? (
            <Empty>All settled up.</Empty>
          ) : (
            <Section header="Pick a balance">
              {balances.map(({ gid, net: gn }) => (
                <Row key={gid} onPress={() => router.replace(`/settle?groupId=${gid}&friendId=${friendId}`)}>
                  <Text className="flex-1 text-label text-[17px]" numberOfLines={1}>
                    {groupName(gid)}
                  </Text>
                  <Money amount={gn.amount} currency={gn.currency} />
                  <Chevron />
                </Row>
              ))}
            </Section>
          )}
        </ScrollView>
      </Screen>
    );
  }

  // MODE 1 — settle a specific debt, pre-filled and scoped to this group (0 = non-group)
  const settled = amountFull < 0.005;
  function record() {
    if (me === null || !friend.data || groupId === null) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast('Enter a valid amount');
      return;
    }
    settle.mutate(
      {
        groupId,
        debtorId: friendOwesMe ? friendId : me,
        creditorId: friendOwesMe ? me : friendId,
        amount: value.toFixed(2),
        currencyCode: settleCurrency,
        description: 'Settle up',
      },
      {
        onSuccess: () => {
          toast('Settled up');
          router.back();
        },
        onError: (e) => toast('Could not settle', { description: e instanceof Error ? e.message : String(e) }),
      },
    );
  }

  return (
    <Screen>
      {header}
      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        <View className="items-center gap-3 mb-7">
          {friend.data ? <Avatar name={displayName(friend.data)} uri={avatarUri(friend.data)} size={64} /> : null}
          <Text className="text-secondaryLabel text-[15px]">in {groupName(groupId)}</Text>
          <Text className="text-label text-[17px]">
            {settled
              ? 'All settled up'
              : friendOwesMe
                ? `${friend.data ? firstName(friend.data) : 'They'} owe you`
                : `You owe ${friend.data ? firstName(friend.data) : 'them'}`}
          </Text>
        </View>

        {settled ? null : (
          <>
            <View className="bg-cell rounded-2xl flex-row items-center px-4 mb-6" style={{ minHeight: 60 }}>
              <Text className="text-secondaryLabel text-[20px]">{settleCurrency} </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                selectTextOnFocus
                className="flex-1 text-label"
                style={{ fontVariant: ['tabular-nums'], fontWeight: '600', fontSize: 28 }}
              />
            </View>
            <Button
              label={settle.isPending ? 'Settling…' : 'Settle up'}
              onPress={record}
              disabled={settle.isPending}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Chevron, Empty, ErrorText, Hero, Loading, Money, Row, Screen, Section } from '@/components/ui';
import { avatarUri, displayName, money, netBalance } from '@/lib/format';
import { useCurrentUser, useExpenses, useFriend, useGroups } from '@/lib/queries';

export default function FriendDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const friendQ = useFriend(id);
  const groups = useGroups();
  const expenses = useExpenses({ friend_id: id, limit: 100 });
  const me = user.data?.id;

  const friend = friendQ.data ?? null;
  const net = netBalance(friend?.balance);
  const sign = Math.abs(net.amount) < 0.005 ? 'settled' : net.amount > 0 ? 'owed' : 'owe';
  const eyebrow = sign === 'settled' ? 'Settled up' : sign === 'owed' ? 'Owes you' : 'You owe';
  const groupName = (gid: number) =>
    gid === 0 ? 'Non-group' : (groups.data?.find((g) => g.id === gid)?.name ?? `Group ${gid}`);
  const balances = (friend?.groups ?? [])
    .map((g) => ({ gid: g.group_id, net: netBalance(g.balance) }))
    .filter((x) => Math.abs(x.net.amount) > 0.005);
  const shared = (expenses.data ?? []).filter((e) => !e.deleted_at);

  function onSettle() {
    if (balances.length === 1) router.push(`/settle?groupId=${balances[0]?.gid}&friendId=${id}`);
    else router.push(`/settle?friendId=${id}`);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: friend ? displayName(friend) : '' }} />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        <View className="items-center mt-1">
          {friend ? <Avatar name={displayName(friend)} uri={avatarUri(friend)} size={72} /> : null}
        </View>
        <Hero eyebrow={eyebrow} amount={net.amount} currency={net.currency} sign={sign} />
        {balances.length > 0 ? (
          <View className="mb-6">
            <Button label="Settle up" onPress={onSettle} />
          </View>
        ) : null}

        {balances.length > 0 ? (
          <Section header="Balances">
            {balances.map(({ gid, net: gn }) => (
              <Row key={gid} onPress={() => router.push(`/settle?groupId=${gid}&friendId=${id}`)}>
                <Text className="flex-1 text-label text-[17px]" numberOfLines={1}>
                  {groupName(gid)}
                </Text>
                <Money amount={gn.amount} currency={gn.currency} />
                <Chevron />
              </Row>
            ))}
          </Section>
        ) : null}

        {friendQ.isLoading || expenses.isLoading ? <Loading /> : null}
        {expenses.error ? <ErrorText>{String(expenses.error)}</ErrorText> : null}
        {shared.length === 0 && !expenses.isLoading ? <Empty>No shared expenses.</Empty> : null}
        {shared.length > 0 ? (
          <Section header="Expenses">
            {shared.map((e) => {
              const mine = e.users.find((u) => (u.user_id ?? u.user?.id) === me);
              const myNet = mine ? Number(mine.paid_share) - Number(mine.owed_share) : 0;
              return (
                <Row key={e.id} onPress={() => router.push(`/expense/${e.id}`)}>
                  <View className="flex-1">
                    <Text className="text-label text-[17px]" numberOfLines={1}>
                      {e.payment ? 'Settlement' : e.description}
                    </Text>
                    <Text className="text-secondaryLabel text-[13px]" style={{ fontVariant: ['tabular-nums'] }}>
                      {money(Number(e.cost), e.currency_code)}
                    </Text>
                  </View>
                  {!e.payment ? <Money amount={myNet} currency={e.currency_code} /> : null}
                  <Chevron />
                </Row>
              );
            })}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

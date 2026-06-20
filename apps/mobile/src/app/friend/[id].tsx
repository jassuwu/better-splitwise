import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Chevron, Empty, ErrorText, Hero, Loading, Money, Row, Screen, Section } from '@/components/ui';
import { avatarUri, displayName, money, netBalance } from '@/lib/format';
import { useCurrentUser, useExpenses, useFriends, useGroups } from '@/lib/queries';

export default function FriendDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const friends = useFriends();
  const groups = useGroups();
  const expenses = useExpenses({ friend_id: id, limit: 100 });
  const me = user.data?.id;

  const friend = friends.data?.find((f) => f.id === id) ?? null;
  const net = netBalance(friend?.balance);
  const sign = Math.abs(net.amount) < 0.005 ? 'settled' : net.amount > 0 ? 'owed' : 'owe';
  const eyebrow = sign === 'settled' ? 'Settled up' : sign === 'owed' ? 'Owes you' : 'You owe';
  const groupName = (gid: number) =>
    groups.data?.find((g) => g.id === gid)?.name ?? (gid === 0 ? 'Non-group' : `Group ${gid}`);
  const perGroup = (friend?.groups ?? [])
    .map((g) => ({ gid: g.group_id, net: netBalance(g.balance) }))
    .filter((x) => Math.abs(x.net.amount) > 0.005);
  const shared = (expenses.data ?? []).filter((e) => !e.deleted_at);

  return (
    <Screen>
      <Stack.Screen options={{ title: friend ? displayName(friend) : '' }} />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        <View className="items-center mt-1">{friend && <Avatar name={displayName(friend)} uri={avatarUri(friend)} size={72} />}</View>
        <Hero eyebrow={eyebrow} amount={net.amount} currency={net.currency} sign={sign} />
        <View className="mb-6">
          <Button label="Settle up" onPress={() => router.push(`/settle?friendId=${id}`)} />
        </View>

        {perGroup.length > 0 && (
          <Section header="By group">
            {perGroup.map(({ gid, net: gn }) => (
              <Row key={gid} onPress={gid !== 0 ? () => router.push(`/settle?groupId=${gid}&friendId=${id}`) : undefined}>
                <Text className="flex-1 text-label text-[17px]" numberOfLines={1}>
                  {groupName(gid)}
                </Text>
                <Money amount={gn.amount} currency={gn.currency} />
                {gid !== 0 ? <Chevron /> : null}
              </Row>
            ))}
          </Section>
        )}

        {expenses.isLoading && <Loading />}
        {expenses.error && <ErrorText>{String(expenses.error)}</ErrorText>}
        {shared.length === 0 && !expenses.isLoading ? <Empty>No shared expenses.</Empty> : null}
        {shared.length > 0 && (
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
                  {!e.payment && <Money amount={myNet} currency={e.currency_code} />}
                  <Chevron />
                </Row>
              );
            })}
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}

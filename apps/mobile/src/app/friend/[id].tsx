import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Card, Empty, ErrorText, Hero, Loading, Money, Screen } from '@/components/ui';
import { avatarUri, displayName, money, netBalance } from '@/lib/format';
import { useCurrentUser, useExpenses, useFriends, useGroups } from '@/lib/queries';

const LABEL = 'text-muted text-[11px] uppercase font-body-medium';

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
  const eyebrow = sign === 'settled' ? 'settled up' : sign === 'owed' ? 'owes you' : 'you owe';
  const groupName = (gid: number) =>
    groups.data?.find((g) => g.id === gid)?.name ?? (gid === 0 ? 'non-group' : `group ${gid}`);
  const perGroup = (friend?.groups ?? [])
    .map((g) => ({ gid: g.group_id, net: netBalance(g.balance) }))
    .filter((x) => Math.abs(x.net.amount) > 0.005);

  return (
    <Screen glow={sign === 'owe' ? 'ember' : 'volt'}>
      <Stack.Screen options={{ title: friend ? displayName(friend) : '' }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <View className="items-center mt-1">{friend && <Avatar name={displayName(friend)} uri={avatarUri(friend)} size={64} />}</View>
        <Hero eyebrow={eyebrow} amount={net.amount} currency={net.currency} sign={sign} />

        <Button label="settle up" onPress={() => router.push(`/settle?friendId=${id}`)} />

        {perGroup.length > 0 && (
          <Card className="gap-3">
            <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
              by group
            </Text>
            {perGroup.map(({ gid, net: gn }) => (
              <View key={gid} className="flex-row items-center gap-2">
                <Text className="flex-1 text-text font-body" numberOfLines={1}>
                  {groupName(gid)}
                </Text>
                <Money amount={gn.amount} currency={gn.currency} />
                {gid !== 0 && (
                  <Pressable onPress={() => router.push(`/settle?groupId=${gid}&friendId=${id}`)} className="active:opacity-70 pl-1">
                    <Text className="text-volt text-xs font-body-medium">settle</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </Card>
        )}

        <Text className={`${LABEL} mt-2`} style={{ letterSpacing: 1.4 }}>
          expenses
        </Text>
        {expenses.isLoading && <Loading />}
        {expenses.error && <ErrorText>{String(expenses.error)}</ErrorText>}
        {expenses.data && expenses.data.filter((e) => !e.deleted_at).length === 0 && <Empty>no shared expenses</Empty>}
        {(expenses.data ?? [])
          .filter((e) => !e.deleted_at)
          .map((e) => {
            const mine = e.users.find((u) => (u.user_id ?? u.user?.id) === me);
            const myNet = mine ? Number(mine.paid_share) - Number(mine.owed_share) : 0;
            return (
              <Pressable key={e.id} onPress={() => router.push(`/expense/${e.id}`)}>
                <Card className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <Text className="text-text font-body">{e.payment ? 'settlement' : e.description}</Text>
                    <Text className="text-faint text-xs font-mono">{money(Number(e.cost), e.currency_code)}</Text>
                  </View>
                  {!e.payment && <Money amount={myNet} currency={e.currency_code} />}
                </Card>
              </Pressable>
            );
          })}
      </ScrollView>
    </Screen>
  );
}

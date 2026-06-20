import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Card, Empty, ErrorText, Loading, Money, Screen } from '@/components/ui';
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
  const color = net.amount > 0 ? 'text-owed' : net.amount < 0 ? 'text-owe' : 'text-muted';
  const label = Math.abs(net.amount) < 0.005 ? 'settled up' : net.amount > 0 ? 'owes you' : 'you owe';
  const groupName = (gid: number) =>
    groups.data?.find((g) => g.id === gid)?.name ?? (gid === 0 ? 'non-group' : `group ${gid}`);
  const perGroup = (friend?.groups ?? [])
    .map((g) => ({ gid: g.group_id, net: netBalance(g.balance) }))
    .filter((x) => Math.abs(x.net.amount) > 0.005);

  return (
    <Screen>
      <Stack.Screen
        options={{ title: friend ? displayName(friend) : 'Friend', headerStyle: { backgroundColor: '#0b0d11' }, headerTintColor: '#ffffff' }}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <View className="items-center mt-2 mb-1">
          {friend && <Avatar name={displayName(friend)} uri={avatarUri(friend)} size={72} />}
          <Text className={`text-4xl font-extrabold mt-3 ${color}`}>
            {net.currency ? `${net.currency} ` : ''}
            {Math.abs(net.amount).toFixed(2)}
          </Text>
          <Text className="text-muted text-sm mt-1">{label}</Text>
        </View>

        <Button label="Settle up" onPress={() => router.push(`/settle?friendId=${id}`)} />

        {perGroup.length > 0 && (
          <Card className="gap-3">
            <Text className="text-muted text-xs uppercase tracking-wide">by group</Text>
            {perGroup.map(({ gid, net: gn }) => (
              <View key={gid} className="flex-row items-center gap-2">
                <Text className="flex-1 text-white" numberOfLines={1}>
                  {groupName(gid)}
                </Text>
                <Money amount={gn.amount} currency={gn.currency} />
                {gid !== 0 && (
                  <Pressable onPress={() => router.push(`/settle?groupId=${gid}&friendId=${id}`)} className="active:opacity-70 pl-1">
                    <Text className="text-brand-soft text-xs font-medium">settle</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </Card>
        )}

        <Text className="text-muted text-xs uppercase tracking-wide mt-2">expenses</Text>
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
                    <Text className="text-white">{e.payment ? 'settlement' : e.description}</Text>
                    <Text className="text-muted text-xs">{money(Number(e.cost), e.currency_code)}</Text>
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

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Card, Empty, ErrorText, Loading, Money, Screen } from '@/components/ui';
import { avatarUri, displayName, firstName, money, netBalance } from '@/lib/format';
import { useCurrentUser, useExpenses, useGroup } from '@/lib/queries';

export default function GroupDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const group = useGroup(id);
  const expenses = useExpenses({ group_id: id, limit: 100 });
  const me = user.data?.id;

  const myNet = netBalance(group.data?.members.find((m) => m.id === me)?.balance);
  const myColor = myNet.amount > 0 ? 'text-owed' : myNet.amount < 0 ? 'text-owe' : 'text-muted';
  const myLabel = Math.abs(myNet.amount) < 0.005 ? 'settled up' : myNet.amount > 0 ? 'you are owed' : 'you owe';
  const debts = group.data?.simplified_debts ?? [];
  const memberName = (uid: number) => {
    const m = group.data?.members.find((x) => x.id === uid);
    return m ? firstName(m) : `user ${uid}`;
  };

  return (
    <Screen>
      <Stack.Screen
        options={{ title: group.data?.name ?? 'Group', headerStyle: { backgroundColor: '#0b0d11' }, headerTintColor: '#ffffff' }}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        {group.isLoading && <Loading />}
        {group.error && <ErrorText>{String(group.error)}</ErrorText>}
        {group.data && (
          <>
            <View className="items-center mt-1">
              <Text className={`text-4xl font-extrabold ${myColor}`}>
                {myNet.currency ? `${myNet.currency} ` : ''}
                {Math.abs(myNet.amount).toFixed(2)}
              </Text>
              <Text className="text-muted text-sm mt-1">{myLabel}</Text>
            </View>

            <View className="flex-row flex-wrap gap-2 justify-center my-1">
              {group.data.members.map((m) => (
                <Avatar key={m.id} name={displayName(m)} uri={avatarUri(m)} size={36} />
              ))}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Add expense" onPress={() => router.push(`/add?groupId=${id}`)} />
              </View>
              <View className="flex-1">
                <Button label="Settle up" variant="ghost" onPress={() => router.push(`/settle?groupId=${id}`)} />
              </View>
            </View>

            {debts.length > 0 && (
              <Card className="gap-2">
                <Text className="text-muted text-xs uppercase tracking-wide">who owes whom</Text>
                {debts.map((d, i) => (
                  <Text key={`${d.from}-${d.to}-${i}`} className="text-white text-sm">
                    {memberName(d.from)} → {memberName(d.to)} · {d.currency_code} {Number(d.amount).toFixed(2)}
                  </Text>
                ))}
              </Card>
            )}

            <Text className="text-muted text-xs uppercase tracking-wide mt-2">expenses</Text>
            {expenses.isLoading && <Loading />}
            {expenses.data && expenses.data.filter((e) => !e.deleted_at).length === 0 && <Empty>no expenses yet</Empty>}
            {(expenses.data ?? [])
              .filter((e) => !e.deleted_at)
              .map((e) => {
                const mine = e.users.find((u) => (u.user_id ?? u.user?.id) === me);
                const myE = mine ? Number(mine.paid_share) - Number(mine.owed_share) : 0;
                return (
                  <Pressable key={e.id} onPress={() => router.push(`/expense/${e.id}`)}>
                    <Card className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <Text className="text-white">{e.payment ? 'settlement' : e.description}</Text>
                        <Text className="text-muted text-xs">{money(Number(e.cost), e.currency_code)}</Text>
                      </View>
                      {!e.payment && <Money amount={myE} currency={e.currency_code} />}
                    </Card>
                  </Pressable>
                );
              })}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Chevron, Empty, ErrorText, Hero, Loading, Money, Row, Screen, Section } from '@/components/ui';
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
  const sign = Math.abs(myNet.amount) < 0.005 ? 'settled' : myNet.amount > 0 ? 'owed' : 'owe';
  const eyebrow = sign === 'settled' ? 'Settled up' : sign === 'owed' ? 'You are owed' : 'You owe';
  const debts = group.data?.simplified_debts ?? [];
  const memberName = (uid: number) => {
    const m = group.data?.members.find((x) => x.id === uid);
    return m ? firstName(m) : `user ${uid}`;
  };
  const ex = (expenses.data ?? []).filter((e) => !e.deleted_at);

  return (
    <Screen>
      <Stack.Screen options={{ title: group.data?.name ?? '' }} />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        {group.isLoading && <Loading />}
        {group.error && <ErrorText>{String(group.error)}</ErrorText>}
        {group.data && (
          <>
            <Hero eyebrow={eyebrow} amount={myNet.amount} currency={myNet.currency} sign={sign} />
            <View className="flex-row flex-wrap gap-2 justify-center mb-5">
              {group.data.members.map((m) => (
                <Avatar key={m.id} name={displayName(m)} uri={avatarUri(m)} size={34} />
              ))}
            </View>
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Button label="Add expense" onPress={() => router.navigate('/add')} />
              </View>
              <View className="flex-1">
                <Button label="Settle up" variant="ghost" onPress={() => router.push(`/settle?groupId=${id}`)} />
              </View>
            </View>

            {debts.length > 0 && (
              <Section header="Who owes whom">
                {debts.map((d, i) => (
                  <Row key={`${d.from}-${d.to}-${i}`}>
                    <Text className="flex-1 text-label text-[16px]">
                      {memberName(d.from)} → {memberName(d.to)}
                    </Text>
                    <Text className="text-secondaryLabel text-[16px]" style={{ fontVariant: ['tabular-nums'] }}>
                      {d.currency_code} {Number(d.amount).toFixed(2)}
                    </Text>
                  </Row>
                ))}
              </Section>
            )}

            {ex.length === 0 && !expenses.isLoading ? <Empty>No expenses yet.</Empty> : null}
            {ex.length > 0 && (
              <Section header="Expenses">
                {ex.map((e) => {
                  const mine = e.users.find((u) => (u.user_id ?? u.user?.id) === me);
                  const myE = mine ? Number(mine.paid_share) - Number(mine.owed_share) : 0;
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
                      {!e.payment && <Money amount={myE} currency={e.currency_code} />}
                      <Chevron />
                    </Row>
                  );
                })}
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

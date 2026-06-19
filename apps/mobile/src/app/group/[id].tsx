import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassFab } from '@/components/glass-fab';
import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, Empty, ErrorText, Loading, Money, PrimaryButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { balanceLabel, displayName, firstName, money, netBalance } from '@/lib/format';
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
  const myLbl = balanceLabel(myNet.amount);
  const debts = group.data?.simplified_debts ?? [];
  const memberName = (uid: number) => {
    const m = group.data?.members.find((x) => x.id === uid);
    return m ? firstName(m) : `user ${uid}`;
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: group.data?.name ?? 'Group' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
        {group.isLoading && <Loading />}
        {group.error && <ErrorText>{String(group.error)}</ErrorText>}

        {group.data && (
          <>
            <ThemedText type="subtitle" style={{ color: myLbl.color }}>
              {myLbl.text}
            </ThemedText>
            <ThemedText type="title" style={{ color: myLbl.color }}>
              {myNet.currency ? `${myNet.currency} ` : ''}
              {Math.abs(myNet.amount).toFixed(2)}
            </ThemedText>

            <View style={styles.memberRow}>
              {group.data.members.map((m) => (
                <Avatar key={m.id} name={displayName(m)} size={32} />
              ))}
            </View>

            {debts.length > 0 && (
              <Card>
                <ThemedText type="smallBold">who owes whom</ThemedText>
                {debts.map((d, i) => (
                  <ThemedText key={`${d.from}-${d.to}-${i}`} type="small">
                    {memberName(d.from)} → {memberName(d.to)} · {d.currency_code} {Number(d.amount).toFixed(2)}
                  </ThemedText>
                ))}
              </Card>
            )}

            <PrimaryButton label="Settle up" onPress={() => router.push(`/settle?groupId=${id}`)} />

            <ThemedText type="smallBold">expenses</ThemedText>
            {expenses.isLoading && <Loading />}
            {expenses.data && expenses.data.filter((e) => !e.deleted_at).length === 0 && <Empty>no expenses yet</Empty>}
            {(expenses.data ?? [])
              .filter((e) => !e.deleted_at)
              .map((e) => {
                const mine = e.users.find((u) => (u.user_id ?? u.user?.id) === me);
                const net = mine ? Number(mine.paid_share) - Number(mine.owed_share) : 0;
                const l = balanceLabel(net);
                return (
                  <Pressable key={e.id} onPress={() => router.push(`/expense/${e.id}`)}>
                    <Card style={styles.expenseRow}>
                      <View style={styles.flex}>
                        <ThemedText type="small">{e.payment ? 'settlement' : e.description}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {money(Number(e.cost), e.currency_code)}
                        </ThemedText>
                      </View>
                      {!e.payment && <Money amount={net} currency={e.currency_code} color={l.color} />}
                    </Card>
                  </Pressable>
                );
              })}
          </>
        )}
      </ScrollView>
      <GlassFab onPress={() => router.push(`/add?groupId=${id}`)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.two },
  memberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, marginVertical: Spacing.one },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});

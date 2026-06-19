import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card, Empty, ErrorText, Loading, Money, PrimaryButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { balanceLabel, displayName, money, netBalance } from '@/lib/format';
import { useCurrentUser, useExpenses, useFriends } from '@/lib/queries';

export default function FriendDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const friends = useFriends();
  const expenses = useExpenses({ friend_id: id, limit: 100 });
  const me = user.data?.id;
  const friend = friends.data?.find((f) => f.id === id) ?? null;
  const net = netBalance(friend?.balance);
  const lbl = balanceLabel(net.amount);

  return (
    <Screen>
      <Stack.Screen options={{ title: friend ? displayName(friend) : 'Friend' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        <ThemedText type="subtitle" style={{ color: lbl.color }}>
          {lbl.text}
        </ThemedText>
        <ThemedText type="title" style={{ color: lbl.color }}>
          {net.currency ? `${net.currency} ` : ''}
          {Math.abs(net.amount).toFixed(2)}
        </ThemedText>

        <PrimaryButton label="Settle up" onPress={() => router.push('/settle')} />

        <ThemedText type="smallBold">expenses</ThemedText>
        {expenses.isLoading && <Loading />}
        {expenses.error && <ErrorText>{String(expenses.error)}</ErrorText>}
        {expenses.data && expenses.data.filter((e) => !e.deleted_at).length === 0 && <Empty>no shared expenses</Empty>}
        {(expenses.data ?? [])
          .filter((e) => !e.deleted_at)
          .map((e) => {
            const mine = e.users.find((u) => (u.user_id ?? u.user?.id) === me);
            const myNet = mine ? Number(mine.paid_share) - Number(mine.owed_share) : 0;
            const l = balanceLabel(myNet);
            return (
              <Pressable key={e.id} onPress={() => router.push(`/expense/${e.id}`)}>
                <Card style={styles.row}>
                  <View style={styles.flex}>
                    <ThemedText type="small">{e.payment ? 'settlement' : e.description}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {money(Number(e.cost), e.currency_code)}
                    </ThemedText>
                  </View>
                  {!e.payment && <Money amount={myNet} currency={e.currency_code} color={l.color} />}
                </Card>
              </Pressable>
            );
          })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});

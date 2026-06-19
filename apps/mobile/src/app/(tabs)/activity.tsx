import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card, Empty, ErrorText, Loading, Money, Screen } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { balanceLabel, money } from '@/lib/format';
import { useCurrentUser, useExpenses } from '@/lib/queries';

export default function Activity() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const expenses = useExpenses({ limit: 50 });
  const me = user.data?.id;
  const items = (expenses.data ?? [])
    .filter((e) => !e.deleted_at)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + 40 },
        ]}>
        <ThemedText type="subtitle">Activity</ThemedText>
        {expenses.isLoading && <Loading />}
        {expenses.error && <ErrorText>{String(expenses.error)}</ErrorText>}
        {items.length === 0 && !expenses.isLoading && <Empty>no activity yet</Empty>}
        {items.map((e) => {
          const mine = e.users.find((u) => (u.user_id ?? u.user?.id) === me);
          const net = mine ? Number(mine.paid_share) - Number(mine.owed_share) : 0;
          const l = balanceLabel(net);
          return (
            <Pressable key={e.id} onPress={() => router.push(`/expense/${e.id}`)}>
              <Card style={styles.row}>
                <View style={styles.flex}>
                  <ThemedText type="small">{e.payment ? 'settlement' : e.description}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {money(Number(e.cost), e.currency_code)}
                    {e.date ? ` · ${new Date(e.date).toLocaleDateString()}` : ''}
                  </ThemedText>
                </View>
                {!e.payment && <Money amount={net} currency={e.currency_code} color={l.color} />}
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

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card, ErrorText, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { displayName, money } from '@/lib/format';
import { useComments, useDeleteExpense, useExpense } from '@/lib/queries';

export default function ExpenseDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const expense = useExpense(id);
  const comments = useComments(id);
  const del = useDeleteExpense();

  const e = expense.data;
  const payers = (e?.users ?? []).filter((u) => Number(u.paid_share) > 0);
  const memberName = (u: { user?: { id: number; first_name: string | null; last_name: string | null }; user_id?: number }) =>
    u.user ? displayName(u.user) : `user ${u.user_id ?? '?'}`;

  function onDelete() {
    del.mutate(id, { onSuccess: () => router.back() });
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: e?.payment ? 'Settlement' : 'Expense' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        {expense.isLoading && <Loading />}
        {expense.error && <ErrorText>{String(expense.error)}</ErrorText>}
        {e && (
          <>
            <ThemedText type="subtitle">{e.payment ? 'settlement' : e.description}</ThemedText>
            <ThemedText type="title">{money(Number(e.cost), e.currency_code)}</ThemedText>
            {e.date && (
              <ThemedText type="small" themeColor="textSecondary">
                {new Date(e.date).toLocaleDateString()}
              </ThemedText>
            )}

            <Card>
              <ThemedText type="smallBold">paid by</ThemedText>
              {payers.map((u, i) => (
                <View key={i} style={styles.row}>
                  <ThemedText type="small" style={styles.flex}>
                    {memberName(u)}
                  </ThemedText>
                  <ThemedText type="small">{money(Number(u.paid_share), e.currency_code)}</ThemedText>
                </View>
              ))}
            </Card>

            <Card>
              <ThemedText type="smallBold">shares</ThemedText>
              {e.users.map((u, i) => (
                <View key={i} style={styles.row}>
                  <ThemedText type="small" style={styles.flex}>
                    {memberName(u)}
                  </ThemedText>
                  <ThemedText type="small">{money(Number(u.owed_share), e.currency_code)}</ThemedText>
                </View>
              ))}
            </Card>

            {e.details ? (
              <Card>
                <ThemedText type="smallBold">notes</ThemedText>
                <ThemedText type="small">{e.details}</ThemedText>
              </Card>
            ) : null}

            {(comments.data ?? []).length > 0 && (
              <Card>
                <ThemedText type="smallBold">comments</ThemedText>
                {(comments.data ?? []).map((c) => (
                  <ThemedText key={c.id} type="small">
                    {c.user ? `${displayName(c.user)}: ` : ''}
                    {c.content}
                  </ThemedText>
                ))}
              </Card>
            )}

            <Pressable onPress={onDelete} disabled={del.isPending} style={styles.deleteBtn}>
              <ThemedText type="smallBold" style={styles.deleteLabel}>
                {del.isPending ? 'deleting…' : 'Delete'}
              </ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#e5484d',
    borderRadius: 12,
    padding: Spacing.two + 2,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  deleteLabel: { color: '#e5484d' },
});

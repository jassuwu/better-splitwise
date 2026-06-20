import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Card, ErrorText, Loading, Screen } from '@/components/ui';
import { avatarUri, displayName, money } from '@/lib/format';
import { useComments, useDeleteExpense, useExpense } from '@/lib/queries';

type Share = { user?: { id: number; first_name: string | null; last_name: string | null; picture?: { small?: string | null; medium?: string | null; large?: string | null } | null }; user_id?: number };

function nameOf(u: Share): string {
  return u.user ? displayName(u.user) : `user ${u.user_id ?? '?'}`;
}

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

  function onDelete() {
    del.mutate(id, { onSuccess: () => router.back() });
  }

  return (
    <Screen>
      <Stack.Screen
        options={{ title: e?.payment ? 'Settlement' : 'Expense', headerStyle: { backgroundColor: '#0b0d11' }, headerTintColor: '#ffffff' }}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        {expense.isLoading && <Loading />}
        {expense.error && <ErrorText>{String(expense.error)}</ErrorText>}
        {e && (
          <>
            <Text className="text-white text-2xl font-bold">{e.payment ? 'settlement' : e.description}</Text>
            <Text className="text-white text-4xl font-extrabold">{money(Number(e.cost), e.currency_code)}</Text>
            {e.date ? <Text className="text-muted text-sm">{new Date(e.date).toLocaleDateString()}</Text> : null}

            <Card className="gap-2 mt-2">
              <Text className="text-muted text-xs uppercase tracking-wide">paid by</Text>
              {payers.map((u, i) => (
                <View key={i} className="flex-row items-center gap-3">
                  <Avatar name={nameOf(u)} uri={u.user ? avatarUri(u.user) : null} size={32} />
                  <Text className="flex-1 text-white">{nameOf(u)}</Text>
                  <Text className="text-white">{money(Number(u.paid_share), e.currency_code)}</Text>
                </View>
              ))}
            </Card>

            <Card className="gap-2">
              <Text className="text-muted text-xs uppercase tracking-wide">shares</Text>
              {e.users.map((u, i) => (
                <View key={i} className="flex-row items-center gap-3">
                  <Avatar name={nameOf(u)} uri={u.user ? avatarUri(u.user) : null} size={32} />
                  <Text className="flex-1 text-white">{nameOf(u)}</Text>
                  <Text className="text-white">{money(Number(u.owed_share), e.currency_code)}</Text>
                </View>
              ))}
            </Card>

            {e.details ? (
              <Card className="gap-1">
                <Text className="text-muted text-xs uppercase tracking-wide">notes</Text>
                <Text className="text-white">{e.details}</Text>
              </Card>
            ) : null}

            {(comments.data ?? []).length > 0 && (
              <Card className="gap-2">
                <Text className="text-muted text-xs uppercase tracking-wide">comments</Text>
                {(comments.data ?? []).map((c) => (
                  <Text key={c.id} className="text-white text-sm">
                    {c.user ? `${displayName(c.user)}: ` : ''}
                    {c.content}
                  </Text>
                ))}
              </Card>
            )}

            <View className="h-2" />
            <Button label={del.isPending ? 'deleting…' : 'Delete'} variant="danger" onPress={onDelete} disabled={del.isPending} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

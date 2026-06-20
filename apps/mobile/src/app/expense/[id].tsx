import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, Card, ErrorText, Loading, Screen } from '@/components/ui';
import { avatarUri, displayName, money } from '@/lib/format';
import { useComments, useDeleteExpense, useExpense } from '@/lib/queries';

type Share = {
  user?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    picture?: { small?: string | null; medium?: string | null; large?: string | null } | null;
  };
  user_id?: number;
};

function nameOf(u: Share): string {
  return u.user ? displayName(u.user) : `user ${u.user_id ?? '?'}`;
}

const LABEL = 'text-muted text-[11px] uppercase font-body-medium';
const MONO = { fontVariant: ['tabular-nums' as const] };

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
    <Screen glow="none">
      <Stack.Screen options={{ title: e?.payment ? 'settlement' : 'expense' }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        {expense.isLoading && <Loading />}
        {expense.error && <ErrorText>{String(expense.error)}</ErrorText>}
        {e && (
          <>
            <View className="items-center py-3">
              <Text className={`${LABEL} mb-2`} style={{ letterSpacing: 1.4 }} numberOfLines={1}>
                {e.payment ? 'settlement' : e.description}
              </Text>
              <Text className="text-text font-mono text-5xl" style={{ ...MONO, letterSpacing: -1 }}>
                {money(Number(e.cost), e.currency_code)}
              </Text>
              {e.date ? <Text className="text-faint text-xs mt-2 font-body">{new Date(e.date).toLocaleDateString()}</Text> : null}
            </View>

            <Card className="gap-2">
              <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
                paid by
              </Text>
              {payers.map((u, i) => (
                <View key={i} className="flex-row items-center gap-3">
                  <Avatar name={nameOf(u)} uri={u.user ? avatarUri(u.user) : null} size={30} />
                  <Text className="flex-1 text-text font-body">{nameOf(u)}</Text>
                  <Text className="text-text font-mono" style={MONO}>
                    {money(Number(u.paid_share), e.currency_code)}
                  </Text>
                </View>
              ))}
            </Card>

            <Card className="gap-2">
              <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
                shares
              </Text>
              {e.users.map((u, i) => (
                <View key={i} className="flex-row items-center gap-3">
                  <Avatar name={nameOf(u)} uri={u.user ? avatarUri(u.user) : null} size={30} />
                  <Text className="flex-1 text-text font-body">{nameOf(u)}</Text>
                  <Text className="text-text font-mono" style={MONO}>
                    {money(Number(u.owed_share), e.currency_code)}
                  </Text>
                </View>
              ))}
            </Card>

            {e.details ? (
              <Card className="gap-1">
                <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
                  notes
                </Text>
                <Text className="text-text font-body">{e.details}</Text>
              </Card>
            ) : null}

            {(comments.data ?? []).length > 0 && (
              <Card className="gap-2">
                <Text className={LABEL} style={{ letterSpacing: 1.4 }}>
                  comments
                </Text>
                {(comments.data ?? []).map((c) => (
                  <Text key={c.id} className="text-text text-sm font-body">
                    {c.user ? `${displayName(c.user)}: ` : ''}
                    {c.content}
                  </Text>
                ))}
              </Card>
            )}

            <View className="h-2" />
            <Button label={del.isPending ? 'deleting…' : 'delete'} variant="danger" onPress={onDelete} disabled={del.isPending} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

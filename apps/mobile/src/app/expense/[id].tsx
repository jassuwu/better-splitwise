import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, ErrorText, Loading, Row, Screen, Section } from '@/components/ui';
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
    <Screen>
      <Stack.Screen options={{ title: e?.payment ? 'Settlement' : 'Expense' }} />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        {expense.isLoading && <Loading />}
        {expense.error && <ErrorText>{String(expense.error)}</ErrorText>}
        {e && (
          <>
            <View className="items-center py-4">
              <Text className="text-secondaryLabel text-[13px] mb-2" numberOfLines={1}>
                {e.payment ? 'Settlement' : e.description}
              </Text>
              <Text className="text-label" style={{ fontSize: 48, fontWeight: '700', ...MONO }}>
                {money(Number(e.cost), e.currency_code)}
              </Text>
              {e.date ? <Text className="text-tertiaryLabel text-[13px] mt-2">{new Date(e.date).toLocaleDateString()}</Text> : null}
            </View>

            <Section header="Paid by" sepInset={56}>
              {payers.map((u, i) => (
                <Row key={i}>
                  <Avatar name={nameOf(u)} uri={u.user ? avatarUri(u.user) : null} size={28} />
                  <Text className="flex-1 text-label text-[17px]">{nameOf(u)}</Text>
                  <Text className="text-label text-[17px]" style={MONO}>
                    {money(Number(u.paid_share), e.currency_code)}
                  </Text>
                </Row>
              ))}
            </Section>

            <Section header="Shares" sepInset={56}>
              {e.users.map((u, i) => (
                <Row key={i}>
                  <Avatar name={nameOf(u)} uri={u.user ? avatarUri(u.user) : null} size={28} />
                  <Text className="flex-1 text-label text-[17px]">{nameOf(u)}</Text>
                  <Text className="text-label text-[17px]" style={MONO}>
                    {money(Number(u.owed_share), e.currency_code)}
                  </Text>
                </Row>
              ))}
            </Section>

            {e.details ? (
              <Section header="Notes">
                <Row>
                  <Text className="text-label text-[15px]">{e.details}</Text>
                </Row>
              </Section>
            ) : null}

            {(comments.data ?? []).length > 0 && (
              <Section header="Comments">
                {(comments.data ?? []).map((c) => (
                  <Row key={c.id}>
                    <Text className="text-label text-[15px]">
                      {c.user ? `${displayName(c.user)}: ` : ''}
                      {c.content}
                    </Text>
                  </Row>
                ))}
              </Section>
            )}

            <Button label={del.isPending ? 'Deleting…' : 'Delete'} variant="danger" onPress={onDelete} disabled={del.isPending} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

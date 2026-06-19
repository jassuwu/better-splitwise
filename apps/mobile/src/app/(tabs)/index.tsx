import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassFab } from '@/components/glass-fab';
import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, ErrorText, Loading, Money, Screen } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { balanceLabel, displayName, netBalance } from '@/lib/format';
import { useCurrentUser, useFriends, useGroups } from '@/lib/queries';

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function BalanceRow({ name, amount, currency }: { name: string; amount: number; currency: string }) {
  const l = balanceLabel(amount);
  return (
    <View style={styles.row}>
      <Avatar name={name} />
      <ThemedText type="small" style={styles.flex}>
        {name}
      </ThemedText>
      <Money amount={amount} currency={currency} color={l.color} />
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const friends = useFriends();
  const groups = useGroups();
  const me = user.data?.id;

  const overall = (friends.data ?? []).flatMap((f) => f.balance ?? []).reduce((s, b) => s + Number(b.amount), 0);
  const currency = user.data?.default_currency ?? '';
  const lbl = balanceLabel(overall);
  const owingFriends = (friends.data ?? []).filter((f) => (f.balance ?? []).length > 0);
  const err = user.error ?? friends.error ?? groups.error;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + 110 },
        ]}>
        <ThemedText type="small" themeColor="textSecondary">
          overall
        </ThemedText>
        <ThemedText type="title" style={{ color: lbl.color }}>
          {currency ? `${currency} ` : ''}
          {Math.abs(overall).toFixed(2)}
        </ThemedText>
        <ThemedText type="small" style={{ color: lbl.color }}>
          {lbl.text}
        </ThemedText>

        {(user.isLoading || friends.isLoading || groups.isLoading) && <Loading />}
        {err && <ErrorText>{describeError(err)}</ErrorText>}

        {owingFriends.length > 0 && (
          <Card>
            <ThemedText type="smallBold">friends</ThemedText>
            {owingFriends.map((f) => {
              const net = netBalance(f.balance);
              return <BalanceRow key={f.id} name={displayName(f)} amount={net.amount} currency={net.currency} />;
            })}
          </Card>
        )}

        {groups.data && groups.data.length > 0 && (
          <Card>
            <ThemedText type="smallBold">groups</ThemedText>
            {groups.data.map((g) => {
              const net = netBalance(g.members.find((m) => m.id === me)?.balance);
              return (
                <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
                  <BalanceRow name={g.name} amount={net.amount} currency={net.currency} />
                </Pressable>
              );
            })}
          </Card>
        )}
      </ScrollView>
      <GlassFab onPress={() => router.push('/add')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  flex: { flex: 1 },
});

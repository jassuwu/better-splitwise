import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassFab } from '@/components/glass-fab';
import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, Empty, ErrorText, Loading, Money, Screen } from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { balanceLabel, netBalance } from '@/lib/format';
import { useCurrentUser, useGroups } from '@/lib/queries';

export default function Groups() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const groups = useGroups();
  const me = user.data?.id;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + 110 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={groups.isRefetching}
            onRefresh={() => {
              void groups.refetch();
              void user.refetch();
            }}
          />
        }>
        <ThemedText type="subtitle">Groups</ThemedText>
        {groups.isLoading && <Loading />}
        {groups.error && <ErrorText>{String(groups.error)}</ErrorText>}
        {groups.data && groups.data.length === 0 && <Empty>no groups yet</Empty>}
        {groups.data?.map((g) => {
          const net = netBalance(g.members.find((m) => m.id === me)?.balance);
          const l = balanceLabel(net.amount);
          return (
            <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
              <Card style={styles.row}>
                <Avatar name={g.name} />
                <ThemedText type="small" style={styles.flex}>
                  {g.name}
                </ThemedText>
                <Money amount={net.amount} currency={net.currency} color={l.color} />
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
      <GlassFab onPress={() => router.push('/add')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
});

import { Ionicons } from '@expo/vector-icons';
import { netWithMember } from '@repo/splitwise';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Avatar } from '@/components/avatar';
import { ActionRow, Button, Chevron, Empty, ErrorText, Hero, Loading, Money, Row, Screen, Section } from '@/components/ui';
import { avatarUri, displayName, firstName, money, netBalance } from '@/lib/format';
import { useCurrentUser, useDeleteGroup, useExpenses, useGroup, useLeaveGroup } from '@/lib/queries';

export default function GroupDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const group = useGroup(id);
  const expenses = useExpenses({ group_id: id, limit: 100 });
  const leave = useLeaveGroup();
  const del = useDeleteGroup();
  const me = user.data?.id;

  const g = group.data;
  const myNet = netBalance(g?.members.find((m) => m.id === me)?.balance);
  const sign = Math.abs(myNet.amount) < 0.005 ? 'settled' : myNet.amount > 0 ? 'owed' : 'owe';
  const eyebrow = sign === 'settled' ? 'Settled up' : sign === 'owed' ? 'You are owed' : 'You owe';

  const members = g?.members ?? [];
  const myBalances =
    me != null && g
      ? members
          .filter((m) => m.id !== me)
          .flatMap((m) => {
            const net = netWithMember(g, me, m.id);
            return net && Math.abs(net.amount) > 0.005 ? [{ m, net }] : [];
          })
      : [];
  const memberName = (uid: number) => {
    const m = members.find((x) => x.id === uid);
    return m ? firstName(m) : `user ${uid}`;
  };
  const debts = g?.simplified_debts ?? [];
  const ex = (expenses.data ?? []).filter((e) => !e.deleted_at);

  function confirmLeave() {
    Alert.alert('Leave group?', 'You can only leave once your balance in this group is settled.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () =>
          leave.mutate(id, {
            onSuccess: () => {
              toast('Left group');
              router.back();
            },
            onError: (e) => toast('Could not leave', { description: e instanceof Error ? e.message : String(e) }),
          }),
      },
    ]);
  }

  function confirmDelete() {
    Alert.alert('Delete group?', 'This deletes the group for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(id, {
            onSuccess: () => {
              toast('Group deleted');
              router.back();
            },
            onError: (e) => toast('Could not delete', { description: e instanceof Error ? e.message : String(e) }),
          }),
      },
    ]);
  }

  function menu() {
    if (Platform.OS !== 'ios') {
      router.push(`/invite?groupId=${id}`);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Add people', 'Leave group', 'Delete group', 'Cancel'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
        userInterfaceStyle: 'dark',
      },
      (i) => {
        if (i === 0) router.push(`/invite?groupId=${id}`);
        else if (i === 1) confirmLeave();
        else if (i === 2) confirmDelete();
      },
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: g?.name ?? '',
          headerRight: () => (
            <Pressable onPress={menu} hitSlop={10}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#d4fd80" />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        {group.isLoading ? <Loading /> : null}
        {group.error ? <ErrorText>{String(group.error)}</ErrorText> : null}
        {g ? (
          <>
            <Hero eyebrow={eyebrow} amount={myNet.amount} currency={myNet.currency} sign={sign} />
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Button label="Add expense" onPress={() => router.navigate('/add')} />
              </View>
              <View className="flex-1">
                <Button label="Settle up" variant="ghost" onPress={() => router.push(`/settle?groupId=${id}`)} />
              </View>
            </View>

            {myBalances.length > 0 ? (
              <Section header="Your balances">
                {myBalances.map(({ m, net }) => (
                  <Row key={m.id} onPress={() => router.push(`/settle?groupId=${id}&friendId=${m.id}`)}>
                    <Avatar name={displayName(m)} uri={avatarUri(m)} size={32} />
                    <View className="flex-1">
                      <Text className="text-label text-[17px]" numberOfLines={1}>
                        {firstName(m)}
                      </Text>
                      <Text className="text-secondaryLabel text-[13px]">{net.amount > 0 ? 'owes you' : 'you owe'}</Text>
                    </View>
                    <Money amount={net.amount} currency={net.currencyCode} />
                    <Chevron />
                  </Row>
                ))}
              </Section>
            ) : null}

            <Section header="Members">
              {members.map((m) => (
                <Row key={m.id}>
                  <Avatar name={displayName(m)} uri={avatarUri(m)} size={32} />
                  <Text className="flex-1 text-label text-[17px]" numberOfLines={1}>
                    {displayName(m)}
                    {m.id === me ? <Text className="text-tertiaryLabel"> · you</Text> : null}
                  </Text>
                  {m.registration_status === 'invited' || m.registration_status === 'dummy' ? (
                    <Text className="text-tertiaryLabel text-[13px]">invited</Text>
                  ) : null}
                </Row>
              ))}
              <ActionRow label="Add people" onPress={() => router.push(`/invite?groupId=${id}`)} />
            </Section>

            {debts.length > 0 ? (
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
            ) : null}

            {ex.length === 0 && !expenses.isLoading ? <Empty>No expenses yet.</Empty> : null}
            {ex.length > 0 ? (
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
                      {!e.payment ? <Money amount={myE} currency={e.currency_code} /> : null}
                      <Chevron />
                    </Row>
                  );
                })}
              </Section>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

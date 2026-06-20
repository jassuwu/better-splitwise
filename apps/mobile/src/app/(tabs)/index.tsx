import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Segmented } from '@/components/segmented';
import { Card, Empty, ErrorText, Loading, Money, Screen } from '@/components/ui';
import { avatarUri, displayName, netBalance } from '@/lib/format';
import { useCurrentUser, useFriends, useGroups } from '@/lib/queries';

type Lens = 'people' | 'groups';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const friends = useFriends();
  const groups = useGroups();
  const me = user.data?.id;
  const [lens, setLens] = useState<Lens>('people');

  const currency = user.data?.default_currency ?? '';
  const overall = (friends.data ?? []).flatMap((f) => f.balance ?? []).reduce((s, b) => s + Number(b.amount), 0);
  const overallColor = Math.abs(overall) < 0.005 ? 'text-muted' : overall > 0 ? 'text-owed' : 'text-owe';
  const overallLabel = Math.abs(overall) < 0.005 ? "you're all settled up" : overall > 0 ? 'you are owed, overall' : 'you owe, overall';

  const people = [...(friends.data ?? [])]
    .map((f) => ({ f, net: netBalance(f.balance) }))
    .filter((x) => Math.abs(x.net.amount) > 0.005)
    .sort((a, b) => Math.abs(b.net.amount) - Math.abs(a.net.amount));

  const groupRows = [...(groups.data ?? [])]
    .map((g) => ({ g, net: netBalance(g.members.find((m) => m.id === me)?.balance) }))
    .sort((a, b) => Math.abs(b.net.amount) - Math.abs(a.net.amount));

  const err = user.error ?? friends.error ?? groups.error;
  const loading = user.isLoading || friends.isLoading || groups.isLoading;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 140, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl
            tintColor="#7c5cff"
            refreshing={user.isRefetching || friends.isRefetching || groups.isRefetching}
            onRefresh={() => {
              void user.refetch();
              void friends.refetch();
              void groups.refetch();
            }}
          />
        }>
        <Text className="text-muted text-sm">{overallLabel}</Text>
        <Text className={`text-4xl font-extrabold mt-1 ${overallColor}`}>
          {currency ? `${currency} ` : ''}
          {Math.abs(overall).toFixed(2)}
        </Text>

        <View className="mt-5 mb-4">
          <Segmented<Lens>
            options={[
              { value: 'people', label: 'People' },
              { value: 'groups', label: 'Groups' },
            ]}
            value={lens}
            onChange={setLens}
          />
        </View>

        {loading && <Loading />}
        {err && <ErrorText>{err instanceof Error ? err.message : String(err)}</ErrorText>}

        {lens === 'people' ? (
          people.length === 0 && !loading ? (
            <Empty>no balances — you&apos;re all settled up</Empty>
          ) : (
            <View className="gap-2">
              {people.map(({ f, net }) => (
                <Pressable key={f.id} onPress={() => router.push(`/friend/${f.id}`)}>
                  <Card className="flex-row items-center gap-3">
                    <Avatar name={displayName(f)} uri={avatarUri(f)} />
                    <Text className="flex-1 text-white text-base" numberOfLines={1}>
                      {displayName(f)}
                    </Text>
                    <View className="items-end">
                      <Money amount={net.amount} currency={net.currency} />
                      <Text className="text-muted text-[11px]">{net.amount > 0 ? 'owes you' : 'you owe'}</Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )
        ) : groupRows.length === 0 && !loading ? (
          <Empty>no groups yet</Empty>
        ) : (
          <View className="gap-2">
            {groupRows.map(({ g, net }) => (
              <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
                <Card className="flex-row items-center gap-3">
                  <Avatar name={g.name} />
                  <Text className="flex-1 text-white text-base" numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Money amount={net.amount} currency={net.currency} />
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { GlassMenu } from '@/components/menu';
import { Segmented } from '@/components/segmented';
import { Button, Chevron, Empty, ErrorText, Hero, Loading, Money, Row, Screen, Section } from '@/components/ui';
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
  const sign = Math.abs(overall) < 0.005 ? 'settled' : overall > 0 ? 'owed' : 'owe';
  const eyebrow = sign === 'settled' ? "You're all settled up" : sign === 'owed' ? 'You are owed, overall' : 'You owe, overall';

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
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={user.isRefetching || friends.isRefetching || groups.isRefetching}
            onRefresh={() => {
              void user.refetch();
              void friends.refetch();
              void groups.refetch();
            }}
          />
        }>
        <View className="flex-row items-center justify-between mt-1 mb-1">
          <Text className="text-label" style={{ fontSize: 28, fontWeight: '700' }}>
            Home
          </Text>
          <GlassMenu
            systemImage="plus"
            icon="add"
            title="Add"
            items={[
              { label: 'New group', systemImage: 'person.2.fill', onPress: () => router.push('/new-group') },
              { label: 'Add a person', systemImage: 'person.crop.circle.badge.plus', onPress: () => router.push('/invite') },
            ]}
          />
        </View>
        <Hero eyebrow={eyebrow} amount={overall} currency={currency} sign={sign} />

        <View className="mb-5">
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
            <Empty>No balances — you&apos;re all settled up.</Empty>
          ) : (
            <Section sepInset={64}>
              {people.map(({ f, net }) => (
                <Row key={f.id} onPress={() => router.push(`/friend/${f.id}`)}>
                  <Avatar name={displayName(f)} uri={avatarUri(f)} />
                  <View className="flex-1">
                    <Text className="text-label text-[17px]" numberOfLines={1}>
                      {displayName(f)}
                    </Text>
                    <Text className="text-secondaryLabel text-[13px]">{net.amount > 0 ? 'owes you' : 'you owe'}</Text>
                  </View>
                  <Money amount={net.amount} currency={net.currency} />
                  <Chevron />
                </Row>
              ))}
            </Section>
          )
        ) : groupRows.length === 0 && !loading ? (
          <View className="items-center mt-2 gap-3">
            <Empty>No groups yet.</Empty>
            <View style={{ width: 200 }}>
              <Button label="New group" onPress={() => router.push('/new-group')} />
            </View>
          </View>
        ) : (
          <Section sepInset={64}>
            {groupRows.map(({ g, net }) => (
              <Row key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
                <Avatar name={g.name} />
                <Text className="flex-1 text-label text-[17px]" numberOfLines={1}>
                  {g.name}
                </Text>
                <Money amount={net.amount} currency={net.currency} />
                <Chevron />
              </Row>
            ))}
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Segmented } from '@/components/segmented';
import { Empty, ErrorText, GlassList, GlassRow, Hero, Loading, Money, Screen } from '@/components/ui';
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
  const eyebrow = sign === 'settled' ? "you're all settled up" : sign === 'owed' ? 'you are owed, overall' : 'you owe, overall';

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
    <Screen glow={sign === 'owe' ? 'ember' : 'volt'}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 150, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl
            tintColor="#B8FF3C"
            refreshing={user.isRefetching || friends.isRefetching || groups.isRefetching}
            onRefresh={() => {
              void user.refetch();
              void friends.refetch();
              void groups.refetch();
            }}
          />
        }>
        <Animated.View entering={FadeIn.duration(450)}>
          <Hero eyebrow={eyebrow} amount={overall} currency={currency} sign={sign} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(450)}>
          <Segmented<Lens>
            options={[
              { value: 'people', label: 'people' },
              { value: 'groups', label: 'groups' },
            ]}
            value={lens}
            onChange={setLens}
          />
        </Animated.View>

        <View className="h-4" />
        {loading && <Loading />}
        {err && <ErrorText>{err instanceof Error ? err.message : String(err)}</ErrorText>}

        <Animated.View entering={FadeInDown.delay(180).duration(450)}>
          {lens === 'people' ? (
            people.length === 0 && !loading ? (
              <Empty>no balances — you&apos;re all settled up</Empty>
            ) : (
              <GlassList>
                {people.map(({ f, net }) => (
                  <GlassRow key={f.id} onPress={() => router.push(`/friend/${f.id}`)}>
                    <Avatar name={displayName(f)} uri={avatarUri(f)} />
                    <View className="flex-1">
                      <Text className="text-text text-base font-display" numberOfLines={1}>
                        {displayName(f)}
                      </Text>
                      <Text className="text-faint text-[11px] font-body">{net.amount > 0 ? 'owes you' : 'you owe'}</Text>
                    </View>
                    <Money amount={net.amount} currency={net.currency} />
                  </GlassRow>
                ))}
              </GlassList>
            )
          ) : groupRows.length === 0 && !loading ? (
            <Empty>no groups yet</Empty>
          ) : (
            <GlassList>
              {groupRows.map(({ g, net }) => (
                <GlassRow key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
                  <Avatar name={g.name} />
                  <Text className="flex-1 text-text text-base font-display" numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Money amount={net.amount} currency={net.currency} />
                </GlassRow>
              ))}
            </GlassList>
          )}
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

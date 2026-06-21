import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Avatar } from '@/components/avatar';
import { Button, Row, Screen, Section } from '@/components/ui';
import { avatarUri, displayName } from '@/lib/format';
import { useAddUserToGroup, useCreateFriend, useFriends, useGroup } from '@/lib/queries';

interface PendingInvite {
  email: string;
  first_name?: string;
}

export default function Invite() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const groupId = params.groupId ? Number(params.groupId) : null;

  const friends = useFriends();
  const group = useGroup(groupId ?? Number.NaN);
  const addToGroup = useAddUserToGroup();
  const createFriend = useCreateFriend();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [busy, setBusy] = useState(false);

  const memberIds = new Set((group.data?.members ?? []).map((m) => m.id));
  const addableFriends = (friends.data ?? []).filter((f) => !memberIds.has(f.id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setInvites((p) => [...p, { email, first_name: inviteName.trim() || undefined }]);
    setInviteName('');
    setInviteEmail('');
  }

  async function submit() {
    setBusy(true);
    try {
      if (groupId !== null) {
        for (const user_id of selected) await addToGroup.mutateAsync({ group_id: groupId, user_id });
        // add_user_to_group's email-invite variant is poorly documented; mint the friend
        // first (this also sends the Splitwise invite), then add by the resulting user_id.
        for (const inv of invites) {
          const friend = await createFriend.mutateAsync({ user_email: inv.email, user_first_name: inv.first_name });
          if (friend?.id) await addToGroup.mutateAsync({ group_id: groupId, user_id: friend.id });
          else await addToGroup.mutateAsync({ group_id: groupId, email: inv.email, first_name: inv.first_name });
        }
      } else {
        for (const inv of invites) await createFriend.mutateAsync({ user_email: inv.email, user_first_name: inv.first_name });
      }
      toast(groupId !== null ? 'Added to group' : 'Invites sent');
      router.back();
    } catch (e) {
      toast('Could not add everyone', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  const nothing = selected.size === 0 && invites.length === 0;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: groupId !== null ? 'Add to group' : 'Add a person',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="close" size={26} color="#d4fd80" />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled">
        {groupId !== null && addableFriends.length > 0 ? (
          <Section header="From your friends">
            {addableFriends.map((f) => {
              const on = selected.has(f.id);
              return (
                <Row key={f.id} onPress={() => toggle(f.id)}>
                  <Avatar name={displayName(f)} uri={avatarUri(f)} size={32} />
                  <Text className="flex-1 text-label text-[17px]" numberOfLines={1}>
                    {displayName(f)}
                  </Text>
                  <Ionicons
                    name={on ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={on ? '#d4fd80' : 'rgba(235,235,245,0.3)'}
                  />
                </Row>
              );
            })}
          </Section>
        ) : null}

        <Section header={groupId !== null ? 'Or invite by email' : 'Invite by email'}>
          {invites.map((inv, i) => (
            <Row key={`${inv.email}-${i}`}>
              <Ionicons name="mail-outline" size={20} color="rgba(235,235,245,0.6)" />
              <Text className="flex-1 text-label text-[16px]" numberOfLines={1}>
                {inv.first_name ? `${inv.first_name} · ` : ''}
                {inv.email}
              </Text>
              <Pressable onPress={() => setInvites((p) => p.filter((_, j) => j !== i))} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="rgba(235,235,245,0.3)" />
              </Pressable>
            </Row>
          ))}
          <View className="px-4 py-3 gap-2">
            <View className="flex-row gap-2">
              <TextInput
                value={inviteName}
                onChangeText={setInviteName}
                placeholder="First name"
                placeholderTextColor="rgba(235,235,245,0.3)"
                className="flex-1 bg-cell2 rounded-xl px-3 py-2.5 text-label text-[15px]"
              />
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="email"
                placeholderTextColor="rgba(235,235,245,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="flex-[2] bg-cell2 rounded-xl px-3 py-2.5 text-label text-[15px]"
              />
            </View>
            <Button label="Add invite" variant="ghost" onPress={addInvite} disabled={!inviteEmail.trim()} />
          </View>
        </Section>

        <Button
          label={busy ? 'Adding…' : groupId !== null ? 'Add to group' : 'Send invites'}
          onPress={submit}
          disabled={busy || nothing}
        />
      </ScrollView>
    </Screen>
  );
}

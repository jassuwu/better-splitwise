import { Ionicons } from '@expo/vector-icons';
import type { InviteUser } from '@repo/splitwise';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Avatar } from '@/components/avatar';
import { Button, Row, Screen, Section } from '@/components/ui';
import { avatarUri, displayName } from '@/lib/format';
import { useCreateGroup, useFriends } from '@/lib/queries';

export default function NewGroup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const friends = useFriends();
  const create = useCreateGroup();

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<InviteUser[]>([]);

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
    setInvites((prev) => [...prev, { email, first_name: inviteName.trim() || undefined }]);
    setInviteName('');
    setInviteEmail('');
  }

  function submit() {
    if (!name.trim()) {
      toast('Name your group');
      return;
    }
    const members = [...[...selected].map((user_id) => ({ user_id })), ...invites];
    create.mutate(
      { name: name.trim(), members },
      {
        onSuccess: (group) => {
          toast('Group created');
          router.replace(`/group/${group.id}`);
        },
        onError: (e) => toast('Could not create group', { description: e instanceof Error ? e.message : String(e) }),
      },
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
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
        <View className="bg-cell2 rounded-2xl px-4 mb-6" style={{ minHeight: 52, justifyContent: 'center' }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Group name"
            placeholderTextColor="rgba(235,235,245,0.3)"
            className="text-label text-[17px]"
            autoFocus
          />
        </View>

        {(friends.data?.length ?? 0) > 0 ? (
          <Section header="Add friends">
            {(friends.data ?? []).map((f) => {
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

        <Section header="Invite by email">
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
          label={create.isPending ? 'Creating…' : 'Create group'}
          onPress={submit}
          disabled={create.isPending || !name.trim()}
        />
      </ScrollView>
    </Screen>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { fromCents } from '@repo/split-core';
import { toCreateExpenseParams, type SplitwiseUser } from '@repo/splitwise';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Avatar } from '@/components/avatar';
import { MenuPicker } from '@/components/menu';
import { Button, Row, Screen, Section } from '@/components/ui';
import { amountToCents, buildSplit, centsToMoney } from '@/lib/amount';
import { onCurrencyPicked } from '@/lib/currency-picker';
import { avatarUri, displayName, firstName } from '@/lib/format';
import { useCreateExpense, useCurrentUser, useDeleteExpense, useFriends, useGroups } from '@/lib/queries';
import { getDefaultCurrency, getLastGroupId, setLastGroupId } from '@/lib/token-store';

type TargetKind = 'group' | 'nongroup';

export default function Add() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const groups = useGroups();
  const friends = useFriends();
  const create = useCreateExpense();
  const del = useDeleteExpense();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [targetKind, setTargetKind] = useState<TargetKind>('group');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [payerId, setPayerId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState('USD');

  const me = user.data?.id ?? null;
  const group = useMemo(() => groups.data?.find((g) => g.id === groupId) ?? null, [groups.data, groupId]);
  const candidates: SplitwiseUser[] = useMemo(
    () =>
      targetKind === 'group'
        ? (group?.members ?? [])
        : ([user.data, ...(friends.data ?? [])].filter(Boolean) as SplitwiseUser[]),
    [targetKind, group, user.data, friends.data],
  );

  useEffect(() => {
    void getDefaultCurrency().then((c) => {
      if (c) setCurrency(c);
      else if (user.data?.default_currency) setCurrency(user.data.default_currency);
    });
  }, [user.data?.default_currency]);

  // default to the last-used group once groups load
  useEffect(() => {
    if (groupId !== null || targetKind === 'nongroup' || !groups.data?.length) return;
    void getLastGroupId().then((last) => {
      const pick = groups.data?.find((g) => g.id === last) ?? groups.data?.[0];
      if (pick) setGroupId(pick.id);
    });
  }, [groups.data, groupId, targetKind]);

  // reset participants when the target changes
  useEffect(() => {
    if (targetKind === 'group') {
      if (!group) return;
      setIncluded(new Set(group.members.map((m) => m.id)));
      setPayerId(group.members.find((m) => m.id === me)?.id ?? group.members[0]?.id ?? null);
    } else {
      setIncluded(new Set(me != null ? [me] : []));
      setPayerId(me ?? null);
    }
    setOverrides({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key on group.id so a background refetch (new array, same group) doesn't reset mid-edit
  }, [targetKind, group?.id, me]);

  const totalCents = amountToCents(amount);
  const includedIds = [...included].map(String);
  const { result, overBy, underBy } = buildSplit({ currency, includedIds, totalCents, overrides });
  const shareFor = (id: number) => result?.perPerson.find((p) => p.personId === String(id))?.owed ?? 0;
  const enoughPeople = targetKind === 'group' ? included.size >= 1 : included.size >= 2;
  const valid =
    result !== null && totalCents > 0 && enoughPeople && payerId !== null && (targetKind !== 'group' || group !== null);

  const groupOptions = [
    ...(groups.data ?? []).map((g) => ({ value: String(g.id), label: g.name })),
    { value: 'nongroup', label: 'Non-group' },
  ];
  const groupValue = targetKind === 'nongroup' ? 'nongroup' : groupId != null ? String(groupId) : '';
  const payerOptions = candidates
    .filter((c) => included.has(c.id))
    .map((c) => ({ value: String(c.id), label: c.id === me ? 'You' : firstName(c) }));
  const payerValue = payerId != null ? String(payerId) : '';

  function onGroupChange(v: string) {
    if (v === 'nongroup') {
      setTargetKind('nongroup');
      setGroupId(null);
    } else {
      setTargetKind('group');
      setGroupId(Number(v));
    }
  }

  function toggleIncluded(id: number) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (payerId === id && !next.has(id)) setPayerId(next.values().next().value ?? null);
      return next;
    });
    setOverrides((o) => {
      const next = { ...o };
      delete next[String(id)];
      return next;
    });
  }

  function pickCurrency() {
    onCurrencyPicked((code) => setCurrency(code));
    router.push(`/currency?selected=${currency}`);
  }

  function overridePrompt(m: SplitwiseUser) {
    if (Platform.OS !== 'ios') return;
    const key = String(m.id);
    const current = overrides[key] !== undefined ? fromCents(overrides[key] as number) : '';
    Alert.prompt(
      `${m.id === me ? 'Your' : `${firstName(m)}'s`} share`,
      'Leave blank to split equally — the rest rebalance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: (text?: string) => {
            const cents = text ? amountToCents(text) : 0;
            setOverrides((o) => {
              const next = { ...o };
              if (cents > 0) next[key] = cents;
              else delete next[key];
              return next;
            });
          },
        },
      ],
      'plain-text',
      current,
      'decimal-pad',
    );
  }

  function reset() {
    setAmount('');
    setDescription('');
    setOverrides({});
  }

  function push() {
    if (!valid || !result || payerId === null) return;
    const gId = targetKind === 'group' ? group?.id : 0;
    if (gId === undefined) return;
    const targetName = targetKind === 'group' ? (group?.name ?? '') : 'Non-group';
    const userIds = Object.fromEntries(candidates.map((c) => [String(c.id), c.id] as const));
    create.mutate(
      {
        params: toCreateExpenseParams(result, {
          groupId: gId,
          description: description || 'expense',
          payerId: String(payerId),
          userIds,
          currencyCode: currency,
        }),
      },
      {
        onSuccess: (expense) => {
          if (targetKind === 'group' && group) void setLastGroupId(group.id);
          let undone = false;
          toast('Expense added', {
            description: `${currency} ${centsToMoney(totalCents)} · ${targetName}`,
            action: {
              label: 'Undo',
              onClick: () => {
                if (undone) return;
                undone = true;
                del.mutate(expense.id);
                toast.dismiss();
              },
            },
          });
          reset();
          router.navigate('/');
        },
        onError: (e) => toast('Could not add', { description: e instanceof Error ? e.message : String(e) }),
      },
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <Text className="text-label" style={{ fontSize: 28, fontWeight: '700' }}>
          Add expense
        </Text>

        <View className="items-center py-2">
          <View className="flex-row items-center gap-2">
            <Pressable onPress={pickCurrency} className="bg-fill3 rounded-full px-3 py-1.5 active:opacity-70">
              <Text className="text-secondaryLabel text-[15px] font-semibold">{currency}</Text>
            </Pressable>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0"
              placeholderTextColor="rgba(235,235,245,0.25)"
              className="text-label"
              style={{ fontSize: 52, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 60 }}
            />
          </View>
        </View>

        <Section>
          <Row>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What for?"
              placeholderTextColor="rgba(235,235,245,0.3)"
              className="flex-1 text-label text-[17px]"
            />
          </Row>
          <Row>
            <Text className="flex-1 text-label text-[17px]">Group</Text>
            <MenuPicker options={groupOptions} value={groupValue} onChange={onGroupChange} title="Add to" />
          </Row>
          <Row>
            <Text className="flex-1 text-label text-[17px]">Paid by</Text>
            <MenuPicker options={payerOptions} value={payerValue} onChange={(v) => setPayerId(Number(v))} title="Paid by" />
          </Row>
        </Section>

        <View className="gap-2">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-secondaryLabel text-[13px]">Split between</Text>
            <Text className="text-tertiaryLabel text-[12px]">tap an amount to set it</Text>
          </View>
          <View className="bg-cell rounded-2xl overflow-hidden">
            {candidates.map((m, i) => {
              const inc = included.has(m.id);
              const locked = overrides[String(m.id)] !== undefined;
              return (
                <View key={m.id}>
                  {i > 0 ? (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(84,84,88,0.6)', marginLeft: 16 }} />
                  ) : null}
                  <View className="flex-row items-center gap-3 px-4" style={{ minHeight: 52 }}>
                    <Pressable onPress={() => toggleIncluded(m.id)} hitSlop={6}>
                      <Ionicons
                        name={inc ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={inc ? '#d4fd80' : 'rgba(235,235,245,0.3)'}
                      />
                    </Pressable>
                    <Avatar name={displayName(m)} uri={avatarUri(m)} size={32} />
                    <Text className="flex-1 text-label text-[16px]" numberOfLines={1}>
                      {m.id === me ? 'You' : firstName(m)}
                      {m.id === payerId ? <Text className="text-tertiaryLabel"> · paid</Text> : null}
                    </Text>
                    {inc ? (
                      <Pressable onPress={() => overridePrompt(m)} className="flex-row items-center gap-1 py-2 pl-2">
                        {locked ? <Ionicons name="lock-closed" size={12} color="rgba(235,235,245,0.6)" /> : null}
                        <Text
                          className={locked ? 'text-label' : 'text-secondaryLabel'}
                          style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
                          {currency} {centsToMoney(shareFor(m.id))}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text className="text-tertiaryLabel text-[14px]">not in</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          {overBy > 0 ? (
            <Text className="text-red text-[14px] px-1">
              Locked shares exceed the total by {currency} {centsToMoney(overBy)}
            </Text>
          ) : null}
          {underBy > 0 ? (
            <Text className="text-red text-[14px] px-1">
              Locked shares are under the total by {currency} {centsToMoney(underBy)}
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          <Button label="Scan a receipt" variant="ghost" systemImage="doc.viewfinder" onPress={() => router.push('/scan')} />
          <Button label={create.isPending ? 'Adding…' : 'Add expense'} onPress={push} disabled={!valid || create.isPending} />
        </View>
      </ScrollView>
    </Screen>
  );
}

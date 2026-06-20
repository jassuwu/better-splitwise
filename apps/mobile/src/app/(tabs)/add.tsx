import { Ionicons } from '@expo/vector-icons';
import { toCreateExpenseParams } from '@repo/splitwise';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Avatar } from '@/components/avatar';
import { Numpad } from '@/components/numpad';
import { Button, Chip, Screen } from '@/components/ui';
import { amountToCents, applyAmountKey, buildSplit, centsToMoney, formatAmountInput } from '@/lib/amount';
import { avatarUri, displayName, firstName } from '@/lib/format';
import { setPendingReceipt } from '@/lib/pending-receipt';
import { useCreateExpense, useCurrentUser, useDeleteExpense, useGroups } from '@/lib/queries';
import { scanReceipt } from '@/lib/scan';
import { getLastGroupId, setLastGroupId } from '@/lib/token-store';

function Caret() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0, { duration: 600 }), -1, true);
  }, [o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 3, height: 38, backgroundColor: '#d4fd80', marginLeft: 5, borderRadius: 2 }, st]} />;
}

export default function Add() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const groups = useGroups();
  const create = useCreateExpense();
  const del = useDeleteExpense();

  const [amount, setAmount] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [payerId, setPayerId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState('INR');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const me = user.data?.id ?? null;
  const group = useMemo(() => groups.data?.find((g) => g.id === groupId) ?? null, [groups.data, groupId]);
  const members = group?.members ?? [];
  const memberById = (id: number) => members.find((m) => m.id === id);

  useEffect(() => {
    if (user.data?.default_currency) setCurrency(user.data.default_currency);
  }, [user.data?.default_currency]);

  // default to the last-used group once groups load
  useEffect(() => {
    if (groupId !== null || !groups.data?.length) return;
    void getLastGroupId().then((last) => {
      const pick = groups.data?.find((g) => g.id === last) ?? groups.data?.[0];
      if (pick) setGroupId(pick.id);
    });
  }, [groups.data, groupId]);

  // reset selection when the group changes
  useEffect(() => {
    if (!group) return;
    setIncluded(new Set(group.members.map((m) => m.id)));
    setPayerId(group.members.find((m) => m.id === me)?.id ?? group.members[0]?.id ?? null);
    setOverrides({});
    setEditing(null);
  }, [group, me]);

  const totalCents = amountToCents(amount);
  const includedIds = [...included].map(String);
  const { result, overBy } = buildSplit({ currency, includedIds, totalCents, overrides });
  const shareFor = (id: number) => result?.perPerson.find((p) => p.personId === String(id))?.owed ?? 0;
  const valid = result !== null && totalCents > 0 && included.size > 0 && group !== null && payerId !== null;

  function onKey(k: Parameters<typeof applyAmountKey>[1]) {
    if (editing === null) setAmount((s) => applyAmountKey(s, k));
    else setEditAmount((s) => applyAmountKey(s, k));
  }

  function editPerson(id: number) {
    setEditing(id);
    setEditAmount('');
  }

  function commitEdit() {
    if (editing === null) return;
    const cents = amountToCents(editAmount);
    setOverrides((o) => {
      const next = { ...o };
      if (cents > 0) next[String(editing)] = cents;
      else delete next[String(editing)];
      return next;
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    setEditing(null);
    setEditAmount('');
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

  function reset() {
    setAmount('');
    setEditAmount('');
    setEditing(null);
    setDescription('');
    setOverrides({});
    setScanned(false);
  }

  async function onScan() {
    setScanning(true);
    try {
      const receipt = await scanReceipt('library');
      if (receipt) {
        setAmount(receipt.total.toFixed(2));
        if (receipt.merchant) setDescription(receipt.merchant);
        if (receipt.currency) setCurrency(receipt.currency);
        setPendingReceipt(receipt);
        setScanned(true);
      }
    } catch (e) {
      toast('Scan failed', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setScanning(false);
    }
  }

  function push() {
    if (!valid || !result || !group || payerId === null) return;
    const userIds = Object.fromEntries(members.map((m) => [String(m.id), m.id] as const));
    create.mutate(
      {
        params: toCreateExpenseParams(result, {
          groupId: group.id,
          description: description || 'expense',
          payerId: String(payerId),
          userIds,
          currencyCode: currency,
        }),
      },
      {
        onSuccess: (expense) => {
          void setLastGroupId(group.id);
          let undone = false;
          toast('Expense added', {
            description: `${currency} ${centsToMoney(totalCents)} · ${group.name}`,
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

  const editingMember = editing !== null ? memberById(editing) : null;

  return (
    <Screen>
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16, gap: 14 }}
          keyboardShouldPersistTaps="handled">
          <View className="items-center pt-1 pb-1">
            {editingMember ? (
              <Text className="text-secondaryLabel text-[13px] mb-1">{firstName(editingMember)}&apos;s share</Text>
            ) : null}
            <View className="flex-row items-baseline">
              <Text className="text-secondaryLabel" style={{ fontSize: 22, fontWeight: '600' }}>
                {currency}{' '}
              </Text>
              <Text className="text-label" style={{ fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {formatAmountInput(editing === null ? amount : editAmount)}
              </Text>
              <Caret />
            </View>
          </View>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What for?"
            placeholderTextColor="rgba(235,235,245,0.3)"
            className="bg-cell2 rounded-2xl px-4 py-3 text-label text-center text-[16px]"
          />

          <View className="gap-2">
            <Text className="text-secondaryLabel text-[13px] px-1">Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="flex-row gap-2 pr-2">
                {(groups.data ?? []).map((g) => (
                  <Chip key={g.id} label={g.name} active={groupId === g.id} onPress={() => setGroupId(g.id)} />
                ))}
              </View>
            </ScrollView>
          </View>

          {group ? (
            <View className="gap-2">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-secondaryLabel text-[13px]">Split between</Text>
                <Text className="text-tertiaryLabel text-[12px]">tap an amount to set it</Text>
              </View>
              <View className="bg-cell rounded-2xl overflow-hidden">
                {members.map((m, i) => {
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
                          {firstName(m)}
                          {m.id === payerId ? <Text className="text-tertiaryLabel"> · paid</Text> : null}
                        </Text>
                        {inc ? (
                          <Pressable onPress={() => editPerson(m.id)} className="flex-row items-center gap-1 py-2 pl-2">
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

              <View className="flex-row flex-wrap items-center gap-2 px-1 pt-1">
                <Text className="text-secondaryLabel text-[13px]">Paid by</Text>
                {members
                  .filter((m) => included.has(m.id))
                  .map((m) => (
                    <Chip key={m.id} label={firstName(m)} active={payerId === m.id} onPress={() => setPayerId(m.id)} />
                  ))}
              </View>

              {overBy > 0 ? (
                <Text className="text-red text-[14px] px-1">
                  Locked shares exceed the total by {currency} {centsToMoney(overBy)}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Button
            label={scanning ? 'Scanning…' : 'Scan a receipt'}
            variant="ghost"
            systemImage="doc.viewfinder"
            onPress={onScan}
            disabled={scanning}
          />
          {scanned && group ? (
            <Pressable onPress={() => router.push(`/assign?groupId=${group.id}`)} className="active:opacity-60">
              <Text className="text-tint text-center text-[15px]">Split by item instead</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <View
          className="px-4 pt-2.5 border-t border-separator bg-groupedBg"
          style={{ paddingBottom: insets.bottom + 8 }}>
          {editing !== null ? (
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-secondaryLabel text-[14px] flex-1" numberOfLines={1}>
                set {editingMember ? firstName(editingMember) : ''}&apos;s share · rest rebalance
              </Text>
              <Pressable onPress={commitEdit} className="px-5 py-2 rounded-full bg-tint active:opacity-80">
                <Text className="text-[#0a0a0a] font-semibold text-[15px]">Done</Text>
              </Pressable>
            </View>
          ) : (
            <View className="mb-3">
              <Button label={create.isPending ? 'Adding…' : 'Add expense'} onPress={push} disabled={!valid || create.isPending} />
            </View>
          )}
          <Numpad onKey={onKey} />
        </View>
      </View>
    </Screen>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { computeSplit, type SplitInput } from '@repo/split-core';
import { formatItemizationComment, toCreateExpenseParams } from '@repo/splitwise';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Avatar } from '@/components/avatar';
import { MenuPicker } from '@/components/menu';
import { Button, Money, Row, Screen, Section } from '@/components/ui';
import { amountToCents, centsToMoney } from '@/lib/amount';
import { avatarUri, displayName, firstName } from '@/lib/format';
import { useCreateExpense, useCurrentUser, useGroups } from '@/lib/queries';
import { scanReceipt } from '@/lib/scan';
import { getDefaultCurrency, getLastGroupId, setLastGroupId } from '@/lib/token-store';

type Step = 'scan' | 'review' | 'who' | 'assign' | 'confirm';
const ORDER: Step[] = ['scan', 'review', 'who', 'assign', 'confirm'];
const TITLES: Record<Step, string> = {
  scan: 'Scan a receipt',
  review: 'Review',
  who: "Who's in?",
  assign: 'Assign items',
  confirm: 'Confirm',
};

interface DraftItem {
  id: string;
  description: string;
  quantity: number;
  total: string;
}

const SEP = { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(84,84,88,0.6)', marginLeft: 16 } as const;
const PH = 'rgba(235,235,245,0.3)';

export default function Scan() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const groups = useGroups();
  const create = useCreateExpense();
  const me = user.data?.id ?? null;

  const [step, setStep] = useState<Step>('scan');
  const [scanning, setScanning] = useState(false);

  const [merchant, setMerchant] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [service, setService] = useState('');
  const [fees, setFees] = useState('');
  const [declaredTotal, setDeclaredTotal] = useState(0);
  const [tipEqual, setTipEqual] = useState(false);

  const [groupId, setGroupId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Set<number>>(new Set());
  const [payerId, setPayerId] = useState<number | null>(null);
  const [assign, setAssign] = useState<Record<string, Set<number>>>({});
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    void getDefaultCurrency().then((c) => {
      if (c) setCurrency(c);
    });
  }, []);

  const group = groups.data?.find((g) => g.id === groupId) ?? null;
  const members = group?.members ?? [];
  const attending = members.filter((m) => attendees.has(m.id));

  const itemsCents = items.reduce((s, it) => s + amountToCents(it.total), 0);
  const feesCents = amountToCents(tax) + amountToCents(tip) + amountToCents(service) + amountToCents(fees);
  const computedCents = itemsCents + feesCents;
  const delta = computedCents - declaredTotal;
  const reconciled = Math.abs(delta) < 1;

  // items start UNASSIGNED — you opt people in per item. just focus the first
  // item when entering the assign step so the picker has something to act on.
  useEffect(() => {
    if (step !== 'assign') return;
    setFocusId((f) => f ?? items[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function go(dir: 1 | -1) {
    const i = ORDER.indexOf(step);
    if (dir === -1 && i <= 0) {
      router.back();
      return;
    }
    setStep(ORDER[Math.min(ORDER.length - 1, Math.max(0, i + dir))] ?? step);
  }

  async function doScan(source: 'camera' | 'library') {
    setScanning(true);
    try {
      const r = await scanReceipt(source);
      if (!r) return;
      setMerchant(r.merchant ?? '');
      if (r.currency) setCurrency(r.currency);
      setItems(r.items.map((it, i) => ({ id: `it-${i}`, description: it.description, quantity: it.quantity, total: it.total.toFixed(2) })));
      setTax(r.tax !== undefined ? r.tax.toFixed(2) : '');
      setTip(r.tip !== undefined ? r.tip.toFixed(2) : '');
      setService(r.service !== undefined ? r.service.toFixed(2) : '');
      setFees(r.fees !== undefined ? r.fees.toFixed(2) : '');
      setDeclaredTotal(amountToCents(String(r.total)));
      void getLastGroupId().then((last) => {
        const pick = groups.data?.find((g) => g.id === last) ?? groups.data?.[0];
        if (pick) {
          setGroupId(pick.id);
          setAttendees(new Set(pick.members.map((m) => m.id)));
          setPayerId(pick.members.find((m) => m.id === me)?.id ?? pick.members[0]?.id ?? null);
        }
      });
      setStep('review');
    } catch (e) {
      toast('Scan failed', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setScanning(false);
    }
  }

  function patchItem(id: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { id: `it-new-${prev.length}-${Date.now() % 100000}`, description: '', quantity: 1, total: '' }]);
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function pickGroup(gid: number) {
    setGroupId(gid);
    const g = groups.data?.find((x) => x.id === gid);
    setAttendees(new Set((g?.members ?? []).map((m) => m.id)));
    setPayerId(g?.members.find((m) => m.id === me)?.id ?? g?.members[0]?.id ?? null);
    setAssign({});
  }
  function toggleAttendee(id: number) {
    setAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAssign({});
  }

  function toggleAssign(itemId: string, memberId: number) {
    setAssign((prev) => {
      const next = { ...prev };
      const set = new Set(next[itemId] ?? []);
      if (set.has(memberId)) set.delete(memberId);
      else set.add(memberId);
      next[itemId] = set;
      return next;
    });
  }
  function setAll(itemId: string, ids: number[]) {
    setAssign((prev) => ({ ...prev, [itemId]: new Set(ids) }));
  }

  const unassigned = items.filter((it) => amountToCents(it.total) > 0 && (assign[it.id]?.size ?? 0) === 0);
  const assignedCount = items.filter((it) => (assign[it.id]?.size ?? 0) > 0).length;

  function buildInput(): SplitInput | null {
    if (!group) return null;
    const people = attending.map((m) => String(m.id));
    if (people.length === 0) return null;
    const splitItems = items
      .map((it) => ({
        id: it.id,
        label: it.description || 'item',
        total: amountToCents(it.total),
        assignees: [...(assign[it.id] ?? new Set<number>())].map(String),
      }))
      .filter((it) => it.assignees.length > 0 && it.total > 0);
    if (splitItems.length === 0) return null;
    return {
      currency,
      people,
      items: splitItems,
      tax: amountToCents(tax) || undefined,
      tip: amountToCents(tip) || undefined,
      service: amountToCents(service) || undefined,
      otherFees: amountToCents(fees) || undefined,
      feeStrategy: { tip: tipEqual ? 'equal' : 'proportional' },
      declaredTotal: declaredTotal || undefined,
    };
  }

  let preview: ReturnType<typeof computeSplit> | null = null;
  if (step === 'confirm') {
    const input = buildInput();
    if (input) {
      try {
        preview = computeSplit(input);
      } catch {
        preview = null;
      }
    }
  }

  function push() {
    const input = buildInput();
    if (!input || !group || payerId === null) {
      toast('Pick a group, people, and assign items');
      return;
    }
    let split: ReturnType<typeof computeSplit>;
    try {
      split = computeSplit(input);
    } catch (e) {
      toast('Could not compute split', { description: e instanceof Error ? e.message : String(e) });
      return;
    }
    const userIds = Object.fromEntries(members.map((m) => [String(m.id), m.id] as const));
    const names = Object.fromEntries(members.map((m) => [String(m.id), firstName(m)] as const));
    create.mutate(
      {
        params: toCreateExpenseParams(split, {
          groupId: group.id,
          description: merchant || 'itemized bill',
          payerId: String(payerId),
          userIds,
          currencyCode: currency,
        }),
        comment: formatItemizationComment(split, names),
      },
      {
        onSuccess: () => {
          void setLastGroupId(group.id);
          toast('Itemized expense added');
          router.back();
        },
        onError: (e) => toast('Could not add', { description: e instanceof Error ? e.message : String(e) }),
      },
    );
  }

  const stepIdx = ORDER.indexOf(step);
  const focusItem = items.find((it) => it.id === focusId) ?? null;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: TITLES[step],
          headerLeft: () => (
            <Pressable onPress={() => go(-1)} hitSlop={10}>
              <Ionicons name={step === 'scan' ? 'close' : 'chevron-back'} size={26} color="#d4fd80" />
            </Pressable>
          ),
        }}
      />
      <View className="flex-1">
        {step !== 'scan' ? (
          <View className="flex-row gap-1.5 px-4 pt-3 pb-1">
            {ORDER.slice(1).map((s, i) => (
              <View
                key={s}
                className="flex-1 rounded-full"
                style={{ height: 3, backgroundColor: i < stepIdx ? '#d4fd80' : '#2C2C2E' }}
              />
            ))}
          </View>
        ) : null}

        {/* ---------- SCAN ---------- */}
        {step === 'scan' ? (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            {scanning ? (
              <>
                <ActivityIndicator />
                <Text className="text-secondaryLabel text-[15px]">Reading your receipt…</Text>
              </>
            ) : (
              <>
                <Ionicons name="receipt-outline" size={56} color="#d4fd80" />
                <Text className="text-label text-center text-[17px]" style={{ fontWeight: '600' }}>
                  Snap or pick a receipt
                </Text>
                <Text className="text-secondaryLabel text-center text-[14px] mb-2">
                  We read the items, then walk you through splitting it.
                </Text>
                <View className="w-full gap-3">
                  <Button label="Take a photo" systemImage="camera.fill" onPress={() => doScan('camera')} />
                  <Button label="Choose from library" variant="ghost" systemImage="photo.on.rectangle" onPress={() => doScan('library')} />
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* ---------- REVIEW ---------- */}
        {step === 'review' ? (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, gap: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View className="bg-cell2 rounded-2xl px-4" style={{ minHeight: 50, justifyContent: 'center' }}>
              <Text className="text-secondaryLabel text-[12px]">What for</Text>
              <TextInput value={merchant} onChangeText={setMerchant} placeholder="Merchant" placeholderTextColor={PH} className="text-label text-[17px]" />
            </View>

            <View>
              <Text className="text-secondaryLabel text-[13px] px-1 mb-2">Items</Text>
              <View className="bg-cell rounded-2xl overflow-hidden">
                {items.map((it, i) => (
                  <View key={it.id}>
                    {i > 0 ? <View style={SEP} /> : null}
                    <View className="flex-row items-center gap-2 px-3" style={{ minHeight: 52 }}>
                      <TextInput
                        value={it.description}
                        onChangeText={(t) => patchItem(it.id, { description: t })}
                        placeholder="Item"
                        placeholderTextColor={PH}
                        className="flex-1 text-label text-[16px]"
                      />
                      <TextInput
                        value={it.total}
                        onChangeText={(t) => patchItem(it.id, { total: t })}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={PH}
                        className="text-label text-[16px] text-right"
                        style={{ width: 86, fontVariant: ['tabular-nums'] }}
                      />
                      <Pressable onPress={() => removeItem(it.id)} hitSlop={8}>
                        <Ionicons name="remove-circle" size={20} color="rgba(235,235,245,0.3)" />
                      </Pressable>
                    </View>
                  </View>
                ))}
                <View style={SEP} />
                <Pressable onPress={addItem} className="flex-row items-center gap-2 px-4" style={{ minHeight: 48 }}>
                  <Ionicons name="add-circle" size={20} color="#d4fd80" />
                  <Text className="text-tint text-[16px]">Add item</Text>
                </Pressable>
              </View>
            </View>

            <View>
              <Text className="text-secondaryLabel text-[13px] px-1 mb-2">Tax &amp; tip</Text>
              <View className="bg-cell rounded-2xl overflow-hidden">
                {(
                  [
                    ['Tax', tax, setTax],
                    ['Tip', tip, setTip],
                    ['Service', service, setService],
                    ['Other fees', fees, setFees],
                  ] as const
                ).map(([label, val, setter], i) => (
                  <View key={label}>
                    {i > 0 ? <View style={SEP} /> : null}
                    <View className="flex-row items-center px-4" style={{ minHeight: 48 }}>
                      <Text className="flex-1 text-label text-[16px]">{label}</Text>
                      <Text className="text-secondaryLabel text-[15px]">{currency} </Text>
                      <TextInput
                        value={val}
                        onChangeText={setter}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={PH}
                        className="text-label text-[16px] text-right"
                        style={{ width: 86, fontVariant: ['tabular-nums'] }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="bg-cell rounded-2xl px-4 py-3 flex-row items-center">
              <Ionicons
                name={reconciled ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={reconciled ? '#30D158' : '#ffcf6b'}
              />
              <Text className="flex-1 text-secondaryLabel text-[13px] ml-2" style={{ fontVariant: ['tabular-nums'] }}>
                items + fees = {currency} {centsToMoney(computedCents)}
              </Text>
              <Text
                className="text-[13px]"
                style={{ fontVariant: ['tabular-nums'], color: reconciled ? '#30D158' : '#ffcf6b' }}>
                receipt {currency} {centsToMoney(declaredTotal)}
              </Text>
            </View>
            {!reconciled ? (
              <Text className="text-secondaryLabel text-[12px] px-1" style={{ marginTop: -8 }}>
                {delta > 0 ? 'Over' : 'Under'} by {currency} {centsToMoney(Math.abs(delta))} — add or fix a line so it matches.
              </Text>
            ) : null}
          </ScrollView>
        ) : null}

        {/* ---------- WHO ---------- */}
        {step === 'who' ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, gap: 16 }}>
            <Section>
              <Row>
                <Text className="flex-1 text-label text-[17px]">Group</Text>
                <MenuPicker
                  options={(groups.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))}
                  value={groupId != null ? String(groupId) : ''}
                  onChange={(v) => pickGroup(Number(v))}
                  title="Split in"
                />
              </Row>
            </Section>

            {group ? (
              <View>
                <Text className="text-secondaryLabel text-[13px] px-1 mb-2">Who was there?</Text>
                <View className="bg-cell rounded-2xl overflow-hidden">
                  {members.map((m, i) => {
                    const on = attendees.has(m.id);
                    return (
                      <View key={m.id}>
                        {i > 0 ? <View style={SEP} /> : null}
                        <Pressable
                          onPress={() => toggleAttendee(m.id)}
                          className="flex-row items-center gap-3 px-4"
                          style={{ minHeight: 52 }}>
                          <Avatar name={displayName(m)} uri={avatarUri(m)} size={32} />
                          <Text className="flex-1 text-label text-[16px]" numberOfLines={1}>
                            {m.id === me ? 'You' : displayName(m)}
                          </Text>
                          <Ionicons
                            name={on ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={on ? '#d4fd80' : 'rgba(235,235,245,0.3)'}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </ScrollView>
        ) : null}

        {/* ---------- ASSIGN ---------- */}
        {step === 'assign' ? (
          <View className="flex-1">
            <View className="flex-row items-center justify-between px-4 py-2">
              <Text className="text-secondaryLabel text-[13px]">Tap an item, then tap who shared it</Text>
              <Text className="text-tertiaryLabel text-[12px]">
                {assignedCount}/{items.length} assigned
              </Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 9 }}>
              {items.map((it) => {
                const on = assign[it.id] ?? new Set<number>();
                const empty = on.size === 0;
                const everyone = on.size > 0 && on.size === attending.length;
                const focused = it.id === focusId;
                return (
                  <Pressable
                    key={it.id}
                    onPress={() => setFocusId(it.id)}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: '#1C1C1E',
                      borderWidth: 1,
                      borderColor: focused ? '#d4fd80' : 'transparent',
                    }}>
                    <View className="flex-row items-center">
                      <Text className="flex-1 text-label text-[16px]" numberOfLines={1}>
                        {it.quantity > 1 ? `${it.quantity}× ` : ''}
                        {it.description || 'item'}
                      </Text>
                      <Text className="text-secondaryLabel text-[15px]" style={{ fontVariant: ['tabular-nums'] }}>
                        {currency} {it.total || '0'}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-2" style={{ gap: 4 }}>
                      {empty ? (
                        <>
                          <Ionicons name="add-circle-outline" size={15} color="rgba(235,235,245,0.3)" />
                          <Text className="text-tertiaryLabel text-[12px]">tap to assign</Text>
                        </>
                      ) : everyone ? (
                        <Text className="text-secondaryLabel text-[12px]">everyone</Text>
                      ) : (
                        attending
                          .filter((m) => on.has(m.id))
                          .map((m) => <Avatar key={m.id} name={displayName(m)} uri={avatarUri(m)} size={20} />)
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {focusItem ? (
              <View className="px-4 pt-3 border-t border-separator bg-groupedBg" style={{ paddingBottom: insets.bottom + 8 }}>
                <Text className="text-secondaryLabel text-[13px] mb-2" numberOfLines={1}>
                  {focusItem.description || 'item'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-3 pr-2">
                    {attending.map((m) => {
                      const on = (assign[focusItem.id] ?? new Set<number>()).has(m.id);
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => toggleAssign(focusItem.id, m.id)}
                          className="items-center gap-1"
                          style={{ opacity: on ? 1 : 0.4 }}>
                          <View style={on ? { borderWidth: 2, borderColor: '#d4fd80', borderRadius: 999, padding: 1 } : { padding: 3 }}>
                            <Avatar name={displayName(m)} uri={avatarUri(m)} size={38} />
                          </View>
                          <Text className="text-secondaryLabel text-[11px]">{m.id === me ? 'You' : firstName(m)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                <View className="flex-row items-center gap-2 mt-3">
                  <Pressable
                    onPress={() => setAll(focusItem.id, attending.map((m) => m.id))}
                    className="rounded-full px-4 py-2 border border-tint">
                    <Text className="text-tint text-[14px]">Everyone</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAll(focusItem.id, me != null ? [me] : [])}
                    className="rounded-full px-4 py-2 bg-fill3">
                    <Text className="text-label text-[14px]">Just me</Text>
                  </Pressable>
                  <View className="flex-1" />
                  {(assign[focusItem.id]?.size ?? 0) > 0 ? (
                    <Pressable
                      onPress={() => setAll(focusItem.id, [])}
                      className="flex-row items-center gap-1 rounded-full px-3 py-2"
                      hitSlop={6}>
                      <Ionicons name="close-circle" size={18} color="rgba(235,235,245,0.6)" />
                      <Text className="text-secondaryLabel text-[14px]">Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ---------- CONFIRM ---------- */}
        {step === 'confirm' ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, gap: 16 }}>
            <Section>
              <Row>
                <Text className="flex-1 text-label text-[17px]">Paid by</Text>
                <MenuPicker
                  options={attending.map((m) => ({ value: String(m.id), label: m.id === me ? 'You' : firstName(m) }))}
                  value={payerId != null ? String(payerId) : ''}
                  onChange={(v) => setPayerId(Number(v))}
                  title="Paid by"
                />
              </Row>
              <View className="flex-row items-center px-4" style={{ minHeight: 48 }}>
                <Text className="flex-1 text-label text-[17px]">Split tip equally</Text>
                <Switch value={tipEqual} onValueChange={setTipEqual} trackColor={{ true: '#d4fd80' }} />
              </View>
            </Section>

            {preview ? (
              <Section header={`${merchant || 'itemized bill'} · ${currency} ${centsToMoney(preview.total)}`}>
                {preview.perPerson.map((p) => {
                  const m = members.find((x) => String(x.id) === p.personId);
                  return (
                    <Row key={p.personId}>
                      <Text className="flex-1 text-label text-[17px]">{m ? (m.id === me ? 'You' : firstName(m)) : p.personId}</Text>
                      <Money amount={p.owed / 100} currency={currency} />
                    </Row>
                  );
                })}
              </Section>
            ) : (
              <Text className="text-red text-[15px] px-1">Could not build the split — go back and check items.</Text>
            )}

            {preview ? (
              <View className="flex-row items-center px-1">
                <Ionicons
                  name={preview.reconciliation.matchesDeclared !== false ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={preview.reconciliation.matchesDeclared !== false ? '#30D158' : '#ffcf6b'}
                />
                <Text className="text-secondaryLabel text-[13px] ml-2">
                  {preview.reconciliation.matchesDeclared === false
                    ? `${(preview.reconciliation.deltaFromDeclared ?? 0) > 0 ? 'Over' : 'Under'} the receipt by ${currency} ${centsToMoney(Math.abs(preview.reconciliation.deltaFromDeclared ?? 0))}`
                    : 'Splits to the receipt total exactly'}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        ) : null}

        {/* ---------- FOOTER CTA ---------- */}
        {step !== 'scan' ? (
          <View className="px-4 pt-2" style={{ paddingBottom: step === 'assign' ? 0 : insets.bottom + 8 }}>
            {step === 'review' ? (
              <Button label="Next · who's in" onPress={() => go(1)} disabled={items.length === 0} />
            ) : null}
            {step === 'who' ? (
              <Button label="Next · assign items" onPress={() => go(1)} disabled={!group || attending.length === 0} />
            ) : null}
            {step === 'assign' ? (
              <View style={{ paddingBottom: insets.bottom + 8 }}>
                <Button
                  label={unassigned.length > 0 ? `${unassigned.length} item${unassigned.length > 1 ? 's' : ''} unassigned` : 'Review split'}
                  onPress={() => go(1)}
                  disabled={unassigned.length > 0}
                />
              </View>
            ) : null}
            {step === 'confirm' ? (
              <Button
                label={create.isPending ? 'Adding…' : 'Add to Splitwise'}
                onPress={push}
                disabled={create.isPending || !preview}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

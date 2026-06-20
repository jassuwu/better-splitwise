import { computeSplit, toCents, type SplitInput } from '@repo/split-core';
import { formatItemizationComment, toCreateExpenseParams } from '@repo/splitwise';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Chip, Empty, ErrorText, Money, Row, Screen, Section } from '@/components/ui';
import { firstName } from '@/lib/format';
import { getPendingReceipt } from '@/lib/pending-receipt';
import { useCreateExpense, useCurrentUser, useGroups } from '@/lib/queries';

export default function Assign() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const groups = useGroups();
  const create = useCreateExpense();
  const receipt = getPendingReceipt();
  const me = user.data?.id ?? null;

  const group = groups.data?.find((g) => g.id === Number(params.groupId)) ?? null;
  const members = group?.members ?? [];
  const [assign, setAssign] = useState<Record<number, Set<number>>>({});
  const [payerId, setPayerId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (receipt && members.length > 0) {
      const init: Record<number, Set<number>> = {};
      receipt.items.forEach((_, i) => {
        init[i] = new Set(members.map((m) => m.id));
      });
      setAssign(init);
      setPayerId(members.find((m) => m.id === me)?.id ?? members[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt, members.length, me]);

  if (!receipt) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Empty>No scanned receipt — scan one from Add first.</Empty>
        </ScrollView>
      </Screen>
    );
  }

  const currency = receipt.currency || user.data?.default_currency || 'INR';
  const nameFor = (personId: string) => {
    const m = members.find((x) => String(x.id) === personId);
    return m ? firstName(m) : personId;
  };

  function toggle(itemIdx: number, memberId: number) {
    setAssign((prev) => {
      const next = { ...prev };
      const set = new Set(next[itemIdx] ?? []);
      if (set.has(memberId)) set.delete(memberId);
      else set.add(memberId);
      next[itemIdx] = set;
      return next;
    });
  }

  function buildSplit(): SplitInput | null {
    if (!receipt) return null;
    const involved = new Set<number>();
    Object.values(assign).forEach((s) => s.forEach((id) => involved.add(id)));
    const people = [...involved].map(String);
    if (people.length === 0) return null;
    const items = receipt.items
      .map((it, i) => ({
        id: `item-${i}`,
        label: it.description,
        total: toCents(it.total),
        assignees: [...(assign[i] ?? new Set<number>())].map(String),
      }))
      .filter((it) => it.assignees.length > 0);
    return {
      currency,
      people,
      items,
      tax: receipt.tax !== undefined ? toCents(receipt.tax) : undefined,
      tip: receipt.tip !== undefined ? toCents(receipt.tip) : undefined,
      service: receipt.service !== undefined ? toCents(receipt.service) : undefined,
      otherFees: receipt.fees !== undefined ? toCents(receipt.fees) : undefined,
    };
  }

  let preview: ReturnType<typeof computeSplit> | null = null;
  const input = buildSplit();
  if (input) {
    try {
      preview = computeSplit(input);
    } catch {
      preview = null;
    }
  }

  function push() {
    setError(null);
    if (!group || payerId === null) {
      setError('Missing group or payer');
      return;
    }
    const splitInput = buildSplit();
    if (!splitInput) {
      setError('Assign at least one item to someone');
      return;
    }
    let split: ReturnType<typeof computeSplit>;
    try {
      split = computeSplit(splitInput);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    const userIds = Object.fromEntries(members.map((m) => [String(m.id), m.id] as const));
    const names = Object.fromEntries(members.map((m) => [String(m.id), firstName(m)] as const));
    create.mutate(
      {
        params: toCreateExpenseParams(split, {
          groupId: group.id,
          description: receipt?.merchant || 'itemized bill',
          payerId: String(payerId),
          userIds,
          currencyCode: currency,
        }),
        comment: formatItemizationComment(split, names),
      },
      { onSuccess: () => router.back(), onError: (e) => setError(e instanceof Error ? e.message : String(e)) },
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        <Text className="text-secondaryLabel text-[13px] mb-3">Tap who shared each item · tax &amp; tip split proportionally.</Text>

        {receipt.items.map((it, i) => (
          <Card key={i} className="gap-3 mb-3">
            <View className="flex-row items-center">
              <Text className="flex-1 text-label text-[16px]">
                {it.quantity > 1 ? `${it.quantity}× ` : ''}
                {it.description}
              </Text>
              <Text className="text-secondaryLabel text-[16px]" style={{ fontVariant: ['tabular-nums'] }}>
                {it.total.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {members.map((m) => (
                <Chip key={m.id} label={firstName(m)} active={(assign[i] ?? new Set<number>()).has(m.id)} onPress={() => toggle(i, m.id)} />
              ))}
            </View>
          </Card>
        ))}

        <Text className="text-secondaryLabel text-[13px] mb-2 mt-1">Paid by</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {members.map((m) => (
            <Chip key={m.id} label={firstName(m)} active={payerId === m.id} onPress={() => setPayerId(m.id)} />
          ))}
        </View>

        {preview && (
          <Section header={`Split · ${currency} ${(preview.total / 100).toFixed(2)}`}>
            {preview.perPerson.map((p) => (
              <Row key={p.personId}>
                <Text className="flex-1 text-label text-[17px]">{nameFor(p.personId)}</Text>
                <Money amount={p.owed / 100} currency={currency} />
              </Row>
            ))}
          </Section>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <Button label={create.isPending ? 'Adding…' : 'Add itemized expense'} onPress={push} disabled={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

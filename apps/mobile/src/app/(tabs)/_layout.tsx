import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';

import { firstName, netBalance } from '@/lib/format';
import { useFriends } from '@/lib/queries';

export default function TabsLayout() {
  // long-press the app icon → these route via params.href (must live in a sub-layout, not root)
  useQuickActionRouting();
  const friends = useFriends();

  useEffect(() => {
    const actions: QuickActions.Action[] = [
      { id: 'scan', title: 'Scan a receipt', icon: 'symbol:doc.text.viewfinder', params: { href: '/scan' } },
      { id: 'add', title: 'Add an expense', icon: 'symbol:plus.circle', params: { href: '/add' } },
      { id: 'settle', title: 'Settle up', icon: 'symbol:arrow.left.arrow.right', params: { href: '/' } },
    ];
    // dynamic 4th: pay back whoever you owe the most
    const top = [...(friends.data ?? [])]
      .map((f) => ({ f, net: netBalance(f.balance) }))
      .filter((x) => x.net.amount < -0.005)
      .sort((a, b) => a.net.amount - b.net.amount)[0];
    if (top) {
      actions.push({
        id: 'settle-top',
        title: `Pay back ${firstName(top.f)}`,
        icon: 'symbol:creditcard',
        params: { href: `/settle?friendId=${top.f.id}` },
      });
    }
    void QuickActions.setItems(actions);
  }, [friends.data]);

  return (
    <NativeTabs tintColor="#d4fd80">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

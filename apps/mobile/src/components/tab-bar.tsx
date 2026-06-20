import { Ionicons } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (...args: any[]) => void };
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeName = state.routes[state.index]?.name;

  function Item({ name, icon, label }: { name: string; icon: IconName; label: string }) {
    const focused = activeName === name;
    return (
      <Pressable
        onPress={() => navigation.navigate(name)}
        className="flex-1 items-center justify-center py-2 active:opacity-70">
        <Ionicons name={icon} size={24} color={focused ? '#ffffff' : '#8b929e'} />
        <Text className={cn('text-[11px] mt-1', focused ? 'text-white' : 'text-muted')}>{label}</Text>
      </Pressable>
    );
  }

  const inner = (
    <View className="flex-row items-center px-6 pt-2.5 border-t border-hairline" style={{ paddingBottom: insets.bottom + 8 }}>
      <Item name="index" icon="home" label="Home" />
      <View className="w-16" />
      <Item name="you" icon="person" label="You" />
    </View>
  );

  return (
    <View>
      {isLiquidGlassAvailable() ? (
        <GlassView glassEffectStyle="regular">{inner}</GlassView>
      ) : (
        <View className="bg-surface">{inner}</View>
      )}
      <Pressable
        onPress={() => router.push('/add')}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        className="absolute left-1/2 -ml-8 active:opacity-80"
        style={{ bottom: insets.bottom + 14 }}>
        <View className="w-16 h-16 rounded-full bg-brand items-center justify-center border-4 border-ink">
          <Ionicons name="add" size={32} color="#ffffff" />
        </View>
      </Pressable>
    </View>
  );
}

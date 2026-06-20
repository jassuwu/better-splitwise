import { Ionicons } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { type ComponentProps, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
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

  // the resting heartbeat — the add orb is the calm echo of the settle pulse
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.14 + pulse.value * 0.16,
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));

  function Item({ name, icon, label }: { name: string; icon: IconName; label: string }) {
    const focused = activeName === name;
    return (
      <Pressable
        onPress={() => navigation.navigate(name)}
        className="flex-1 items-center justify-center py-2 active:opacity-70">
        <Ionicons name={icon} size={23} color={focused ? '#B8FF3C' : '#8B929E'} />
        <Text className={cn('text-[11px] mt-1 font-body-medium', focused ? 'text-volt' : 'text-muted')}>{label}</Text>
        <View className={cn('w-1 h-1 rounded-full mt-1', focused ? 'bg-volt' : 'bg-transparent')} />
      </Pressable>
    );
  }

  const inner = (
    <View
      className="flex-row items-center px-6 pt-2.5"
      style={{ paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: 'rgba(184,255,60,0.16)' }}>
      <Item name="index" icon="home" label="home" />
      <View className="w-16" />
      <Item name="you" icon="person" label="you" />
    </View>
  );

  return (
    <View>
      {isLiquidGlassAvailable() ? <GlassView glassEffectStyle="regular">{inner}</GlassView> : <View className="bg-surface">{inner}</View>}

      <Pressable
        onPress={() => router.push('/add')}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        className="absolute left-1/2 -ml-8 active:opacity-80"
        style={{ bottom: insets.bottom + 14 }}>
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: -8, top: -8, width: 80, height: 80, borderRadius: 40, backgroundColor: '#B8FF3C' }, haloStyle]}
        />
        {isLiquidGlassAvailable() ? (
          <GlassView
            glassEffectStyle="clear"
            isInteractive
            tintColor="rgba(184,255,60,0.16)"
            style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(184,255,60,0.5)' }}>
            <Ionicons name="add" size={30} color="#B8FF3C" />
          </GlassView>
        ) : (
          <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: '#B8FF3C' }}>
            <Ionicons name="add" size={30} color="#07080A" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

/** A segmented control whose active segment is a Liquid Glass thumb (iOS 26). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const glass = isLiquidGlassAvailable();
  return (
    <View className="flex-row bg-fill3 rounded-full" style={{ padding: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className="flex-1 rounded-full items-center justify-center overflow-hidden"
            style={{ paddingVertical: 7 }}>
            {active ? (
              glass ? (
                <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { borderRadius: 999, backgroundColor: '#2C2C2E' }]} />
              )
            ) : null}
            <Text className={cn('text-[14px]', active ? 'text-label font-semibold' : 'text-secondaryLabel')}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

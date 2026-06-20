import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

/** A neutral iOS-style segmented control (raised thumb, no tint). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row bg-fill3 rounded-lg" style={{ padding: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={cn('flex-1 rounded-md items-center', active && 'bg-cell2')}
            style={[
              { paddingVertical: 7 },
              active ? { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : null,
            ]}>
            <Text className={cn('text-[14px]', active ? 'text-label font-semibold' : 'text-secondaryLabel')}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

/** A compact two-or-more option toggle (quiet control, not an option wall). */
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
    <View className="flex-row bg-surface rounded-full p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={cn('flex-1 rounded-full py-2 items-center', active && 'bg-brand')}>
            <Text className={cn('text-sm font-medium', active ? 'text-white' : 'text-muted')}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

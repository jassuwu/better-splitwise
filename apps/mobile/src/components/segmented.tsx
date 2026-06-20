import { Text, View } from 'react-native';

import { PressableScale } from '@/components/press';
import { cn } from '@/lib/cn';

/** A compact toggle (quiet control). Active segment carries a faint volt wash. */
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
    <View className="flex-row bg-surface2 rounded-full p-1 border border-hairline">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            onPress={() => onChange(o.value)}
            className={cn('flex-1 rounded-full py-2 items-center', active && 'bg-volt/10')}>
            <Text className={cn('text-sm font-body-medium', active ? 'text-volt' : 'text-muted')}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

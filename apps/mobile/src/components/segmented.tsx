import { Host, Picker, Text as UIText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { nativeGlass } from '@/lib/native-glass';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  // iOS 26 — native segmented Picker: the thumb is Liquid Glass and slides natively.
  if (nativeGlass()) {
    return (
      <Host matchContents={{ vertical: true }} colorScheme="dark" style={{ alignSelf: 'stretch' }}>
        <Picker selection={value} onSelectionChange={(v) => onChange(v as T)} modifiers={[pickerStyle('segmented')]}>
          {options.map((o) => (
            <UIText key={o.value} modifiers={[tag(o.value)]}>
              {o.label}
            </UIText>
          ))}
        </Picker>
      </Host>
    );
  }

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
            {active ? <View style={[StyleSheet.absoluteFill, { borderRadius: 999, backgroundColor: '#2C2C2E' }]} /> : null}
            <Text className={cn('text-[14px]', active ? 'text-label font-semibold' : 'text-secondaryLabel')}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

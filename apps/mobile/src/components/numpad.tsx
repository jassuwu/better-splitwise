import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

export type NumpadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'del';

const ROWS: NumpadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
];

/** A calculator-style numeric keypad. Drives a digit string; no system keyboard. */
export function Numpad({ onKey }: { onKey: (k: NumpadKey) => void }) {
  return (
    <View className="gap-2">
      {ROWS.map((row, r) => (
        <View key={r} className="flex-row gap-2">
          {row.map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                void Haptics.selectionAsync();
                onKey(k);
              }}
              className="flex-1 items-center justify-center rounded-2xl active:bg-fill3"
              style={{ height: 54 }}>
              {k === 'del' ? (
                <Ionicons name="backspace-outline" size={24} color="#F4F6F8" />
              ) : (
                <Text className="text-label" style={{ fontSize: 26, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                  {k}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

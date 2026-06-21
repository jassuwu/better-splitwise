import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Section } from '@/components/ui';
import { commitCurrency } from '@/lib/currency-picker';
import { CURRENCIES } from '@/lib/currencies';

export default function CurrencyPicker() {
  const params = useLocalSearchParams<{ selected?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return CURRENCIES;
    return CURRENCIES.filter((c) => c.code.includes(needle) || c.name.toUpperCase().includes(needle));
  }, [q]);

  function pick(code: string) {
    commitCurrency(code);
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="close" size={26} color="#d4fd80" />
            </Pressable>
          ),
        }}
      />
      <View className="px-4 pt-3 pb-2">
        <View className="bg-cell2 rounded-xl flex-row items-center px-3" style={{ height: 38 }}>
          <Ionicons name="search" size={18} color="rgba(235,235,245,0.5)" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search"
            placeholderTextColor="rgba(235,235,245,0.3)"
            autoCorrect={false}
            autoCapitalize="characters"
            className="flex-1 text-label text-[17px] ml-2"
          />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled">
        <Section>
          {list.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => pick(c.code)}
              style={({ pressed }) => (pressed ? { backgroundColor: '#2C2C2E' } : undefined)}>
              <View className="flex-row items-center gap-3 px-4" style={{ minHeight: 48 }}>
                <Text className="text-label text-[17px]" style={{ width: 46, fontVariant: ['tabular-nums'] }}>
                  {c.code}
                </Text>
                <Text className="flex-1 text-secondaryLabel text-[15px]" numberOfLines={1}>
                  {c.name}
                </Text>
                {params.selected === c.code ? <Ionicons name="checkmark" size={20} color="#d4fd80" /> : null}
              </View>
            </Pressable>
          ))}
        </Section>
      </ScrollView>
    </Screen>
  );
}

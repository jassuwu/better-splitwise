import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

/** A password-style input with a show/hide toggle, for API keys. */
export function SecretInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View className="flex-row items-center bg-surface2 rounded-2xl px-4 border border-hairline">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#5B616C"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!show}
        className="flex-1 text-text font-mono py-3.5"
        style={{ fontVariant: ['tabular-nums'] }}
      />
      <Pressable onPress={() => setShow((s) => !s)} hitSlop={10}>
        <Text className="text-volt text-sm font-body-medium">{show ? 'hide' : 'show'}</Text>
      </Pressable>
    </View>
  );
}

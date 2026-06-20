import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

/** A round avatar — Splitwise profile photo when available, else the name initial. */
export function Avatar({ name, uri, size = 36 }: { name: string; uri?: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(84,84,88,0.6)',
      }}
      className="overflow-hidden bg-cell2 items-center justify-center">
      {uri ? (
        <Image source={uri} style={{ width: size, height: size }} contentFit="cover" transition={150} />
      ) : (
        <Text className="text-label" style={{ fontSize: Math.round(size * 0.42), fontWeight: '600' }}>
          {initial}
        </Text>
      )}
    </View>
  );
}

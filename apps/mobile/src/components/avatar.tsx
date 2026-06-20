import { Image } from 'expo-image';
import { Text, View } from 'react-native';

/** A round avatar — Splitwise profile photo when available, else the name initial. */
export function Avatar({ name, uri, size = 44 }: { name: string; uri?: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}
      className="overflow-hidden bg-surface2 items-center justify-center">
      {uri ? (
        <Image source={uri} style={{ width: size, height: size }} contentFit="cover" transition={150} />
      ) : (
        <Text className="text-text font-display" style={{ fontSize: Math.round(size * 0.4) }}>
          {initial}
        </Text>
      )}
    </View>
  );
}

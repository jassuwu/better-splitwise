import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

/**
 * True only on iOS 26+, where @expo/ui SwiftUI controls render real Liquid Glass.
 * Everywhere else (web/PWA, Android, iOS < 26) callers fall back to the NativeWind UI.
 */
export function nativeGlass(): boolean {
  return Platform.OS === 'ios' && isLiquidGlassAvailable();
}

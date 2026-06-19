import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({ children }: { children: ReactNode }) {
  return <ThemedView style={styles.screen}>{children}</ThemedView>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && styles.dim]}>
      <ThemedText type="smallBold" style={styles.buttonLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Money({
  amount,
  currency,
  bold,
  color,
}: {
  amount: number;
  currency: string;
  bold?: boolean;
  color?: string;
}) {
  const sign = amount < 0 ? '-' : '';
  return (
    <ThemedText type={bold ? 'smallBold' : 'small'} style={color ? { color } : undefined}>
      {sign}
      {currency ? `${currency} ` : ''}
      {Math.abs(amount).toFixed(2)}
    </ThemedText>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const theme = useTheme();
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.backgroundSelected },
      ]}>
      <ThemedText type="smallBold">{initial}</ThemedText>
    </View>
  );
}

export function Loading() {
  return <ActivityIndicator style={styles.loading} />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" style={styles.error}>
      {children}
    </ThemedText>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: { padding: Spacing.three, borderRadius: 16, gap: Spacing.two },
  button: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLabel: { color: '#ffffff' },
  dim: { opacity: 0.5 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  loading: { marginVertical: Spacing.four },
  error: { color: '#e5484d' },
  empty: { textAlign: 'center', marginVertical: Spacing.four },
});

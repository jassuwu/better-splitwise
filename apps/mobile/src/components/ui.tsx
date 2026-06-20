import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

export function Screen({ children }: { children: ReactNode }) {
  return <View className="flex-1 bg-ink">{children}</View>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('bg-surface rounded-3xl p-4', className)}>{children}</View>;
}

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  className,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
}) {
  const shell =
    variant === 'primary' ? 'bg-brand' : variant === 'danger' ? 'border border-owe' : 'border border-hairline';
  const text = variant === 'danger' ? 'text-owe' : 'text-white';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn('rounded-2xl py-3.5 items-center active:opacity-80', shell, disabled && 'opacity-50', className)}>
      <Text className={cn('font-semibold text-base', text)}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn('rounded-full px-4 py-2 border active:opacity-70', active ? 'bg-brand border-brand' : 'border-hairline')}>
      <Text className={cn('text-sm', active ? 'text-white font-medium' : 'text-muted')}>{label}</Text>
    </Pressable>
  );
}

export function Money({ amount, currency, className }: { amount: number; currency: string; className?: string }) {
  const sign = amount < 0 ? '-' : '';
  const color = Math.abs(amount) < 0.005 ? 'text-muted' : amount > 0 ? 'text-owed' : 'text-owe';
  return (
    <Text className={cn('font-semibold', color, className)}>
      {sign}
      {currency ? `${currency} ` : ''}
      {Math.abs(amount).toFixed(2)}
    </Text>
  );
}

export function Loading() {
  return <ActivityIndicator className="my-8" color="#7c5cff" />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text className="text-owe text-sm">{children}</Text>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text className="text-muted text-center my-8">{children}</Text>;
}

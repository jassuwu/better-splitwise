import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AtmosphereField, type Glow } from '@/components/atmosphere';
import { PressableScale } from '@/components/press';
import { cn } from '@/lib/cn';

export function Screen({ children, glow = 'volt' }: { children: ReactNode; glow?: Glow }) {
  return (
    <View className="flex-1 bg-ink">
      <AtmosphereField glow={glow} />
      {children}
    </View>
  );
}

/** The big balance number: eyebrow + DM-Mono figure, cents dimmed, coloured by standing. */
export function Hero({
  eyebrow,
  amount,
  currency,
  sign,
}: {
  eyebrow: string;
  amount: number;
  currency: string;
  sign: 'owed' | 'owe' | 'settled';
}) {
  const color = sign === 'owed' ? 'text-owed' : sign === 'owe' ? 'text-owe' : 'text-text';
  const [whole, cents] = Math.abs(amount).toFixed(2).split('.');
  return (
    <View className="items-center py-7">
      <Text className="text-muted text-[11px] font-body-medium uppercase mb-3" style={{ letterSpacing: 1.6 }}>
        {eyebrow}
      </Text>
      <View className="flex-row items-baseline">
        {currency ? <Text className="text-faint font-mono text-xl mr-1.5">{currency}</Text> : null}
        <Text className={cn('font-mono text-6xl', color)} style={{ letterSpacing: -1.5 }}>
          {whole}
        </Text>
        <Text className={cn('font-mono text-3xl', color)} style={{ opacity: 0.45 }}>
          .{cents}
        </Text>
      </View>
    </View>
  );
}

/** A matte data card. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('bg-surface rounded-3xl p-4 border border-hairline', className)}>{children}</View>;
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
  const shell = variant === 'primary' ? 'bg-volt' : variant === 'danger' ? 'border border-owe' : 'border border-hairline';
  const text = variant === 'primary' ? 'text-ink' : variant === 'danger' ? 'text-owe' : 'text-text';
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      className={cn('rounded-2xl py-3.5 items-center', shell, disabled && 'opacity-50', className)}>
      <Text className={cn('font-body-semibold text-base', text)}>{label}</Text>
    </PressableScale>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      className={cn('rounded-full px-4 py-2 border', active ? 'bg-volt/10 border-volt' : 'border-hairline')}>
      <Text className={cn('text-sm font-body-medium', active ? 'text-volt' : 'text-muted')}>{label}</Text>
    </PressableScale>
  );
}

export function Money({ amount, currency, className }: { amount: number; currency: string; className?: string }) {
  const sign = amount < 0 ? '-' : '';
  const color = Math.abs(amount) < 0.005 ? 'text-faint' : amount > 0 ? 'text-owed' : 'text-owe';
  return (
    <Text className={cn('font-mono', color, className)} style={{ fontVariant: ['tabular-nums'] }}>
      {sign}
      {currency ? `${currency} ` : ''}
      {Math.abs(amount).toFixed(2)}
    </Text>
  );
}

/** A list whose rows merge into one continuous smoked-glass sheet (iOS 26 liquid-merge). */
export function GlassList({ children }: { children: ReactNode }) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassContainer spacing={10} style={{ gap: 8 }}>
        {children}
      </GlassContainer>
    );
  }
  return <View className="gap-2">{children}</View>;
}

export function GlassRow({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const inner = <View className="p-4 flex-row items-center gap-3">{children}</View>;
  if (isLiquidGlassAvailable()) {
    return (
      <PressableScale onPress={onPress}>
        <GlassView glassEffectStyle="regular" tintColor="rgba(22,26,32,0.55)" style={{ borderRadius: 24, overflow: 'hidden' }}>
          {inner}
        </GlassView>
      </PressableScale>
    );
  }
  return (
    <PressableScale onPress={onPress} className="bg-surface rounded-3xl border border-hairline">
      {inner}
    </PressableScale>
  );
}

export function Loading() {
  return <ActivityIndicator className="my-8" color="#B8FF3C" />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text className="text-owe text-sm font-body">{children}</Text>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text className="text-muted text-center my-8 font-body">{children}</Text>;
}

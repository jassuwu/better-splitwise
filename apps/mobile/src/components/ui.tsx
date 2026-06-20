import { Ionicons } from '@expo/vector-icons';
import { Button as UIButton, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled as disabledMod, foregroundStyle, frame, tint } from '@expo/ui/swift-ui/modifiers';
import { Children, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { PressableScale } from '@/components/press';
import { cn } from '@/lib/cn';
import { nativeGlass } from '@/lib/native-glass';

export function Screen({ children }: { children: ReactNode }) {
  return <View className="flex-1 bg-groupedBg">{children}</View>;
}

/** An inset-grouped section: optional sentence-case header + an opaque rounded card of rows. */
export function Section({
  children,
  header,
  sepInset = 16,
  className,
}: {
  children: ReactNode;
  header?: string;
  sepInset?: number;
  className?: string;
}) {
  const items = Children.toArray(children);
  return (
    <View className={cn('mb-6', className)}>
      {header ? <Text className="text-secondaryLabel text-[13px] px-4 pb-2">{header}</Text> : null}
      <View className="bg-cell rounded-2xl overflow-hidden">
        {items.map((child, i) => (
          <View key={i}>
            {i > 0 ? (
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(84,84,88,0.6)', marginLeft: sepInset }} />
            ) : null}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

export function Row({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const content = (
    <View className="flex-row items-center gap-3 px-4" style={{ minHeight: 44, paddingVertical: 11 }}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { backgroundColor: '#2C2C2E' } : undefined)}>
      {content}
    </Pressable>
  );
}

export function Chevron() {
  return <Ionicons name="chevron-forward" size={16} color="rgba(235,235,245,0.3)" />;
}

/** A generic opaque grouped container for non-list content. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('bg-cell rounded-2xl p-4', className)}>{children}</View>;
}

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  className,
  systemImage,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
  systemImage?: SFSymbol;
}) {
  // iOS 26 — native Liquid Glass button (.glassProminent for the primary CTA, .glass otherwise)
  if (nativeGlass()) {
    const mods = [
      buttonStyle(variant === 'primary' ? 'glassProminent' : 'glass'),
      controlSize('large'),
      frame({ maxWidth: 1000 }),
      // lime is a LIGHT accent: filled prominent button needs a dark label; ghost gets a lime label
      ...(variant === 'primary' ? [tint('#d4fd80'), foregroundStyle('#0a0a0a')] : []),
      ...(variant === 'ghost' ? [tint('#d4fd80')] : []),
      ...(disabled ? [disabledMod(true)] : []),
    ];
    return (
      <Host matchContents={{ vertical: true }} colorScheme="dark" style={{ alignSelf: 'stretch' }}>
        <UIButton
          label={label}
          systemImage={systemImage}
          role={variant === 'danger' ? 'destructive' : undefined}
          onPress={onPress}
          modifiers={mods}
        />
      </Host>
    );
  }

  const shell = variant === 'primary' ? 'bg-tint' : variant === 'ghost' ? 'border border-separator' : '';
  const text = variant === 'primary' ? 'text-[#0a0a0a]' : variant === 'danger' ? 'text-red' : 'text-label';
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      className={cn('rounded-2xl items-center justify-center px-4', shell, disabled && 'opacity-40', className)}>
      <View style={{ minHeight: 50, justifyContent: 'center' }}>
        <Text className={cn('text-[17px] font-semibold', text)}>{label}</Text>
      </View>
    </PressableScale>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  // iOS 26 — a capsule glass button; selected reads as the tinted prominent glass
  if (nativeGlass()) {
    return (
      <Host matchContents colorScheme="dark">
        <UIButton
          label={label}
          onPress={onPress}
          modifiers={
            active
              ? [buttonStyle('glassProminent'), tint('#d4fd80'), foregroundStyle('#0a0a0a'), controlSize('regular')]
              : [buttonStyle('glass'), controlSize('regular')]
          }
        />
      </Host>
    );
  }
  return (
    <PressableScale
      onPress={onPress}
      className={cn('rounded-full px-4 py-2', active ? 'border border-tint' : 'bg-fill3')}>
      <Text className={cn('text-[15px]', active ? 'text-tint' : 'text-label')}>{label}</Text>
    </PressableScale>
  );
}

/** The big balance figure — SF Pro, tabular, semantic colour, cents same size. */
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
  const colorCls = sign === 'owed' ? 'text-green' : sign === 'owe' ? 'text-red' : 'text-secondaryLabel';
  return (
    <View className="items-center py-6">
      <Text className="text-secondaryLabel text-[13px] mb-2">{eyebrow}</Text>
      <View className="flex-row items-baseline">
        {currency ? (
          <Text className="text-secondaryLabel" style={{ fontSize: 24, fontWeight: '600' }}>
            {currency}{' '}
          </Text>
        ) : null}
        <Text className={colorCls} style={{ fontSize: 52, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {Math.abs(amount).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

export function Money({ amount, currency, className }: { amount: number; currency: string; className?: string }) {
  const sign = amount < 0 ? '-' : '';
  const colorCls = Math.abs(amount) < 0.005 ? 'text-secondaryLabel' : amount > 0 ? 'text-green' : 'text-red';
  return (
    <Text className={cn('text-[17px]', colorCls, className)} style={{ fontVariant: ['tabular-nums'] }}>
      {sign}
      {currency ? `${currency} ` : ''}
      {Math.abs(amount).toFixed(2)}
    </Text>
  );
}

export function Loading() {
  return <ActivityIndicator className="my-8" />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text className="text-red text-[15px]">{children}</Text>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text className="text-secondaryLabel text-center my-8 text-[15px]">{children}</Text>;
}

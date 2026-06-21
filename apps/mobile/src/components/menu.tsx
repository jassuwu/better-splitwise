import { Ionicons } from '@expo/vector-icons';
import { Button as UIButton, Host, Menu, Picker, Text as UIText } from '@expo/ui/swift-ui';
import { pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import type { ComponentProps } from 'react';
import { Pressable, Text } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { nativeGlass } from '@/lib/native-glass';
import { showActionSheet } from '@/lib/sheet';

export interface MenuItem {
  label: string;
  systemImage?: SFSymbol;
  destructive?: boolean;
  onPress: () => void;
}

/** A native iOS 26 Liquid Glass pull-down menu of actions, anchored to an icon button. */
export function GlassMenu({
  systemImage,
  icon,
  items,
  title,
}: {
  systemImage: SFSymbol;
  icon: ComponentProps<typeof Ionicons>['name'];
  items: MenuItem[];
  title?: string;
}) {
  if (nativeGlass()) {
    return (
      <Host matchContents colorScheme="dark">
        <Menu label="" systemImage={systemImage} modifiers={[tint('#d4fd80')]}>
          {items.map((it, i) => (
            <UIButton
              key={`${it.label}-${i}`}
              label={it.label}
              systemImage={it.systemImage}
              role={it.destructive ? 'destructive' : undefined}
              onPress={it.onPress}
            />
          ))}
        </Menu>
      </Host>
    );
  }
  return (
    <Pressable
      onPress={() => showActionSheet(items, title)}
      hitSlop={10}
      className="items-center justify-center rounded-full bg-fill3 active:opacity-70"
      style={{ width: 40, height: 40 }}>
      <Ionicons name={icon} size={24} color="#d4fd80" />
    </Pressable>
  );
}

/** A native iOS 26 glass menu for picking one value (SwiftUI Picker, menu style). */
export function MenuPicker<T extends string>({
  options,
  value,
  onChange,
  title,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  title?: string;
}) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? '—';
  if (nativeGlass()) {
    return (
      <Host matchContents colorScheme="dark">
        <Picker selection={value} onSelectionChange={(v) => onChange(v as T)} modifiers={[pickerStyle('menu'), tint('#d4fd80')]}>
          {options.map((o) => (
            <UIText key={o.value} modifiers={[tag(o.value)]}>
              {o.label}
            </UIText>
          ))}
        </Picker>
      </Host>
    );
  }
  return (
    <Pressable
      onPress={() =>
        showActionSheet(
          options.map((o) => ({ label: o.label, onPress: () => onChange(o.value) })),
          title,
        )
      }
      className="flex-row items-center gap-1 active:opacity-60">
      <Text className="text-secondaryLabel text-[17px]" numberOfLines={1}>
        {selectedLabel}
      </Text>
      <Ionicons name="chevron-expand" size={15} color="rgba(235,235,245,0.5)" />
    </Pressable>
  );
}

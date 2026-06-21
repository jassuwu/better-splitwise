import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dismissSheet, useSheet } from '@/lib/sheet';

const SEP = { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(84,84,88,0.6)' } as const;

/**
 * Renders the active cross-platform sheet/prompt (Android / web). On iOS this is
 * inert — showActionSheet/showPrompt use the native components and never set state.
 * Mount once at the root.
 */
export function SheetHost() {
  const req = useSheet();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  useEffect(() => {
    if (req?.kind === 'prompt') setText(req.defaultValue ?? '');
  }, [req]);

  return (
    <Modal visible={req !== null} transparent animationType="fade" onRequestClose={dismissSheet} statusBarTranslucent>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={dismissSheet}>
        {req?.kind === 'action' ? (
          <Pressable onPress={() => undefined} className="bg-cell rounded-t-3xl overflow-hidden" style={{ paddingBottom: insets.bottom + 10 }}>
            {req.title ? <Text className="text-secondaryLabel text-center text-[13px] py-3.5">{req.title}</Text> : null}
            {req.items.map((it, i) => (
              <Pressable
                key={`${it.label}-${i}`}
                onPress={() => {
                  dismissSheet();
                  it.onPress();
                }}
                style={({ pressed }) => (pressed ? { backgroundColor: '#2C2C2E' } : undefined)}>
                <View style={i > 0 || req.title ? SEP : undefined} />
                <View className="px-5 items-center justify-center" style={{ minHeight: 56 }}>
                  <Text className={it.destructive ? 'text-red text-[17px]' : 'text-label text-[17px]'}>{it.label}</Text>
                </View>
              </Pressable>
            ))}
            <View style={{ height: 8, backgroundColor: '#000' }} />
            <Pressable onPress={dismissSheet}>
              <View className="px-5 items-center justify-center" style={{ minHeight: 54 }}>
                <Text className="text-tint text-[17px] font-semibold">Cancel</Text>
              </View>
            </Pressable>
          </Pressable>
        ) : req?.kind === 'prompt' ? (
          <Pressable onPress={() => undefined} className="bg-cell rounded-t-3xl px-5 pt-5" style={{ paddingBottom: insets.bottom + 16 }}>
            <Text className="text-label text-[17px] font-semibold mb-1">{req.title}</Text>
            {req.message ? <Text className="text-secondaryLabel text-[14px] mb-3">{req.message}</Text> : null}
            <TextInput
              value={text}
              onChangeText={setText}
              autoFocus
              keyboardType={req.keyboardType ?? 'default'}
              placeholder={req.placeholder}
              placeholderTextColor="rgba(235,235,245,0.3)"
              className="bg-cell2 rounded-xl px-4 py-3 text-label text-[17px] mt-1"
              style={{ fontVariant: ['tabular-nums'] }}
            />
            <View className="flex-row gap-3 mt-4">
              <Pressable onPress={dismissSheet} className="flex-1 bg-fill3 rounded-xl items-center justify-center" style={{ minHeight: 48 }}>
                <Text className="text-label text-[16px]">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const t = text;
                  dismissSheet();
                  req.onSubmit(t);
                }}
                className="flex-1 bg-tint rounded-xl items-center justify-center"
                style={{ minHeight: 48 }}>
                <Text className="text-[#0a0a0a] text-[16px] font-semibold">{req.submitLabel ?? 'Set'}</Text>
              </Pressable>
            </View>
          </Pressable>
        ) : (
          <View />
        )}
      </Pressable>
    </Modal>
  );
}

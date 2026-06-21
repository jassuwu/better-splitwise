import { useSyncExternalStore } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

// A cross-platform action sheet + prompt. On iOS we use the native components;
// off iOS (Android / web) we push a request to this store and <SheetHost> renders
// a styled Modal. This replaces the iOS-only ActionSheetIOS / Alert.prompt calls.

export interface SheetItem {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

export interface ActionRequest {
  kind: 'action';
  id: number;
  title?: string;
  items: SheetItem[];
}
export interface PromptRequest {
  kind: 'prompt';
  id: number;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
  submitLabel?: string;
  onSubmit: (text: string) => void;
}
export type SheetRequest = ActionRequest | PromptRequest;

let current: SheetRequest | null = null;
let seq = 0;
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export function dismissSheet() {
  current = null;
  emit();
}

export function useSheet(): SheetRequest | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
}

export function showActionSheet(items: SheetItem[], title?: string): void {
  if (Platform.OS === 'ios') {
    const destructiveButtonIndex = items.findIndex((i) => i.destructive);
    const options = [...items.map((i) => i.label), 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
        title,
        userInterfaceStyle: 'dark',
      },
      (i) => {
        if (i !== undefined && i < items.length) items[i]?.onPress();
      },
    );
    return;
  }
  current = { kind: 'action', id: ++seq, title, items };
  emit();
}

export function showPrompt(opts: {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
  submitLabel?: string;
  onSubmit: (text: string) => void;
}): void {
  if (Platform.OS === 'ios') {
    Alert.prompt(
      opts.title,
      opts.message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: opts.submitLabel ?? 'Set', onPress: (t?: string) => opts.onSubmit(t ?? '') },
      ],
      'plain-text',
      opts.defaultValue,
      opts.keyboardType ?? 'default',
    );
    return;
  }
  current = { kind: 'prompt', id: ++seq, ...opts };
  emit();
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'splitwise_api_key';

// expo-secure-store is native-only; fall back to localStorage on web (PWA).
interface WebStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
function webStore(): WebStore | undefined {
  return (globalThis as { localStorage?: WebStore }).localStorage;
}

export async function getApiKey(): Promise<string | null> {
  if (Platform.OS === 'web') return webStore()?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function setApiKey(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

export async function clearApiKey(): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}

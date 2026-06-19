import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store is native-only; fall back to localStorage on web (PWA).
interface WebStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
function webStore(): WebStore | undefined {
  return (globalThis as { localStorage?: WebStore }).localStorage;
}

async function getKey(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webStore()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function setKey(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}
async function clearKey(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

const SPLITWISE_KEY = 'splitwise_api_key';
const GEMINI_KEY = 'gemini_api_key';

export const getApiKey = () => getKey(SPLITWISE_KEY);
export const setApiKey = (value: string) => setKey(SPLITWISE_KEY, value);
export const clearApiKey = () => clearKey(SPLITWISE_KEY);

export const getGeminiKey = () => getKey(GEMINI_KEY);
export const setGeminiKey = (value: string) => setKey(GEMINI_KEY, value);
export const clearGeminiKey = () => clearKey(GEMINI_KEY);

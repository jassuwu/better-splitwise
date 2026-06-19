import type { Receipt } from '@repo/split-core';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { createOcrProvider } from './ocr';

const MAX_WIDTH = 1500;

/**
 * Pick (or snap) a receipt image, downscale it to control token cost, and
 * extract structured data via the OCR provider. Returns null if cancelled.
 */
export async function scanReceipt(source: 'library' | 'camera' = 'library'): Promise<Receipt | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error(`${source} permission denied`);

  const picked =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 });
  const asset = picked.assets?.[0];
  if (picked.canceled || !asset) return null;

  const width = Math.min(MAX_WIDTH, asset.width ?? MAX_WIDTH);
  const rendered = await ImageManipulator.manipulate(asset.uri).resize({ width }).renderAsync();
  const out = await rendered.saveAsync({ format: SaveFormat.JPEG, base64: true });
  if (!out.base64) throw new Error('failed to encode image');

  return createOcrProvider().extractReceipt({ base64: out.base64, mimeType: 'image/jpeg' });
}

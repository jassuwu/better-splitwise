import { reconcileReceipt } from '@repo/ocr';
import type { Receipt } from '@repo/split-core';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createOcrProvider } from '@/lib/ocr';
import { getGeminiKey, setGeminiKey } from '@/lib/token-store';

const MAX_WIDTH = 1500;

function SummaryRow({
  label,
  value,
  currency,
  bold,
}: {
  label: string;
  value: number | undefined;
  currency: string;
  bold?: boolean;
}) {
  if (value === undefined) return null;
  const type = bold ? 'smallBold' : 'small';
  return (
    <ThemedView style={styles.itemRow}>
      <ThemedText type={type} style={styles.flex}>
        {label}
      </ThemedText>
      <ThemedText type={type}>
        {currency} {value.toFixed(2)}
      </ThemedText>
    </ThemedView>
  );
}

export default function ScanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    void getGeminiKey().then((k) => setHasKey(!!k));
  }, []);

  async function saveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    await setGeminiKey(trimmed);
    setHasKey(true);
    setKeyInput('');
  }

  async function scan(source: 'library' | 'camera') {
    setError(null);
    setReceipt(null);
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError(`${source} permission denied`);
        return;
      }
      const picked =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 });
      const asset = picked.assets?.[0];
      if (picked.canceled || !asset) return;

      setBusy(true);
      // Downscale to control token cost (the single biggest OCR cost lever).
      const width = Math.min(MAX_WIDTH, asset.width ?? MAX_WIDTH);
      const rendered = await ImageManipulator.manipulate(asset.uri).resize({ width }).renderAsync();
      const out = await rendered.saveAsync({ format: SaveFormat.JPEG, base64: true });
      if (!out.base64) throw new Error('failed to encode image');

      const result = await createOcrProvider().extractReceipt({ base64: out.base64, mimeType: 'image/jpeg' });
      setReceipt(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const recon = receipt ? reconcileReceipt(receipt) : null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}>
        <ThemedText type="subtitle">Scan</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          snap a receipt → Gemini extracts the items, tax, tip and total.
        </ThemedText>

        {!hasKey && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small">Gemini API key (aistudio.google.com → API key)</ThemedText>
            <TextInput
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="gemini api key"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <Pressable onPress={saveKey} style={styles.button}>
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                Save key
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {hasKey && (
          <ThemedView style={styles.row}>
            <Pressable onPress={() => scan('camera')} disabled={busy} style={[styles.button, styles.flex, busy && styles.dim]}>
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                Take photo
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => scan('library')} disabled={busy} style={[styles.button, styles.flex, busy && styles.dim]}>
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                Pick image
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {busy && <ActivityIndicator />}
        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        {receipt && recon && (
          <ThemedView type="backgroundElement" style={styles.card}>
            {receipt.merchant && <ThemedText type="smallBold">{receipt.merchant}</ThemedText>}
            {receipt.items.map((it, i) => (
              <ThemedView key={i} style={styles.itemRow}>
                <ThemedText type="small" style={styles.flex}>
                  {it.quantity > 1 ? `${it.quantity}× ` : ''}
                  {it.description}
                </ThemedText>
                <ThemedText type="small">{it.total.toFixed(2)}</ThemedText>
              </ThemedView>
            ))}
            <ThemedView style={styles.divider} />
            <SummaryRow label="subtotal" value={receipt.subtotal} currency={receipt.currency} />
            <SummaryRow label="tax" value={receipt.tax} currency={receipt.currency} />
            <SummaryRow label="tip" value={receipt.tip} currency={receipt.currency} />
            <SummaryRow label="service" value={receipt.service} currency={receipt.currency} />
            <SummaryRow label="fees" value={receipt.fees} currency={receipt.currency} />
            <SummaryRow label="total" value={receipt.total} currency={receipt.currency} bold />
            <ThemedText type="small" style={{ color: recon.ok ? '#30a46c' : '#e5484d' }}>
              {recon.ok ? 'reconciles ✓' : `off by ${(recon.deltaCents / 100).toFixed(2)} — check the items`}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  divider: { height: 1, backgroundColor: '#8884', marginVertical: Spacing.one },
  input: { borderWidth: 1, borderRadius: 8, padding: Spacing.two },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
  },
  dim: { opacity: 0.6 },
  buttonLabel: { color: '#ffffff' },
  error: { color: '#e5484d' },
});

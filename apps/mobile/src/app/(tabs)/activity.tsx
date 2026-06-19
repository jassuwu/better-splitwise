import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Empty, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function Activity() {
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}>
        <ThemedText type="subtitle">Activity</ThemedText>
        <Empty>coming soon</Empty>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
});

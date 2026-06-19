import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Empty, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function Settle() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Settle up</ThemedText>
        <Empty>coming soon</Empty>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
});

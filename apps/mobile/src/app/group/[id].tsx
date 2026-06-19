import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Empty, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">group {id}</ThemedText>
        <Empty>coming soon</Empty>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
});

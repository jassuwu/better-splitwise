import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, PrimaryButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { displayName } from '@/lib/format';
import { useCurrentUser } from '@/lib/queries';
import { clearApiKey, clearGeminiKey } from '@/lib/token-store';

export default function You() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useAuth();
  const user = useCurrentUser();

  async function signOut() {
    await clearApiKey();
    await clearGeminiKey();
    await refresh();
    router.replace('/onboarding');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}>
        <ThemedText type="subtitle">You</ThemedText>
        {user.data && (
          <Card style={styles.profile}>
            <Avatar name={displayName(user.data)} size={56} />
            <ThemedText type="default">{displayName(user.data)}</ThemedText>
            {user.data.email && (
              <ThemedText type="small" themeColor="textSecondary">
                {user.data.email}
              </ThemedText>
            )}
            {user.data.default_currency && (
              <ThemedText type="small" themeColor="textSecondary">
                default currency · {user.data.default_currency}
              </ThemedText>
            )}
          </Card>
        )}
        <PrimaryButton label="Sign out" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  profile: { alignItems: 'center', gap: Spacing.one },
});

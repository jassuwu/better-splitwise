import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** A floating Liquid Glass action button (the primary Add). Falls back to a solid accent circle. */
export function GlassFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.wrap} accessibilityRole="button" accessibilityLabel="Add expense">
      {isLiquidGlassAvailable() ? (
        <GlassView glassEffectStyle="regular" isInteractive tintColor="#3c87f7" style={styles.fab}>
          <Text style={styles.plus}>＋</Text>
        </GlassView>
      ) : (
        <View style={[styles.fab, styles.solid]}>
          <Text style={styles.plus}>＋</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 20, bottom: 28 },
  fab: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  solid: { backgroundColor: '#3c87f7' },
  plus: { fontSize: 32, lineHeight: 36, color: '#ffffff' },
});

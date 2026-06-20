import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export type Glow = 'volt' | 'ember' | 'none';

/**
 * The graphite atmosphere: dimensional black-metal gradient + one soft, slowly
 * breathing glow (volt when you're owed/settled, warm ember when you owe). This
 * is the only colour in the room and the thing every glass surface refracts.
 */
export function AtmosphereField({ glow = 'volt' }: { glow?: Glow }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [t]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + t.value * 0.08,
    transform: [{ translateY: t.value * 12 }],
  }));

  const hue = glow === 'ember' ? '#FF9A6B' : '#B8FF3C';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#07080A', '#0E1014', '#14181E']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {glow !== 'none' && (
        <Animated.View style={[styles.heroGlow, heroStyle]}>
          <LinearGradient colors={[`${hue}33`, `${hue}00`]} start={{ x: 0.3, y: 0.1 }} end={{ x: 0.85, y: 1 }} style={styles.fill} />
        </Animated.View>
      )}
      <View style={styles.dockGlow}>
        <LinearGradient colors={['#B8FF3C26', '#B8FF3C00']} start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }} style={styles.fill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, borderRadius: 220 },
  heroGlow: { position: 'absolute', top: 16, left: -50, width: 400, height: 400, borderRadius: 220 },
  dockGlow: { position: 'absolute', bottom: -40, alignSelf: 'center', width: 300, height: 240, borderRadius: 200, opacity: 0.85 },
});

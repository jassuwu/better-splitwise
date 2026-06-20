import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SPRING = { damping: 20, stiffness: 320 };

/** A pressable that springs down on touch — crisp, mechanical, not bouncy. */
export function PressableScale({
  children,
  onPress,
  className,
  to = 0.97,
  disabled,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  to?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        s.value = withSpring(to, SPRING);
      }}
      onPressOut={() => {
        s.value = withSpring(1, SPRING);
      }}>
      <Animated.View style={style} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

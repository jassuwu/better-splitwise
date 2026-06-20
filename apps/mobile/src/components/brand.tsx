import { Text } from 'react-native';

import { cn } from '@/lib/cn';

/** The super·splitwise wordmark — "super" carries the one volt accent. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Text className={cn('font-display-bold tracking-tight', className)}>
      <Text className="text-volt">super</Text>
      <Text className="text-text">·splitwise</Text>
    </Text>
  );
}

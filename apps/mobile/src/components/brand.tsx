import { Text } from 'react-native';

import { cn } from '@/lib/cn';

/** The super·splitwise wordmark. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Text className={cn('font-extrabold tracking-tight', className)}>
      <Text className="text-brand">super</Text>
      <Text className="text-white">·splitwise</Text>
    </Text>
  );
}

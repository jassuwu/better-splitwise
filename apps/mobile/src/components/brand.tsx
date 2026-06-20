import { Text } from 'react-native';

import { cn } from '@/lib/cn';

/** The super·splitwise wordmark — "super" carries the systemRed tint. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Text className={cn(className)} style={{ fontWeight: '700' }}>
      <Text className="text-tint">super</Text>
      <Text className="text-label">·splitwise</Text>
    </Text>
  );
}

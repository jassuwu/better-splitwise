import { Text } from 'react-native';

import { cn } from '@/lib/cn';

/** The better splitwise wordmark — "better" carries the accent. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Text className={cn(className)} style={{ fontWeight: '700' }}>
      <Text className="text-tint">better</Text>
      <Text className="text-label"> splitwise</Text>
    </Text>
  );
}

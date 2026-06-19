import { SplitwiseClient } from '@repo/splitwise';

import { getApiKey } from './token-store';

/** A Splitwise client that pulls the BYO personal key from secure storage on each request. */
export function createSplitwiseClient(): SplitwiseClient {
  return new SplitwiseClient({
    token: async () => {
      const key = await getApiKey();
      if (!key) throw new Error('No Splitwise API key configured');
      return key;
    },
  });
}

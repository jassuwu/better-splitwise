import { useRouter, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getApiKey } from './token-store';

interface AuthState {
  ready: boolean;
  hasKey: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  ready: false,
  hasKey: false,
  refresh: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  async function refresh() {
    const key = await getApiKey();
    setHasKey(!!key);
    setReady(true);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useProtectedRoute(ready, hasKey);

  return <AuthContext.Provider value={{ ready, hasKey, refresh }}>{children}</AuthContext.Provider>;
}

// Redirect to onboarding when no Splitwise key is set, and away from it once connected.
function useProtectedRoute(ready: boolean, hasKey: boolean) {
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!hasKey && !inOnboarding) router.replace('/onboarding');
    else if (hasKey && inOnboarding) router.replace('/(tabs)');
  }, [ready, hasKey, segments, router]);
}

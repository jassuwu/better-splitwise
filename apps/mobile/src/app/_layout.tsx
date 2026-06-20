import '../../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlatformColor } from 'react-native';

import { AuthProvider } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#FF453A', background: '#000000' },
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <AuthProvider>
          <Stack screenOptions={{ headerTintColor: PlatformColor('systemRed') }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="settle" options={{ presentation: 'modal', title: 'Settle up' }} />
            <Stack.Screen name="assign" options={{ presentation: 'modal', title: 'Split by item' }} />
            <Stack.Screen name="friend/[id]" options={{ title: '' }} />
            <Stack.Screen name="group/[id]" options={{ title: '' }} />
            <Stack.Screen name="expense/[id]" options={{ title: '' }} />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

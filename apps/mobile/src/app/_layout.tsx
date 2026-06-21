import '../../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

import { SheetHost } from '@/components/sheet-host';
import { AuthProvider } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#d4fd80', background: '#000000' },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navTheme}>
          <AuthProvider>
            <Stack screenOptions={{ headerTintColor: '#d4fd80', headerBackButtonDisplayMode: 'minimal' }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="settle" options={{ presentation: 'modal', title: 'Settle up' }} />
              <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="currency" options={{ presentation: 'modal', title: 'Currency' }} />
              <Stack.Screen name="new-group" options={{ presentation: 'modal', title: 'New group' }} />
              <Stack.Screen name="invite" options={{ presentation: 'modal', title: 'Add people' }} />
              <Stack.Screen name="friend/[id]" options={{ title: '' }} />
              <Stack.Screen name="group/[id]" options={{ title: '' }} />
              <Stack.Screen name="expense/[id]" options={{ title: '' }} />
            </Stack>
            <Toaster
              theme="dark"
              position="top-center"
              offset={16}
              duration={4500}
              toastOptions={{
                style: { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e', borderWidth: 1 },
                actionButtonStyle: { backgroundColor: '#d4fd80' },
                actionButtonTextStyle: { color: '#0a0a0a', fontWeight: '600' },
              }}
            />
            <SheetHost />
            <StatusBar style="light" />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

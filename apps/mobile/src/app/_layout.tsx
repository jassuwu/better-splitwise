import '../../global.css';

import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';

void SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#07080A', card: '#07080A', border: 'transparent' },
};

const headerOptions = {
  headerStyle: { backgroundColor: '#07080A' },
  headerTintColor: '#F4F6F8',
  headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: '#07080A' },
} as const;

export default function RootLayout() {
  const [loaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <AuthProvider>
          <Stack screenOptions={headerOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="add" options={{ presentation: 'modal', title: 'add expense' }} />
            <Stack.Screen name="settle" options={{ presentation: 'modal', title: 'settle up' }} />
            <Stack.Screen name="assign" options={{ presentation: 'modal', title: 'split by item' }} />
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

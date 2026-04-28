import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AppPreferencesProvider, useAppPreferences } from '@/providers/app-preferences-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <RootNavigator />
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { isPreferencesHydrated, resolvedTheme } = useAppPreferences();

  if (!isPreferencesHydrated) {
    return null;
  }

  const colorScheme = resolvedTheme;
  const colors = Colors[colorScheme];
  const navigationTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      border: colors.border,
      card: colors.surface,
      notification: colors.danger,
      primary: colors.primary,
      text: colors.text,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

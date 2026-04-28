import {
  Colors,
  Fonts,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useAppPreferences } from '@/providers/app-preferences-provider';

export function useTheme() {
  const { resolvedTheme } = useAppPreferences();
  const colorScheme = resolvedTheme;

  return {
    colorScheme,
    colors: Colors[colorScheme],
    fonts: Fonts,
    radius: Radius,
    shadows: Shadows,
    spacing: Spacing,
    typography: Typography,
  };
}

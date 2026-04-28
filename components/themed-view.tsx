import { View, type ViewProps } from 'react-native';

import { Radius, Shadows, Spacing, type ThemeColorName } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  backgroundColor?: ThemeColorName;
  lightColor?: string;
  darkColor?: string;
  padding?: keyof typeof Spacing;
  radius?: keyof typeof Radius;
  shadow?: keyof typeof Shadows;
  variant?: 'background' | 'surface' | 'surfaceMuted' | 'elevated' | 'transparent';
};

const variantBackground: Record<NonNullable<ThemedViewProps['variant']>, ThemeColorName> = {
  background: 'background',
  surface: 'surface',
  surfaceMuted: 'surfaceMuted',
  elevated: 'surfaceElevated',
  transparent: 'background',
};

export function ThemedView({
  style,
  backgroundColor,
  lightColor,
  darkColor,
  padding,
  radius,
  shadow = 'none',
  variant = 'background',
  ...otherProps
}: ThemedViewProps) {
  const backgroundToken = backgroundColor ?? variantBackground[variant];
  const themedBackgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    backgroundToken
  );
  const resolvedBackgroundColor =
    variant === 'transparent' ? 'transparent' : themedBackgroundColor;

  return (
    <View
      style={[
        {
          backgroundColor: resolvedBackgroundColor,
          padding: padding ? Spacing[padding] : undefined,
          borderRadius: radius ? Radius[radius] : undefined,
        },
        Shadows[shadow],
        style,
      ]}
      {...otherProps}
    />
  );
}

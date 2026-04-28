import { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  fullWidth?: boolean;
  icon?: IconSymbolName;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
};

export function Button({
  children,
  disabled,
  fullWidth = false,
  icon,
  size = 'md',
  style,
  textStyle,
  variant = 'primary',
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const palette = getButtonPalette(variant, colors);
  const isTextChild = typeof children === 'string' || typeof children === 'number';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        fullWidth ? styles.fullWidth : undefined,
        {
          backgroundColor: pressed && !disabled ? palette.pressedBackground : palette.background,
          borderColor: palette.border,
        },
        variant === 'ghost' ? styles.ghost : undefined,
        disabled ? styles.disabled : undefined,
        style,
      ]}
      {...rest}>
      {icon ? <IconSymbol name={icon} color={palette.foreground} size={iconSizes[size]} /> : null}
      {isTextChild ? (
        <Text style={[styles.text, textSizeStyles[size], { color: palette.foreground }, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

function getButtonPalette(variant: ButtonVariant, colors: ReturnType<typeof useTheme>['colors']) {
  switch (variant) {
    case 'secondary':
      return {
        background: colors.surfaceMuted,
        pressedBackground: colors.border,
        border: colors.surfaceMuted,
        foreground: colors.text,
      };
    case 'outline':
      return {
        background: 'transparent',
        pressedBackground: colors.surfaceMuted,
        border: colors.borderStrong,
        foreground: colors.text,
      };
    case 'ghost':
      return {
        background: 'transparent',
        pressedBackground: colors.surfaceMuted,
        border: 'transparent',
        foreground: colors.text,
      };
    case 'danger':
      return {
        background: colors.danger,
        pressedBackground: colors.danger,
        border: colors.danger,
        foreground: colors.primaryForeground,
      };
    case 'primary':
    default:
      return {
        background: colors.primary,
        pressedBackground: colors.primaryPressed,
        border: colors.primary,
        foreground: colors.primaryForeground,
      };
  }
}

const iconSizes: Record<ButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 20,
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  ghost: {
    borderWidth: 0,
  },
  disabled: {
    opacity: 0.48,
  },
  text: {
    ...Typography.label,
    textAlign: 'center',
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 12,
    lineHeight: 16,
  },
  md: {
    fontSize: 13,
    lineHeight: 18,
  },
  lg: {
    fontSize: 15,
    lineHeight: 20,
  },
});

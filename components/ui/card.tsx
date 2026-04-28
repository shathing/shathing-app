import { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardVariant = 'flat' | 'outlined' | 'elevated';

type CardProps = PropsWithChildren<
  ViewProps & {
    padding?: keyof typeof Spacing;
    variant?: CardVariant;
  }
>;

export function Card({
  children,
  padding = 'lg',
  style,
  variant = 'flat',
  ...rest
}: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: variant === 'flat' ? colors.border : colors.borderStrong,
          padding: Spacing[padding],
        },
        variant === 'elevated' ? Shadows.sm : undefined,
        variant === 'outlined' ? styles.outlined : undefined,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

export function CardHeader({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.header, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardTitle({ children, ...rest }: ThemedTextProps) {
  return (
    <ThemedText type="heading" {...rest}>
      {children}
    </ThemedText>
  );
}

export function CardDescription({ children, ...rest }: ThemedTextProps) {
  return (
    <ThemedText type="body" color="textMuted" {...rest}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
  header: {
    gap: Spacing.xs,
  },
});

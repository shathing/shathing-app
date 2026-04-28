import { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BadgeTone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

type BadgeProps = PropsWithChildren<
  TextProps & {
    size?: BadgeSize;
    tone?: BadgeTone;
  }
>;

export function Badge({ children, size = 'md', style, tone = 'neutral', ...rest }: BadgeProps) {
  const { colors } = useTheme();
  const palette = getBadgePalette(tone, colors);

  return (
    <Text
      style={[
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: palette.background,
          color: palette.foreground,
        },
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}

function getBadgePalette(tone: BadgeTone, colors: ReturnType<typeof useTheme>['colors']) {
  switch (tone) {
    case 'primary':
      return { background: colors.primary, foreground: colors.primaryForeground };
    case 'accent':
      return { background: colors.accent, foreground: colors.accentForeground };
    case 'success':
      return { background: colors.successMuted, foreground: colors.success };
    case 'warning':
      return { background: colors.warningMuted, foreground: colors.warning };
    case 'danger':
      return { background: colors.dangerMuted, foreground: colors.danger };
    case 'info':
      return { background: colors.infoMuted, foreground: colors.info };
    case 'neutral':
    default:
      return { background: colors.surfaceMuted, foreground: colors.textMuted };
  }
}

const styles = StyleSheet.create({
  base: {
    ...Typography.caption,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});

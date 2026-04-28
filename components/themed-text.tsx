import { StyleSheet, Text, type TextProps } from 'react-native';

import { Typography, type ThemeColorName } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  color?: ThemeColorName;
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'defaultSemiBold'
    | 'display'
    | 'title'
    | 'subtitle'
    | 'heading'
    | 'body'
    | 'bodyStrong'
    | 'label'
    | 'caption'
    | 'link';
};

export function ThemedText({
  style,
  color,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const colorName = color ?? (type === 'link' ? 'primary' : 'text');
  const resolvedColor = useThemeColor({ light: lightColor, dark: darkColor }, colorName);

  return (
    <Text
      style={[
        { color: resolvedColor },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: Typography.body,
  defaultSemiBold: Typography.bodyStrong,
  display: Typography.display,
  title: Typography.title,
  subtitle: Typography.heading,
  heading: Typography.heading,
  body: Typography.body,
  bodyStrong: Typography.bodyStrong,
  label: Typography.label,
  caption: Typography.caption,
  link: Typography.bodyStrong,
});

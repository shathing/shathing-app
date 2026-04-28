// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'arrow.clockwise': 'refresh',
  'arrow.right': 'arrow-forward',
  'bolt.fill': 'bolt',
  'chart.bar.fill': 'bar-chart',
  'checkmark.circle.fill': 'check-circle',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'gearshape.fill': 'settings',
  'globe': 'language',
  'heart.fill': 'favorite',
  'house.fill': 'home',
  'line.3.horizontal.decrease.circle': 'filter-list',
  'magnifyingglass': 'search',
  'message.fill': 'chat-bubble',
  'paintpalette.fill': 'palette',
  'paperplane.fill': 'send',
  'person.2.fill': 'group',
  'person.crop.circle': 'account-circle',
  'photo.fill': 'photo',
  'plus': 'add',
  'rectangle.stack.fill': 'view-agenda',
  'square.and.pencil': 'edit',
} as IconMapping;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

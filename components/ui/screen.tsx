import type { PropsWithChildren } from "react";
import {
	ScrollView,
	type StyleProp,
	StyleSheet,
	View,
	type ViewProps,
	type ViewStyle,
} from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

import { Spacing, type ThemeColorName } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ScreenProps = PropsWithChildren<
	ViewProps & {
		backgroundColor?: ThemeColorName;
		contentStyle?: StyleProp<ViewStyle>;
		edges?: Edge[];
		padded?: boolean;
		scroll?: boolean;
	}
>;

export function Screen({
	backgroundColor = "background",
	children,
	contentStyle,
	edges = ["top", "left", "right"],
	padded = true,
	scroll = false,
	style,
	...rest
}: ScreenProps) {
	const { colors } = useTheme();
	const resolvedBackgroundColor = colors[backgroundColor];
	const contentStyles = [
		styles.content,
		padded ? styles.padded : undefined,
		contentStyle,
	];

	return (
		<SafeAreaView
			edges={edges}
			style={[
				styles.safeArea,
				{ backgroundColor: resolvedBackgroundColor },
				style,
			]}
			{...rest}
		>
			{scroll ? (
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={contentStyles}
					showsVerticalScrollIndicator={false}
				>
					{children}
				</ScrollView>
			) : (
				<View style={contentStyles}>{children}</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
	},
	padded: {
		paddingHorizontal: Spacing.md,
	},
});

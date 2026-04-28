import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { Button } from "./button";
import { Card } from "./card";

export function LoadingState({
	label,
	showIndicator = true,
}: {
	label?: string;
	showIndicator?: boolean;
}) {
	const { colors } = useTheme();

	return (
		<View style={styles.centered}>
			{showIndicator ? <ActivityIndicator color={colors.primary} /> : null}
			{label ? (
				<ThemedText type="body" color="textMuted">
					{label}
				</ThemedText>
			) : null}
		</View>
	);
}

export function RetryState({
	message,
	onRetry,
	retryLabel = "다시 시도",
}: {
	message: string;
	onRetry: () => void;
	retryLabel?: string;
}) {
	return (
		<Card variant="outlined" style={styles.errorCard}>
			<ThemedText type="body" color="textMuted" style={styles.centerText}>
				{message}
			</ThemedText>
			<Button onPress={onRetry} size="sm" variant="outline">
				{retryLabel}
			</Button>
		</Card>
	);
}

const styles = StyleSheet.create({
	centered: {
		alignItems: "center",
		flex: 1,
		gap: Spacing.md,
		justifyContent: "center",
		padding: Spacing.lg,
	},
	centerText: {
		textAlign: "center",
	},
	errorCard: {
		alignItems: "center",
		alignSelf: "center",
		gap: Spacing.md,
		margin: Spacing.lg,
	},
});

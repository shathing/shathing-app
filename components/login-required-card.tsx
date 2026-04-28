import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button, Card } from "@/components/ui";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type LoginRequiredCardProps = {
	description: string;
	icon?: IconSymbolName;
	title?: string;
};

export function LoginRequiredCard({
	description,
	icon = "person.crop.circle",
	title = "로그인이 필요합니다.",
}: LoginRequiredCardProps) {
	const router = useRouter();
	const { colors } = useTheme();

	return (
		<Card variant="elevated" style={styles.card}>
			<IconSymbol name={icon} size={30} color={colors.icon} />
			<ThemedText type="heading">{title}</ThemedText>
			<ThemedText type="body" color="textMuted" style={styles.centerText}>
				{description}
			</ThemedText>
			<Button onPress={() => router.push("/settings")}>로그인하러 가기</Button>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: {
		alignItems: "center",
		gap: Spacing.md,
		marginHorizontal: Spacing.lg,
		maxWidth: 360,
		width: "100%",
	},
	centerText: {
		textAlign: "center",
	},
});

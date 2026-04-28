import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { chatApi, parseAxiosErrorMessage } from "@/apis";
import { LoginRequiredCard } from "@/components/login-required-card";
import { ThemedText } from "@/components/themed-text";
import { Button, LoadingState, RetryState, Screen } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRefreshedAuth } from "@/hooks/use-refreshed-auth";
import { formatAgo } from "@/lib/format-ago";
import { getMemberInitial } from "@/lib/member";
import type { ChatRoom } from "@/types/models/chat-room";

const chatCopy = {
	emptyRooms: "참여 중인 채팅방이 없습니다.",
	loadingRooms: "대화방을 불러오는 중입니다.",
	refresh: "새로고침",
	title: "채팅",
	unknownUser: "사용자",
} as const;

export default function ChatScreen() {
	const router = useRouter();
	const { isAuthLoading, me } = useRefreshedAuth();
	const [rooms, setRooms] = useState<ChatRoom[]>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [roomsError, setRoomsError] = useState<string>();

	const loadRooms = useCallback(async () => {
		if (!me) return;

		setIsLoadingRooms(true);
		setRoomsError(undefined);

		try {
			const { data } = await chatApi.getRooms();
			setRooms(data);
		} catch (error) {
			setRoomsError(parseAxiosErrorMessage(error));
			setRooms([]);
		} finally {
			setIsLoadingRooms(false);
		}
	}, [me]);

	useEffect(() => {
		if (!me) {
			setRooms([]);
			return;
		}

		void loadRooms();
	}, [loadRooms, me]);

	if (isAuthLoading) {
		return (
			<Screen contentStyle={styles.centerContent}>
				<LoadingState />
			</Screen>
		);
	}

	if (!me) {
		return (
			<Screen contentStyle={styles.centerContent}>
				<LoginRequiredCard
					description="채팅을 사용하려면 먼저 로그인하세요."
					icon="message.fill"
					title={chatCopy.title}
				/>
			</Screen>
		);
	}

	return (
		<Screen padded={false} contentStyle={styles.screen}>
			<View style={styles.roomPane}>
				<View style={styles.header}>
					<View>
						<ThemedText type="title">{chatCopy.title}</ThemedText>
						<ThemedText type="caption" color="textMuted">
							{rooms.length}개 대화
						</ThemedText>
					</View>
					<Button
						icon="arrow.clockwise"
						onPress={() => void loadRooms()}
						size="sm"
						variant="outline"
						disabled={isLoadingRooms}
					>
						{chatCopy.refresh}
					</Button>
				</View>

				{isLoadingRooms ? (
					<LoadingState label={chatCopy.loadingRooms} />
				) : roomsError ? (
					<RetryState message={roomsError} onRetry={() => void loadRooms()} />
				) : rooms.length === 0 ? (
					<LoadingState label={chatCopy.emptyRooms} showIndicator={false} />
				) : (
					<ScrollView
						contentContainerStyle={styles.roomList}
						showsVerticalScrollIndicator={false}
					>
						{rooms.map((room) => (
							<RoomListItem
								key={room.id}
								onPress={() => router.push(`/chat/${room.id}`)}
								room={room}
							/>
						))}
					</ScrollView>
				)}
			</View>
		</Screen>
	);
}

function RoomListItem({
	onPress,
	room,
}: {
	onPress: () => void;
	room: ChatRoom;
}) {
	const { colors } = useTheme();
	const lastMessage = room.lastMessage?.trim() || "아직 메시지가 없습니다.";

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => [
				styles.roomItem,
				{
					backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
					borderColor: colors.border,
				},
			]}
		>
			<View style={[styles.roomAvatar, { backgroundColor: colors.primary }]}>
				<ThemedText type="bodyStrong" color="primaryForeground">
					{getMemberInitial(room.otherMember.username)}
				</ThemedText>
			</View>
			<View style={styles.roomBody}>
				<View style={styles.roomTitleRow}>
					<ThemedText
						type="bodyStrong"
						style={styles.roomTitle}
						numberOfLines={1}
					>
						{room.otherMember.username || chatCopy.unknownUser}
					</ThemedText>
					{room.lastMessageAt ? (
						<ThemedText type="caption" color="textSubtle">
							{formatAgo(room.lastMessageAt)}
						</ThemedText>
					) : null}
				</View>
				<ThemedText type="caption" color="textMuted" numberOfLines={2}>
					{lastMessage}
				</ThemedText>
			</View>
			<IconSymbol name="chevron.right" size={18} color={colors.icon} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	centerContent: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: Spacing.lg,
	},
	header: {
		alignItems: "center",
		flexDirection: "row",
		gap: Spacing.md,
		justifyContent: "space-between",
		paddingHorizontal: Spacing.md,
		paddingTop: Spacing.lg,
	},
	roomAvatar: {
		alignItems: "center",
		borderRadius: Radius.pill,
		height: 48,
		justifyContent: "center",
		width: 48,
	},
	roomBody: {
		flex: 1,
		gap: Spacing.xs,
	},
	roomItem: {
		alignItems: "center",
		borderRadius: Radius.md,
		borderWidth: 1,
		flexDirection: "row",
		gap: Spacing.md,
		padding: Spacing.md,
	},
	roomList: {
		gap: Spacing.sm,
		padding: Spacing.md,
		paddingBottom: Spacing["2xl"],
	},
	roomPane: {
		flex: 1,
	},
	roomTitle: {
		flex: 1,
	},
	roomTitleRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: Spacing.sm,
	},
	screen: {
		flex: 1,
	},
});

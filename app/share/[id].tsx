import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
	useWindowDimensions,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
} from "react-native";

import { chatApi, parseAxiosErrorMessage, shareApi } from "@/apis";
import { ThemedText } from "@/components/themed-text";
import { Badge, Button, Card, Screen } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatAgo } from "@/lib/format-ago";
import { getImageUrl } from "@/lib/image-url";
import { getMemberInitial } from "@/lib/member";
import { useAppPreferences } from "@/providers/app-preferences-provider";
import type { ShareItem } from "@/types/models/share-item";

const CONTENT_HORIZONTAL_PADDING = Spacing.md;
const MAX_CONTENT_WIDTH = 680;

export default function ShareDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ id?: string }>();
	const { colors } = useTheme();
	const { me } = useAppPreferences();
	const { width } = useWindowDimensions();
	const shareItemId = Number(params.id);
	const mediaWidth = Math.min(
		Math.max(width - CONTENT_HORIZONTAL_PADDING * 2, 0),
		MAX_CONTENT_WIDTH,
	);

	const [shareItem, setShareItem] = useState<ShareItem>();
	const [error, setError] = useState<string>();
	const [feedback, setFeedback] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isStartingChat, setIsStartingChat] = useState(false);
	const [activeImageIndex, setActiveImageIndex] = useState(0);

	const isMine = !!shareItem && me?.id === shareItem.member.id;

	const loadShareItem = useCallback(async () => {
		if (!Number.isInteger(shareItemId) || shareItemId <= 0) {
			setShareItem(undefined);
			setError("올바른 게시글이 아닙니다.");
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(undefined);

		try {
			const { data } = await shareApi.getById(shareItemId);
			setShareItem(data);
			setActiveImageIndex(0);
		} catch (loadError) {
			setShareItem(undefined);
			setError(getErrorMessage(loadError));
		} finally {
			setIsLoading(false);
		}
	}, [shareItemId]);

	useEffect(() => {
		void loadShareItem();
	}, [loadShareItem]);

	const handleDelete = async () => {
		if (!shareItem || isDeleting) return;

		setIsDeleting(true);
		setFeedback(undefined);

		try {
			await shareApi.delete(shareItem.id);
			router.replace("/");
		} catch (deleteError) {
			setFeedback(getErrorMessage(deleteError));
		} finally {
			setIsDeleting(false);
		}
	};

	const confirmDelete = () => {
		Alert.alert("게시글 삭제", "게시글을 삭제할까요?", [
			{ text: "취소", style: "cancel" },
			{ text: "삭제", style: "destructive", onPress: () => void handleDelete() },
		]);
	};

	const handleStartChat = async () => {
		if (!shareItem || isStartingChat) return;

		setIsStartingChat(true);
		setFeedback(undefined);

		try {
			const { data } = await chatApi.createRoom({
				otherMemberId: shareItem.member.id,
			});
			router.push(`/chat/${data.id}`);
		} catch (chatError) {
			setFeedback(getErrorMessage(chatError));
		} finally {
			setIsStartingChat(false);
		}
	};

	const handleEdit = () => {
		if (!shareItem) return;
		router.push({ pathname: "/post", params: { id: String(shareItem.id) } });
	};

	const handleImageScrollEnd = (
		event: NativeSyntheticEvent<NativeScrollEvent>,
	) => {
		if (!mediaWidth) return;

		const nextIndex = Math.round(
			event.nativeEvent.contentOffset.x / mediaWidth,
		);
		setActiveImageIndex(nextIndex);
	};

	return (
		<Screen padded={false} edges={["top", "left", "right", "bottom"]}>
			<Stack.Screen options={{ headerShown: false }} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
					<View style={styles.navBar}>
						<Pressable
							accessibilityRole="button"
							onPress={() => {
								if (router.canGoBack()) {
									router.back();
									return;
								}

								router.replace("/");
							}}
							style={({ pressed }) => [
								styles.backButton,
								{ backgroundColor: pressed ? colors.surfaceMuted : "transparent" },
						]}
					>
						<IconSymbol
							name="chevron.right"
							size={18}
							color={colors.text}
							style={styles.backButtonIcon}
						/>
						<ThemedText type="label">목록</ThemedText>
					</Pressable>
				</View>

				{isLoading ? (
					<Section>
						<Card style={styles.stateCard}>
							<ThemedText type="body" color="textMuted">
								게시글을 불러오는 중입니다.
							</ThemedText>
						</Card>
					</Section>
				) : error || !shareItem ? (
					<Section>
						<Card variant="elevated" style={styles.errorCard}>
							<View
								style={[
									styles.stateIcon,
									{ backgroundColor: colors.surfaceMuted },
								]}
							>
								<IconSymbol
									name="chevron.left.forwardslash.chevron.right"
									size={28}
									color={colors.icon}
								/>
							</View>
							<ThemedText type="heading" style={styles.centerText}>
								게시글을 불러오지 못했습니다.
							</ThemedText>
							<ThemedText
								type="body"
								color="textMuted"
								style={styles.centerText}
							>
								{error ?? "잠시 후 다시 시도해 주세요."}
							</ThemedText>
							<View style={styles.retryRow}>
								<Button
									onPress={() => router.replace("/")}
									size="sm"
									variant="ghost"
								>
									홈으로
								</Button>
								<Button onPress={() => void loadShareItem()} size="sm">
									다시 시도
								</Button>
							</View>
						</Card>
					</Section>
				) : (
					<>
						<Section>
							<View style={styles.galleryShell}>
								{shareItem.photoUrls.length > 0 ? (
									<View
										style={[
											styles.galleryFrame,
											{
												backgroundColor: colors.surfaceMuted,
												width: mediaWidth,
											},
										]}
									>
										<ScrollView
											horizontal
											pagingEnabled
											decelerationRate="fast"
											onMomentumScrollEnd={handleImageScrollEnd}
											showsHorizontalScrollIndicator={false}
										>
											{shareItem.photoUrls.map((photoUrl, index) => {
												const imageUrl = getImageUrl(photoUrl);

												return (
													<View
														key={`${shareItem.id}-${photoUrl}-${index}`}
														style={[
															styles.gallerySlide,
															{
																backgroundColor: colors.surfaceMuted,
																width: mediaWidth,
															},
														]}
													>
														{imageUrl ? (
															<Image
																source={{ uri: imageUrl }}
																style={styles.galleryImage}
																contentFit="cover"
															/>
														) : (
															<View
																style={[
																	styles.galleryPlaceholder,
																	{
																		backgroundColor: colors.surfaceMuted,
																	},
																]}
															>
																<IconSymbol
																	name="photo.fill"
																	size={36}
																	color={colors.icon}
																/>
															</View>
														)}
													</View>
												);
											})}
										</ScrollView>

										{shareItem.photoUrls.length > 1 ? (
											<View
												style={[
													styles.imageCount,
													{ backgroundColor: colors.overlay },
												]}
											>
												<ThemedText
													type="caption"
													style={styles.imageCountText}
												>
													{`${activeImageIndex + 1}/${shareItem.photoUrls.length}`}
												</ThemedText>
											</View>
										) : null}
									</View>
								) : (
									<View
										style={[
											styles.galleryPlaceholder,
											styles.galleryFrame,
											{
												backgroundColor: colors.surfaceMuted,
												width: mediaWidth,
											},
										]}
									>
										<IconSymbol
											name="photo.fill"
											size={36}
											color={colors.icon}
										/>
										<ThemedText type="caption" color="textMuted">
											등록된 사진이 없습니다.
										</ThemedText>
									</View>
								)}

								{shareItem.photoUrls.length > 1 ? (
									<View style={styles.dotsRow}>
										{shareItem.photoUrls.map((photoUrl, index) => (
											<View
												key={`dot:${photoUrl}:${index}`}
												style={[
													styles.dot,
													{
														backgroundColor:
															index === activeImageIndex
																? colors.primary
																: colors.border,
														width: index === activeImageIndex ? 22 : 8,
													},
												]}
											/>
										))}
									</View>
								) : null}
							</View>
						</Section>

						<Section>
							<View style={styles.articleHeader}>
								<View style={styles.badgesRow}>
									<Badge tone="primary" size="sm">
										{shareItem.category.name}
									</Badge>
									<Badge size="sm">{shareItem.region.name}</Badge>
									<Badge size="sm">{formatAgo(shareItem.createdDate)}</Badge>
								</View>
								<ThemedText type="title">{shareItem.title}</ThemedText>
								<ThemedText type="caption" color="textSubtle">
									{formatCreatedAt(shareItem.createdDate)}
								</ThemedText>
							</View>
						</Section>

						<Section>
							<Card variant="elevated" style={styles.ownerCard}>
								<View style={styles.ownerRow}>
									<View
										style={[
											styles.ownerAvatar,
											{ backgroundColor: colors.surfaceMuted },
										]}
									>
										<ThemedText type="heading">
											{getMemberInitial(shareItem.member.username)}
										</ThemedText>
									</View>
									<View style={styles.ownerMeta}>
										<ThemedText type="bodyStrong">
											{shareItem.member.username}
										</ThemedText>
										<ThemedText type="caption" color="textMuted">
											{shareItem.region.fullName}
										</ThemedText>
									</View>
								</View>

								{feedback ? (
									<ThemedText type="caption" color="danger">
										{feedback}
									</ThemedText>
								) : null}

								{isMine ? (
									<View style={styles.actionRow}>
										<Button
											onPress={handleEdit}
											size="sm"
											style={styles.actionButton}
											variant="outline"
											icon="square.and.pencil"
										>
											수정
										</Button>
										<Button
											onPress={confirmDelete}
											size="sm"
											style={styles.actionButton}
											variant="danger"
											disabled={isDeleting}
										>
											{isDeleting ? "삭제 중" : "삭제"}
										</Button>
									</View>
								) : (
									<Button
										fullWidth
										onPress={handleStartChat}
										disabled={isStartingChat}
										icon="message.fill"
									>
										{isStartingChat ? "연결 중" : "채팅으로 문의하기"}
									</Button>
								)}
							</Card>
						</Section>

						<Section>
							<Card variant="outlined" style={styles.infoCard}>
								<View style={styles.infoGrid}>
									<DetailField
										label="카테고리"
										value={shareItem.category.name}
									/>
									<DetailField label="지역" value={shareItem.region.fullName} />
									<DetailField
										label="등록일"
										value={formatCreatedAt(shareItem.createdDate)}
									/>
								</View>
							</Card>
						</Section>

						<Section>
							<Card style={styles.contentCard}>
								<ThemedText type="heading">내용</ThemedText>
								<ThemedText type="body" style={styles.contentText}>
									{shareItem.content}
								</ThemedText>
							</Card>
						</Section>
					</>
				)}
			</ScrollView>
		</Screen>
	);
}

function Section({ children }: { children: ReactNode }) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionInner}>{children}</View>
		</View>
	);
}

function DetailField({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.infoItem}>
			<ThemedText type="caption" color="textSubtle">
				{label}
			</ThemedText>
			<ThemedText type="bodyStrong">{value}</ThemedText>
		</View>
	);
}

function getErrorMessage(error: unknown) {
	return parseAxiosErrorMessage(error);
}

function formatCreatedAt(value: string) {
	const date = new Date(value);
	const timestamp = date.getTime();

	if (Number.isNaN(timestamp)) return value;

	return date.toLocaleString("ko-KR", {
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		month: "long",
		year: "numeric",
	});
}

const styles = StyleSheet.create({
	content: {
		gap: Spacing.lg,
		paddingBottom: Spacing["4xl"],
		paddingTop: Spacing.sm,
	},
	navBar: {
		paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
	},
	backButton: {
		alignItems: "center",
		alignSelf: "flex-start",
		borderRadius: Radius.md,
		flexDirection: "row",
		gap: Spacing.xs,
		paddingHorizontal: Spacing.sm,
		paddingVertical: Spacing.sm,
	},
	backButtonIcon: {
		transform: [{ rotate: "180deg" }],
	},
	section: {
		paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
	},
	sectionInner: {
		alignSelf: "center",
		maxWidth: MAX_CONTENT_WIDTH,
		width: "100%",
	},
	stateCard: {
		alignItems: "center",
		paddingVertical: Spacing.xl,
	},
	errorCard: {
		alignItems: "center",
		gap: Spacing.md,
		minHeight: 280,
		justifyContent: "center",
	},
	stateIcon: {
		alignItems: "center",
		borderRadius: Radius.pill,
		height: 64,
		justifyContent: "center",
		width: 64,
	},
	centerText: {
		textAlign: "center",
	},
	retryRow: {
		flexDirection: "row",
		gap: Spacing.sm,
	},
	galleryShell: {
		gap: Spacing.md,
	},
	galleryFrame: {
		alignSelf: "center",
		borderRadius: Radius["2xl"],
		overflow: "hidden",
	},
	gallerySlide: {
		aspectRatio: 1,
	},
	galleryImage: {
		height: "100%",
		width: "100%",
	},
	galleryPlaceholder: {
		alignItems: "center",
		aspectRatio: 1,
		gap: Spacing.sm,
		justifyContent: "center",
	},
	imageCount: {
		borderRadius: Radius.pill,
		paddingHorizontal: Spacing.sm,
		paddingVertical: Spacing.xs,
		position: "absolute",
		right: Spacing.md,
		top: Spacing.md,
	},
	imageCountText: {
		color: "#FFFFFF",
	},
	dotsRow: {
		alignItems: "center",
		alignSelf: "center",
		flexDirection: "row",
		gap: Spacing.sm,
	},
	dot: {
		borderRadius: Radius.pill,
		height: 8,
	},
	articleHeader: {
		gap: Spacing.sm,
	},
	badgesRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: Spacing.sm,
	},
	ownerCard: {
		gap: Spacing.md,
	},
	ownerRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: Spacing.md,
	},
	ownerAvatar: {
		alignItems: "center",
		borderRadius: Radius.pill,
		height: 56,
		justifyContent: "center",
		width: 56,
	},
	ownerMeta: {
		flex: 1,
		gap: Spacing.xs,
	},
	actionRow: {
		flexDirection: "row",
		gap: Spacing.sm,
	},
	actionButton: {
		flex: 1,
	},
	infoCard: {
		gap: Spacing.none,
	},
	infoGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: Spacing.md,
	},
	infoItem: {
		gap: Spacing.xs,
		minWidth: "48%",
	},
	contentCard: {
		gap: Spacing.md,
	},
	contentText: {
		...Typography.body,
		lineHeight: 28,
	},
});

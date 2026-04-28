import { AxiosError } from "axios";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from "react-native";

import { chatApi, parseAxiosErrorMessage } from "@/apis";
import { authTokenStorage } from "@/apis/config";
import { LoginRequiredCard } from "@/components/login-required-card";
import { ThemedText } from "@/components/themed-text";
import { Badge, Button, LoadingState, RetryState, Screen } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useRefreshedAuth } from "@/hooks/use-refreshed-auth";
import { useTheme } from "@/hooks/use-theme";
import {
	getRoomAccessErrorFromFrame,
	getRoomAccessErrorFromStatus,
	toChatMessageItem,
	type ChatMessageItem,
	type RoomAccessError,
} from "@/lib/chat-message";
import { getMemberInitial } from "@/lib/member";
import {
	buildAuthenticatedWebSocketUrl,
	buildStompFrame,
	parseStompFrames,
	sendStompFrame,
	STOMP_SUBPROTOCOLS,
} from "@/lib/stomp";
import type { ChatMessageSliceResponse } from "@/types/apis/chat";
import type { ChatMessage } from "@/types/models/chat-message";
import type { ChatRoom } from "@/types/models/chat-room";

const PAGE_SIZE = 30;

const chatCopy = {
	accessDenied: "이 대화방에 접근할 수 없습니다.",
	activeNow: "활성화됨",
	backToRooms: "목록",
	connecting: "연결 중",
	emptyMessages: "아직 메시지가 없습니다.",
	inputPlaceholder: "메시지를 입력하세요",
	loadMore: "이전 메시지 더보기",
	loadingMessages: "메시지를 불러오는 중입니다.",
	messageSendUnavailable: "채팅 서버에 연결되면 메시지를 보낼 수 있습니다.",
	roomNotFound: "대화방을 찾을 수 없습니다.",
	send: "보내기",
	title: "채팅",
	unknownUser: "사용자",
} as const;

export default function ChatRoomScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ id?: string }>();
	const { colors } = useTheme();
	const { isAuthLoading, me } = useRefreshedAuth();
	const roomId = Number(params.id);
	const hasValidRoomId = Number.isInteger(roomId) && roomId > 0;

	const [room, setRoom] = useState<ChatRoom>();
	const [messages, setMessages] = useState<ChatMessageItem[]>([]);
	const [nextCursorId, setNextCursorId] = useState<number | null>(null);
	const [hasNextPage, setHasNextPage] = useState(false);
	const [messageInput, setMessageInput] = useState("");
	const [isLoadingRoom, setIsLoadingRoom] = useState(false);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
	const [roomError, setRoomError] = useState<string>();
	const [messagesError, setMessagesError] = useState<string>();
	const [roomAccessError, setRoomAccessError] = useState<RoomAccessError>(
		hasValidRoomId ? null : "not-found",
	);
	const [connectedRoomId, setConnectedRoomId] = useState<number>();
	const [socketFeedback, setSocketFeedback] = useState<string>();
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const scrollViewRef = useRef<ScrollView | null>(null);

	const sortedMessages = useMemo(
		() => [...messages].sort((a, b) => a.createdAt - b.createdAt),
		[messages],
	);
	const isRoomConnected = connectedRoomId === roomId;

	const mergeMessages = useCallback((incomingMessages: ChatMessageItem[]) => {
		setMessages((currentMessages) => {
			const merged = new Map<number, ChatMessageItem>();
			for (const message of currentMessages) merged.set(message.id, message);
			for (const message of incomingMessages) merged.set(message.id, message);
			return [...merged.values()].sort((a, b) => a.createdAt - b.createdAt);
		});
	}, []);

	const handleBack = useCallback(() => {
		if (router.canGoBack()) {
			router.back();
			return;
		}

		router.replace("/chat");
	}, [router]);

	const loadRoom = useCallback(async () => {
		if (!me || !hasValidRoomId) return;

		setIsLoadingRoom(true);
		setRoomError(undefined);

		try {
			const { data } = await chatApi.getRooms();
			const nextRoom = data.find((chatRoom) => chatRoom.id === roomId);
			setRoom(nextRoom);
			if (!nextRoom) setRoomAccessError("not-found");
		} catch (error) {
			setRoom(undefined);
			setRoomError(parseAxiosErrorMessage(error));
		} finally {
			setIsLoadingRoom(false);
		}
	}, [hasValidRoomId, me, roomId]);

	const applyMessageSlice = useCallback(
		(slice: ChatMessageSliceResponse, appendOlder = false) => {
			const nextMessages = slice.items.map((message) =>
				toChatMessageItem(message, me?.id),
			);

			if (appendOlder) {
				mergeMessages(nextMessages);
			} else {
				setMessages(nextMessages.sort((a, b) => a.createdAt - b.createdAt));
			}

			setNextCursorId(slice.nextCursorId);
			setHasNextPage(slice.hasNext);
			setMessagesError(undefined);
			setRoomAccessError(null);
		},
		[me?.id, mergeMessages],
	);

	const loadMessages = useCallback(
		async ({ appendOlder = false } = {}) => {
			if (!hasValidRoomId) {
				setRoomAccessError("not-found");
				return;
			}

			if (appendOlder) {
				setIsLoadingMoreMessages(true);
			} else {
				setIsLoadingMessages(true);
			}
			setMessagesError(undefined);

			try {
				const { data } = await chatApi.getMessages(roomId, {
					beforeMessageId: appendOlder
						? (nextCursorId ?? undefined)
						: undefined,
					size: PAGE_SIZE,
				});
				applyMessageSlice(data, appendOlder);
			} catch (error) {
				const accessError = getRoomAccessErrorFromStatus(
					error instanceof AxiosError ? error.response?.status : undefined,
				);
				if (accessError) {
					setRoomAccessError(accessError);
				}
				setMessagesError(parseAxiosErrorMessage(error));
				if (!appendOlder) {
					setMessages([]);
				}
			} finally {
				setIsLoadingMessages(false);
				setIsLoadingMoreMessages(false);
			}
		},
		[applyMessageSlice, hasValidRoomId, nextCursorId, roomId],
	);

	const sendMessage = () => {
		const content = messageInput.trim();
		const socket = socketRef.current;

		if (!content || !hasValidRoomId) return;
		if (!socket || socket.readyState !== WebSocket.OPEN || !isRoomConnected) {
			setSocketFeedback(chatCopy.messageSendUnavailable);
			return;
		}

		sendStompFrame(
			socket,
			buildStompFrame("SEND", {
				body: JSON.stringify({ content }),
				headers: {
					"content-type": "application/json",
					destination: `/pub/chat/rooms/${roomId}/messages`,
				},
			}),
		);
		setMessageInput("");
		setSocketFeedback(undefined);
	};

	useEffect(() => {
		if (!me) return;

		void loadRoom();
		void loadMessages();
	}, [loadMessages, loadRoom, me]);

	useEffect(() => {
		if (!hasValidRoomId || !me || roomAccessError) return;

		let isActive = true;

		async function connect() {
			clearTimeout(reconnectTimeoutRef.current);
			socketRef.current?.close();
			setConnectedRoomId(undefined);
			setSocketFeedback(undefined);

			const chatWsUrl = process.env.EXPO_PUBLIC_CHAT_WS_URL;
			if (!chatWsUrl) {
				setSocketFeedback("채팅 WebSocket 주소가 설정되지 않았습니다.");
				return;
			}

			const accessToken = await authTokenStorage.getAccessToken();
			if (!isActive) return;

			const socket = new WebSocket(
				buildAuthenticatedWebSocketUrl(chatWsUrl, accessToken),
				STOMP_SUBPROTOCOLS,
			);
			socketRef.current = socket;

			socket.onopen = () => {
				try {
					sendStompFrame(
						socket,
						buildStompFrame("CONNECT", {
							headers: {
								"accept-version": "1.2,1.1,1.0",
								"heart-beat": "10000,10000",
							},
						}),
					);
				} catch {
					setSocketFeedback(chatCopy.messageSendUnavailable);
				}
			};

			socket.onmessage = (event) => {
				for (const frame of parseStompFrames(String(event.data))) {
					if (frame.command === "CONNECTED") {
						if (!isActive) return;
						setConnectedRoomId(roomId);
						setSocketFeedback(undefined);
						try {
							sendStompFrame(
								socket,
								buildStompFrame("SUBSCRIBE", {
									headers: {
										ack: "auto",
										destination: `/topic/chat/rooms/${roomId}`,
										id: `room-${roomId}`,
									},
								}),
							);
						} catch {
							setSocketFeedback(chatCopy.messageSendUnavailable);
						}
					}

					if (frame.command === "MESSAGE") {
						try {
							const payload = JSON.parse(frame.body) as ChatMessage;
							const messageItem = toChatMessageItem(payload, me?.id);
							mergeMessages([messageItem]);
							if (payload.roomId === roomId) {
								setRoom((currentRoom) =>
									currentRoom
										? {
												...currentRoom,
												lastMessage: payload.content,
												lastMessageAt: payload.createdDate,
											}
										: currentRoom,
								);
							}
						} catch {
							return;
						}
					}

					if (frame.command === "ERROR") {
						const accessError = getRoomAccessErrorFromFrame(frame);
						if (accessError) setRoomAccessError(accessError);
						setSocketFeedback(
							frame.headers.message || chatCopy.messageSendUnavailable,
						);
					}
				}
			};

			socket.onerror = () => {
				if (!isActive) return;
				setConnectedRoomId(undefined);
				setSocketFeedback(chatCopy.connecting);
			};

			socket.onclose = () => {
				if (!isActive) return;
				setConnectedRoomId(undefined);
				reconnectTimeoutRef.current = setTimeout(connect, 5000);
			};
		}

		void connect();

		return () => {
			isActive = false;
			clearTimeout(reconnectTimeoutRef.current);
			socketRef.current?.close();
			socketRef.current = null;
		};
	}, [hasValidRoomId, me, mergeMessages, roomAccessError, roomId]);

	useEffect(() => {
		if (sortedMessages.length === 0) return;
		requestAnimationFrame(() => {
			scrollViewRef.current?.scrollToEnd({ animated: true });
		});
	}, [sortedMessages.length]);

	if (isAuthLoading) {
		return (
			<Screen contentStyle={styles.centerContent}>
				<Stack.Screen options={{ headerShown: false }} />
				<LoadingState />
			</Screen>
		);
	}

	if (!me) {
		return (
			<Screen contentStyle={styles.centerContent}>
				<Stack.Screen options={{ headerShown: false }} />
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
			<Stack.Screen options={{ headerShown: false }} />
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.keyboard}
			>
				<View style={styles.messagePane}>
					<View style={[styles.chatHeader, { borderColor: colors.border }]}>
						<Pressable
							accessibilityRole="button"
							onPress={handleBack}
							style={({ pressed }) => [
								styles.backButton,
								{
									backgroundColor: pressed
										? colors.surfaceMuted
										: "transparent",
								},
							]}
						>
							<IconSymbol
								name="chevron.right"
								size={18}
								color={colors.text}
								style={styles.backButtonIcon}
							/>
							<ThemedText type="label">{chatCopy.backToRooms}</ThemedText>
						</Pressable>
						<View
							style={[
								styles.chatAvatar,
								{ backgroundColor: colors.surfaceMuted },
							]}
						>
							<ThemedText type="bodyStrong">
								{getMemberInitial(room?.otherMember.username ?? "")}
							</ThemedText>
						</View>
						<View style={styles.chatHeaderText}>
							<ThemedText type="bodyStrong" numberOfLines={1}>
								{room?.otherMember.username || chatCopy.unknownUser}
							</ThemedText>
							<ThemedText type="caption" color="textMuted">
								{isRoomConnected
									? chatCopy.activeNow
									: socketFeedback || chatCopy.connecting}
							</ThemedText>
						</View>
						<Badge tone={isRoomConnected ? "success" : "neutral"} size="sm">
							{isRoomConnected ? "ON" : "..."}
						</Badge>
					</View>

					<View style={styles.messagesArea}>
						{roomAccessError ? (
							<RetryState
								message={
									roomAccessError === "forbidden"
										? chatCopy.accessDenied
										: chatCopy.roomNotFound
								}
								onRetry={handleBack}
								retryLabel={chatCopy.backToRooms}
							/>
						) : roomError ? (
							<RetryState message={roomError} onRetry={() => void loadRoom()} />
						) : isLoadingRoom || isLoadingMessages ? (
							<LoadingState label={chatCopy.loadingMessages} />
						) : messagesError ? (
							<RetryState
								message={messagesError}
								onRetry={() => void loadMessages()}
							/>
						) : (
							<ScrollView
								ref={scrollViewRef}
								contentContainerStyle={styles.messageList}
								showsVerticalScrollIndicator={false}
							>
								{hasNextPage ? (
									<View style={styles.loadMoreRow}>
										<Button
											onPress={() => void loadMessages({ appendOlder: true })}
											size="sm"
											variant="outline"
											disabled={isLoadingMoreMessages}
										>
											{isLoadingMoreMessages
												? chatCopy.loadingMessages
												: chatCopy.loadMore}
										</Button>
									</View>
								) : null}

								{sortedMessages.length === 0 ? (
									<ThemedText
										type="body"
										color="textMuted"
										style={styles.emptyMessages}
									>
										{chatCopy.emptyMessages}
									</ThemedText>
								) : (
									sortedMessages.map((message) => (
										<MessageBubble key={message.id} message={message} />
									))
								)}
							</ScrollView>
						)}
					</View>

					<View style={[styles.composer, { borderColor: colors.border }]}>
						<View
							style={[
								styles.inputShell,
								{
									backgroundColor: colors.surface,
									borderColor: colors.input,
								},
							]}
						>
							<TextInput
								multiline
								onChangeText={setMessageInput}
								onSubmitEditing={sendMessage}
								placeholder={chatCopy.inputPlaceholder}
								placeholderTextColor={colors.textSubtle}
								selectionColor={colors.primary}
								style={[styles.input, { color: colors.text }]}
								value={messageInput}
							/>
						</View>
						<Button
							accessibilityLabel={chatCopy.send}
							disabled={!messageInput.trim()}
							icon="paperplane.fill"
							onPress={sendMessage}
							style={styles.sendButton}
						>
							{chatCopy.send}
						</Button>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Screen>
	);
}

function MessageBubble({ message }: { message: ChatMessageItem }) {
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.messageRow,
				message.mine ? styles.messageRowMine : styles.messageRowOther,
			]}
		>
			<View
				style={[
					styles.messageBubble,
					{
						backgroundColor: message.mine ? colors.primary : colors.surface,
						borderColor: message.mine ? colors.primary : colors.border,
					},
				]}
			>
				<ThemedText
					type="body"
					color={message.mine ? "primaryForeground" : "text"}
				>
					{message.text}
				</ThemedText>
				<ThemedText
					type="caption"
					color={message.mine ? "primaryForeground" : "textSubtle"}
					style={message.mine ? styles.mineTime : undefined}
				>
					{message.time}
				</ThemedText>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	centerContent: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: Spacing.lg,
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
	chatAvatar: {
		alignItems: "center",
		borderRadius: Radius.pill,
		height: 42,
		justifyContent: "center",
		width: 42,
	},
	chatHeader: {
		alignItems: "center",
		borderBottomWidth: 1,
		flexDirection: "row",
		gap: Spacing.sm,
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.sm,
	},
	chatHeaderText: {
		flex: 1,
		gap: Spacing.xxs,
	},
	composer: {
		alignItems: "flex-end",
		borderTopWidth: 1,
		flexDirection: "row",
		gap: Spacing.sm,
		padding: Spacing.md,
	},
	emptyMessages: {
		paddingVertical: Spacing["3xl"],
		textAlign: "center",
	},
	input: {
		...Typography.body,
		maxHeight: 96,
		minHeight: 42,
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.sm,
		textAlignVertical: "top",
	},
	inputShell: {
		borderRadius: Radius.md,
		borderWidth: 1,
		flex: 1,
	},
	keyboard: {
		flex: 1,
	},
	loadMoreRow: {
		alignItems: "center",
		paddingBottom: Spacing.sm,
	},
	messageBubble: {
		borderRadius: Radius["2xl"],
		borderWidth: 1,
		gap: Spacing.xs,
		maxWidth: "78%",
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.sm,
	},
	messageList: {
		flexGrow: 1,
		gap: Spacing.sm,
		justifyContent: "flex-end",
		padding: Spacing.md,
	},
	messagePane: {
		flex: 1,
	},
	messageRow: {
		flexDirection: "row",
	},
	messageRowMine: {
		justifyContent: "flex-end",
	},
	messageRowOther: {
		justifyContent: "flex-start",
	},
	messagesArea: {
		flex: 1,
	},
	mineTime: {
		opacity: 0.78,
	},
	screen: {
		flex: 1,
	},
	sendButton: {
		minWidth: 78,
	},
});

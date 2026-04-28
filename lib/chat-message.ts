import type { ChatMessage } from "@/types/models/chat-message";

import type { StompFrame } from "./stomp";

export type ChatMessageItem = {
	createdAt: number;
	id: number;
	mine: boolean;
	text: string;
	time: string;
};

export type RoomAccessError = "forbidden" | "not-found" | null;

export function toChatMessageItem(
	message: ChatMessage,
	myId?: number,
): ChatMessageItem {
	const createdAt = new Date(message.createdDate).getTime();

	return {
		createdAt,
		id: message.id,
		mine: message.sender.id === myId,
		text: message.content,
		time: formatMessageTime(createdAt),
	};
}

export function getRoomAccessErrorFromStatus(
	status?: number,
): RoomAccessError {
	if (status === 403) return "forbidden";
	if (status === 404) return "not-found";
	return null;
}

export function getRoomAccessErrorFromFrame(
	frame: StompFrame,
): RoomAccessError {
	const status = Number(frame.headers.status ?? frame.headers["status-code"]);
	const explicitStatusError = getRoomAccessErrorFromStatus(
		Number.isFinite(status) ? status : undefined,
	);
	if (explicitStatusError) return explicitStatusError;

	const errorText =
		`${frame.headers.message ?? ""} ${frame.body}`.toLowerCase();
	if (
		errorText.includes("403") ||
		errorText.includes("forbidden") ||
		errorText.includes("access denied")
	) {
		return "forbidden";
	}
	if (errorText.includes("404") || errorText.includes("not found")) {
		return "not-found";
	}
	return null;
}

function formatMessageTime(timestamp: number) {
	if (Number.isNaN(timestamp)) return "";

	return new Date(timestamp).toLocaleTimeString("ko-KR", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

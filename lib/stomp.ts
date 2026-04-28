import { Platform } from "react-native";

export const STOMP_SUBPROTOCOLS = ["v12.stomp"];

export type StompFrame = {
	body: string;
	command: string;
	headers: Record<string, string>;
};

export function buildStompFrame(
	command: string,
	{
		body = "",
		headers = {},
	}: {
		body?: string;
		headers?: Record<string, string>;
	} = {},
) {
	const headerLines = Object.entries(headers).map(
		([key, value]) => `${key}:${value}`,
	);

	return `${command}\n${headerLines.join("\n")}\n\n${body}\0`;
}

export function sendStompFrame(socket: WebSocket, frame: string) {
	if (Platform.OS === "web") {
		socket.send(frame);
		return;
	}

	socket.send(new TextEncoder().encode(frame).buffer as ArrayBuffer);
}

export function parseStompFrames(rawData: string) {
	return rawData
		.split("\0")
		.map((frameText) => frameText.trim())
		.filter(Boolean)
		.map(parseStompFrame);
}

export function buildAuthenticatedWebSocketUrl(
	url: string,
	accessToken?: string | null,
) {
	if (!accessToken) return url;

	try {
		const nextUrl = new URL(url);
		nextUrl.searchParams.set("access_token", accessToken);
		return nextUrl.toString();
	} catch {
		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}access_token=${encodeURIComponent(accessToken)}`;
	}
}

function parseStompFrame(frameText: string): StompFrame {
	const [head, ...bodyParts] = frameText.split("\n\n");
	const [command = "", ...headerLines] = head.split("\n");
	const headers: Record<string, string> = {};

	for (const headerLine of headerLines) {
		const separatorIndex = headerLine.indexOf(":");
		if (separatorIndex === -1) continue;
		headers[headerLine.slice(0, separatorIndex)] = headerLine.slice(
			separatorIndex + 1,
		);
	}

	return {
		body: bodyParts.join("\n\n"),
		command,
		headers,
	};
}

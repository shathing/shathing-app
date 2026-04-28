import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosHeaders, type AxiosError } from "axios";

const ACCESS_TOKEN_STORAGE_KEY = "shathing-app:access-token";
const REFRESH_TOKEN_STORAGE_KEY = "shathing-app:refresh-token";

type ApiErrorResponse = {
	message?: string | { message?: string };
};

const http = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL,
	withCredentials: true,
});

export const s3Client = axios.create();

export const authTokenStorage = {
	getAccessToken: () => AsyncStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
	setAccessToken: (accessToken: string) =>
		AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken),
	setTokens: async ({
		accessToken,
		refreshToken,
	}: {
		accessToken?: string;
		refreshToken?: string;
	}) => {
		const operations: Promise<void>[] = [];

		if (accessToken) {
			operations.push(AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken));
		}
		if (refreshToken) {
			operations.push(
				AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken),
			);
		}

		await Promise.all(operations);
	},
	clear: async () => {
		await Promise.all([
			AsyncStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY),
			AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY),
		]);
	},
};

http.interceptors.request.use(async (config) => {
	const accessToken = await authTokenStorage.getAccessToken();

	if (accessToken) {
		config.headers = AxiosHeaders.from(config.headers);
		config.headers.set("Authorization", `Bearer ${accessToken}`);
	}

	return config;
});

export const parseAxiosErrorMessage = (error: unknown) => {
	if (!axios.isAxiosError(error)) {
		return error instanceof Error
			? error.message
			: "A temporary error has occurred.";
	}

	const response = error.response?.data as ApiErrorResponse | undefined;
	const nestedMessage =
		typeof response?.message === "object"
			? response.message.message
			: undefined;
	const message =
		typeof response?.message === "string" ? response.message : nestedMessage;

	return message || "A temporary error has occurred.";
};

// Backward compatibility for the frontend's previous misspelled export name.
export const parseAsioxErrorMessage = parseAxiosErrorMessage;

export const isGlobalHandledStatusCode = (error: AxiosError) => {
	const excludedStatuses = [400, 404];

	return !excludedStatuses.includes(error.response?.status ?? -1);
};

export default http;

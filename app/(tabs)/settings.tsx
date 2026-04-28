import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

import { authApi, parseAxiosErrorMessage } from "@/apis";
import { ThemedText } from "@/components/themed-text";
import { Badge, Button, Card, Screen } from "@/components/ui";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import {
	Radius,
	Spacing,
	type ThemeColorName,
	Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getMemberInitial } from "@/lib/member";
import { useAppPreferences } from "@/providers/app-preferences-provider";

WebBrowser.maybeCompleteAuthSession();

const MISSING_GOOGLE_CLIENT_ID = "missing-google-client-id";

const settingsCopy = {
	en: {
		account: {
			emailLabel: "Email",
			emailPlaceholder: "you@example.com",
			google: "Continue with Google",
			googleCancelled: "Google sign-in was canceled.",
			googleFailed: "Google sign-in failed.",
			googleHint: "Complete Google sign-in, then return to the app.",
			googleMissingIdToken: "Google did not return an ID token.",
			googlePending: "Waiting for Google sign-in.",
			googlePreparing: "Preparing Google sign-in.",
			googleUnavailable: "Google OAuth client ID is not configured.",
			hint: "Sign in with the token sent to your email.",
			loggedIn: "Signed in",
			loggedOut: "Signed out",
			loggingIn: "Signing in",
			loggingOut: "Signing out",
			logout: "Log out",
			refresh: "Refresh",
			sendCode: "Send token",
			sendingCode: "Sending",
			statusLoading: "Checking your account status.",
			successLogin: "Signed in.",
			successLogout: "Signed out.",
			successSendCode: "Verification email sent.",
			title: "Account",
			tokenLabel: "Token",
			tokenPlaceholder: "Paste the token from your email",
			verify: "Sign in",
		},
		header: {
			eyebrow: "App settings",
			title: "Settings",
		},
		language: {
			description: "Choose the display language used by the app.",
			english: {
				description: "Use English labels in the interface.",
				label: "English",
			},
			korean: {
				description: "Use Korean labels in the interface.",
				label: "한국어",
			},
			title: "Language",
		},
		theme: {
			dark: {
				description: "Keep the app dark regardless of device settings.",
				label: "Dark",
			},
			description: "Select how the app should render light and dark surfaces.",
			light: {
				description: "Always use the light theme.",
				label: "Light",
			},
			system: {
				description: "Follow your device appearance automatically.",
				label: "System",
			},
			title: "Appearance",
		},
	},
	ko: {
		account: {
			emailLabel: "이메일",
			emailPlaceholder: "you@example.com",
			google: "Google로 계속하기",
			googleCancelled: "Google 로그인이 취소되었습니다.",
			googleFailed: "Google 로그인에 실패했습니다.",
			googleHint: "Google 로그인을 마친 뒤 앱으로 돌아오세요.",
			googleMissingIdToken: "Google ID 토큰을 받지 못했습니다.",
			googlePending: "Google 로그인 완료를 확인하는 중입니다.",
			googlePreparing: "Google 로그인을 준비하는 중입니다.",
			googleUnavailable: "Google OAuth 클라이언트 ID가 설정되지 않았습니다.",
			hint: "이메일로 받은 토큰을 입력해 로그인합니다.",
			loggedIn: "로그인됨",
			loggedOut: "로그아웃 상태",
			loggingIn: "로그인 중",
			loggingOut: "로그아웃 중",
			logout: "로그아웃",
			refresh: "새로고침",
			sendCode: "인증 메일 보내기",
			sendingCode: "전송 중",
			statusLoading: "계정 정보를 확인하는 중입니다.",
			successLogin: "로그인되었습니다.",
			successLogout: "로그아웃되었습니다.",
			successSendCode: "인증 메일을 보냈습니다.",
			title: "계정 설정",
			tokenLabel: "인증 토큰",
			tokenPlaceholder: "메일로 받은 토큰을 입력하세요",
			verify: "로그인",
		},
		header: {
			eyebrow: "앱 설정",
			title: "설정",
		},
		language: {
			description: "앱에서 표시할 언어를 선택합니다.",
			english: {
				description: "앱의 주요 라벨을 영어로 표시합니다.",
				label: "English",
			},
			korean: {
				description: "앱의 주요 라벨을 한국어로 표시합니다.",
				label: "한국어",
			},
			title: "언어",
		},
		theme: {
			dark: {
				description: "기기 설정과 무관하게 항상 어두운 테마를 사용합니다.",
				label: "어두운 테마",
			},
			description: "앱의 밝은 화면과 어두운 화면 표시 방식을 고릅니다.",
			light: {
				description: "항상 밝은 테마를 사용합니다.",
				label: "밝은 테마",
			},
			system: {
				description: "기기 설정에 맞춰 자동으로 전환합니다.",
				label: "시스템 설정",
			},
			title: "화면 테마",
		},
	},
} as const;

type FeedbackTone = Extract<ThemeColorName, "danger" | "success" | "textMuted">;

function resolveGoogleClientIds() {
	const baseClientId =
		process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
		process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
		"";
	const webClientId =
		process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || baseClientId;
	const iosClientId =
		process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || baseClientId;
	const androidClientId =
		process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || baseClientId;
	const runtimeClientId =
		Platform.select({
			android: androidClientId,
			ios: iosClientId,
			default: webClientId,
		}) || baseClientId;

	return {
		androidClientId:
			androidClientId || runtimeClientId || MISSING_GOOGLE_CLIENT_ID,
		clientId: runtimeClientId || MISSING_GOOGLE_CLIENT_ID,
		isConfigured: Boolean(runtimeClientId),
		iosClientId: iosClientId || runtimeClientId || MISSING_GOOGLE_CLIENT_ID,
		webClientId: webClientId || runtimeClientId || MISSING_GOOGLE_CLIENT_ID,
	};
}

export default function SettingsScreen() {
	const { colors } = useTheme();
	const {
		isAuthLoading,
		language,
		logout,
		me,
		refreshAuth,
		setLanguage,
		setThemePreference,
		themePreference,
	} = useAppPreferences();
	const copy = settingsCopy[language];

	const [email, setEmail] = useState("");
	const [token, setToken] = useState("");
	const [feedback, setFeedback] = useState<string>();
	const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("textMuted");
	const [isGoogleLoginPending, setIsGoogleLoginPending] = useState(false);
	const [isSendingCode, setIsSendingCode] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const processedGoogleResponseRef = useRef<string | undefined>(undefined);
	const googleClientIds = resolveGoogleClientIds();
	const [googleRequest, googleResponse, promptGoogleLogin] =
		Google.useIdTokenAuthRequest(
			{
				androidClientId: googleClientIds.androidClientId,
				clientId: googleClientIds.clientId,
				iosClientId: googleClientIds.iosClientId,
				language,
				selectAccount: true,
				webClientId: googleClientIds.webClientId,
			},
			{ path: "oauthredirect", scheme: "shathingapp" },
		);

	const handleSendCode = async () => {
		const trimmedEmail = email.trim();
		if (!trimmedEmail) return;

		setIsSendingCode(true);
		setFeedback(undefined);

		try {
			await authApi.sendAuthEmail({ email: trimmedEmail, fromApp: true });
			setFeedback(copy.account.successSendCode);
			setFeedbackTone("success");
		} catch (error) {
			setFeedback(parseAxiosErrorMessage(error));
			setFeedbackTone("danger");
		} finally {
			setIsSendingCode(false);
		}
	};

	const handleVerify = async () => {
		const trimmedToken = token.trim();
		if (!trimmedToken) return;

		setIsVerifying(true);
		setFeedback(undefined);

		try {
			await authApi.verifyToken({ token: trimmedToken });
			await refreshAuth();
			setFeedback(copy.account.successLogin);
			setFeedbackTone("success");
		} catch (error) {
			setFeedback(parseAxiosErrorMessage(error));
			setFeedbackTone("danger");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		setFeedback(undefined);

		try {
			await logout();
			setToken("");
			setFeedback(copy.account.successLogout);
			setFeedbackTone("success");
		} catch (error) {
			setFeedback(parseAxiosErrorMessage(error));
			setFeedbackTone("danger");
		} finally {
			setIsLoggingOut(false);
		}
	};

	const handleGoogleLogin = async () => {
		if (!googleClientIds.isConfigured) {
			setFeedback(copy.account.googleUnavailable);
			setFeedbackTone("danger");
			return;
		}
		if (!googleRequest) {
			setFeedback(copy.account.googlePreparing);
			setFeedbackTone("textMuted");
			return;
		}

		setFeedback(copy.account.googleHint);
		setFeedbackTone("textMuted");
		setIsGoogleLoginPending(true);

		try {
			const result = await promptGoogleLogin();

			if (result.type === "cancel" || result.type === "dismiss") {
				setIsGoogleLoginPending(false);
				setFeedback(copy.account.googleCancelled);
				setFeedbackTone("textMuted");
			}
			if (result.type === "error") {
				setIsGoogleLoginPending(false);
				setFeedback(
					result.error?.message ||
						result.params.error_description ||
						result.params.error ||
						copy.account.googleFailed,
				);
				setFeedbackTone("danger");
			}
			if (result.type === "locked") {
				setIsGoogleLoginPending(false);
				setFeedback(copy.account.googleFailed);
				setFeedbackTone("danger");
			}
		} catch (error) {
			setIsGoogleLoginPending(false);
			setFeedback(parseAxiosErrorMessage(error));
			setFeedbackTone("danger");
		}
	};

	useEffect(() => {
		if (!googleResponse) return;

		if (googleResponse.type === "cancel" || googleResponse.type === "dismiss") {
			setIsGoogleLoginPending(false);
			setFeedback(copy.account.googleCancelled);
			setFeedbackTone("textMuted");
			return;
		}

		if (googleResponse.type === "error") {
			setIsGoogleLoginPending(false);
			setFeedback(
				googleResponse.error?.message ||
					googleResponse.params.error_description ||
					googleResponse.params.error ||
					copy.account.googleFailed,
			);
			setFeedbackTone("danger");
			return;
		}

		if (googleResponse.type !== "success") return;

		const responseKey =
			googleResponse.url ||
			googleResponse.params.id_token ||
			googleResponse.params.code;
		if (responseKey && processedGoogleResponseRef.current === responseKey) {
			return;
		}
		if (responseKey) {
			processedGoogleResponseRef.current = responseKey;
		}

		const idToken =
			googleResponse.params.id_token || googleResponse.authentication?.idToken;

		if (!idToken) {
			setIsGoogleLoginPending(false);
			setFeedback(copy.account.googleMissingIdToken);
			setFeedbackTone("danger");
			return;
		}

		let isActive = true;

		async function completeGoogleLogin(googleIdToken: string) {
			try {
				await authApi.loginWithGoogle({ idToken: googleIdToken });
				const member = await refreshAuth();

				if (!isActive) return;

				if (member) {
					setFeedback(copy.account.successLogin);
					setFeedbackTone("success");
				} else {
					setFeedback(copy.account.googleFailed);
					setFeedbackTone("danger");
				}
			} catch (error) {
				if (!isActive) return;

				setFeedback(parseAxiosErrorMessage(error));
				setFeedbackTone("danger");
			} finally {
				if (isActive) {
					setIsGoogleLoginPending(false);
				}
			}
		}

		void completeGoogleLogin(idToken);

		return () => {
			isActive = false;
		};
	}, [
		copy.account.googleCancelled,
		copy.account.googleFailed,
		copy.account.googleMissingIdToken,
		copy.account.successLogin,
		googleResponse,
		refreshAuth,
	]);

	return (
		<Screen scroll contentStyle={styles.content}>
			<View style={styles.header}>
				<ThemedText type="title">{copy.header.title}</ThemedText>
			</View>

			<SettingSection
				description={copy.account.hint}
				icon="person.crop.circle"
				title={copy.account.title}
			>
				<View style={styles.accountTopRow}>
					{isAuthLoading ? (
						<Badge>{copy.account.statusLoading}</Badge>
					) : me ? (
						<Badge tone="success">{copy.account.loggedIn}</Badge>
					) : (
						<Badge>{copy.account.loggedOut}</Badge>
					)}
				</View>

				{me ? (
					<View style={styles.accountPanel}>
						<View style={styles.accountSummary}>
							<View
								style={[
									styles.profileAvatar,
									{ backgroundColor: colors.primary },
								]}
							>
								<ThemedText type="title" color="primaryForeground">
									{getMemberInitial(me.username)}
								</ThemedText>
							</View>
							<View style={styles.accountBody}>
								<ThemedText type="bodyStrong">{me.username}</ThemedText>
								<ThemedText type="caption" color="textMuted">
									{me.email}
								</ThemedText>
							</View>
						</View>

						<View style={styles.accountActions}>
							<Button
								icon="arrow.clockwise"
								onPress={() => void refreshAuth()}
								size="sm"
								style={styles.inlineAction}
								variant="outline"
							>
								{copy.account.refresh}
							</Button>
							<Button
								onPress={() => void handleLogout()}
								size="sm"
								style={styles.inlineAction}
								variant="outline"
								disabled={isLoggingOut}
							>
								{isLoggingOut ? copy.account.loggingOut : copy.account.logout}
							</Button>
						</View>
					</View>
				) : (
					<View style={styles.form}>
						<Button
							fullWidth
							onPress={() => void handleGoogleLogin()}
							disabled={
								isGoogleLoginPending ||
								(googleClientIds.isConfigured && !googleRequest)
							}
							variant="outline"
						>
							{isGoogleLoginPending
								? copy.account.googlePending
								: googleClientIds.isConfigured && !googleRequest
									? copy.account.googlePreparing
									: copy.account.google}
						</Button>

						<InputField
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
							label={copy.account.emailLabel}
							onChangeText={setEmail}
							placeholder={copy.account.emailPlaceholder}
							value={email}
						/>
						<Button
							fullWidth
							onPress={() => void handleSendCode()}
							disabled={isSendingCode || !email.trim()}
						>
							{isSendingCode ? copy.account.sendingCode : copy.account.sendCode}
						</Button>

						<InputField
							autoCapitalize="none"
							autoCorrect={false}
							label={copy.account.tokenLabel}
							onChangeText={setToken}
							placeholder={copy.account.tokenPlaceholder}
							value={token}
						/>
						<Button
							fullWidth
							onPress={() => void handleVerify()}
							disabled={isVerifying || !token.trim()}
						>
							{isVerifying ? copy.account.loggingIn : copy.account.verify}
						</Button>
					</View>
				)}

				{feedback ? (
					<ThemedText type="caption" color={feedbackTone}>
						{feedback}
					</ThemedText>
				) : null}
			</SettingSection>

			<SettingSection
				description={copy.theme.description}
				icon="paintpalette.fill"
				title={copy.theme.title}
			>
				<View style={styles.optionList}>
					<PreferenceOption
						description={copy.theme.system.description}
						isSelected={themePreference === "system"}
						label={copy.theme.system.label}
						onPress={() => setThemePreference("system")}
					/>
					<PreferenceOption
						description={copy.theme.light.description}
						isSelected={themePreference === "light"}
						label={copy.theme.light.label}
						onPress={() => setThemePreference("light")}
					/>
					<PreferenceOption
						description={copy.theme.dark.description}
						isSelected={themePreference === "dark"}
						label={copy.theme.dark.label}
						onPress={() => setThemePreference("dark")}
					/>
				</View>
			</SettingSection>

			<SettingSection
				description={copy.language.description}
				icon="globe"
				title={copy.language.title}
			>
				<View style={styles.optionList}>
					<PreferenceOption
						description={copy.language.korean.description}
						isSelected={language === "ko"}
						label={copy.language.korean.label}
						onPress={() => setLanguage("ko")}
					/>
					<PreferenceOption
						description={copy.language.english.description}
						isSelected={language === "en"}
						label={copy.language.english.label}
						onPress={() => setLanguage("en")}
					/>
				</View>
			</SettingSection>
		</Screen>
	);
}

function SettingSection({
	children,
	description,
	icon,
	title,
}: {
	children: ReactNode;
	description: string;
	icon: IconSymbolName;
	title: string;
}) {
	const { colors } = useTheme();

	return (
		<Card variant="elevated" style={styles.section}>
			<View style={styles.sectionHeader}>
				<View
					style={[styles.sectionIcon, { backgroundColor: colors.surfaceMuted }]}
				>
					<IconSymbol color={colors.primary} name={icon} size={20} />
				</View>
				<View style={styles.sectionText}>
					<ThemedText type="heading">{title}</ThemedText>
					<ThemedText type="caption" color="textMuted">
						{description}
					</ThemedText>
				</View>
			</View>
			{children}
		</Card>
	);
}

function PreferenceOption({
	description,
	isSelected,
	label,
	onPress,
}: {
	description: string;
	isSelected: boolean;
	label: string;
	onPress: () => void;
}) {
	const { colors } = useTheme();

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => [
				styles.optionButton,
				{
					backgroundColor: isSelected
						? colors.surfaceMuted
						: pressed
							? colors.surfaceMuted
							: colors.surface,
					borderColor: isSelected ? colors.primary : colors.border,
				},
			]}
		>
			<View style={styles.optionBody}>
				<ThemedText type="bodyStrong">{label}</ThemedText>
				<ThemedText type="caption" color="textMuted">
					{description}
				</ThemedText>
			</View>
			<View
				style={[
					styles.optionIndicator,
					{
						backgroundColor: isSelected ? colors.primary : "transparent",
						borderColor: isSelected ? colors.primary : colors.borderStrong,
					},
				]}
			/>
		</Pressable>
	);
}

function InputField({
	label,
	...props
}: {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder: string;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	autoCorrect?: boolean;
	keyboardType?: "default" | "email-address";
}) {
	const { colors } = useTheme();

	return (
		<View style={styles.field}>
			<ThemedText type="label">{label}</ThemedText>
			<TextInput
				placeholderTextColor={colors.textSubtle}
				selectionColor={colors.primary}
				style={[
					styles.input,
					{
						backgroundColor: colors.surface,
						borderColor: colors.input,
						color: colors.text,
					},
				]}
				{...props}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	accountActions: {
		flexDirection: "row",
		gap: Spacing.sm,
	},
	accountBody: {
		flex: 1,
		gap: Spacing.xs,
	},
	accountPanel: {
		gap: Spacing.md,
	},
	accountSummary: {
		alignItems: "center",
		flexDirection: "row",
		gap: Spacing.md,
	},
	accountTopRow: {
		alignItems: "flex-start",
	},
	content: {
		gap: Spacing.xl,
		paddingBottom: Spacing["4xl"],
	},
	field: {
		gap: Spacing.sm,
	},
	form: {
		gap: Spacing.md,
	},
	header: {
		gap: Spacing.sm,
	},
	inlineAction: {
		flex: 1,
	},
	input: {
		...Typography.body,
		borderRadius: Radius.md,
		borderWidth: 1,
		minHeight: 48,
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.md,
	},
	optionBody: {
		flex: 1,
		gap: Spacing.xs,
	},
	optionButton: {
		alignItems: "center",
		borderRadius: Radius.lg,
		borderWidth: 1,
		flexDirection: "row",
		gap: Spacing.md,
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.md,
	},
	optionIndicator: {
		borderRadius: Radius.pill,
		borderWidth: 1,
		height: 14,
		width: 14,
	},
	optionList: {
		gap: Spacing.sm,
	},
	profileAvatar: {
		alignItems: "center",
		borderRadius: Radius.pill,
		height: 52,
		justifyContent: "center",
		width: 52,
	},
	section: {
		gap: Spacing.lg,
	},
	sectionHeader: {
		alignItems: "center",
		flexDirection: "row",
		gap: Spacing.md,
	},
	sectionIcon: {
		alignItems: "center",
		borderRadius: Radius.md,
		height: 42,
		justifyContent: "center",
		width: 42,
	},
	sectionText: {
		flex: 1,
		gap: Spacing.xs,
	},
});

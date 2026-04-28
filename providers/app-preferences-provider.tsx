import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "@/apis";
import { type ThemeName } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Member } from "@/types/models/member";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type PropsWithChildren,
} from "react";

export type ThemePreference = "system" | "light" | "dark";
export type AppLanguage = "ko" | "en";

const APP_PREFERENCES_STORAGE_KEY = "shathing-app:preferences";

type AppPreferencesContextValue = {
	isPreferencesHydrated: boolean;
	language: AppLanguage;
	me?: Member;
	refreshAuth: () => Promise<Member | undefined>;
	resolvedTheme: ThemeName;
	setLanguage: (language: AppLanguage) => void;
	setThemePreference: (preference: ThemePreference) => void;
	themePreference: ThemePreference;
	isAuthLoading: boolean;
	logout: () => Promise<void>;
};

const AppPreferencesContext = createContext<
	AppPreferencesContextValue | undefined
>(undefined);

export function AppPreferencesProvider({
	children,
}: PropsWithChildren) {
	const systemColorScheme = useColorScheme() ?? "light";
	const [themePreference, setThemePreference] =
		useState<ThemePreference>("system");
	const [language, setLanguage] = useState<AppLanguage>("ko");
	const [me, setMe] = useState<Member>();
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [isPreferencesHydrated, setIsPreferencesHydrated] = useState(false);

	const resolvedTheme: ThemeName =
		themePreference === "system" ? systemColorScheme : themePreference;

	const refreshAuth = useCallback(async () => {
		setIsAuthLoading(true);

		try {
			const { data } = await authApi.me();
			setMe(data);
			return data;
		} catch {
			setMe(undefined);
			return undefined;
		} finally {
			setIsAuthLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		await authApi.logout();
		setMe(undefined);
	}, []);

	useEffect(() => {
		void refreshAuth();
	}, [refreshAuth]);

	useEffect(() => {
		let isMounted = true;

		async function loadPreferences() {
			try {
				const storedPreferences = await AsyncStorage.getItem(
					APP_PREFERENCES_STORAGE_KEY,
				);

				if (!storedPreferences) return;

				const parsedPreferences = JSON.parse(
					storedPreferences,
				) as Partial<{
					language: AppLanguage;
					themePreference: ThemePreference;
				}>;

				if (
					parsedPreferences.themePreference === "system" ||
					parsedPreferences.themePreference === "light" ||
					parsedPreferences.themePreference === "dark"
				) {
					setThemePreference(parsedPreferences.themePreference);
				}

				if (
					parsedPreferences.language === "ko" ||
					parsedPreferences.language === "en"
				) {
					setLanguage(parsedPreferences.language);
				}
			} catch {
				// Ignore malformed or unavailable persisted preferences.
			} finally {
				if (isMounted) {
					setIsPreferencesHydrated(true);
				}
			}
		}

		void loadPreferences();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (!isPreferencesHydrated) return;

		void AsyncStorage.setItem(
			APP_PREFERENCES_STORAGE_KEY,
			JSON.stringify({
				language,
				themePreference,
			}),
		);
	}, [isPreferencesHydrated, language, themePreference]);

	const value = useMemo<AppPreferencesContextValue>(
		() => ({
			isPreferencesHydrated,
			language,
			me,
			refreshAuth,
			resolvedTheme,
			setLanguage,
			setThemePreference,
			themePreference,
			isAuthLoading,
			logout,
		}),
		[
			isPreferencesHydrated,
			language,
			me,
			refreshAuth,
			resolvedTheme,
			themePreference,
			isAuthLoading,
			logout,
		],
	);

	return (
		<AppPreferencesContext.Provider value={value}>
			{children}
		</AppPreferencesContext.Provider>
	);
}

export function useAppPreferences() {
	const context = useContext(AppPreferencesContext);

	if (!context) {
		throw new Error(
			"useAppPreferences must be used within an AppPreferencesProvider",
		);
	}

	return context;
}

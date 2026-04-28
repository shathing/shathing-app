import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAppPreferences } from "@/providers/app-preferences-provider";

const tabLabels = {
	en: {
		chat: "Chat",
		home: "Home",
		post: "Post",
		settings: "Settings",
	},
	ko: {
		chat: "채팅",
		home: "홈",
		post: "글쓰기",
		settings: "설정",
	},
} as const;

export default function TabLayout() {
	const { colors } = useTheme();
	const { language } = useAppPreferences();
	const insets = useSafeAreaInsets();
	const bottomInset = Math.max(insets.bottom, 8);
	const labels = tabLabels[language];

	return (
		<Tabs
			screenOptions={{
				sceneStyle: { backgroundColor: colors.background },
				tabBarActiveTintColor: colors.tabIconSelected,
				tabBarInactiveTintColor: colors.tabIconDefault,
				tabBarHideOnKeyboard: true,
				tabBarItemStyle: {
					paddingBottom: 0,
					paddingTop: 4,
				},
				tabBarLabelStyle: {
					...Typography.caption,
					lineHeight: 16,
					marginBottom: 0,
					marginTop: 0,
				},
				tabBarStyle: {
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
					borderTopLeftRadius: Radius.lg,
					borderTopRightRadius: Radius.lg,
					height: 56 + bottomInset,
					overflow: "hidden",
					paddingBottom: bottomInset,
					paddingTop: 6,
				},
				headerShown: false,
				tabBarButton: HapticTab,
			}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: labels.home,
						tabBarIcon: ({ color }) => (
							<IconSymbol size={24} name="house.fill" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="post"
					options={{
						title: labels.post,
						tabBarIcon: ({ color }) => (
							<IconSymbol size={24} name="square.and.pencil" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="chat"
					options={{
						title: labels.chat,
						tabBarIcon: ({ color }) => (
							<IconSymbol size={24} name="message.fill" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						title: labels.settings,
						tabBarIcon: ({ color }) => (
							<IconSymbol size={24} name="gearshape.fill" color={color} />
						),
					}}
				/>
		</Tabs>
	);
}

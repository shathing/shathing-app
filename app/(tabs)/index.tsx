import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from "react-native";

import { parseAxiosErrorMessage, shareApi } from "@/apis";
import { CategorySelector } from "@/components/category-selector";
import { RegionSelector } from "@/components/region-selector";
import { ThemedText } from "@/components/themed-text";
import { Button, Card, Screen } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatAgo } from "@/lib/format-ago";
import { getImageUrl } from "@/lib/image-url";
import type { CountryCode, PageResponse } from "@/types/apis/common";
import type { Category } from "@/types/models/category";
import type { Region } from "@/types/models/region";
import type { ShareItem } from "@/types/models/share-item";

const COUNTRY_CODE: CountryCode = "KR";
const PAGE_SIZE = 20;

export default function HomeScreen() {
	const [keyword, setKeyword] = useState("");
	const [submittedSearch, setSubmittedSearch] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<Category>();
	const [selectedRegion, setSelectedRegion] = useState<Region>();
	const [shareItems, setShareItems] = useState<ShareItem[]>([]);
	const [pageInfo, setPageInfo] = useState<PageResponse<ShareItem>>();
	const [error, setError] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const selectedCategoryId = selectedCategory?.id.toString();
	const selectedRegionId = selectedRegion?.id.toString();

	const loadShareItems = useCallback(
		async ({
			append = false,
			page,
		}: {
			append?: boolean;
			page?: number;
		} = {}) => {
			if (append) {
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
			}

			try {
				const response = await shareApi.getList({
					categoryId: selectedCategoryId,
					countryCode: COUNTRY_CODE,
					page,
					regionId: selectedRegionId,
					search: submittedSearch || undefined,
					size: PAGE_SIZE,
				});

				setPageInfo(response.data);
				setShareItems((currentItems) =>
					append
						? [...currentItems, ...response.data.items]
						: response.data.items,
				);
				setError(undefined);
			} catch (loadError) {
				setError(getErrorMessage(loadError));
				if (!append) {
					setShareItems([]);
					setPageInfo(undefined);
				}
			} finally {
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[selectedCategoryId, selectedRegionId, submittedSearch],
	);

	useEffect(() => {
		void loadShareItems();
	}, [loadShareItems]);

	const submitSearch = () => {
		setSubmittedSearch(keyword.trim());
	};

	const loadNextPage = () => {
		if (!pageInfo?.hasNext || isLoadingMore) return;
		void loadShareItems({ append: true, page: pageInfo.page + 1 });
	};

	return (
		<Screen contentStyle={styles.screen}>
			<SearchPanel
				category={selectedCategory}
				countryCode={COUNTRY_CODE}
				keyword={keyword}
				onChangeKeyword={setKeyword}
				onSelectCategory={(category) => {
					setSelectedCategory(category);
				}}
				onSelectRegion={(region) => {
					setSelectedRegion(region);
				}}
				onSubmit={submitSearch}
				region={selectedRegion}
			/>

			<ScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				style={styles.resultsScroll}
			>
				{isLoading ? (
					<StatusCard title="공유글을 불러오는 중입니다." />
				) : error ? (
					<ErrorCard message={error} onRetry={() => void loadShareItems()} />
				) : shareItems.length > 0 ? (
					<View style={styles.list}>
						{shareItems.map((item) => (
							<ShareListItem key={item.id} item={item} />
						))}
						{pageInfo?.hasNext ? (
							<View style={styles.loadMore}>
								<Button
									disabled={isLoadingMore}
									onPress={loadNextPage}
									variant="outline"
								>
									{isLoadingMore ? "불러오는 중" : "더보기"}
								</Button>
							</View>
						) : null}
					</View>
				) : (
					<EmptyShareList />
				)}
			</ScrollView>
		</Screen>
	);
}

function SearchPanel({
	category,
	countryCode,
	keyword,
	onChangeKeyword,
	onSelectCategory,
	onSelectRegion,
	onSubmit,
	region,
}: {
	category?: Category;
	countryCode: CountryCode;
	keyword: string;
	onChangeKeyword: (value: string) => void;
	onSelectCategory: (category?: Category) => void;
	onSelectRegion: (region?: Region) => void;
	onSubmit: () => void;
	region?: Region;
}) {
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.searchBar,
				{
					backgroundColor: colors.background,
					borderBottomColor: colors.border,
				},
			]}
		>
			<RegionSelector
				countryCode={countryCode}
				onChange={onSelectRegion}
				selectedRegion={region}
				style={styles.selectorButton}
			/>
			<CategorySelector
				countryCode={countryCode}
				onChange={onSelectCategory}
				selectedCategory={category}
				style={styles.selectorButton}
			/>
			<View style={styles.searchRow}>
				<View
					style={[
						styles.inputShell,
						{
							backgroundColor: colors.surface,
							borderColor: colors.input,
						},
					]}
				>
					<IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
					<TextInput
						value={keyword}
						onChangeText={onChangeKeyword}
						onSubmitEditing={onSubmit}
						placeholder="입력"
						placeholderTextColor={colors.textSubtle}
						returnKeyType="search"
						selectionColor={colors.primary}
						style={[styles.input, { color: colors.text }]}
					/>
				</View>
				<Button onPress={onSubmit} style={styles.searchButton}>
					검색
				</Button>
			</View>
		</View>
	);
}

function ShareListItem({ item }: { item: ShareItem }) {
	const { colors } = useTheme();
	const router = useRouter();
	const imageUrl = getImageUrl(item.photoUrls[0]);

	return (
		<Pressable
			accessibilityRole="button"
			onPress={() => router.push(`/share/${item.id}`)}
			style={({ pressed }) => [
				styles.shareItem,
				{
					backgroundColor: pressed ? colors.surfaceMuted : colors.background,
					borderColor: colors.border,
				},
			]}
		>
			<View
				style={[styles.thumbnail, { backgroundColor: colors.surfaceMuted }]}
			>
				{imageUrl ? (
					<Image
						source={{ uri: imageUrl }}
						style={styles.thumbnailImage}
						contentFit="cover"
					/>
				) : (
					<IconSymbol name="photo.fill" size={26} color={colors.icon} />
				)}
			</View>
			<View style={styles.shareText}>
				<ThemedText type="heading" numberOfLines={1}>
					{item.title}
				</ThemedText>
				<View style={styles.metaRow}>
					<ThemedText type="caption" color="textMuted" numberOfLines={1}>
						{item.region.name}
					</ThemedText>
					<ThemedText type="caption" color="textMuted">
						·
					</ThemedText>
					<ThemedText type="caption" color="textMuted">
						{formatAgo(item.createdDate)}
					</ThemedText>
				</View>
			</View>
		</Pressable>
	);
}

function StatusCard({ title }: { title: string }) {
	return (
		<Card style={styles.statusCard}>
			<ThemedText type="body" color="textMuted">
				{title}
			</ThemedText>
		</Card>
	);
}

function ErrorCard({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	const { colors } = useTheme();

	return (
		<Card variant="elevated" style={styles.empty}>
			<View
				style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}
			>
				<IconSymbol
					name="chevron.left.forwardslash.chevron.right"
					size={28}
					color={colors.icon}
				/>
			</View>
			<ThemedText type="heading" style={styles.emptyText}>
				공유글을 불러오지 못했습니다.
			</ThemedText>
			<ThemedText type="body" color="textMuted" style={styles.emptyText}>
				{message}
			</ThemedText>
			<Button onPress={onRetry} variant="outline">
				다시 시도
			</Button>
		</Card>
	);
}

function EmptyShareList() {
	const { colors } = useTheme();

	return (
		<Card variant="elevated" style={styles.empty}>
			<View
				style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}
			>
				<IconSymbol name="photo.fill" size={28} color={colors.icon} />
			</View>
			<ThemedText type="heading" style={styles.emptyText}>
				아직 공유된 물건이 없습니다.
			</ThemedText>
			<ThemedText type="body" color="textMuted" style={styles.emptyText}>
				직접 등록해 보는 건 어떠신가요?
			</ThemedText>
			<Button icon="square.and.pencil">등록하기</Button>
		</Card>
	);
}

function getErrorMessage(error: unknown) {
	return parseAxiosErrorMessage(error);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	resultsScroll: {
		flex: 1,
	},
	content: {
		gap: Spacing.md,
		paddingBottom: Spacing["4xl"],
		paddingTop: Spacing.md,
	},
	searchBar: {
		alignItems: "center",
		borderBottomWidth: 1,
		flexDirection: "row",
		gap: Spacing.sm,
		paddingBottom: Spacing.md,
	},
	selectorButton: {
		flexShrink: 0,
		maxWidth: 104,
		minWidth: 82,
	},
	searchRow: {
		alignItems: "center",
		flex: 1,
		flexDirection: "row",
		gap: Spacing.sm,
		minWidth: 0,
	},
	inputShell: {
		alignItems: "center",
		borderRadius: Radius.md,
		borderWidth: 1,
		flex: 1,
		flexDirection: "row",
		gap: Spacing.sm,
		minHeight: 44,
		paddingHorizontal: Spacing.md,
	},
	input: {
		...Typography.body,
		flex: 1,
		minWidth: 0,
		paddingVertical: Spacing.sm,
	},
	searchButton: {
		minWidth: 58,
		paddingHorizontal: Spacing.md,
	},
	list: {
		gap: Spacing.md,
	},
	shareItem: {
		borderBottomWidth: 1,
		borderRadius: Radius.lg,
		flexDirection: "row",
		gap: Spacing.md,
		padding: Spacing.xs,
	},
	thumbnail: {
		alignItems: "center",
		borderRadius: Radius.lg,
		height: 80,
		justifyContent: "center",
		overflow: "hidden",
		width: 80,
	},
	thumbnailImage: {
		height: "100%",
		width: "100%",
	},
	shareText: {
		flex: 1,
		gap: Spacing.xs,
		justifyContent: "center",
		minWidth: 0,
		paddingRight: Spacing.xs,
	},
	metaRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: Spacing.xs,
	},
	loadMore: {
		alignItems: "center",
		paddingVertical: Spacing.sm,
	},
	statusCard: {
		alignItems: "center",
		paddingVertical: Spacing.xl,
	},
	empty: {
		alignItems: "center",
		gap: Spacing.md,
		justifyContent: "center",
		minHeight: 280,
	},
	emptyIcon: {
		alignItems: "center",
		borderRadius: Radius.pill,
		height: 64,
		justifyContent: "center",
		width: 64,
	},
	emptyText: {
		textAlign: "center",
	},
});

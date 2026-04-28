import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { parseAxiosErrorMessage, regionApi } from '@/apis';
import { ThemedText } from '@/components/themed-text';
import { Button, Card } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type CountryCode } from '@/types/apis/common';
import { type Region } from '@/types/models/region';

type RegionSelectorProps = {
  countryCode: CountryCode;
  selectedRegion?: Region;
  style?: StyleProp<ViewStyle>;
  onChange: (region?: Region) => void;
};

export function RegionSelector({
  countryCode,
  selectedRegion,
  style,
  onChange,
}: RegionSelectorProps) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadRegions = useCallback(async () => {
    setIsPending(true);
    try {
      const response = await regionApi.getList({
        countryCode,
        search: debouncedSearch || undefined,
      });
      setRegions(response.data);
      setError(undefined);
    } catch (loadError) {
      setError(parseAxiosErrorMessage(loadError));
    } finally {
      setIsPending(false);
    }
  }, [countryCode, debouncedSearch]);

  useEffect(() => {
    if (!open) return;

    void loadRegions();
  }, [loadRegions, open]);

  const handleChange = (region?: Region) => {
    onChange(region);
    setSearch('');
    setOpen(false);
  };

  return (
    <>
      <Button
        icon="line.3.horizontal.decrease.circle"
        onPress={() => setOpen(true)}
        size="sm"
        style={style}
        variant="outline">
        {selectedRegion?.name ?? '지역'}
      </Button>

      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Card variant="elevated" style={[styles.panel, { maxHeight: height * 0.82 }]}>
              <View style={styles.header}>
                <ThemedText type="heading">지역 변경</ThemedText>
                <Button size="sm" variant="ghost" onPress={() => setOpen(false)}>
                  닫기
                </Button>
              </View>

              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.input,
                  },
                ]}>
                <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="입력"
                  placeholderTextColor={colors.textSubtle}
                  returnKeyType="search"
                  selectionColor={colors.primary}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>

              {isPending ? (
                <View style={styles.state}>
                  <ThemedText type="body" color="textMuted">
                    지역을 불러오고 있습니다.
                  </ThemedText>
                </View>
              ) : error ? (
                <View style={styles.state}>
                  <ThemedText type="body" color="textMuted" style={styles.stateText}>
                    {error}
                  </ThemedText>
                  <Button icon="arrow.clockwise" onPress={() => void loadRegions()} variant="outline">
                    다시 시도
                  </Button>
                </View>
              ) : regions.length === 0 ? (
                <View style={styles.state}>
                  <ThemedText type="body" color="textMuted">
                    검색 결과가 없습니다.
                  </ThemedText>
                </View>
              ) : (
                <ScrollView style={styles.options} showsVerticalScrollIndicator={false}>
                  <RegionOption
                    label="전체 지역"
                    selected={!selectedRegion}
                    onPress={() => handleChange(undefined)}
                  />
                  {regions.map((region) => (
                    <RegionOption
                      key={region.id}
                      label={region.fullName}
                      selected={region.id === selectedRegion?.id}
                      onPress={() => handleChange(region)}
                    />
                  ))}
                </ScrollView>
              )}
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function RegionOption({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.accent : 'transparent',
        },
      ]}>
      <ThemedText type="bodyStrong" style={styles.optionText}>
        {label}
      </ThemedText>
      {selected ? <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
  },
  sheet: {
    flexShrink: 1,
    padding: Spacing.lg,
  },
  panel: {
    borderRadius: Radius.xl,
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputShell: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
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
  options: {
    maxHeight: 380,
  },
  option: {
    alignItems: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionText: {
    flex: 1,
  },
  state: {
    alignItems: 'center',
    gap: Spacing.md,
    justifyContent: 'center',
    minHeight: 160,
  },
  stateText: {
    textAlign: 'center',
  },
});

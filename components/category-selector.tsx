import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { categoryApi, parseAxiosErrorMessage } from '@/apis';
import { ThemedText } from '@/components/themed-text';
import { Button, Card } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type CountryCode } from '@/types/apis/common';
import { type Category } from '@/types/models/category';

type CategorySelectorProps = {
  countryCode: CountryCode;
  selectedCategory?: Category;
  style?: StyleProp<ViewStyle>;
  onChange: (category?: Category) => void;
};

export function CategorySelector({
  countryCode,
  selectedCategory,
  style,
  onChange,
}: CategorySelectorProps) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  const loadCategories = useCallback(async () => {
    setIsPending(true);
    try {
      const response = await categoryApi.getList(countryCode);
      setCategories(response.data);
      setError(undefined);
    } catch (loadError) {
      setError(parseAxiosErrorMessage(loadError));
    } finally {
      setIsPending(false);
    }
  }, [countryCode]);

  useEffect(() => {
    if (!open || categories.length > 0 || isPending) return;

    void loadCategories();
  }, [categories.length, isPending, loadCategories, open]);

  const handleChange = (category?: Category) => {
    onChange(category);
    setOpen(false);
  };

  return (
    <>
      <Button
        icon="rectangle.stack.fill"
        onPress={() => setOpen(true)}
        size="sm"
        style={style}
        variant="outline">
        {selectedCategory?.name ?? '카테고리'}
      </Button>

      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Card variant="elevated" style={[styles.panel, { maxHeight: height * 0.82 }]}>
              <View style={styles.header}>
                <ThemedText type="heading">카테고리</ThemedText>
                <Button size="sm" variant="ghost" onPress={() => setOpen(false)}>
                  닫기
                </Button>
              </View>

              {isPending ? (
                <View style={styles.state}>
                  <ThemedText type="body" color="textMuted">
                    카테고리를 불러오고 있습니다.
                  </ThemedText>
                </View>
              ) : error ? (
                <View style={styles.state}>
                  <ThemedText type="body" color="textMuted" style={styles.stateText}>
                    {error}
                  </ThemedText>
                  <Button icon="arrow.clockwise" onPress={() => void loadCategories()} variant="outline">
                    다시 시도
                  </Button>
                </View>
              ) : (
                <ScrollView style={styles.options} showsVerticalScrollIndicator={false}>
                  <CategoryOption
                    label="전체 카테고리"
                    selected={!selectedCategory}
                    onPress={() => handleChange(undefined)}
                  />
                  {categories.map((category) => (
                    <CategoryOption
                      key={category.id}
                      label={category.name}
                      selected={category.id === selectedCategory?.id}
                      onPress={() => handleChange(category)}
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

function CategoryOption({
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
    minHeight: 160,
    justifyContent: 'center',
  },
  stateText: {
    textAlign: 'center',
  },
});

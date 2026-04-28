import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fileApi, parseAxiosErrorMessage, shareApi } from '@/apis';
import { CategorySelector } from '@/components/category-selector';
import { LoginRequiredCard } from '@/components/login-required-card';
import { RegionSelector } from '@/components/region-selector';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, LoadingState, Screen } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRefreshedAuth } from '@/hooks/use-refreshed-auth';
import { getImageUrl } from '@/lib/image-url';
import { type CountryCode } from '@/types/apis/common';
import { type Category } from '@/types/models/category';
import { type Region } from '@/types/models/region';
import { type ShareItem } from '@/types/models/share-item';

const COUNTRY_CODE: CountryCode = 'KR';
const TITLE_MAX_LENGTH = 80;
const CONTENT_MAX_LENGTH = 1200;
const PHOTO_MAX_COUNT = 10;

type FormErrors = {
  categoryId?: string;
  content?: string;
  photoUrls?: string;
  regionId?: string;
  title?: string;
};

type SelectedPhoto = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  remoteKey?: string;
  file?: File;
};

export default function PostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editItemId = Number(params.id);
  const isEditMode = Number.isFinite(editItemId) && editItemId > 0;
  const { colors } = useTheme();
  const { isAuthLoading, me } = useRefreshedAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region>();
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [errors, setErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState<string>();
  const [isPendingEditingItem, setIsPendingEditingItem] = useState(isEditMode);
  const [isErrorEditingItem, setIsErrorEditingItem] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = content.length;
  const canSubmit = useMemo(() => !isSubmitting && !isPendingEditingItem, [
    isPendingEditingItem,
    isSubmitting,
  ]);

  useEffect(() => {
    if (!isEditMode || !me) return;

    let isMounted = true;

    async function loadEditingItem() {
      setIsPendingEditingItem(true);
      try {
        const { data } = await shareApi.getById(editItemId);
        if (!isMounted) return;
        populateForm(data);
        setIsErrorEditingItem(false);
      } catch {
        if (!isMounted) return;
        setIsErrorEditingItem(true);
      } finally {
        if (isMounted) {
          setIsPendingEditingItem(false);
        }
      }
    }

    void loadEditingItem();

    return () => {
      isMounted = false;
    };
  }, [editItemId, isEditMode, me]);

  const populateForm = (item: ShareItem) => {
    setTitle(item.title);
    setContent(item.content);
    setPhotos(
      item.photoUrls.map((photoUrl, index) => ({
        id: `remote:${photoUrl}:${index}`,
        mimeType: 'image/jpeg',
        name: getPhotoName(photoUrl, index),
        remoteKey: photoUrl,
        uri: getImageUrl(photoUrl) ?? photoUrl,
      }))
    );
    setSelectedRegion(item.region);
    setSelectedCategory(item.category);
  };

  const pickPhotos = async () => {
    if (photos.length >= PHOTO_MAX_COUNT) {
      setErrors((current) => ({
        ...current,
        photoUrls: `사진은 최대 ${PHOTO_MAX_COUNT}장까지 업로드할 수 있어요.`,
      }));
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrors((current) => ({
        ...current,
        photoUrls: '사진 보관함 접근 권한이 필요합니다.',
      }));
      return;
    }

    const remainingCount = PHOTO_MAX_COUNT - photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.85,
      selectionLimit: remainingCount,
    });

    if (result.canceled) return;

    const pickedPhotos = result.assets.slice(0, remainingCount).map((asset, index) => ({
      file: asset.file,
      id: asset.assetId ?? `${asset.uri}:${Date.now()}:${index}`,
      mimeType: asset.mimeType ?? 'image/jpeg',
      name: asset.fileName ?? `photo-${Date.now()}-${index}.jpg`,
      uri: asset.uri,
    }));

    setPhotos((current) => {
      const knownUris = new Set(current.map((photo) => photo.uri));
      return [...current, ...pickedPhotos.filter((photo) => !knownUris.has(photo.uri))];
    });
    setErrors((current) => ({ ...current, photoUrls: undefined }));
  };

  const removePhoto = (photoId: string) => {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      nextErrors.title = '제목을 입력해 주세요.';
    } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      nextErrors.title = `제목은 ${TITLE_MAX_LENGTH}자 이내로 입력해 주세요.`;
    }

    if (!trimmedContent) {
      nextErrors.content = '내용을 입력해 주세요.';
    } else if (trimmedContent.length > CONTENT_MAX_LENGTH) {
      nextErrors.content = `내용은 ${CONTENT_MAX_LENGTH}자 이내로 입력해 주세요.`;
    }

    if (photos.length === 0) {
      nextErrors.photoUrls = '사진을 등록해 주세요.';
    } else if (photos.length > PHOTO_MAX_COUNT) {
      nextErrors.photoUrls = `사진은 최대 ${PHOTO_MAX_COUNT}장까지 업로드할 수 있어요.`;
    }

    if (!selectedRegion) {
      nextErrors.regionId = '위치를 선택해 주세요.';
    }

    if (!selectedCategory) {
      nextErrors.categoryId = '카테고리를 선택해 주세요.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFeedback(undefined);
    if (!me) {
      setFeedback('로그인 후 이용해 주세요.');
      return;
    }
    if (!validateForm() || !selectedRegion || !selectedCategory) return;

    setIsSubmitting(true);
    try {
      const request = {
        title: title.trim(),
        content: content.trim(),
        photoUrls: await uploadPhotos(photos),
        regionId: selectedRegion.id,
        categoryId: selectedCategory.id,
      };

      if (isEditMode) {
        await shareApi.update(editItemId, request);
        setFeedback('게시글이 수정되었습니다.');
      } else {
        await shareApi.post(request);
        setFeedback('게시 완료');
        resetForm();
      }

      router.replace('/');
    } catch (submitError) {
      setFeedback(parseAxiosErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.replace('/');
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPhotos([]);
    setSelectedRegion(undefined);
    setSelectedCategory(undefined);
    setErrors({});
  };

  if (isAuthLoading) {
    return (
      <Screen contentStyle={styles.centered}>
        <LoadingState />
      </Screen>
    );
  }

  if (!me) {
    return (
      <Screen contentStyle={styles.centered}>
        <LoginRequiredCard
          description="글쓰기는 로그인 후 이용할 수 있습니다."
          icon="square.and.pencil"
        />
      </Screen>
    );
  }

  if (isEditMode && isPendingEditingItem) {
    return (
      <Screen contentStyle={styles.centered}>
        <LoadingState label="공유글을 불러오는 중입니다." />
      </Screen>
    );
  }

  if (isEditMode && isErrorEditingItem) {
    return (
      <Screen contentStyle={styles.centered}>
        <Button onPress={handleCancel} variant="outline">
          취소
        </Button>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <Card variant="elevated" padding="none" style={styles.formCard}>
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <ThemedText type="heading">{isEditMode ? '공유글 수정' : '공유하기'}</ThemedText>
          <ThemedText type="body" color="textMuted">
            {isEditMode ? '공유글 내용을 수정해 주세요.' : '빌려줄 물건을 등록해 주세요.'}
          </ThemedText>
        </View>

        <View style={styles.cardContent}>
          <Field label="제목" error={errors.title}>
            <TextInput
              maxLength={TITLE_MAX_LENGTH}
              onChangeText={(value) => {
                setTitle(value);
                setErrors((current) => ({ ...current, title: undefined }));
              }}
              placeholder="예) 캠핑 의자 2개 빌려드려요"
              placeholderTextColor={colors.textSubtle}
              selectionColor={colors.primary}
              style={[
                styles.input,
                {
                  borderColor: errors.title ? colors.danger : colors.input,
                  color: colors.text,
                },
              ]}
              value={title}
            />
          </Field>

          <Field
            label="내용"
            description={`최대 ${CONTENT_MAX_LENGTH}자`}
            error={errors.content}>
            <TextInput
              maxLength={CONTENT_MAX_LENGTH}
              multiline
              onChangeText={(value) => {
                setContent(value);
                setErrors((current) => ({ ...current, content: undefined }));
              }}
              placeholder="물품 상태, 대여 가능 시간, 보증금 여부 등을 자세히 적어주세요."
              placeholderTextColor={colors.textSubtle}
              selectionColor={colors.primary}
              style={[
                styles.textarea,
                {
                  borderColor: errors.content ? colors.danger : colors.input,
                  color: colors.text,
                },
              ]}
              textAlignVertical="top"
              value={content}
            />
            <ThemedText type="caption" color="textSubtle" style={styles.counter}>
              {characterCount}/{CONTENT_MAX_LENGTH}
            </ThemedText>
          </Field>

          <Field label="사진" error={errors.photoUrls}>
            <Pressable
              accessibilityRole="button"
              onPress={pickPhotos}
              style={[
                styles.photoDropzone,
                {
                  borderColor: errors.photoUrls ? colors.danger : colors.input,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}>
              <IconSymbol name="photo.fill" size={22} color={colors.icon} />
              <ThemedText type="body" color="textMuted" style={styles.photoText}>
                {photos.length > 0
                  ? `${photos.length}장 선택됨`
                  : '사진 보관함에서 선택'}
              </ThemedText>
            </Pressable>

            {photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.photoPreview}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} contentFit="cover" />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => removePhoto(photo.id)}
                      style={[styles.photoRemove, { backgroundColor: colors.overlay }]}>
                      <ThemedText type="caption" color="primaryForeground">
                        제거
                      </ThemedText>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </Field>

          <View style={styles.selectorGrid}>
            <Field
              label="위치"
              error={errors.regionId}
              icon="line.3.horizontal.decrease.circle"
              style={styles.selectorField}>
              <RegionSelector
                countryCode={COUNTRY_CODE}
                onChange={(region) => {
                  setSelectedRegion(region);
                  setErrors((current) => ({ ...current, regionId: undefined }));
                }}
                selectedRegion={selectedRegion}
                style={styles.selectorControl}
              />
            </Field>
            <Field
              label="카테고리"
              error={errors.categoryId}
              icon="rectangle.stack.fill"
              style={styles.selectorField}>
              <CategorySelector
                countryCode={COUNTRY_CODE}
                onChange={(category) => {
                  setSelectedCategory(category);
                  setErrors((current) => ({ ...current, categoryId: undefined }));
                }}
                selectedCategory={selectedCategory}
                style={styles.selectorControl}
              />
            </Field>
          </View>

          {feedback ? (
            <ThemedText type="caption" color="textMuted">
              {feedback}
            </ThemedText>
          ) : null}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Button disabled={!canSubmit} onPress={handleCancel} variant="danger" style={styles.footerButton}>
            취소
          </Button>
          <Button disabled={!canSubmit} onPress={handleSubmit} style={styles.footerButton}>
            {isSubmitting ? '처리 중' : isEditMode ? '수정' : '등록'}
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

function Field({
  children,
  description,
  error,
  icon,
  label,
  style,
}: {
  children: React.ReactNode;
  description?: string;
  error?: string;
  icon?: 'line.3.horizontal.decrease.circle' | 'rectangle.stack.fill';
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.field, style]}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelRow}>
          {icon ? <IconSymbol name={icon} size={16} color={colors.icon} /> : null}
          <ThemedText type="label">{label}</ThemedText>
        </View>
        {description ? (
          <ThemedText type="caption" color="textSubtle">
            {description}
          </ThemedText>
        ) : null}
      </View>
      {children}
      {error ? (
        <ThemedText type="caption" color="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

async function uploadPhotos(photos: SelectedPhoto[]) {
  return Promise.all(
    photos.map(async (photo) => {
      if (photo.remoteKey) return photo.remoteKey;

      const { data } = await fileApi.getUploadPresignedUrl({
        contentType: photo.mimeType,
        fileName: photo.name,
      });
      const file = photo.file ?? (await fetchPhotoBlob(photo.uri));
      await fileApi.uploadWithPresignedUrl(data.uploadUrl, file);

      return data.key;
    })
  );
}

async function fetchPhotoBlob(uri: string) {
  const response = await fetch(uri);
  return response.blob();
}

function getPhotoName(photoUrl: string, index: number) {
  return photoUrl.split('/').pop() || `photo-${index + 1}.jpg`;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: Spacing['4xl'],
  },
  formCard: {
    borderWidth: 0,
    gap: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    borderBottomWidth: 1,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cardContent: {
    gap: Spacing.xl,
    padding: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  fieldHeader: {
    gap: Spacing.xs,
  },
  fieldLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  input: {
    ...Typography.body,
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textarea: {
    ...Typography.body,
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 176,
    padding: Spacing.md,
  },
  counter: {
    textAlign: 'right',
  },
  photoDropzone: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: 112,
    padding: Spacing.lg,
  },
  photoText: {
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoPreview: {
    aspectRatio: 1,
    borderRadius: Radius.md,
    flexBasis: '31%',
    flexGrow: 1,
    maxWidth: '32%',
    minWidth: 92,
    overflow: 'hidden',
  },
  photoImage: {
    height: '100%',
    width: '100%',
  },
  photoRemove: {
    bottom: Spacing.xs,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    position: 'absolute',
    right: Spacing.xs,
  },
  selectorGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  selectorField: {
    flex: 1,
  },
  selectorControl: {
    width: '100%',
  },
  cardFooter: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  footerButton: {
    minWidth: 96,
  },
});

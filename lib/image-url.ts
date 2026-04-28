const R2_BASE_URL = process.env.EXPO_PUBLIC_R2_BASE_URL ?? '';

export function getImageUrl(path?: string) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  if (!R2_BASE_URL) return undefined;

  return `${R2_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

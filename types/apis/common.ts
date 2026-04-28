export interface PageResponse<T> {
  items: T[];
  hasNext: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type CountryCode = 'KR' | 'US';

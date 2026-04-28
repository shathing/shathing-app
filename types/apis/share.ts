import { type CountryCode } from './common';

export interface SharePostRequest {
  title: string;
  content: string;
  photoUrls: string[];
  regionId: number;
  categoryId: number;
}

export interface UpdateShareItemRequest {
  title: string;
  content: string;
  photoUrls: string[];
  regionId: number;
  categoryId: number;
}

export interface GetShareItemsRequest {
  countryCode: CountryCode;
  categoryId?: string;
  regionId?: string;
  search?: string;
  page?: number;
  size?: number;
}

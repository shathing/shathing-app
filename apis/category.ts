import http from './config';

import { type CountryCode } from '@/types/apis/common';
import { type CategoryRequest } from '@/types/apis/category';
import { type Category } from '@/types/models/category';

export const categoryApi = {
  getCategory: (request: CategoryRequest) => http.get<Category>('/category', { params: request }),
  getList: (countryCode: CountryCode) =>
    http.get<Category[]>('/categories', { params: { countryCode } }),
};

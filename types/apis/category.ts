import { type CountryCode } from './common';

export interface CategoryRequest {
  categoryId: number;
  countryCode: CountryCode;
}

import { type CountryCode } from './common';

export interface RegionRequest {
  countryCode: CountryCode;
  search?: string;
}

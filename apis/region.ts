import http from './config';

import { type RegionRequest } from '@/types/apis/region';
import { type Region } from '@/types/models/region';

export const regionApi = {
  getRegion: (regionId: number) => http.get<Region>('/region', { params: { regionId } }),
  getList: (request: RegionRequest) => http.get<Region[]>('/regions', { params: request }),
};

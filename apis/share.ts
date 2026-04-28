import http from './config';

import { type PageResponse } from '@/types/apis/common';
import {
  type GetShareItemsRequest,
  type SharePostRequest,
  type UpdateShareItemRequest,
} from '@/types/apis/share';
import { type ShareItem } from '@/types/models/share-item';

export const shareApi = {
  post: (request: SharePostRequest) => http.post<void>('/share/post', request),
  getList: (request?: GetShareItemsRequest) =>
    http.get<PageResponse<ShareItem>>('/share/posts', { params: request }),
  getById: (id: number) => http.get<ShareItem>(`/share/posts/${id}`),
  update: (id: number, request: UpdateShareItemRequest) =>
    http.put<ShareItem>(`/share/posts/${id}`, request),
  delete: (id: number) => http.delete<void>(`/share/posts/${id}`),
};

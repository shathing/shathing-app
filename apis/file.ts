import http, { s3Client } from './config';

import {
  type UploadPresignedUrlRequest,
  type UploadPresignedUrlResponse,
} from '@/types/apis/file';

type UploadFile = Blob & {
  type?: string;
};

const toContentType = (file: UploadFile) => file.type || 'application/octet-stream';

export const fileApi = {
  getUploadPresignedUrl: (request: UploadPresignedUrlRequest) =>
    http.post<UploadPresignedUrlResponse>('/uploads/presigned-url', request),

  uploadWithPresignedUrl: async (uploadUrl: string, file: UploadFile) => {
    await s3Client.put(uploadUrl, file, {
      headers: {
        'Content-Type': toContentType(file),
      },
    });
  },
};

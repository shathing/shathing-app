export interface UploadPresignedUrlRequest {
  fileName: string;
  contentType: string;
}

export interface UploadPresignedUrlResponse {
  key: string;
  uploadUrl: string;
  publicUrl: string | null;
}

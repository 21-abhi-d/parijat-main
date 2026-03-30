export interface PresignedUploadResult {
  /** Presigned PUT URL — client uploads directly to S3 with this. */
  uploadUrl: string;
  /** S3 object key — pass to confirmImageUpload after successful upload. */
  objectKey: string;
  /** Final public URL via CloudFront. */
  publicUrl: string;
}

export interface IStorageService {
  getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<PresignedUploadResult>;

  deleteObject(key: string): Promise<void>;

  buildPublicUrl(key: string): string;
}

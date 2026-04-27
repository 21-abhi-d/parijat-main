export interface IStorageService {
  /**
   * Generate a presigned S3 PUT URL for direct browser-to-S3 upload.
   * @param key      S3 object key (e.g. "products/abc123/uuid.jpg")
   * @param contentType  MIME type of the file being uploaded
   * @param expiresIn    URL expiry in seconds (default: 900 = 15 min)
   */
  presignUpload(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<string>;

  /** Delete an object from S3 by key. */
  deleteObject(key: string): Promise<void>;

  /** Return the public CloudFront URL for a given S3 key. */
  getPublicUrl(key: string): string;
}

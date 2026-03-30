/**
 * S3 + CloudFront storage service.
 * Products are uploaded by admins via presigned PUT URLs — the browser uploads
 * directly to S3, bypassing the Next.js server entirely.
 *
 * S3 bucket policy: block all public access. Objects are served exclusively
 * through CloudFront with Origin Access Control (OAC).
 */
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  IStorageService,
  PresignedUploadResult,
} from "./storage.interface";

export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cloudfrontUrl: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION ?? "ap-southeast-2",
    });
    this.bucket = process.env.S3_BUCKET_NAME ?? "";
    this.cloudfrontUrl = (process.env.CLOUDFRONT_URL ?? "").replace(/\/$/, "");
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      uploadUrl,
      objectKey: key,
      publicUrl: this.buildPublicUrl(key),
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  buildPublicUrl(key: string): string {
    return `${this.cloudfrontUrl}/${key}`;
  }
}

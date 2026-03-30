import type { IStorageService } from "./storage.interface";
import { S3StorageService } from "./s3-storage.service";

export function createStorageService(): IStorageService {
  return new S3StorageService();
}

export type { IStorageService, PresignedUploadResult } from "./storage.interface";

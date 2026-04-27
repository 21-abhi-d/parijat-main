import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import { env } from "~/env";
import { storageService } from "~/server/services/storage/s3-storage.service";
import { adminProcedure, createTRPCRouter } from "../trpc";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const uploadsRouter = createTRPCRouter({
  // Generate a presigned S3 PUT URL for direct browser-to-S3 image upload.
  // The client uploads directly to S3 — no file data passes through the server.
  presignUrl: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        contentType: z.string().refine(
          (ct) => ALLOWED_CONTENT_TYPES.includes(ct),
          { message: "Only JPEG, PNG, WebP, and AVIF images are allowed" },
        ),
      }),
    )
    .mutation(async ({ input }) => {
      if (!env.S3_BUCKET_NAME || !env.CLOUDFRONT_URL) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "S3 storage is not configured.",
        });
      }

      const ext = EXTENSION_MAP[input.contentType] ?? "jpg";
      const key = `products/${input.productId}/${randomUUID()}.${ext}`;

      const uploadUrl = await storageService.presignUpload(key, input.contentType);
      const publicUrl = storageService.getPublicUrl(key);

      return { uploadUrl, key, publicUrl };
    }),

  // Delete an image from S3 by key — called when admin removes a product image.
  deleteImage: adminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      if (!env.S3_BUCKET_NAME) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "S3 storage is not configured.",
        });
      }

      await storageService.deleteObject(input.key);
      return { success: true };
    }),
});

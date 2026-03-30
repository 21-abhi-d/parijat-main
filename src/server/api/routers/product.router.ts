/**
 * Product router — admin-only procedures for full product management.
 * All procedures here are adminProcedure — internal fields are always available.
 */
import { z } from "zod";

import { connectDB } from "~/server/db/client";
import { ProductModel } from "~/server/db/models/product.model";
import {
  CreateProductSchema,
  UpdateProductSchema,
} from "~/lib/validators/product.schema";
import { slugify } from "~/lib/utils";
import { createTRPCRouter, adminProcedure } from "../trpc";

export const productRouter = createTRPCRouter({
  /** Create a new product with all fields (public + internal). */
  create: adminProcedure.input(CreateProductSchema).mutation(async ({ input }) => {
    await connectDB();
    const slug = slugify(`${input.code}-${input.name}`);
    const product = await ProductModel.create({ ...input, slug });
    return { id: product._id.toString(), slug: product.slug };
  }),

  /** Update any field on a product. */
  update: adminProcedure.input(UpdateProductSchema).mutation(async ({ input }) => {
    await connectDB();
    const { id, ...fields } = input;
    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) throw new Error("Product not found");
    return { id: updated._id.toString() };
  }),

  /** Soft-delete: mark product as sold so it disappears from public catalog. */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await connectDB();
      await ProductModel.findByIdAndUpdate(input.id, { $set: { isSold: true } });
      return { success: true };
    }),

  /** Full product document including all internal fields. */
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      await connectDB();
      const doc = await ProductModel.findById(input.id).lean();
      if (!doc) return null;
      return doc;
    }),

  /** Generate a presigned S3 PUT URL for direct browser-to-S3 image upload. */
  uploadImageUrl: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        fileName: z.string().max(200),
        contentType: z.string().regex(/^image\//),
      }),
    )
    .mutation(async ({ input }) => {
      const { createStorageService } = await import("~/server/services/storage");
      const storage = createStorageService();
      const key = `products/${input.productId}/${crypto.randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      return storage.getPresignedUploadUrl(key, input.contentType, 300);
    }),

  /** Append an image record to the product after successful S3 upload. */
  confirmImageUpload: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        objectKey: z.string(),
        alt: z.string().default(""),
      }),
    )
    .mutation(async ({ input }) => {
      await connectDB();
      const { createStorageService } = await import("~/server/services/storage");
      const storage = createStorageService();
      const url = storage.buildPublicUrl(input.objectKey);

      const product = await ProductModel.findById(input.productId);
      if (!product) throw new Error("Product not found");

      const order = product.images.length;
      product.images.push({ url, alt: input.alt, order });
      await product.save();

      return { url, order };
    }),
});

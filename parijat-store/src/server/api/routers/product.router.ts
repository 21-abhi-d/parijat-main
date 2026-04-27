import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { connectDB } from "~/server/db/client";
import {
  ProductModel,
  PUBLIC_PRODUCT_FIELDS,
} from "~/server/db/models/product.model";
import {
  createProductSchema as createProductInput,
  updateProductSchema as updateProductInput,
} from "~/lib/validators/product.schema";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";

export const productRouter = createTRPCRouter({
  // ── Public ─────────────────────────────────────────────────────────────────

  // Get a single product by slug — used by the product detail page.
  // Returns public fields only (same as catalog.getBySlug but kept separate
  // in case product detail needs slightly different data in future).
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      await connectDB();
      const product = await ProductModel.findOne({
        slug: input.slug,
        active: true,
      })
        .select(PUBLIC_PRODUCT_FIELDS)
        .lean();

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return product;
    }),

  // ── Admin ──────────────────────────────────────────────────────────────────

  // Full product list including internal fields — admin dashboard only.
  adminList: adminProcedure.query(async () => {
    await connectDB();
    // No .select() here — admin sees all fields including internal ones
    const products = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
    return products;
  }),

  create: adminProcedure
    .input(createProductInput)
    .mutation(async ({ input }) => {
      await connectDB();
      const product = await ProductModel.create(input);
      return product;
    }),

  update: adminProcedure
    .input(updateProductInput)
    .mutation(async ({ input }) => {
      await connectDB();
      const { id, ...data } = input;
      const product = await ProductModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean();

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return product;
    }),

  // Soft delete — sets active: false rather than removing the document.
  softDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await connectDB();
      const product = await ProductModel.findByIdAndUpdate(
        input.id,
        { active: false },
        { new: true },
      ).lean();

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return { success: true };
    }),
});

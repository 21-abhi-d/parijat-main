import { z } from "zod";

import { connectDB } from "~/server/db/client";
import {
  ProductModel,
  PUBLIC_PRODUCT_FIELDS,
} from "~/server/db/models/product.model";
import { CustomerModel } from "~/server/db/models/customer.model";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const catalogRouter = createTRPCRouter({
  // Returns all active products — public fields only.
  // Client handles filtering and search (100–200 SKUs, in-browser).
  list: publicProcedure.query(async () => {
    await connectDB();
    const products = await ProductModel.find({ active: true })
      .select(PUBLIC_PRODUCT_FIELDS)
      .lean();
    return products;
  }),

  // Single product by slug — public fields only.
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
        return null;
      }

      return product;
    }),

  // Count of customers who have wishlisted a product.
  // Used to display demand on the product detail page.
  getWishlistCount: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input }) => {
      await connectDB();
      const count = await CustomerModel.countDocuments({
        "wishlist.productId": input.productId,
      });
      return { count };
    }),
});

/**
 * Catalog router — all public procedures.
 * IMPORTANT: Every procedure here applies PUBLIC_PRODUCT_PROJECTION and calls
 * toPublicProduct() to ensure internal fields are never returned.
 */
import { z } from "zod";

import { connectDB } from "~/server/db/client";
import {
  ProductModel,
  PUBLIC_PRODUCT_PROJECTION,
  toPublicProduct,
} from "~/server/db/models/product.model";
import { CatalogListInputSchema } from "~/lib/validators/product.schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const catalogRouter = createTRPCRouter({
  /** Paginated, filtered product list — customer catalog page. */
  list: publicProcedure
    .input(CatalogListInputSchema)
    .query(async ({ input }) => {
      await connectDB();

      const filter: Record<string, unknown> = { isSold: { $ne: true } };

      if (input.category) filter.category = input.category;
      if (input.type) filter.type = { $regex: input.type, $options: "i" };
      if (input.colour)
        filter.colour = { $regex: input.colour, $options: "i" };
      if (input.stockStatus) filter.stockStatus = input.stockStatus;
      if (input.minPrice !== undefined || input.maxPrice !== undefined) {
        filter.salePriceAUD = {
          ...(input.minPrice !== undefined ? { $gte: input.minPrice } : {}),
          ...(input.maxPrice !== undefined ? { $lte: input.maxPrice } : {}),
        };
      }
      if (input.search) {
        filter.$text = { $search: input.search };
      }

      const sortMap = {
        price_asc: { salePriceAUD: 1 as const },
        price_desc: { salePriceAUD: -1 as const },
        newest: { createdAt: -1 as const },
      };
      const sort = sortMap[input.sortBy];
      const skip = (input.page - 1) * input.limit;

      const [items, total] = await Promise.all([
        ProductModel.find(filter, PUBLIC_PRODUCT_PROJECTION)
          .sort(sort)
          .skip(skip)
          .limit(input.limit)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      return {
        items: items.map((doc) => toPublicProduct(doc as Parameters<typeof toPublicProduct>[0])),
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  /** Full-text search across name, code, type. */
  search: publicProcedure
    .input(z.object({ q: z.string().min(1).max(100) }))
    .query(async ({ input }) => {
      await connectDB();
      const items = await ProductModel.find(
        { $text: { $search: input.q }, isSold: { $ne: true } },
        { ...PUBLIC_PRODUCT_PROJECTION, score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(20)
        .lean();
      return items.map((doc) => toPublicProduct(doc as Parameters<typeof toPublicProduct>[0]));
    }),

  /** Single product by URL slug. */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      await connectDB();
      const doc = await ProductModel.findOne(
        { slug: input.slug, isSold: { $ne: true } },
        PUBLIC_PRODUCT_PROJECTION,
      ).lean();
      if (!doc) return null;
      return toPublicProduct(doc as Parameters<typeof toPublicProduct>[0]);
    }),

  /** Featured products for the home page hero section. */
  featured: publicProcedure.query(async () => {
    await connectDB();
    const items = await ProductModel.find(
      { featured: true, isSold: { $ne: true }, stockStatus: "in_stock" },
      PUBLIC_PRODUCT_PROJECTION,
    )
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return items.map((doc) => toPublicProduct(doc as Parameters<typeof toPublicProduct>[0]));
  }),

  /** Returns distinct filter option values for building the filter panel UI. */
  filterOptions: publicProcedure.query(async () => {
    await connectDB();
    const [categories, types, colours] = await Promise.all([
      ProductModel.distinct("category", { isSold: { $ne: true } }),
      ProductModel.distinct("type", { isSold: { $ne: true } }),
      ProductModel.distinct("colour", { isSold: { $ne: true } }),
    ]);

    const priceRange = await ProductModel.aggregate([
      { $match: { isSold: { $ne: true } } },
      {
        $group: {
          _id: null,
          min: { $min: "$salePriceAUD" },
          max: { $max: "$salePriceAUD" },
        },
      },
    ]);

    return {
      categories: categories as string[],
      types: (types as string[]).filter(Boolean).sort(),
      colours: (colours as string[]).flat().filter(Boolean).sort(),
      priceRange: priceRange[0]
        ? { min: priceRange[0].min as number, max: priceRange[0].max as number }
        : { min: 0, max: 10000 },
    };
  }),
});

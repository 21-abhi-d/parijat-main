import { z } from "zod";

export const ProductCategorySchema = z.enum([
  "saree",
  "suit",
  "lehenga",
  "dupatta",
  "other",
]);

export const StockStatusSchema = z.enum([
  "in_stock",
  "out_of_stock",
  "backorder",
]);

export const ProductImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().default(""),
  order: z.number().int().min(0).default(0),
});

/** Fields required/allowed when creating a product (admin) */
export const CreateProductSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(200),
  category: ProductCategorySchema,
  type: z.string().max(100).default(""),
  colour: z.array(z.string()).default([]),
  salePriceAUD: z.number().positive(),
  stockStatus: StockStatusSchema.default("in_stock"),
  stockQuantity: z.number().int().min(0).default(0),
  description: z.string().max(2000).optional(),
  featured: z.boolean().default(false),
  // Internal fields
  vendor: z.string().max(200).optional(),
  unitPriceINR: z.number().positive().optional(),
  salePriceINR: z.number().positive().optional(),
  audConversionRate: z.number().positive().optional(),
  purchaseCostAUD: z.number().positive().optional(),
  estimatedSalePriceAUD: z.number().positive().optional(),
  internalNotes: z.string().max(1000).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string(),
});

/** Catalog filter input */
export const CatalogListInputSchema = z.object({
  category: ProductCategorySchema.optional(),
  type: z.string().optional(),
  colour: z.string().optional(),
  stockStatus: StockStatusSchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(24),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest"])
    .default("newest"),
});

export type CatalogListInput = z.infer<typeof CatalogListInputSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

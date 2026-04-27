import { z } from "zod";

export const stockStatusSchema = z.enum([
  "in_stock",
  "out_of_stock",
  "backorder",
]);

export const productImageSchema = z.object({
  key: z.string(),
  url: z.string().url(),
  order: z.number(),
});

export const createProductSchema = z.object({
  // Public fields
  slug: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  type: z.string().min(1),
  colour: z.array(z.string()).default([]),
  priceAUD: z.number().positive(),
  stockStatus: stockStatusSchema.default("in_stock"),
  stockQty: z.number().min(0).default(0),
  images: z.array(productImageSchema).default([]),
  description: z.string().optional(),
  active: z.boolean().default(true),
  // Internal fields
  vendor: z.string().optional(),
  priceINR: z.number().positive().optional(),
  costINR: z.number().positive().optional(),
  audConversionRate: z.number().positive().optional(),
  costAUD: z.number().positive().optional(),
  sold: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type StockStatus = z.infer<typeof stockStatusSchema>;
